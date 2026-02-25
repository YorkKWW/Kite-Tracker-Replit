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
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // ── Metadata ──────────────────────────────────────────────────────────────
  const invoiceNumber = text.match(/INVOICE\s+No[:\s]+([\w\-]+)/i)?.[1] || "";
  const rawDate = text.match(/Date[:\s]+([\d]+-[A-Za-z]+-[\d]+)/i)?.[1] || "";
  const invoiceDate = convertDuotoneDate(rawDate);
  // Delivery date from "Del.note/date/ref.IDEL-007774/15.05.2024/..."
  const deliveryDate = text.match(/Del\.note\/date\/ref\.[^/]+\/([\d.]+)/i)?.[1] || "";
  // Order number from "B&M/B2B order no.IOR-0031549/..."
  const orderNumber = text.match(/B&M\/B2B order no\.([\w\-]+)/i)?.[1] || "";
  // Totals – appear as "Total Net Value EUR 5 194,20"
  const totalNetRaw = text.match(/Total Net Value\s+EUR\s+([\d\s.,]+)/i)?.[1]?.trim() || "";
  const totalGrossRaw = text.match(/Invoice Total\s+EUR\s+([\d\s.,]+)/i)?.[1]?.trim() || "";
  const totalNet = totalNetRaw ? parseDuotoneNumber(totalNetRaw) : null;
  const totalGross = totalGrossRaw ? parseDuotoneNumber(totalGrossRaw) : null;

  // ── Line items ────────────────────────────────────────────────────────────
  // Format: "44240-3004  DTK-Kite Neo : 06.0 : C02:coral/light-grey  SS24  1 pcs  1 020,00  612,00  612,00"
  // Next line: "LK/95030099   40%"
  const skuRe = /^(\d{4,6}-\d{3,5})\s+/;
  const items: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const skuMatch = line.match(skuRe);
    if (!skuMatch) continue;

    const sku = skuMatch[1];
    const rest = line.slice(skuMatch[0].length);

    // Split on "N pcs" to isolate description (+ season) from prices
    const pcsIdx = rest.search(/\d+\s+pcs/);
    if (pcsIdx < 0) continue;

    const descSection = rest.slice(0, pcsIdx).trim();
    const afterPcs = rest.slice(pcsIdx);

    // Quantity
    const qtyMatch = afterPcs.match(/^(\d+)\s+pcs\s+(.*)/);
    if (!qtyMatch) continue;
    const quantity = parseInt(qtyMatch[1], 10) || 1;
    const priceSection = qtyMatch[2];

    // Parse description: "DTK-Kite Neo : 06.0 : C02:coral/light-grey   SS24"
    // Remove trailing season code (SS24, AW24, FW24, SS23 …)
    const descClean = descSection.replace(/\s+(?:SS|AW|FW)\d{2}\s*$/, "").trim();
    const descParts = descClean.split(":").map((s) => s.trim());
    const name = descParts[0] || descClean;
    const rawSize = descParts[1] || "";
    // Normalize size: "06.0" → "6", "10.0" → "10"
    const size = rawSize ? (parseFloat(rawSize) || rawSize).toString() : "";
    // Color: "C02:coral/light-grey" → strip leading code
    const colorRaw = descParts.slice(2).join(":").trim();
    const color = colorRaw.replace(/^[A-Z0-9]+:/, "").trim();

    // Extract all European numbers from price section
    // e.g. "     1 020,00        612,00        612,00"
    const numMatches = [...priceSection.matchAll(/\b[\d][\d\s]*,\d{2}\b/g)];
    // Net value is the last number (= purchase price)
    const netValue = numMatches.length > 0
      ? parseDuotoneNumber(numMatches[numMatches.length - 1][0])
      : 0;
    const unitPriceAfterDiscount = quantity > 0 ? netValue / quantity : netValue;

    // Discount % on the following line (e.g. "LK/95030099   40%")
    let discount = 0;
    if (i + 1 < lines.length) {
      const discMatch = lines[i + 1].match(/(\d+)%/);
      if (discMatch) discount = parseInt(discMatch[1], 10);
    }

    const { type, isSpare } = detectEquipmentType(name, sku);

    items.push({
      sku,
      name,
      size,
      color,
      quantity,
      discount,
      unitPriceAfterDiscount: Math.round(unitPriceAfterDiscount * 100) / 100,
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

      // Check for duplicate serials in DB
      const allSerial = parsed.items
        .map((i: any) => i.serialNumber)
        .filter(Boolean);
      const existingSerials = new Set<string>();
      for (const s of allSerial) {
        const found = await storage.getEquipmentBySerial(s);
        if (found) existingSerials.add(s);
      }

      const items = parsed.items.map((item: any) => ({
        ...item,
        isDuplicate: existingSerials.has(item.serialNumber),
      }));

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
          serialNumber: item.serialNumber || `IMPORT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
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

  return httpServer;
}
