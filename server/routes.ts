import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin, hashPassword } from "./auth";
import passport from "passport";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { ObjectStorageService } from "./replit_integrations/object_storage/objectStorage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage/routes";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const { PDFParse } = _require("pdf-parse");

async function parsePdfBuffer(buffer: Buffer): Promise<{ text: string }> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return { text: result.text };
}

const objectStorage = new ObjectStorageService();

const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      return cb(null, true);
    }
    cb(new Error("Only PDF files are allowed"));
  },
});

function parseGermanNumber(s: string): number {
  return parseFloat(s.replace(/\./g, "").replace(",", "."));
}

// Duotone invoices use space as thousands separator: "1 020,00" → 1020.00
function parseDuotoneNumber(s: string): number {
  return parseFloat(s.replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
}

// Convert "15-May-24" → "15.05.2024"
function convertDuotoneDate(raw: string): string {
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const m = raw.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2,4})/);
  if (!m) return raw;
  const [, day, mon, yr] = m;
  const month = months[mon.charAt(0).toUpperCase() + mon.slice(1).toLowerCase()] || "01";
  const year = yr.length === 2 ? (parseInt(yr) >= 70 ? `19${yr}` : `20${yr}`) : yr;
  return `${day.padStart(2, "0")}.${month}.${year}`;
}

function parseDuotoneInvoice(text: string) {
  // pdf-parse extracts Duotone table rows across multiple lines:
  //   L+0: "44240-3004 DTK-Kite Neo : 06.0 : C02:coral/light-grey SS24"
  //   L+1: "LK/95030099"              ← tariff code (skip)
  //   L+2: "1 pcs 1 020,00"           ← quantity + unit price
  //   L+3: "40%"                      ← discount
  //   L+4: "612,00 612,00"            ← discounted unit price + net total
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // ── Metadata ──────────────────────────────────────────────────────────────
  const invoiceNumber = text.match(/INVOICE\s+No[:\s]+([\w\-]+)/i)?.[1] || "";
  // Date appears as standalone "15-May-24" (separate line from "Date:" label)
  const rawDate = text.match(/(\d{1,2}-[A-Za-z]{3}-\d{2,4})/)?.[1] || "";
  const invoiceDate = convertDuotoneDate(rawDate);
  const deliveryDate = text.match(/Del\.note\/date\/ref\.[^/]+\/([\d.]+)/i)?.[1] || "";
  const orderNumber = text.match(/B&M\/B2B order no\.([\w\-]+)/i)?.[1] || "";
  const totalNetRaw = text.match(/Total Net Value\s+EUR\s+([\d\s.,]+)/i)?.[1]?.trim() || "";
  const totalGrossRaw = text.match(/Invoice Total\s+EUR\s+([\d\s.,]+)/i)?.[1]?.trim() || "";
  const totalNet = totalNetRaw ? parseDuotoneNumber(totalNetRaw) : null;
  const totalGross = totalGrossRaw ? parseDuotoneNumber(totalGrossRaw) : null;

  // ── Line items ────────────────────────────────────────────────────────────
  const skuLineRe = /^(\d{4,6}-\d{3,5})\s+(.+)\s+((?:SS|AW|FW)\d{2})\s*$/;
  const qtyLineRe = /^(\d+)\s+pcs\s+([\d\s.,]+)\s*$/;
  const discLineRe = /^(\d+)%\s*$/;
  const priceLineRe = /^([\d.,]+)\s+([\d.,]+)\s*$/;

  const items: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const skuMatch = lines[i].match(skuLineRe);
    if (!skuMatch) continue;

    const sku = skuMatch[1];
    const description = skuMatch[2].trim();

    // Scan the next 6 lines for qty, discount, and price data
    let quantity = 1;
    let discount = 0;
    let discountedUnitPrice = 0;
    let foundQty = false;
    let foundPrice = false;

    for (let j = i + 1; j <= Math.min(i + 6, lines.length - 1); j++) {
      if (!foundQty) {
        const qtyMatch = lines[j].match(qtyLineRe);
        if (qtyMatch) {
          quantity = parseInt(qtyMatch[1], 10) || 1;
          foundQty = true;
          continue;
        }
      }
      const discMatch = lines[j].match(discLineRe);
      if (discMatch) {
        discount = parseInt(discMatch[1], 10);
        continue;
      }
      if (foundQty && !foundPrice) {
        const priceMatch = lines[j].match(priceLineRe);
        if (priceMatch) {
          discountedUnitPrice = parseDuotoneNumber(priceMatch[1]);
          foundPrice = true;
          break;
        }
      }
    }

    if (!foundQty || !foundPrice) continue;

    // Parse description: "DTK-Kite Neo : 06.0 : C02:coral/light-grey"
    const descParts = description.split(":").map((s) => s.trim());
    const name = descParts[0] || description;
    const rawSize = descParts[1] || "";
    const size = rawSize ? (parseFloat(rawSize) || rawSize).toString() : "";
    const colorRaw = descParts.slice(2).join(":").trim();
    const color = colorRaw.replace(/^[A-Z0-9]+:/, "").trim();

    const { type, isSpare } = detectEquipmentType(name, sku);

    items.push({
      sku,
      name,
      size,
      color,
      quantity,
      discount,
      unitPriceAfterDiscount: Math.round(discountedUnitPrice * 100) / 100,
      serialNumber: "",
      type,
      isSpare,
      skip: isSpare,
    });
  }

  return { invoiceNumber, invoiceDate, deliveryDate, orderNumber, totalNet, totalGross, items };
}

function detectEquipmentType(name: string, sku: string): { type: string; isSpare: boolean } {
  const text = `${name} ${sku}`.toLowerCase();
  if (/bladder|bridle|chickenstick|ersatzteil|spare|strut|screw|bolt|pump hose/i.test(text)) {
    return { type: "kite", isSpare: true };
  }
  if (/\bkite\b|xr\d|gts\d|nexus|rebel|evo|delta|freeride|air pro|foil kite|kap\d|kxr|kgts|knex/i.test(text)) {
    return { type: "kite", isSpare: false };
  }
  if (/\bbar\b|sensor|navigator|control bar|rse\d|click bar|trust bar/i.test(text)) {
    return { type: "bar_lines", isSpare: false };
  }
  if (/\bfoilboard\b/i.test(text)) {
    return { type: "foilboard", isSpare: false };
  }
  if (/\bboard\b|twintip|directional/i.test(text)) {
    return { type: "board", isSpare: false };
  }
  if (/\bfoil\b|hydrofoil|wingfoil|wing foil/i.test(text)) {
    return { type: "foil", isSpare: false };
  }
  if (/\bwing\b/i.test(text)) {
    return { type: "wing", isSpare: false };
  }
  if (/harness|seat harness/i.test(text)) {
    return { type: "harness", isSpare: false };
  }
  if (/wetsuit|neoprene/i.test(text)) {
    return { type: "wetsuit", isSpare: false };
  }
  if (/helmet|impact vest|safety/i.test(text)) {
    return { type: "helmet_safety", isSpare: false };
  }
  return { type: "kite", isSpare: false };
}

function parsePdfInvoice(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  const invoiceNumber = text.match(/Rechnungsnummer\s+(RE\/[\d\/]+)/)?.[1]
    || text.match(/Invoice\s*(?:Number|No\.?)[:\s]+([\w\/\-]+)/i)?.[1] || "";
  const invoiceDate = text.match(/Rechnungsdatum\s+([\d.]+)/)?.[1]
    || text.match(/Invoice\s*Date[:\s]+([\d.\/\-]+)/i)?.[1] || "";
  const deliveryDate = text.match(/Lieferdatum\s+([\d.]+)/)?.[1]
    || text.match(/Delivery\s*Date[:\s]+([\d.\/\-]+)/i)?.[1] || "";
  const orderNumber = text.match(/Auftragsnummer[^\d]*([\w]+)/)?.[1]
    || text.match(/Order\s*(?:Number|No\.?)[:\s]+([\w\-]+)/i)?.[1] || "";
  const totalNet = text.match(/Nettobetrag\s+([\d.,]+)\s*€/)?.[1] || "";
  const totalGross = text.match(/Gesamt\s+([\d.,]+)\s*€/)?.[1] || "";

  const items: any[] = [];

  // CORE invoice multi-line format:
  //   Line 1: "[SKU] Product Name (size, color)"
  //   Line 2: description text
  //   Line 3: serial(s) OR already the qty line (spare parts have no serial)
  //   Line N: "qty \t unitPrice \t discount% total €"
  const skuLineRe = /^\[([A-Z0-9]+)\]\s+(.+)$/;
  const qtyLineRe = /^(\d+)\s+[\d.,]+\s+\d+%\s+([\d.,]+)\s*€?$/;
  const serialLineRe = /^([A-Z0-9]{6,}(?:,\s*[A-Z0-9]{6,})*)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const skuMatch = line.match(skuLineRe);
    if (!skuMatch) continue;

    const [, sku, rawName] = skuMatch;

    // Find qty line within the next 4 lines
    let qtyLine: string | null = null;
    let qtyLineIdx = -1;
    for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1); j++) {
      if (lines[j].match(qtyLineRe)) {
        qtyLine = lines[j];
        qtyLineIdx = j;
        break;
      }
    }
    if (!qtyLine || qtyLineIdx < 0) continue;

    const qtyMatch = qtyLine.match(/^(\d+)\s+([\d.]+,\d{2})\s+(\d+)%\s+([\d.,]+)\s*€?$/);
    let quantity = 1, discount = 0, total = 0;
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1], 10);
      discount = parseInt(qtyMatch[3], 10);
      total = parseGermanNumber(qtyMatch[4]);
    }
    const unitPriceAfterDiscount = quantity > 0 ? total / quantity : total;

    // Look for serial line between SKU line and qty line
    let serials: string[] = [];
    for (let j = i + 1; j < qtyLineIdx; j++) {
      const serialMatch = lines[j].match(serialLineRe);
      if (serialMatch) {
        serials = serialMatch[1].split(",").map((s: string) => s.trim()).filter(Boolean);
        break;
      }
    }

    if (serials.length === 0) serials = [""];

    const sizeMatch = rawName.match(/\(([0-9.]+)/);
    const colorMatch = rawName.match(/,\s*([^)]+)\)/);
    const size = sizeMatch?.[1]?.trim() || "";
    const color = colorMatch?.[1]?.trim() || "";
    const name = rawName.replace(/\s*\([^)]*\)\s*/, "").trim();

    const { type, isSpare } = detectEquipmentType(name, sku);

    for (const serial of serials) {
      items.push({
        sku,
        name,
        size,
        color,
        quantity,
        discount,
        unitPriceAfterDiscount: Math.round(unitPriceAfterDiscount * 100) / 100,
        serialNumber: serial,
        type,
        isSpare,
        skip: isSpare,
      });
    }

    // Skip ahead past the qty line so we don't re-process
    i = qtyLineIdx;
  }

  return {
    invoiceNumber,
    invoiceDate,
    deliveryDate,
    orderNumber,
    totalNet: totalNet ? parseGermanNumber(totalNet) : null,
    totalGross: totalGross ? parseGermanNumber(totalGross) : null,
    items,
  };
}

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error("Only image files are allowed"));
  },
});

async function checkEquipmentAccess(req: any, equipmentId: number): Promise<boolean> {
  const user = req.user as any;
  if (user.role === "admin") return true;
  const item = await storage.getEquipment(equipmentId);
  if (!item) return false;
  return item.currentStationId === user.assignedStationId;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  registerObjectStorageRoutes(app);

  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadDir, path.basename(req.path));
    res.sendFile(filePath, (err) => {
      if (err) next();
    });
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Login failed" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        const { password, ...safeUser } = user;
        return res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const { password, ...safeUser } = req.user as any;
    res.json(safeUser);
  });

  app.get("/api/stations", requireAuth, async (_req, res) => {
    const stationsList = await storage.getAllStations();
    res.json(stationsList);
  });

  app.post("/api/stations", requireAdmin, async (req, res) => {
    const station = await storage.createStation(req.body);
    await storage.createActivityLog({
      userId: (req.user as any).id,
      action: "station_created",
      details: `Created station: ${station.name}`,
    });
    res.json(station);
  });

  app.patch("/api/stations/:id", requireAdmin, async (req, res) => {
    const station = await storage.updateStation(parseInt(req.params.id), req.body);
    if (!station) return res.status(404).json({ message: "Station not found" });
    res.json(station);
  });

  app.delete("/api/stations/:id", requireAdmin, async (req, res) => {
    await storage.deleteStation(parseInt(req.params.id));
    res.json({ message: "Deleted" });
  });

  app.get("/api/users", requireAdmin, async (_req, res) => {
    const usersList = await storage.getAllUsers();
    res.json(usersList.map(({ password, ...u }) => u));
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const hashed = await hashPassword(req.body.password);
      const user = await storage.createUser({ ...req.body, password: hashed });
      const { password, ...safeUser } = user;
      await storage.createActivityLog({
        userId: (req.user as any).id,
        action: "user_created",
        details: `Created user: ${user.email}`,
      });
      res.json(safeUser);
    } catch (err: any) {
      if (err.message?.includes("duplicate")) {
        return res.status(400).json({ message: "Email already exists" });
      }
      throw err;
    }
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    const data = { ...req.body };
    if (data.password) {
      data.password = await hashPassword(data.password);
    }
    const user = await storage.updateUser(parseInt(req.params.id), data);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    await storage.deleteUser(parseInt(req.params.id));
    res.json({ message: "Deleted" });
  });

  app.get("/api/equipment/scan", requireAuth, async (req, res) => {
    const serial = (req.query.serial || req.query.code) as string;
    if (!serial) return res.status(400).json({ message: "serial or code param required" });
    const item = await storage.getEquipmentByCode(serial);
    if (!item) return res.status(404).json({ message: "Equipment not found" });
    const user = req.user as any;
    if (user.role === "manager" && item.currentStationId !== user.assignedStationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(item);
  });

  app.post("/api/equipment/first-photos", requireAuth, async (req, res) => {
    const ids: number[] = req.body.ids || [];
    const map = await storage.getFirstPhotos(ids);
    res.json(map);
  });

  app.get("/api/equipment", requireAuth, async (req, res) => {
    const user = req.user as any;
    const filters: any = {};
    if (user.role === "manager") {
      filters.stationId = user.assignedStationId;
    } else if (req.query.stationId) {
      filters.stationId = parseInt(req.query.stationId as string);
    }
    if (req.query.type) filters.type = req.query.type;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.conditionRating) filters.conditionRating = parseInt(req.query.conditionRating as string);
    if (req.query.search) filters.search = req.query.search;

    let items = await storage.getAllEquipment(filters);

    if (user.role !== "admin") {
      items = items.map(({ purchasePrice, currentValue, salePrice, ...rest }) => rest as any);
    }

    res.json(items);
  });

  app.get("/api/equipment/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Equipment not found" });
    const item = await storage.getEquipment(id);
    if (!item) return res.status(404).json({ message: "Equipment not found" });

    const user = req.user as any;
    if (user.role === "manager" && item.currentStationId !== user.assignedStationId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (user.role !== "admin") {
      const { purchasePrice, currentValue, salePrice, ...safe } = item;
      return res.json(safe);
    }

    res.json(item);
  });

  app.post("/api/equipment", requireAdmin, async (req, res) => {
    try {
      const item = await storage.createEquipment(req.body);
      await storage.createActivityLog({
        userId: (req.user as any).id,
        action: "equipment_created",
        equipmentId: item.id,
        details: `Added ${item.brand} ${item.model} (${item.serialNumber})`,
      });
      res.json(item);
    } catch (err: any) {
      if (err.message?.includes("duplicate") || err.message?.includes("unique")) {
        return res.status(400).json({ message: "Serial number already exists" });
      }
      throw err;
    }
  });

  app.patch("/api/equipment/:id", requireAdmin, async (req, res) => {
    const item = await storage.updateEquipment(parseInt(req.params.id), req.body);
    if (!item) return res.status(404).json({ message: "Equipment not found" });
    res.json(item);
  });

  app.delete("/api/equipment/:id", requireAdmin, async (req, res) => {
    await storage.deleteEquipment(parseInt(req.params.id));
    await storage.createActivityLog({
      userId: (req.user as any).id,
      action: "equipment_deleted",
      details: `Deleted equipment #${req.params.id}`,
    });
    res.json({ message: "Deleted" });
  });

  app.get("/api/equipment/:id/ratings", requireAuth, async (req, res) => {
    const equipmentId = parseInt(req.params.id);
    if (!(await checkEquipmentAccess(req, equipmentId))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const ratings = await storage.getConditionRatings(equipmentId);
    res.json(ratings);
  });

  app.post("/api/equipment/:id/ratings", requireAuth, async (req, res) => {
    const user = req.user as any;
    const equipmentId = parseInt(req.params.id);
    if (!(await checkEquipmentAccess(req, equipmentId))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const rating = await storage.createConditionRating({
      equipmentId,
      rating: req.body.rating,
      ratedBy: user.id,
      notes: req.body.notes,
    });
    await storage.createActivityLog({
      userId: user.id,
      action: "condition_rated",
      equipmentId,
      details: `Rated condition: ${req.body.rating}/5`,
    });
    res.json(rating);
  });

  app.get("/api/equipment/:id/repairs", requireAuth, async (req, res) => {
    const equipmentId = parseInt(req.params.id);
    if (!(await checkEquipmentAccess(req, equipmentId))) {
      return res.status(403).json({ message: "Access denied" });
    }
    let repairsList = await storage.getRepairs(equipmentId);
    const user = req.user as any;
    if (user.role !== "admin") {
      repairsList = repairsList.map(({ cost, ...rest }) => rest as any);
    }
    res.json(repairsList);
  });

  app.post("/api/equipment/:id/repairs", requireAuth, async (req, res) => {
    const user = req.user as any;
    const equipmentId = parseInt(req.params.id);
    if (!(await checkEquipmentAccess(req, equipmentId))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const repair = await storage.createRepair({
      equipmentId,
      description: req.body.description,
      cost: user.role === "admin" ? req.body.cost : null,
      status: req.body.status || "pending",
      loggedBy: user.id,
    });
    await storage.createActivityLog({
      userId: user.id,
      action: "repair_logged",
      equipmentId,
      details: `Logged repair: ${req.body.description}`,
    });
    res.json(repair);
  });

  app.patch("/api/repairs/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const data = { ...req.body };
    if (user.role !== "admin") {
      delete data.cost;
    }
    const repair = await storage.updateRepair(parseInt(req.params.id), data);
    if (!repair) return res.status(404).json({ message: "Repair not found" });
    res.json(repair);
  });

  app.get("/api/transfers", requireAuth, async (req, res) => {
    const user = req.user as any;
    const filters: any = {};
    if (user.role === "manager") {
      filters.stationId = user.assignedStationId;
    } else if (req.query.stationId) {
      filters.stationId = parseInt(req.query.stationId as string);
    }
    if (req.query.status) filters.status = req.query.status;
    const transfersList = await storage.getTransfers(filters);
    res.json(transfersList);
  });

  app.get("/api/equipment/:id/transfers", requireAuth, async (req, res) => {
    const transfersList = await storage.getTransfersByEquipment(parseInt(req.params.id));
    res.json(transfersList);
  });

  app.post("/api/transfers", requireAuth, async (req, res) => {
    const user = req.user as any;
    const transfer = await storage.createTransfer({
      equipmentId: req.body.equipmentId,
      fromStationId: req.body.fromStationId,
      toStationId: req.body.toStationId,
      initiatedBy: user.id,
    });
    await storage.createActivityLog({
      userId: user.id,
      action: "transfer_initiated",
      equipmentId: req.body.equipmentId,
      details: `Transfer initiated from station ${req.body.fromStationId} to ${req.body.toStationId}`,
    });
    res.json(transfer);
  });

  app.post("/api/transfers/:id/confirm", requireAuth, async (req, res) => {
    const user = req.user as any;
    const transferId = parseInt(req.params.id);
    const existingTransfers = await storage.getTransfers({ status: "pending" });
    const existing = existingTransfers.find(t => t.id === transferId);
    if (!existing) return res.status(404).json({ message: "Transfer not found" });
    if (user.role !== "admin" && user.assignedStationId !== existing.toStationId && user.assignedStationId !== existing.fromStationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const transfer = await storage.confirmTransfer(transferId, user.id);
    if (!transfer) return res.status(404).json({ message: "Transfer not found" });
    await storage.createActivityLog({
      userId: user.id,
      action: "transfer_confirmed",
      equipmentId: transfer.equipmentId,
      details: `Transfer confirmed`,
    });
    res.json(transfer);
  });

  app.post("/api/transfers/:id/cancel", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can cancel transfers" });
    }
    const transfer = await storage.cancelTransfer(parseInt(req.params.id));
    if (!transfer) return res.status(404).json({ message: "Transfer not found" });
    res.json(transfer);
  });

  app.get("/api/equipment/:id/photos", requireAuth, async (req, res) => {
    const equipmentId = parseInt(req.params.id);
    if (!(await checkEquipmentAccess(req, equipmentId))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const photosList = await storage.getPhotos(equipmentId);
    res.json(photosList);
  });

  app.get("/api/equipment/:id/photos/upload-url", requireAuth, async (req, res) => {
    const equipmentId = parseInt(req.params.id);
    if (!(await checkEquipmentAccess(req, equipmentId))) {
      return res.status(403).json({ message: "Access denied" });
    }
    try {
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to get upload URL: " + err.message });
    }
  });

  app.post("/api/equipment/:id/photos", requireAuth, async (req, res) => {
    const user = req.user as any;
    const equipmentId = parseInt(req.params.id);
    if (!(await checkEquipmentAccess(req, equipmentId))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { url, caption } = req.body;
    if (!url) return res.status(400).json({ message: "url is required" });
    const photo = await storage.createPhoto({
      equipmentId,
      url,
      uploadedBy: user.id,
      caption: caption || null,
    });
    res.json(photo);
  });

  app.delete("/api/photos/:id", requireAuth, async (req, res) => {
    await storage.deletePhoto(parseInt(req.params.id));
    res.json({ message: "Deleted" });
  });

  app.post("/api/stations/:id/inventory-checks", requireAuth, async (req, res) => {
    const user = req.user as any;
    const stationId = parseInt(req.params.id);
    if (user.role === "manager" && user.assignedStationId !== stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const equipmentList = await storage.getAllEquipment({ stationId });
    const check = await storage.createInventoryCheck({
      stationId,
      startedBy: user.id,
      status: "in_progress",
      totalItems: equipmentList.length,
    });
    for (const eq of equipmentList) {
      await storage.upsertInventoryCheckItem({ checkId: check.id, equipmentId: eq.id });
    }
    res.json(check);
  });

  app.get("/api/stations/:id/inventory-checks", requireAuth, async (req, res) => {
    const user = req.user as any;
    const stationId = parseInt(req.params.id);
    if (user.role === "manager" && user.assignedStationId !== stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const checks = await storage.getInventoryChecks(stationId);
    res.json(checks);
  });

  app.get("/api/inventory-checks/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const check = await storage.getInventoryCheck(parseInt(req.params.id));
    if (!check) return res.status(404).json({ message: "Not found" });
    if (user.role === "manager" && user.assignedStationId !== check.stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const items = await storage.getInventoryCheckItems(check.id);
    const equipmentIds = items.map(i => i.equipmentId);
    const equipmentList = equipmentIds.length > 0 ? await storage.getAllEquipment({ stationId: check.stationId }) : [];
    res.json({ check, items, equipment: equipmentList });
  });

  app.patch("/api/inventory-checks/:id/complete", requireAuth, async (req, res) => {
    const user = req.user as any;
    const check = await storage.getInventoryCheck(parseInt(req.params.id));
    if (!check) return res.status(404).json({ message: "Not found" });
    if (user.role === "manager" && user.assignedStationId !== check.stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const updated = await storage.completeInventoryCheck(check.id);
    res.json(updated);
  });

  app.patch("/api/inventory-checks/:id/items/:equipmentId", requireAuth, async (req, res) => {
    const user = req.user as any;
    const checkId = parseInt(req.params.id);
    const equipmentId = parseInt(req.params.equipmentId);
    const check = await storage.getInventoryCheck(checkId);
    if (!check) return res.status(404).json({ message: "Not found" });
    if (user.role === "manager" && user.assignedStationId !== check.stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const item = await storage.upsertInventoryCheckItem({
      checkId,
      equipmentId,
      ...req.body,
      checkedAt: req.body.checked ? new Date() : undefined,
      checkedBy: req.body.checked ? user.id : undefined,
    });
    res.json(item);
  });

  app.get("/api/activity", requireAdmin, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const logs = await storage.getActivityLog(limit);
    res.json(logs);
  });

  app.get("/api/dashboard", requireAuth, async (req, res) => {
    const user = req.user as any;
    const stationId = user.role === "manager" ? user.assignedStationId : undefined;
    const stats = await storage.getDashboardStats(stationId);
    res.json(stats);
  });

  app.post("/api/equipment/import", requireAdmin, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
      const content = fs.readFileSync(req.file.path, "utf-8");
      const lines = content.split("\n").filter((l) => l.trim());
      if (lines.length < 2) return res.status(400).json({ message: "File is empty or has no data rows" });

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
      const results = { imported: 0, skipped: 0, errors: [] as string[] };

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/['"]/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });

        const serialNumber = row["serial_number"] || row["serialnumber"] || row["serial"];
        if (!serialNumber) {
          results.errors.push(`Row ${i + 1}: Missing serial number`);
          results.skipped++;
          continue;
        }

        const existing = await storage.getEquipmentBySerial(serialNumber);
        if (existing) {
          results.skipped++;
          continue;
        }

        try {
          await storage.createEquipment({
            serialNumber,
            type: (row["type"] || "kite") as any,
            brand: row["brand"] || "Unknown",
            model: row["model"] || "Unknown",
            yearOfPurchase: row["year"] ? parseInt(row["year"]) : null,
            currentStationId: row["station_id"] ? parseInt(row["station_id"]) : null,
            status: "active",
            conditionRating: row["condition"] ? parseInt(row["condition"]) : 5,
            notes: row["notes"] || null,
            purchasePrice: row["purchase_price"] || null,
            currentValue: row["current_value"] || null,
            typeSpecificFields: {},
          });
          results.imported++;
        } catch (err: any) {
          results.errors.push(`Row ${i + 1}: ${err.message}`);
          results.skipped++;
        }
      }

      fs.unlinkSync(req.file.path);
      res.json(results);
    } catch (err: any) {
      res.status(400).json({ message: `Import failed: ${err.message}` });
    }
  });

  // ─── Suppliers ───────────────────────────────────────────────────────────────
  app.get("/api/suppliers", requireAuth, async (_req, res) => {
    res.json(await storage.getAllSuppliers());
  });

  app.post("/api/suppliers", requireAdmin, async (req, res) => {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: "name required" });
    try {
      const supplier = await storage.createSupplier({ name, color: color || "#6366f1" });
      res.json(supplier);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ─── Invoice: Parse PDF ───────────────────────────────────────────────────────
  app.post("/api/invoices/parse", requireAdmin, uploadPdf.single("pdf"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No PDF uploaded" });
    try {
      const data = await parsePdfBuffer(req.file.buffer);
      // Auto-detect supplier format from PDF content
      const isDuotone = /boards.and.more|B&M\/B2B/i.test(data.text);
      const parsed = isDuotone ? parseDuotoneInvoice(data.text) : parsePdfInvoice(data.text);

      // Check for duplicate serials in DB — store ID so frontend can link to existing item
      const allSerial = parsed.items
        .map((i: any) => i.serialNumber)
        .filter(Boolean);
      const existingSerialMap = new Map<string, number>();
      for (const s of allSerial) {
        const found = await storage.getEquipmentBySerial(s);
        if (found) existingSerialMap.set(s, found.id);
      }

      const items = parsed.items.map((item: any) => {
        const isDuplicate = existingSerialMap.has(item.serialNumber);
        return {
          ...item,
          isDuplicate,
          duplicateId: existingSerialMap.get(item.serialNumber) ?? null,
          skip: item.skip || isDuplicate, // auto-skip duplicates
        };
      });

      res.json({ ...parsed, items });
    } catch (err: any) {
      res.status(400).json({ message: `PDF parse failed: ${err.message}` });
    }
  });

  // ─── Invoice: Confirm Import ──────────────────────────────────────────────────
  app.post("/api/invoices/confirm", requireAdmin, async (req, res) => {
    const {
      supplierId, invoiceNumber, invoiceDate, deliveryDate, orderNumber,
      totalNet, totalGross, items, brand,
    } = req.body;
    const user = req.user as any;

    if (!supplierId || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: "supplierId and items required" });
    }

    const toImport = items.filter((i: any) => !i.skip);
    if (toImport.length === 0) return res.status(400).json({ message: "No items to import" });

    const invoice = await storage.createInvoice({
      supplierId,
      invoiceNumber: invoiceNumber || "N/A",
      invoiceDate: invoiceDate || null,
      deliveryDate: deliveryDate || null,
      orderNumber: orderNumber || null,
      totalNet: totalNet?.toString() || null,
      totalGross: totalGross?.toString() || null,
      importedBy: user.id,
      itemCount: toImport.length,
    });

    // Parse German date format DD.MM.YYYY from delivery or invoice date
    const parseDateDE = (s: string | null | undefined): Date | null => {
      if (!s) return null;
      const parts = s.split(".");
      if (parts.length === 3) {
        const d = new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`);
        if (!isNaN(d.getTime())) return d;
      }
      return null;
    };
    const parsedDate = parseDateDE(deliveryDate) || parseDateDE(invoiceDate);
    const year = parsedDate ? parsedDate.getFullYear() : new Date().getFullYear();

    const allStations = await storage.getAllStations();
    const warehouseStation = allStations.find((s) => s.name === "Office Hamburg Warehouse/Incoming");
    const warehouseStationId = warehouseStation?.id ?? null;

    let imported = 0;
    const errors: string[] = [];
    for (const item of toImport) {
      try {
        await storage.createEquipment({
          serialNumber: item.serialNumber || `AUTO-${item.type?.toUpperCase() || "ITEM"}-${Date.now()}`,
          sku: item.sku || null,
          type: item.type,
          brand: brand || item.brand || "Unknown",
          model: item.name || "Unknown",
          purchaseDate: parsedDate,
          yearOfPurchase: year,
          currentStationId: warehouseStationId,
          status: "active",
          conditionRating: 5,
          purchasePrice: item.unitPriceAfterDiscount?.toString() || null,
          typeSpecificFields: { size: item.size || "", color: item.color || "" },
          invoiceId: invoice.id,
          invoiceReference: invoiceNumber || null,
        });
        imported++;
      } catch (err: any) {
        errors.push(`${item.serialNumber || item.sku}: ${err.message}`);
      }
    }

    res.json({ invoiceId: invoice.id, imported, errors });
  });

  // ─── Invoice: List ────────────────────────────────────────────────────────────
  app.get("/api/invoices", requireAdmin, async (_req, res) => {
    res.json(await storage.getAllInvoices());
  });

  // ─── Company Settings ──────────────────────────────────────────────────────
  app.get("/api/company-settings", requireAdmin, async (_req, res) => {
    res.json(await storage.getCompanySettings());
  });

  app.put("/api/company-settings", requireAdmin, async (req, res) => {
    const updated = await storage.updateCompanySettings(req.body);
    res.json(updated);
  });

  // Logo upload for company settings
  const uploadImage = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
  app.post("/api/company-settings/logo", requireAdmin, uploadImage.single("logo"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file" });
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      await fetch(uploadURL, { method: "PUT", body: blob, headers: { "Content-Type": req.file.mimetype } });
      const publicUrl = `/api/object-storage/${objectPath}`;
      await storage.updateCompanySettings({ logoUrl: publicUrl });
      res.json({ logoUrl: publicUrl });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Customers ────────────────────────────────────────────────────────────
  app.get("/api/customers", requireAdmin, async (_req, res) => {
    res.json(await storage.getAllCustomers());
  });

  app.post("/api/customers", requireAdmin, async (req, res) => {
    const { name, companyName, address, email, taxId } = req.body;
    if (!name || !address || !email) return res.status(400).json({ message: "name, address, email required" });
    const customer = await storage.createCustomer({ name, companyName: companyName || null, address, email, taxId: taxId || null });
    res.status(201).json(customer);
  });

  app.put("/api/customers/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.updateCustomer(id, req.body);
    if (!updated) return res.status(404).json({ message: "Customer not found" });
    res.json(updated);
  });

  // ─── Sales Invoices ───────────────────────────────────────────────────────
  app.get("/api/sales", requireAdmin, async (_req, res) => {
    res.json(await storage.getAllSalesInvoices());
  });

  app.get("/api/sales/next-number", requireAdmin, async (_req, res) => {
    const settings = await storage.getCompanySettings();
    const currentYear = new Date().getFullYear();
    const year = settings.invoiceYear !== currentYear ? currentYear : settings.invoiceYear;
    const nextNum = settings.invoiceYear !== currentYear ? 1001 : settings.invoiceNextNumber;
    const numStr = String(nextNum).padStart(4, "0");
    res.json({ invoiceNumber: `${settings.invoicePrefix}-${year}-${numStr}` });
  });

  app.get("/api/sales/:id", requireAdmin, async (req, res) => {
    const sale = await storage.getSalesInvoice(parseInt(req.params.id));
    if (!sale) return res.status(404).json({ message: "Not found" });
    res.json(sale);
  });

  app.post("/api/sales", requireAdmin, async (req, res) => {
    try {
      const user = req.user as any;
      const { customerId, invoiceDate, deliveryDate, paymentMethod, paymentTerms, vatType, vatRate, vatNote, notes, totalNet, totalVat, totalGross, items } = req.body;
      if (!customerId || !invoiceDate || !items?.length) {
        return res.status(400).json({ message: "customerId, invoiceDate, and items are required" });
      }
      const invoiceNumber = await storage.getNextInvoiceNumber();
      const sale = await storage.createSalesInvoice(
        {
          invoiceNumber,
          invoiceDate,
          deliveryDate: deliveryDate || null,
          customerId: parseInt(customerId),
          paymentMethod: paymentMethod || "bank_transfer",
          paymentTerms: paymentTerms || "14 Tage ohne Abzug",
          vatType: vatType || "standard_19",
          vatRate: (vatRate ?? "19.00").toString(),
          vatNote: vatNote || null,
          notes: notes || null,
          totalNet: totalNet.toString(),
          totalVat: totalVat.toString(),
          totalGross: totalGross.toString(),
          status: "draft",
          createdBy: user.id,
        },
        items.map((item: any, idx: number) => ({
          equipmentId: parseInt(item.equipmentId),
          position: idx + 1,
          description: item.description,
          serialNumber: item.serialNumber || null,
          sku: item.sku || null,
          quantity: 1,
          unitPrice: item.unitPrice.toString(),
          total: item.unitPrice.toString(),
        }))
      );
      res.status(201).json(sale);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/sales/:id/confirm", requireAdmin, async (req, res) => {
    const sale = await storage.confirmSale(parseInt(req.params.id));
    if (!sale) return res.status(404).json({ message: "Not found" });
    res.json(sale);
  });

  // ─── Sales PDF Generation ─────────────────────────────────────────────────
  app.get("/api/sales/:id/pdf", requireAdmin, async (req, res) => {
    try {
      const sale = await storage.getSalesInvoice(parseInt(req.params.id));
      if (!sale) return res.status(404).json({ message: "Not found" });
      const settings = await storage.getCompanySettings();

      const PDFDocument = _require("pdfkit");
      const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: `Rechnung ${sale.invoiceNumber}` } });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${sale.invoiceNumber}.pdf"`);
      doc.pipe(res);

      const pageW = 595.28;
      const pageH = 841.89;
      const margin = 50;
      const contentW = pageW - margin * 2;

      // ── Colours & fonts ──────────────────────────────────
      const navy = "#1e3a5f";
      const grey = "#6b7280";
      const lightGrey = "#f3f4f6";
      const black = "#111827";

      // ── Header: Company name left + logo right ──────────
      doc.fontSize(20).font("Helvetica-Bold").fillColor(navy).text(settings.companyName, margin, margin, { width: contentW * 0.65 });
      doc.fontSize(8).font("Helvetica").fillColor(grey)
        .text(`${settings.companyName} | ${settings.address}`, margin, margin + 28, { width: contentW });

      // ── Horizontal rule ──────────────────────────────────
      doc.moveTo(margin, margin + 42).lineTo(pageW - margin, margin + 42).strokeColor(navy).lineWidth(1.5).stroke();

      let y = margin + 55;

      // ── Recipient address block ──────────────────────────
      doc.fontSize(7).font("Helvetica").fillColor(grey).text("Rechnung an:", margin, y);
      y += 12;
      doc.fontSize(10).font("Helvetica-Bold").fillColor(black);
      if (sale.customer.companyName) {
        doc.text(sale.customer.companyName, margin, y); y += 14;
      }
      doc.text(sale.customer.name, margin, y); y += 14;
      doc.font("Helvetica").fontSize(9).fillColor(black);
      sale.customer.address.split("\n").forEach((line) => { doc.text(line, margin, y); y += 13; });
      if (sale.customer.email) { doc.text(sale.customer.email, margin, y); y += 13; }
      if (sale.customer.taxId) { doc.text(`St-Nr.: ${sale.customer.taxId}`, margin, y); y += 13; }

      // ── Invoice meta (right side) ─────────────────────────
      const metaX = pageW - margin - 200;
      const metaY = margin + 55;
      const metaData = [
        ["Rechnungsnummer:", sale.invoiceNumber],
        ["Rechnungsdatum:", sale.invoiceDate],
        ...(sale.deliveryDate ? [["Lieferdatum:", sale.deliveryDate]] : []),
        ["Zahlungsbedingungen:", sale.paymentTerms],
      ] as [string, string][];
      let my = metaY;
      for (const [label, val] of metaData) {
        doc.fontSize(8).font("Helvetica").fillColor(grey).text(label, metaX, my, { width: 100, align: "right" });
        doc.fontSize(8).font("Helvetica-Bold").fillColor(black).text(val, metaX + 105, my, { width: 95, align: "left" });
        my += 14;
      }

      y = Math.max(y, my) + 20;

      // ── "RECHNUNG" heading ────────────────────────────────
      doc.fontSize(16).font("Helvetica-Bold").fillColor(navy).text("RECHNUNG", margin, y);
      y += 30;

      // ── Table header ──────────────────────────────────────
      const colPos = margin;
      const colDesc = margin + 30;
      const colSerial = margin + 250;
      const colSku = margin + 340;
      const colQty = margin + 415;
      const colPrice = margin + 445;
      const colTotal = margin + 490;
      const tableRight = pageW - margin;

      doc.rect(margin, y, contentW, 18).fill(navy);
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text("Pos.", colPos, y + 5, { width: 25 });
      doc.text("Beschreibung", colDesc, y + 5, { width: 185 });
      doc.text("Seriennr.", colSerial, y + 5, { width: 85 });
      doc.text("SKU", colSku, y + 5, { width: 70 });
      doc.text("Menge", colQty, y + 5, { width: 40 });
      doc.text("Einzelpreis", colPrice, y + 5, { width: 55, align: "right" });
      doc.text("Gesamt", colTotal, y + 5, { width: tableRight - colTotal, align: "right" });
      y += 20;

      // ── Table rows ────────────────────────────────────────
      for (const item of sale.items) {
        const rowH = 18;
        if (item.position % 2 === 0) {
          doc.rect(margin, y, contentW, rowH).fill(lightGrey);
        }
        doc.fontSize(8).font("Helvetica").fillColor(black);
        doc.text(String(item.position), colPos, y + 5, { width: 25 });
        doc.text(item.description, colDesc, y + 5, { width: 185 });
        doc.text(item.serialNumber || "—", colSerial, y + 5, { width: 85 });
        doc.text(item.sku || "—", colSku, y + 5, { width: 70 });
        doc.text(String(item.quantity), colQty, y + 5, { width: 40, align: "center" });
        doc.text(`${parseFloat(item.unitPrice).toFixed(2)} €`, colPrice, y + 5, { width: 55, align: "right" });
        doc.text(`${parseFloat(item.total).toFixed(2)} €`, colTotal, y + 5, { width: tableRight - colTotal, align: "right" });
        y += rowH;
      }

      // ── Totals ────────────────────────────────────────────
      y += 10;
      doc.moveTo(margin + contentW * 0.55, y).lineTo(tableRight, y).strokeColor(grey).lineWidth(0.5).stroke();
      y += 6;
      const totX = margin + contentW * 0.55;
      const totValX = tableRight - 80;
      const vatRateNum = parseFloat(sale.vatRate);
      const vatLabel = vatRateNum === 0 ? `MwSt. 0%` : `MwSt. ${vatRateNum}%`;
      const totals: [string, string][] = [
        ["Nettobetrag:", `${parseFloat(sale.totalNet).toFixed(2)} €`],
        [vatLabel, `${parseFloat(sale.totalVat).toFixed(2)} €`],
      ];
      for (const [lbl, val] of totals) {
        doc.fontSize(9).font("Helvetica").fillColor(grey).text(lbl, totX, y, { width: totValX - totX - 5, align: "right" });
        doc.font("Helvetica").fillColor(black).text(val, totValX, y, { width: 80, align: "right" });
        y += 14;
      }
      // Grand total
      doc.rect(totX - 5, y - 2, tableRight - totX + 5, 20).fill(navy);
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text("Gesamtbetrag:", totX, y + 4, { width: totValX - totX - 5, align: "right" });
      doc.text(`${parseFloat(sale.totalGross).toFixed(2)} €`, totValX, y + 4, { width: 80, align: "right" });
      y += 30;

      // VAT note if applicable
      if (sale.vatNote) {
        doc.fontSize(8).font("Helvetica-Oblique").fillColor(grey).text(`Hinweis: ${sale.vatNote}`, margin, y, { width: contentW });
        y += 20;
      }

      // ── Payment section ────────────────────────────────────
      y += 10;
      doc.fontSize(10).font("Helvetica-Bold").fillColor(navy).text("Zahlungsinformationen", margin, y);
      y += 16;
      doc.fontSize(9).font("Helvetica").fillColor(black);
      if (sale.paymentMethod === "bank_transfer") {
        doc.text(`Bank: ${settings.bankName}`, margin, y); y += 13;
        doc.text(`IBAN: ${settings.iban}`, margin, y); y += 13;
        doc.text(`BIC: ${settings.bic}`, margin, y); y += 13;
        doc.text(`Kontoinhaber: ${settings.accountHolder}`, margin, y); y += 13;
        doc.text(`Verwendungszweck: ${sale.invoiceNumber}`, margin, y); y += 13;
      } else if (sale.paymentMethod === "cash") {
        doc.text("Bezahlung: Bar erhalten", margin, y); y += 13;
      } else if (sale.paymentMethod === "paypal") {
        doc.text(`Bezahlung per PayPal${settings.paypalEmail ? ` (${settings.paypalEmail})` : ""}`, margin, y); y += 13;
      } else if (sale.paymentMethod === "credit_card") {
        doc.text("Bezahlung per Kreditkarte", margin, y); y += 13;
      }

      if (sale.notes) {
        y += 10;
        doc.fontSize(9).font("Helvetica-Bold").fillColor(black).text("Anmerkungen:", margin, y); y += 13;
        doc.font("Helvetica").fillColor(grey).text(sale.notes, margin, y, { width: contentW }); y += 20;
      }

      // ── Footer ─────────────────────────────────────────────
      const footerY = pageH - 80;
      doc.moveTo(margin, footerY).lineTo(pageW - margin, footerY).strokeColor(grey).lineWidth(0.5).stroke();
      doc.fontSize(7).font("Helvetica").fillColor(grey);
      const footerLine1 = `${settings.companyName} | ${settings.address} | Geschäftsführer: ${settings.managingDirector}`;
      const footerLine2 = `Registergericht: ${settings.registry} | St-Nr.: ${settings.taxId} | USt-IdNr.: ${settings.vatId}`;
      const footerLine3 = `Tel.: ${settings.phone} | Web: ${settings.website} | ${settings.bankName} | IBAN: ${settings.iban} | BIC: ${settings.bic}`;
      doc.text(footerLine1, margin, footerY + 8, { width: contentW, align: "center" });
      doc.text(footerLine2, margin, footerY + 20, { width: contentW, align: "center" });
      doc.text(footerLine3, margin, footerY + 32, { width: contentW, align: "center" });

      doc.end();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Price Lists ──────────────────────────────────────────────────
  function parsePriceListText(text: string): Array<{ sku: string; productName: string; retailPrice: string }> {
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const items: Array<{ sku: string; productName: string; retailPrice: string }> = [];
    // Matches prices like 1.529,00 or 1529.00 or 1,529.00 at end of line (optionally preceded by €)
    const pricePattern = /(?:€\s*)?(\d{1,3}(?:[.,]\d{3})*[.,]\d{2}|\d+[.,]\d{2})\s*€?\s*$/;
    // SKU: starts uppercase letter or digit, contains letters/digits/hyphens/dots, 3-25 chars
    const skuPattern = /^([A-Z0-9][A-Z0-9\-_.]{2,24})\s+([\s\S]+)$/;
    for (const line of lines) {
      const priceMatch = line.match(pricePattern);
      if (!priceMatch) continue;
      const raw = priceMatch[1];
      // Normalise: German 1.529,00 → 1529.00  or  English 1,529.00 → 1529.00
      let normalised: string;
      if (raw.includes(",") && raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
        normalised = raw.replace(/\./g, "").replace(",", ".");
      } else {
        normalised = raw.replace(/,/g, "");
      }
      const price = parseFloat(normalised);
      if (isNaN(price) || price <= 0 || price > 100000) continue;
      const lineWithoutPrice = line.slice(0, line.length - priceMatch[0].length).trim();
      if (!lineWithoutPrice || lineWithoutPrice.length < 3) continue;
      const skuMatch = lineWithoutPrice.match(skuPattern);
      if (skuMatch) {
        const sku = skuMatch[1].trim();
        const productName = skuMatch[2].replace(/\s+/g, " ").trim();
        if (productName.length < 2) continue;
        items.push({ sku, productName, retailPrice: price.toFixed(2) });
      }
    }
    return items;
  }

  // Parse PDF → preview (no DB save)
  app.post("/api/price-lists/parse", requireAdmin, uploadPdf.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No PDF uploaded" });
      const { text } = await parsePdfBuffer(req.file.buffer);
      const items = parsePriceListText(text);
      res.json({ items, rawLineCount: text.split("\n").length });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Confirm and save a parsed price list
  app.post("/api/price-lists", requireAdmin, async (req, res) => {
    try {
      const user = req.user as any;
      const { supplier, items } = req.body;
      if (!supplier || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "supplier and items[] are required" });
      }
      const pl = await storage.createPriceList(
        { supplier: supplier.trim(), uploadedBy: user.id },
        items.map((i: any) => ({ sku: i.sku, productName: i.productName, retailPrice: i.retailPrice })),
      );
      res.json(pl);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/price-lists", requireAdmin, async (_req, res) => {
    const lists = await storage.getAllPriceLists();
    res.json(lists);
  });

  app.get("/api/price-lists/:id/items", requireAdmin, async (req, res) => {
    const items = await storage.getPriceListItems(parseInt(req.params.id));
    res.json(items);
  });

  app.delete("/api/price-lists/:id", requireAdmin, async (req, res) => {
    await storage.deletePriceList(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Retail price lookup by SKU (used on sale-create + equipment-detail)
  app.get("/api/price-lists/lookup", requireAuth, async (req, res) => {
    const sku = (req.query.sku as string || "").trim();
    if (!sku) return res.json(null);
    const result = await storage.lookupRetailPrice(sku);
    res.json(result);
  });

  return httpServer;
}
