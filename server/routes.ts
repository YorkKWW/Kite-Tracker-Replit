import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin, requireSuperAdmin, requireHamburg, hashPassword } from "./auth";
import passport from "passport";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { randomUUID } from "crypto";
import PDFDocument from "pdfkit";
import { ObjectStorageService, objectStorageClient } from "./replit_integrations/object_storage/objectStorage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage/routes";
import { PDFParse } from "pdf-parse";

async function sendNotificationEmail(to: string | string[], subject: string, body: string) {
  try {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      console.log("Skipping email: SMTP credentials not configured");
      return;
    }
    const nodemailer = await import("nodemailer");
    const port = parseInt(process.env.SMTP_PORT || "465");
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    const recipients = Array.isArray(to) ? to : [to];
    const fromAddress = process.env.EMAIL_FROM || `KiteTracker <${user}>`;
    console.log(`Sending email to ${recipients.join(", ")} from ${fromAddress}: ${subject}`);
    const result = await transporter.sendMail({
      from: fromAddress,
      to: recipients.join(", "),
      subject: `[KiteTracker] ${subject}`,
      text: body,
    });
    console.log(`Email sent, messageId: ${result.messageId}`);
  } catch (e: any) {
    console.error("Notification email error:", e?.message || e);
  }
}

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

    const detected = detectEquipmentType(name, sku);
    const type = detected?.type ?? "kite";
    const isSpare = detected?.isSpare ?? false;
    const isAccessory = detected === null;

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
      skip: isSpare || isAccessory,
    });
  }

  return { invoiceNumber, invoiceDate, deliveryDate, orderNumber, totalNet, totalGross, items };
}

function detectEquipmentType(name: string, sku: string): { type: string; isSpare: boolean } | null {
  const text = `${name} ${sku}`.toLowerCase();
  const textNoIncl = text.replace(/\(incl\..*?\)/gi, "");

  if (/\bbar\b|sensor|navigator|control bar|rse\d|click bar|trust bar|vary bar/i.test(text)) {
    return { type: "bar_lines", isSpare: false };
  }
  if (/\bfoilboard\b/i.test(text)) {
    return { type: "foilboard", isSpare: false };
  }
  if (/\bboard\b|twintip|directional|\bfusion\b|\bfreeride\b|\bchoice\b|\bdeluxe\b|\d{3}x\d{2}|\bprocess\b|\bmaster\b|\bignition\b/i.test(text)) {
    if (/set of pads|pads\s*&\s*straps/i.test(text)) {
      return { type: "board", isSpare: true };
    }
    return { type: "board", isSpare: false };
  }
  if (/\bkite\b|xr\d|gts\d|nexus|rebel|evo|delta|air pro|foil kite|kap\d|kxr|kgts|knex|\bgts\b|\bos\s+v\d|\brs\s+v\d|\bfs\s+v\d/i.test(text)) {
    return { type: "kite", isSpare: false };
  }
  if (/bladder|bridle|chickenstick|ersatzteil|spare|strut|pump hose|fin.?set|\bfins?\b|grab.?handle|equalizer.*fin|leash|kitebag|repair.?kit|screws|washers|set of \d|set of pads|pads\s*&\s*straps/i.test(textNoIncl)) {
    return { type: "kite", isSpare: true };
  }
  if (/\bfoil\b|hydrofoil|wingfoil|wing foil/i.test(text)) {
    return { type: "foil", isSpare: false };
  }
  if (/\bwing\b/i.test(text)) {
    return { type: "wing", isSpare: false };
  }
  if (/harness|seat harness|trapez/i.test(text)) {
    return null;
  }
  if (/wetsuit|neoprene|neopren/i.test(text)) {
    return null;
  }
  if (/helmet|impact vest|safety vest/i.test(text)) {
    return null;
  }
  return { type: "kite", isSpare: false };
}

// ─── Elevate (Eleveight) invoice format ──────────────────────────────────────
// Distributed by Elliot GmbH. Format:
//   Pos  Art.-Nr.  Bezeichnung  Anzahl Einheit  E-Preis  Rabatt %  Gesamt
//   1  9894076  23 OS V4 10 m  1 Stück  750,09  30,00  525,06
//   CC: 520 15803                              ← serial(s)
function parseEleveightInvoice(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  const invoiceNumber = text.match(/R\s*E\s*C\s*H\s*N\s*U\s*N\s*G\s*Nr\.\s*(\d+)/)?.[1] || "";
  const rawDate = text.match(/Datum\s*:\s*([\d.]+)/)?.[1] || "";
  const invoiceDate = rawDate;
  const orderNumber = text.match(/Auftragsnummer\s*:\s*([\w\-]+)/)?.[1] || "";
  const totalNetRaw = text.match(/Netto-Betrag\s+EUR\s+([\d.,]+)/)?.[1] || "";
  const totalGrossRaw = text.match(/Gesamtbetrag\s+Brutto\s+EUR\s+([\d.,]+)/)?.[1] || "";

  function parseGerman(s: string): number {
    return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
  }

  const totalNet = totalNetRaw ? parseGerman(totalNetRaw) : null;
  const totalGross = totalGrossRaw ? parseGerman(totalGrossRaw) : null;

  const items: any[] = [];

  // pdf-parse reorders columns: "Pos Anzahl Einheit\tArt.-Nr. Bezeichnung E-Preis Rabatt% Gesamt"
  // Actual line: "1 1 Stück\t9894076 23 OS V4 10 m 750,09 30,00 525,06"
  const itemLineRe = /^(\d+)\s+(\d+)\s+Stück\t(\d+)\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)$/;
  const itemLineNoDiscountRe = /^(\d+)\s+(\d+)\s+Stück\t(\d+)\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)$/;

  for (let i = 0; i < lines.length; i++) {
    let match = lines[i].match(itemLineRe);
    let discount = 0;
    let hasDiscount = true;

    if (!match) {
      match = lines[i].match(itemLineNoDiscountRe);
      hasDiscount = false;
    }
    if (!match) continue;

    const sku = match[3];
    const rawName = match[4].trim();
    const quantity = parseInt(match[2], 10) || 1;

    let unitPrice: number, totalPrice: number;
    if (hasDiscount) {
      unitPrice = parseGerman(match[5]);
      discount = parseFloat(match[6].replace(",", ".")) || 0;
      totalPrice = parseGerman(match[7]);
    } else {
      unitPrice = parseGerman(match[5]);
      totalPrice = parseGerman(match[6]);
    }

    const discountedUnitPrice = quantity > 0 ? Math.round((totalPrice / quantity) * 100) / 100 : totalPrice;

    if (/delivery\s*cost|versandkosten|shipping|freight/i.test(rawName)) continue;

    const isNonEquipment = discount >= 100 || /t-shirt|cap\b|beach flag|banner\b|\bflag\b|sticker/i.test(rawName);

    let serials: string[] = [];
    let color = "";
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const ccMatch = nextLine.match(/^CC:\s*(.+)/i);
      if (ccMatch) {
        const ccRaw = ccMatch[1].trim();
        const colorSerialMatch = ccRaw.match(/^\d+\s*-\s*(.+?)\s+([\d,]+)$/);
        if (colorSerialMatch) {
          color = colorSerialMatch[1].trim();
          serials = colorSerialMatch[2].split(",").map(s => s.trim()).filter(Boolean);
        } else {
          const parts = ccRaw.split(/\s+/);
          if (parts.length >= 2) {
            const serialsPart = parts.slice(1).join(",");
            serials = serialsPart.split(",").map(s => s.trim()).filter(Boolean);
          } else {
            serials = ccRaw.split(",").map(s => s.trim()).filter(Boolean);
          }
        }
      } else {
        const trimmedNext = nextLine.trim();
        const boardSerialMatch = trimmedNext.match(/^(?:.*?\s)?(\d{3,5})-(\d{5,}(?:,\d{5,})*)\s*$/);
        if (boardSerialMatch) {
          serials = boardSerialMatch[2].split(",").map(s => s.trim()).filter(Boolean);
        } else {
          const barSerialMatch = trimmedNext.match(/^(?:\d{2}-)(\d{4,5}(?:,\d{4,5})+)$/);
          if (barSerialMatch) {
            serials = barSerialMatch[1].split(",").map(s => s.trim()).filter(Boolean);
          }
        }
      }
    }

    const detected2 = detectEquipmentType(rawName, sku);
    const eqType = detected2?.type ?? "kite";
    const isSpare = detected2?.isSpare ?? false;
    const isAccessory = detected2 === null;

    let size = "";
    if (eqType === "board") {
      const cmMatch = rawName.match(/(\d{2,3})\s*(?:cm|x)/);
      size = cmMatch?.[1] || "";
    } else {
      const sizeMatch = rawName.match(/(\d+(?:\.\d+)?)\s*m\b/);
      size = sizeMatch?.[1] || "";
    }

    const yearMatch = rawName.match(/^(\d{2})\s/);
    const modelYear = yearMatch ? 2000 + parseInt(yearMatch[1], 10) : null;

    const brandedName = `Eleveight ${rawName.replace(/^\d{2}\s+/, "").trim()}`;

    const serialList = serials.length ? serials : [""];
    for (const serial of serialList) {
      items.push({
        sku,
        name: brandedName,
        size,
        color,
        quantity: serials.length > 1 ? 1 : quantity,
        discount,
        unitPriceAfterDiscount: discountedUnitPrice,
        serialNumber: serial,
        type: eqType,
        isSpare,
        skip: isSpare || isNonEquipment || isAccessory,
        modelYear,
      });
    }
  }

  return {
    supplier: "Eleveight",
    invoiceNumber,
    invoiceDate,
    deliveryDate: invoiceDate,
    orderNumber,
    totalNet,
    totalGross,
    items,
  };
}

// ─── Core old invoice format (pre-2023) ──────────────────────────────────────
// pdf-parse extracts each column as a separate line (column-split format):
//   SKU              ← standalone uppercase line
//   UPC: XXXXXXXXX
//   Handelsware / Schulungsmaterial
//   Product description (name)
//   [extra description lines...]
//   SERIAL1 SERIAL2  ← one or more serial lines
//   qty unitPrice€ discount% total€   ← price line
function parseCoreOldInvoice(text: string) {
  // pdf-parse extracts this format with each column on its own line:
  //   SKU (standalone uppercase line)
  //   UPC: xxxxxxx
  //   Handelsware / Schulungsmaterial
  //   Product description (name)
  //   [optional extra description lines]
  //   [serial line(s)]
  //   qty unitPrice€ discount% total€   ← price line

  const invoiceNumber = text.match(/Rechnung\s+(IN\d+)/)?.[1] || "";
  const invoiceDate   = text.match(/Datum\s+([\d.]+)/)?.[1] || "";
  const deliveryDate  = text.match(/Lieferdatum\s+([\d.]+)/)?.[1] || "";
  const orderNumber   = text.match(/Bestellnummer[^\d]*([\w]+)/)?.[1]
    || text.match(/Order\s*(?:Number|No\.?)[:\s]+([\w\-]+)/i)?.[1] || "";
  const totalNetRaw   = text.match(/Subtotal\s+([\d.,]+)\s*€/)?.[1] || "";
  const totalGrossRaw = text.match(/Gesamtsumme\s+([\d.,]+)\s*€/)?.[1] || "";

  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // A standalone SKU: uppercase letters/digits only, starts with a letter, min 3 chars
  // Must contain at least one digit to exclude words like GERMANY, CORE, etc.
  const skuLineRe    = /^([A-Z][A-Z0-9]*[0-9][A-Z0-9]*)$/;
  // Price line: qty unitPrice€ discount% total€
  const priceLineRe  = /^(\d+)\s+([\d.,]+)\s*€\s+(\d+)%\s+([\d.,]+)\s*€$/;
  // Serial line: one or more uppercase+digit tokens each with at least one digit
  const serialLineRe = /^([A-Z]*[0-9][A-Z0-9]{4,}(?:\s+[A-Z]*[0-9][A-Z0-9]{4,})*)$/;
  // Lines to skip within an item block (not name, not serial, not price)
  const skipLineRe   = /^(UPC:|Handelsware|Schulungsmaterial|Artikel|Menge|HEK|Summe)/;
  // Description continuation lines (contain lowercase letters — not product names or serials)
  const descContRe   = /[a-z]/;
  // Page footer/header lines to skip entirely
  const pageBreakRe  = /^(CORE Kiteboarding|Ton Strand|GERMANY|Page|Seite|tel:|email:|surf:|GTC:|IBAN:|SWIFT:|Tax-ID:|VAT-ID:|EORI:|Creditor|CEO:|Comm Register|Company domiciled|VR Bank|Klausdorfer)/;

  const items: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const skuMatch = lines[i].match(skuLineRe);
    if (!skuMatch) continue;
    const sku = skuMatch[1];

    let rawName = "";
    const serials: string[] = [];
    let foundSerials = false;

    for (let j = i + 1; j <= Math.min(i + 120, lines.length - 1); j++) {
      const priceMatch = lines[j].match(priceLineRe);
      if (priceMatch) {
        // Found the price/quantity line — build items from everything collected so far
        const quantity  = parseInt(priceMatch[1], 10) || 1;
        const discount  = parseInt(priceMatch[3], 10) || 0;
        const total     = parseGermanNumber(priceMatch[4]);
        const unitPrice = quantity > 0 ? Math.round((total / quantity) * 100) / 100 : total;

        const detected3 = detectEquipmentType(rawName, sku);
        const type = detected3?.type ?? "kite";
        const isSpare = detected3?.isSpare ?? false;
        const isAccessoryItem = detected3 === null;
        const dimMatch = rawName.match(/(\d{2,3})\s*x\s*\d{2,3}/);
        const decimalMatch = rawName.match(/\s(\d+\.\d+)(?:\s|$)/);
        const fallbackMatch = rawName.match(/\s(\d+\.?\d*)(?:\s|$)/);
        let size = "";
        if (type === "board" || type === "foilboard") {
          size = dimMatch?.[1] || decimalMatch?.[1] || fallbackMatch?.[1] || "";
        } else if (type === "kite" || type === "wing") {
          size = decimalMatch?.[1] || dimMatch?.[1] || fallbackMatch?.[1] || "";
        } else {
          size = decimalMatch?.[1] || fallbackMatch?.[1] || "";
        }
        const serialList = serials.length ? serials : [""];

        for (const serial of serialList) {
          items.push({
            sku,
            name: rawName.trim(),
            size,
            color: "",
            quantity,
            discount,
            unitPriceAfterDiscount: unitPrice,
            serialNumber: serial,
            type,
            isSpare,
            skip: isSpare || isAccessoryItem,
          });
        }
        i = j; // advance outer loop past this item block
        break;
      }

      if (skipLineRe.test(lines[j]) || pageBreakRe.test(lines[j])) continue;

      if (serialLineRe.test(lines[j])) {
        serials.push(...lines[j].split(/\s+/).filter(Boolean));
        foundSerials = true;
        continue;
      }

      // Description continuation lines (contain lowercase — e.g. "24m Line Length, Standard Loop/Stick Set")
      // Only skip AFTER we already captured the product name
      if (rawName && descContRe.test(lines[j])) continue;

      // Lines like "333(12)" for pad/strap counts — skip
      if (/^\d+\(\d+\)$/.test(lines[j])) continue;

      // First non-skip, non-serial, non-price line → product name
      if (!rawName) rawName = lines[j];
    }
  }

  return {
    invoiceNumber,
    invoiceDate,
    deliveryDate,
    orderNumber,
    totalNet:   totalNetRaw   ? parseGermanNumber(totalNetRaw)   : null,
    totalGross: totalGrossRaw ? parseGermanNumber(totalGrossRaw) : null,
    items,
  };
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
  const serialLineRe = /^([A-Z0-9]{6,}(?:,\s*[A-Z0-9]{6,})*),?\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const skuMatch = line.match(skuLineRe);
    if (!skuMatch) continue;

    const [, sku, rawName] = skuMatch;

    // Find qty line within the next 10 lines (serial numbers may span multiple lines)
    let qtyLine: string | null = null;
    let qtyLineIdx = -1;
    for (let j = i + 1; j <= Math.min(i + 10, lines.length - 1); j++) {
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

    // Look for serial lines between SKU line and qty line (may span multiple lines)
    let serials: string[] = [];
    for (let j = i + 1; j < qtyLineIdx; j++) {
      const serialMatch = lines[j].match(serialLineRe);
      if (serialMatch) {
        const found = serialMatch[1].split(",").map((s: string) => s.trim()).filter(Boolean);
        serials.push(...found);
      }
    }

    if (serials.length === 0) serials = [""];

    const sizeMatch = rawName.match(/\(([0-9.]+)/);
    const colorMatch = rawName.match(/,\s*([^)]+)\)/);
    const size = sizeMatch?.[1]?.trim() || "";
    const color = colorMatch?.[1]?.trim() || "";
    const name = rawName.replace(/\s*\([^)]*\)\s*/, "").trim();

    const detected4 = detectEquipmentType(name, sku);
    const type = detected4?.type ?? "kite";
    const isSpare = detected4?.isSpare ?? false;
    const isAccessoryLine = detected4 === null;

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
        skip: isSpare || isAccessoryLine,
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

const uploadCsv = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".csv" || ext === ".txt" || file.mimetype === "text/csv" || file.mimetype === "text/plain") {
      return cb(null, true);
    }
    cb(new Error("Only CSV files are allowed"));
  },
});

async function checkEquipmentAccess(req: any, equipmentId: number): Promise<boolean> {
  const user = req.user as any;
  if (user.role === "admin" || user.role === "manager") return true;
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
      req.logIn(user, async (err) => {
        if (err) return next(err);
        const { password, ...safeUser } = user;
        await storage.createActivityLog({
          userId: user.id,
          action: "user_login",
          details: `${user.name} logged in`,
        }).catch(() => {});
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

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      // Always return success to prevent email enumeration
      if (!user) return res.json({ message: "If that email exists, a reset link has been sent." });
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await storage.createPasswordResetToken(user.id, token, expiresAt);
      const appUrl = process.env.APP_URL || `https://${req.get("host")}`;
      const resetLink = `${appUrl}/reset-password?token=${token}`;
      await sendNotificationEmail(
        user.email,
        "Passwort zurücksetzen",
        `Hallo ${user.name},\n\ndu hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.\n\nKlicke auf den folgenden Link, um ein neues Passwort zu setzen:\n${resetLink}\n\nDer Link ist 1 Stunde gültig.\n\nFalls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.\n\nDein KiteTracker-Team`
      );
      res.json({ message: "If that email exists, a reset link has been sent." });
    } catch (err: any) {
      console.error("Forgot password error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) return res.status(400).json({ message: "Token and password required" });
      if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
      const record = await storage.getValidPasswordResetToken(token);
      if (!record) return res.status(400).json({ message: "Invalid or expired reset link" });
      const hashed = await hashPassword(password);
      await storage.updateUserPassword(record.userId, hashed);
      await storage.markPasswordResetTokenUsed(record.id);
      res.json({ message: "Password updated successfully" });
    } catch (err: any) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
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
    await storage.createActivityLog({
      userId: (req.user as any).id,
      action: "station_updated",
      details: `Updated station: ${station.name}`,
    });
    res.json(station);
  });

  app.delete("/api/stations/:id", requireSuperAdmin, async (req, res) => {
    const station = await storage.getStation(parseInt(req.params.id));
    await storage.deleteStation(parseInt(req.params.id));
    await storage.createActivityLog({
      userId: (req.user as any).id,
      action: "station_deleted",
      details: `Deleted station: ${station?.name || `#${req.params.id}`}`,
    });
    res.json({ message: "Deleted" });
  });

  app.get("/api/users", requireAdmin, async (_req, res) => {
    const usersList = await storage.getAllUsers();
    res.json(usersList.map(({ password, ...u }) => u));
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const currentUser = req.user as any;
      const targetRole = req.body.role;
      const targetIsSuperAdmin = req.body.isSuperAdmin;
      if (!currentUser.isSuperAdmin && (targetRole === "admin" || targetIsSuperAdmin)) {
        return res.status(403).json({ message: "Only Super Admins can create Admin accounts" });
      }
      if (!currentUser.isSuperAdmin) {
        delete req.body.canEditEquipment;
      }
      const hashed = await hashPassword(req.body.password);
      const user = await storage.createUser({ ...req.body, password: hashed });
      const { password, ...safeUser } = user;
      await storage.createActivityLog({
        userId: currentUser.id,
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
    const currentUser = req.user as any;
    const targetRole = req.body.role;
    const targetIsSuperAdmin = req.body.isSuperAdmin;
    if (!currentUser.isSuperAdmin && (targetRole === "admin" || targetIsSuperAdmin)) {
      return res.status(403).json({ message: "Only Super Admins can assign Admin roles" });
    }
    const existingUser = await storage.getUser(parseInt(req.params.id));
    if (existingUser && existingUser.role === "admin" && !currentUser.isSuperAdmin) {
      return res.status(403).json({ message: "Only Super Admins can edit Admin accounts" });
    }
    if (!currentUser.isSuperAdmin) {
      delete req.body.canEditEquipment;
    }
    const data = { ...req.body };
    if (data.password) {
      data.password = await hashPassword(data.password);
    }
    const user = await storage.updateUser(parseInt(req.params.id), data);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password, ...safeUser } = user;
    await storage.createActivityLog({
      userId: currentUser.id,
      action: "user_updated",
      details: `Updated user: ${user.email}`,
    });
    res.json(safeUser);
  });

  app.delete("/api/users/:id", requireSuperAdmin, async (req, res) => {
    const targetId = parseInt(req.params.id);
    if (targetId === (req.user as any)?.id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }
    try {
      const targetUser = await storage.getUser(targetId);
      await storage.deleteUser(targetId);
      await storage.createActivityLog({
        userId: (req.user as any).id,
        action: "user_deleted",
        details: `Deleted user: ${targetUser?.email || `#${targetId}`}`,
      });
      res.json({ message: "Deleted" });
    } catch (err: any) {
      console.error("deleteUser error:", err);
      res.status(500).json({ message: "Failed to delete user. " + (err.message || "") });
    }
  });

  app.get("/api/equipment/scan", requireAuth, async (req, res) => {
    const serial = (req.query.serial || req.query.code) as string;
    if (!serial) return res.status(400).json({ message: "serial or code param required" });
    const item = await storage.getEquipmentByCode(serial);
    if (!item) return res.status(404).json({ message: "Equipment not found" });
    const user = req.user as any;
    if (user.role === "station_lead" && item.currentStationId !== user.assignedStationId) {
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
    if (user.role === "station_lead") {
      filters.stationId = user.assignedStationId;
      filters.includeTransfersForStation = true;
    } else if (req.query.stationId === "unassigned") {
      filters.unassigned = true;
    } else if (req.query.stationId) {
      filters.stationId = parseInt(req.query.stationId as string);
      if (req.query.includeTransfers === "true") {
        filters.includeTransfersForStation = true;
      }
    }
    if (req.query.type) filters.type = req.query.type;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.conditionRating) filters.conditionRating = parseInt(req.query.conditionRating as string);
    if (req.query.search) filters.search = req.query.search;

    let items = await storage.getAllEquipment(filters);

    if (user.role === "station_lead") {
      items = items.map(({ purchasePrice, salePrice, ...rest }) => rest as any);
    }

    res.json(items);
  });

  app.get("/api/equipment/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Equipment not found" });
    const item = await storage.getEquipment(id);
    if (!item) return res.status(404).json({ message: "Equipment not found" });

    const user = req.user as any;
    if (user.role === "station_lead" && item.currentStationId !== user.assignedStationId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (user.role === "station_lead") {
      const { purchasePrice, salePrice, ...safe } = item;
      return res.json(safe);
    }

    res.json(item);
  });

  app.post("/api/equipment", requireHamburg, async (req, res) => {
    try {
      if (!req.body.currentStationId) {
        const allSt = await storage.getAllStations();
        const fallback = allSt.find(s => s.isVirtual && s.name.includes("Incoming"))
          ?? allSt.find(s => s.name.toLowerCase().includes("incoming"))
          ?? allSt.find(s => s.name.toLowerCase().includes("warehouse"));
        req.body.currentStationId = fallback?.id ?? null;
      }
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

  app.patch("/api/equipment/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const isHamburg = user.role === "admin" || user.role === "manager";
    if (!isHamburg && !user.canEditEquipment) {
      return res.status(403).json({ message: "Not authorized to edit equipment" });
    }
    let updateData = req.body;
    if (!isHamburg && user.canEditEquipment) {
      const ALLOWED_FIELDS = ["serialNumber", "brand", "model", "type", "sku", "typeSpecificFields", "notes"];
      updateData = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => ALLOWED_FIELDS.includes(key))
      );
    }
    const equipmentId = parseInt(req.params.id);
    const item = await storage.updateEquipment(equipmentId, updateData);
    if (!item) return res.status(404).json({ message: "Equipment not found" });
    await storage.createActivityLog({
      userId: (req.user as any).id,
      action: "equipment_updated",
      equipmentId,
      details: `Updated ${item.brand} ${item.model}`,
    });
    res.json(item);
  });

  app.delete("/api/equipment/:id", requireSuperAdmin, async (req, res) => {
    await storage.deleteEquipment(parseInt(req.params.id));
    await storage.createActivityLog({
      userId: (req.user as any).id,
      action: "equipment_deleted",
      details: `Deleted equipment #${req.params.id}`,
    });
    res.json({ message: "Deleted" });
  });

  app.post("/api/equipment/bulk-delete", requireSuperAdmin, async (req, res) => {
    const ids: number[] = req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }
    const result = await storage.bulkDeleteEquipment(ids);
    await storage.createActivityLog({
      userId: (req.user as any).id,
      action: "equipment_bulk_deleted",
      details: `Bulk deleted ${result.deleted} equipment items (IDs: ${ids.join(", ")})`,
    });
    res.json(result);
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
    if (user.role === "station_lead") {
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
      cost: (user.role === "admin" || user.role === "manager") ? req.body.cost : null,
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
    if (user.role === "station_lead") {
      delete data.cost;
    }
    const repair = await storage.updateRepair(parseInt(req.params.id), data);
    if (!repair) return res.status(404).json({ message: "Repair not found" });
    const repairEq = await storage.getEquipment(repair.equipmentId);
    await storage.createActivityLog({
      userId: user.id,
      action: "repair_updated",
      equipmentId: repair.equipmentId,
      details: `Updated repair for ${repairEq ? `${repairEq.brand} ${repairEq.model}` : `equipment #${repair.equipmentId}`}`,
    });
    res.json(repair);
  });

  app.get("/api/repairs/active", requireAuth, async (req, res) => {
    const user = req.user as any;
    const stationId = user.role === "station_lead" ? user.assignedStationId : undefined;
    const items = await storage.getActiveRepairsWithDetails(stationId);
    res.json(items);
  });

  app.post("/api/repairs/:id/complete", requireAuth, async (req, res) => {
    const user = req.user as any;
    const repairId = parseInt(req.params.id);
    const { actualCost, notes } = req.body;

    const existing = await storage.getAllRepairs();
    const existingRepair = existing.find(r => r.id === repairId);
    if (!existingRepair) return res.status(404).json({ message: "Repair not found" });

    const descriptionUpdate = notes
      ? `${existingRepair.description}\n\nCompletion notes: ${notes}`
      : existingRepair.description;

    const repair = await storage.updateRepair(repairId, {
      status: "completed",
      cost: actualCost ?? null,
      description: descriptionUpdate,
    });
    if (!repair) return res.status(404).json({ message: "Repair not found" });

    await storage.updateEquipment(repair.equipmentId, { status: "active" });

    const damageReports_ = await storage.getDamageReportsByEquipment(repair.equipmentId);
    const openDR = damageReports_.find(dr => dr.status === "open" && dr.repairId === repairId);
    if (openDR) {
      await storage.updateDamageReport(openDR.id, { status: "closed" as any });
    }

    await storage.createActivityLog({
      userId: user.id,
      action: "repair_logged",
      equipmentId: repair.equipmentId,
      details: `Repair completed. Actual cost: ${actualCost ? `€${actualCost}` : "not recorded"}${notes ? `. Notes: ${notes}` : ""}`,
    });

    res.json({ success: true, repair });
  });

  app.get("/api/transfers", requireAuth, async (req, res) => {
    const user = req.user as any;
    const filters: any = {};
    if (user.role === "station_lead") {
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

  app.post("/api/transfers/bulk", requireHamburg, async (req, res) => {
    const user = req.user as any;
    const { equipmentIds, toStationId } = req.body;
    if (!Array.isArray(equipmentIds) || equipmentIds.length === 0 || !equipmentIds.every((id: any) => typeof id === "number" && Number.isInteger(id) && id > 0)) {
      return res.status(400).json({ message: "equipmentIds must be a non-empty array of positive integers" });
    }
    if (typeof toStationId !== "number" || !Number.isInteger(toStationId) || toStationId <= 0) {
      return res.status(400).json({ message: "toStationId must be a positive integer" });
    }

    const allStations = await storage.getAllStations();
    const destStation = allStations.find(s => s.id === toStationId);
    if (!destStation || destStation.isVirtual) {
      return res.status(400).json({ message: "Invalid destination station" });
    }

    const results: { transferred: number; errors: string[] } = { transferred: 0, errors: [] };

    for (const eqId of equipmentIds) {
      try {
        const item = await storage.getEquipment(eqId);
        if (!item) {
          results.errors.push(`Equipment #${eqId} not found`);
          continue;
        }
        if (item.status === "in_transfer") {
          results.errors.push(`${item.brand} ${item.model} (${item.serialNumber}) is already in transfer`);
          continue;
        }
        let fromStationId = item.currentStationId;
        if (!fromStationId) {
          const incoming = allStations.find(s => s.isVirtual && s.name.includes("Incoming"))
            ?? allStations.find(s => s.name.toLowerCase().includes("incoming"))
            ?? allStations.find(s => s.name.toLowerCase().includes("warehouse"))
            ?? allStations.find(s => s.isVirtual);
          fromStationId = incoming?.id ?? toStationId;
        }
        await storage.createTransfer({
          equipmentId: eqId,
          fromStationId,
          toStationId,
          initiatedBy: user.id,
        });
        try {
          await storage.createActivityLog({
            userId: user.id,
            action: "transfer_initiated",
            equipmentId: eqId,
            details: `Bulk transfer initiated to station ${toStationId}`,
          });
        } catch (_logErr) {
          // Activity log failure is non-fatal
        }
        results.transferred++;
      } catch (err: any) {
        console.error(`Bulk transfer error for equipment #${eqId}:`, err);
        results.errors.push(`Equipment #${eqId}: Transfer failed`);
      }
    }

    res.json(results);
  });

  app.post("/api/transfers", requireAuth, async (req, res) => {
    const user = req.user as any;
    let fromStationId = req.body.fromStationId;
    if (!fromStationId) {
      const allStations = await storage.getAllStations();
      const incoming = allStations.find(s => s.isVirtual && s.name.includes("Incoming"))
        ?? allStations.find(s => s.name.toLowerCase().includes("incoming"))
        ?? allStations.find(s => s.name.toLowerCase().includes("warehouse"))
        ?? allStations.find(s => s.isVirtual);
      fromStationId = incoming?.id ?? null;
      if (!fromStationId) {
        fromStationId = req.body.toStationId;
      }
    }
    const transfer = await storage.createTransfer({
      equipmentId: req.body.equipmentId,
      fromStationId,
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

    const isAdmin = user.role === "admin";
    const isReceivingManager =
      (user.role === "manager" || user.role === "station_lead") &&
      user.assignedStationId === existing.toStationId;
    if (!isAdmin && !isReceivingManager) {
      return res.status(403).json({ message: "Only the receiving station manager or admin can confirm receipt" });
    }

    const { arrived, condition } = req.body as { arrived: boolean; condition?: number };
    if (typeof arrived !== "boolean") {
      return res.status(400).json({ message: "arrived (boolean) is required" });
    }
    if (arrived && (condition == null || condition < 1 || condition > 5)) {
      return res.status(400).json({ message: "condition (1–5) is required when item arrived" });
    }

    const transfer = await storage.confirmTransfer(transferId, user.id, { arrived, condition });
    if (!transfer) return res.status(404).json({ message: "Transfer not found" });

    await storage.createActivityLog({
      userId: user.id,
      action: arrived ? "transfer_confirmed" : "transfer_item_missing",
      equipmentId: transfer.equipmentId,
      details: arrived
        ? `Transfer received · condition ${condition}/5`
        : `Transfer receipt: item reported missing`,
    });
    res.json(transfer);
  });

  app.post("/api/transfers/:id/cancel", requireAuth, async (req, res) => {
    const user = req.user as any;
    const transfer = await storage.cancelTransfer(parseInt(req.params.id));
    if (!transfer) return res.status(404).json({ message: "Transfer not found" });
    await storage.createActivityLog({
      userId: user.id,
      action: "transfer_cancelled",
      details: `Cancelled transfer #${transfer.id}`,
    });
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
    const eq = await storage.getEquipment(equipmentId);
    await storage.createActivityLog({
      userId: user.id,
      action: "photo_added",
      equipmentId,
      details: `Added photo to ${eq ? `${eq.brand} ${eq.model}` : `equipment #${equipmentId}`}`,
    });
    res.json(photo);
  });

  app.delete("/api/photos/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const photoId = parseInt(req.params.id);
    const photo = await storage.getPhoto(photoId);
    if (photo?.url?.startsWith("/objects/")) {
      try {
        const objectFile = await objectStorage.getObjectEntityFile(photo.url);
        await objectFile.delete({ ignoreNotFound: true });
      } catch {
        // Object storage cleanup failed — still delete DB record
      }
    }
    const eqId = photo?.equipmentId;
    await storage.deletePhoto(photoId);
    if (eqId) {
      const eq = await storage.getEquipment(eqId);
      await storage.createActivityLog({
        userId: user.id,
        action: "photo_deleted",
        equipmentId: eqId,
        details: `Deleted photo from ${eq ? `${eq.brand} ${eq.model}` : `equipment #${eqId}`}`,
      });
    }
    res.json({ message: "Deleted" });
  });

  app.post("/api/stations/:id/inventory-checks", requireAuth, async (req, res) => {
    const user = req.user as any;
    const stationId = parseInt(req.params.id);
    if (user.role === "station_lead" && user.assignedStationId !== stationId) {
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
    const stationsList = await storage.getAllStations();
    const stationName = stationsList.find(s => s.id === stationId)?.name || `Station #${stationId}`;
    await storage.createActivityLog({
      userId: user.id,
      action: "inventory_check_started",
      details: `Started inventory check at ${stationName} (${equipmentList.length} items)`,
    });
    res.json(check);
  });

  app.get("/api/stations/:id/inventory-checks", requireAuth, async (req, res) => {
    const user = req.user as any;
    const stationId = parseInt(req.params.id);
    if (user.role === "station_lead" && user.assignedStationId !== stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const checks = await storage.getInventoryChecks(stationId);
    res.json(checks);
  });

  app.get("/api/inventory-checks/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const check = await storage.getInventoryCheck(parseInt(req.params.id));
    if (!check) return res.status(404).json({ message: "Not found" });
    if (user.role === "station_lead" && user.assignedStationId !== check.stationId) {
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
    if (user.role === "station_lead" && user.assignedStationId !== check.stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const updated = await storage.completeInventoryCheck(check.id);
    const stationsList = await storage.getAllStations();
    const stationName = stationsList.find(s => s.id === check.stationId)?.name || `Station #${check.stationId}`;
    await storage.createActivityLog({
      userId: user.id,
      action: "inventory_check_completed",
      details: `Completed inventory check at ${stationName}`,
    });
    res.json(updated);
  });

  app.get("/api/inventory-checks/:id/items/:equipmentId/photos/upload-url", requireAuth, async (req, res) => {
    const checkId = parseInt(req.params.id);
    const check = await storage.getInventoryCheck(checkId);
    if (!check) return res.status(404).json({ message: "Not found" });
    try {
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to get upload URL: " + err.message });
    }
  });

  app.patch("/api/inventory-checks/:id/items/:equipmentId", requireAuth, async (req, res) => {
    const user = req.user as any;
    const checkId = parseInt(req.params.id);
    const equipmentId = parseInt(req.params.equipmentId);
    const check = await storage.getInventoryCheck(checkId);
    if (!check) return res.status(404).json({ message: "Not found" });
    if (user.role === "station_lead" && user.assignedStationId !== check.stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const item = await storage.upsertInventoryCheckItem({
      checkId,
      equipmentId,
      ...req.body,
      checkedAt: req.body.checked ? new Date() : undefined,
      checkedBy: req.body.checked ? user.id : undefined,
    });
    const eq = await storage.getEquipment(equipmentId);
    const status = req.body.status || (req.body.checked ? "found" : "pending");
    await storage.createActivityLog({
      userId: user.id,
      action: "inventory_item_checked",
      equipmentId,
      details: `Inventory check: ${eq ? `${eq.brand} ${eq.model}` : `#${equipmentId}`} marked as ${status}`,
    });
    res.json(item);
  });

  app.get("/api/activity", requireAuth, async (req, res) => {
    const user = req.user as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const action = req.query.action as string | undefined;
    const equipmentId = req.query.equipmentId ? parseInt(req.query.equipmentId as string) : undefined;
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
    const stationId = user.role === "station_lead"
      ? user.assignedStationId
      : req.query.stationId ? parseInt(req.query.stationId as string) : undefined;
    const logs = await storage.getActivityLog({ limit, userId, action, stationId, equipmentId, dateFrom, dateTo });
    res.json(logs);
  });

  app.get("/api/equipment/:id/activity", requireAuth, async (req, res) => {
    const equipmentId = parseInt(req.params.id);
    if (!(await checkEquipmentAccess(req, equipmentId))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const logs = await storage.getEquipmentActivityLog(equipmentId);
    res.json(logs);
  });

  app.get("/api/dashboard", requireAuth, async (req, res) => {
    const user = req.user as any;
    let stationId: number | undefined;
    if (user.role === "station_lead") {
      stationId = user.assignedStationId;
    } else if (req.query.stationId) {
      stationId = parseInt(req.query.stationId as string);
    }
    const stats = await storage.getDashboardStats(stationId);
    res.json(stats);
  });

  app.post("/api/equipment/import", requireHamburg, uploadCsv.single("file"), async (req, res) => {
    return res.status(503).json({ message: "CSV Import is currently disabled. We're working on improving the import process to ensure data integrity." });
    
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
      // Strip BOM + normalise line endings
      const content = fs.readFileSync(req.file.path, "utf-8")
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
      const lines = content.split("\n").filter((l) => l.trim());
      if (lines.length < 2) return res.status(400).json({ message: "File is empty or has no data rows" });

      // Auto-detect delimiter: semicolon or comma (check header row, ignoring quoted sections)
      const headerLine = lines[0];
      const unquoted = headerLine.replace(/"[^"]*"/g, "");
      const delimiter = unquoted.includes(";") ? ";" : ",";

      // Proper CSV field parser that respects quoted fields
      function parseCSVLine(line: string, delim: string): string[] {
        const fields: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
          const ch = line[j];
          if (inQuotes) {
            if (ch === '"' && line[j + 1] === '"') {
              current += '"';
              j++;
            } else if (ch === '"') {
              inQuotes = false;
            } else {
              current += ch;
            }
          } else {
            if (ch === '"') {
              inQuotes = true;
            } else if (ch === delim) {
              fields.push(current.trim());
              current = "";
            } else {
              current += ch;
            }
          }
        }
        fields.push(current.trim());
        return fields;
      }

      const rawHeaders = parseCSVLine(lines[0], delimiter).map(h => h.replace(/['"]/g, ""));

      // Normalise header → internal key
      function normaliseHeader(h: string): string {
        const cleaned = h.toLowerCase()
          .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");
        return cleaned;
      }
      const headers = rawHeaders.map(normaliseHeader);

      // Equipment type mapping (handles plural/German/capitalised values)
      const TYPE_MAP: Record<string, string> = {
        kites: "kite", kite: "kite",
        boards: "board", board: "board",
        bars: "bar_lines", bar: "bar_lines", bar_lines: "bar_lines",
        wetsuits: "wetsuit", wetsuit: "wetsuit",
        wings: "wing", wing: "wing",
        foilboards: "foilboard", foilboard: "foilboard",
        foils: "foil", foil: "foil",
        harnesses: "harness", harness: "harness",
        helmets: "helmet_safety", helmet: "helmet_safety",
      };

      const STATUS_MAP: Record<string, string> = {
        active: "active", aktiv: "active", ok: "active", good: "active",
        in_repair: "in_repair", repair: "in_repair", reparatur: "in_repair",
        in_reparatur: "in_repair", "in repair": "in_repair", defekt: "in_repair",
        retired: "retired", ausgemustert: "retired", entsorgt: "retired",
        sold: "sold", verkauft: "sold",
        in_transfer: "in_transfer", transfer: "in_transfer", "in transfer": "in_transfer",
        missing: "missing", vermisst: "missing", fehlt: "missing",
      };
      const VALID_STATUSES = new Set(["active", "in_repair", "retired", "sold", "in_transfer", "missing"]);

      const allStationsForImport = await storage.getAllStations();
      // targetStationId can be passed from the frontend to assign a specific station
      const targetStationId = req.body?.targetStationId ? parseInt(req.body.targetStationId) : null;
      const incomingFallback = allStationsForImport.find(s => s.isVirtual && s.name.includes("Incoming"))
        ?? allStationsForImport.find(s => s.name.toLowerCase().includes("incoming"))
        ?? allStationsForImport.find(s => s.name.toLowerCase().includes("warehouse"));
      const fallbackStationId = targetStationId ?? incomingFallback?.id ?? null;

      const results = { imported: 0, skipped: 0, duplicates: 0, errors: [] as string[], skippedSerials: [] as string[] };

      console.log(`[CSV Import] Delimiter: "${delimiter}", Headers: ${JSON.stringify(headers)}, Rows: ${lines.length - 1}, HasStatusColumn: ${headers.some(h => ["status","zustand_status","equipment_status","state"].includes(h))}`);

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i], delimiter);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

        // Serial number — handle multiple possible header names (EN + DE)
        const serialNumber =
          row["serial_number"] || row["serialnumber"] || row["serial"] ||
          row["serial_nr"] || row["sn"] || row["seriennummer"] || row["serien_nummer"] ||
          row["seriennr"] || row["serien_nr"] || row["s_n"] || "";
        
        if (!serialNumber.trim()) {
          results.errors.push(`Row ${i + 1}: Missing serial number (columns: ${headers.join(", ")})`);
          results.skipped++;
          continue;
        }

        const existing = await storage.getEquipmentBySerial(serialNumber.trim());
        if (existing) {
          results.duplicates++;
          results.skipped++;
          results.skippedSerials.push(serialNumber.trim());
          continue;
        }

        // Equipment type — handles "Equipment Type" column and plural/capitalised values
        const rawType = row["equipment_type"] || row["type"] || row["typ"] || "kite";
        const resolvedType = (TYPE_MAP[rawType.toLowerCase().trim()] ?? rawType.toLowerCase().trim()) as any;

        // Size — fix European decimal comma → dot
        const rawSize = (row["size_m"] || row["size"] || row["gre"] || "").replace(",", ".");
        const sizeVal = rawSize.trim();

        // Model — use model column; optionally append size if not already in model name
        const baseModel = row["model"] || row["modell"] || "Unknown";
        const model = baseModel.trim();

        // Station: honour "Location" column if it matches a station name, else fall back
        const locationCol = row["location"] || row["standort"] || row["station"] || "";
        let stationId: number | null = fallbackStationId;
        if (locationCol.trim()) {
          const matched = allStationsForImport.find(s =>
            s.name.toLowerCase() === locationCol.trim().toLowerCase()
          );
          if (matched) stationId = matched.id;
        }

        // Status — map from CSV or default to "active"
        const rawStatus = row["status"] || row["zustand_status"] || row["equipment_status"] || row["state"] || "";
        let status: string = "active";
        if (rawStatus.trim()) {
          const mapped = STATUS_MAP[rawStatus.trim().toLowerCase().replace(/\s+/g, "_")];
          if (mapped) {
            status = mapped;
          } else if (VALID_STATUSES.has(rawStatus.trim().toLowerCase())) {
            status = rawStatus.trim().toLowerCase();
          }
        }

        // Condition: CSV values are taken as-is on 1–5 scale (5=best, 1=worst)
        const rawCond = row["condition"] || row["condition_rating"] || row["zustand"] || row["bewertung"] || "";
        let conditionRating = 5;
        if (rawCond.trim()) {
          const n = parseInt(rawCond.trim());
          if (!isNaN(n)) {
            conditionRating = Math.min(5, Math.max(1, n));
          }
        }

        // Purchase date
        const rawDate = row["date_of_purchase"] || row["purchase_date"] || row["date"] || row["kaufdatum"] || "";
        let purchaseDate: Date | null = null;
        if (rawDate.trim()) {
          const d = new Date(rawDate.trim());
          if (!isNaN(d.getTime())) purchaseDate = d;
        }

        // Prices — remove € signs and spaces, fix decimal comma
        function parsePrice(raw: string): string | null {
          if (!raw.trim()) return null;
          const cleaned = raw.replace(/[€$\s]/g, "").replace(",", ".");
          return isNaN(parseFloat(cleaned)) ? null : cleaned;
        }
        const purchasePrice = parsePrice(row["purchase_price_"] || row["purchase_price"] || row["preis"] || row["einkaufspreis"] || "");
        const currentValue = parsePrice(row["current_value_"] || row["current_value"] || row["aktueller_wert"] || row["zeitwert"] || "") ?? purchasePrice;
        const salePrice = parsePrice(row["sale_price"] || row["sale_price_"] || row["verkaufspreis"] || "");
        const invoiceReference = (row["invoice_reference"] || row["invoice_ref"] || row["rechnungsnummer"] || row["rechnung"] || "").trim() || null;

        try {
          await storage.createEquipment({
            serialNumber: serialNumber.trim(),
            sku: row["sku"] || null,
            type: resolvedType,
            brand: (row["brand"] || row["marke"] || "Unknown").trim(),
            model,
            purchaseDate,
            yearOfPurchase: purchaseDate ? purchaseDate.getFullYear() : (row["year"] || row["year_of_purchase"] || row["baujahr"] || row["kaufjahr"] ? parseInt(row["year"] || row["year_of_purchase"] || row["baujahr"] || row["kaufjahr"]) : null),
            currentStationId: stationId,
            status: status as any,
            conditionRating,
            notes: (row["notes"] || row["bemerkung"] || "").trim() || null,
            purchasePrice,
            currentValue,
            salePrice,
            invoiceReference,
            typeSpecificFields: {
              ...(sizeVal ? { size: sizeVal } : {}),
              ...(row["color"] || row["farbe"] ? { color: (row["color"] || row["farbe"]).trim() } : {}),
            },
          });
          results.imported++;
        } catch (err: any) {
          results.errors.push(`Row ${i + 1} (${serialNumber}): ${err.message}`);
          results.skipped++;
        }
      }

      fs.unlinkSync(req.file.path);
      const user = req.user as any;
      await storage.createActivityLog({
        userId: user.id,
        action: "equipment_csv_import",
        details: `CSV import: ${results.imported} imported, ${results.skipped} skipped, ${results.errors.length} errors`,
      });
      res.json(results);
    } catch (err: any) {
      res.status(400).json({ message: `Import failed: ${err.message}` });
    }
  });

  // ─── Suppliers ───────────────────────────────────────────────────────────────
  app.get("/api/suppliers", requireAuth, async (_req, res) => {
    res.json(await storage.getAllSuppliers());
  });


  // ─── Invoice: Parse PDF ───────────────────────────────────────────────────────
  app.post("/api/invoices/parse", requireHamburg, uploadPdf.single("pdf"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No PDF uploaded" });
    try {
      const data = await parsePdfBuffer(req.file.buffer);
      // Auto-detect invoice format
      const isDuotone    = /boards.and.more|B&M\/B2B/i.test(data.text);
      const isEleveight  = /Elliot\s+GmbH|Eleveight|eleveight/i.test(data.text);
      const isNewCore    = /^\[[A-Z0-9]+\]/m.test(data.text);
      const parsed = isDuotone    ? parseDuotoneInvoice(data.text)
                   : isEleveight  ? parseEleveightInvoice(data.text)
                   : isNewCore    ? parsePdfInvoice(data.text)
                   :                parseCoreOldInvoice(data.text);

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
  app.post("/api/invoices/confirm", requireHamburg, async (req, res) => {
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

    const warehouseStationId = null;

    const allPriceLists = await storage.getAllPriceLists();
    const effectiveBrand = (brand || "").trim();
    const activePriceList = allPriceLists.find(
      (pl) => pl.isActive && pl.supplier.toLowerCase() === effectiveBrand.toLowerCase()
    );

    let imported = 0;
    const errors: { serial: string; name: string; message: string; existingId: number | null }[] = [];
    for (const item of toImport) {
      try {
        await storage.createEquipment({
          serialNumber: item.serialNumber || `AUTO-${item.type?.toUpperCase() || "ITEM"}-${Date.now()}`,
          sku: item.sku || null,
          type: item.type,
          brand: brand || item.brand || "Unknown",
          model: item.name || "Unknown",
          purchaseDate: parsedDate,
          yearOfPurchase: item.modelYear || year,
          currentStationId: warehouseStationId,
          status: "active",
          conditionRating: 5,
          purchasePrice: item.unitPriceAfterDiscount?.toString() || null,
          currentValue: item.unitPriceAfterDiscount?.toString() || null,
          typeSpecificFields: { size: item.size || "", color: item.color || "" },
          invoiceId: invoice.id,
          invoiceReference: invoiceNumber || null,
          priceListId: activePriceList?.id ?? null,
        });
        imported++;
      } catch (err: any) {
        let existingId: number | null = null;
        if (err.message?.includes("equipment_serial_number_unique") && item.serialNumber) {
          const existing = await storage.getEquipmentBySerial(item.serialNumber);
          existingId = existing?.id ?? null;
        }
        errors.push({
          serial: item.serialNumber || item.sku || "",
          name: item.name || "",
          message: err.message,
          existingId,
        });
      }
    }

    await storage.createActivityLog({
      userId: user.id,
      action: "invoice_import",
      equipmentId: null,
      details: `Imported invoice ${invoiceNumber || "N/A"} from ${brand || "Unknown"} (${imported} items)`,
    });

    res.json({ invoiceId: invoice.id, imported, errors });
  });

  // ─── Invoice: List ────────────────────────────────────────────────────────────
  app.get("/api/invoices", requireHamburg, async (_req, res) => {
    res.json(await storage.getAllInvoices());
  });

  app.get("/api/invoices/:id/equipment", requireHamburg, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid invoice id" });
    const items = await storage.getEquipmentByInvoice(id);
    res.json(items);
  });

  app.delete("/api/invoices/:id", requireSuperAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid invoice id" });
    const inv = await storage.getInvoice(id);
    if (!inv) return res.status(404).json({ message: "Invoice not found" });
    await storage.deleteInvoice(id);
    await storage.createActivityLog({
      userId: (req.user as any).id,
      action: "invoice_deleted",
      details: `Deleted invoice ${inv.invoiceNumber}`,
    });
    res.json({ success: true });
  });

  // ─── Company Settings ──────────────────────────────────────────────────────
  app.get("/api/company-settings", requireAdmin, async (_req, res) => {
    res.json(await storage.getCompanySettings());
  });

  app.put("/api/company-settings", requireAdmin, async (req, res) => {
    const updated = await storage.updateCompanySettings(req.body);
    await storage.createActivityLog({
      userId: (req.user as any).id,
      action: "settings_updated",
      details: "Updated company settings",
    });
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
      await storage.createActivityLog({
        userId: (req.user as any).id,
        action: "settings_updated",
        details: "Updated company logo",
      });
      res.json({ logoUrl: publicUrl });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Customers ────────────────────────────────────────────────────────────
  app.get("/api/customers", requireAuth, async (_req, res) => {
    res.json(await storage.getAllCustomers());
  });

  app.post("/api/customers", requireHamburg, async (req, res) => {
    const user = req.user as any;
    const { name, companyName, address, email, taxId } = req.body;
    if (!name || !address || !email) return res.status(400).json({ message: "name, address, email required" });
    const customer = await storage.createCustomer({ name, companyName: companyName || null, address, email, taxId: taxId || null });
    await storage.createActivityLog({
      userId: user.id,
      action: "customer_created",
      details: `Created customer: ${name}`,
    });
    res.status(201).json(customer);
  });

  app.put("/api/customers/:id", requireHamburg, async (req, res) => {
    const user = req.user as any;
    const id = parseInt(req.params.id);
    const updated = await storage.updateCustomer(id, req.body);
    if (!updated) return res.status(404).json({ message: "Customer not found" });
    await storage.createActivityLog({
      userId: user.id,
      action: "customer_updated",
      details: `Updated customer: ${updated.name}`,
    });
    res.json(updated);
  });

  // ─── Sales Invoices ───────────────────────────────────────────────────────
  app.get("/api/sales", requireAuth, async (_req, res) => {
    res.json(await storage.getAllSalesInvoices());
  });

  app.get("/api/sales/next-number", requireAuth, async (_req, res) => {
    const settings = await storage.getCompanySettings();
    const currentYear = new Date().getFullYear();
    const year = settings.invoiceYear !== currentYear ? currentYear : settings.invoiceYear;
    const nextNum = settings.invoiceYear !== currentYear ? 1001 : settings.invoiceNextNumber;
    const numStr = String(nextNum).padStart(4, "0");
    res.json({ invoiceNumber: `${settings.invoicePrefix}-${year}-${numStr}` });
  });

  app.get("/api/sales/:id", requireAuth, async (req, res) => {
    const sale = await storage.getSalesInvoice(parseInt(req.params.id));
    if (!sale) return res.status(404).json({ message: "Not found" });
    res.json(sale);
  });

  app.post("/api/sales", requireAuth, async (req, res) => {
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
      await storage.createActivityLog({
        userId: user.id,
        action: "sale_created",
        details: `Created sale invoice ${sale.invoiceNumber}`,
      });
      res.status(201).json(sale);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/sales/:id/confirm", requireAuth, async (req, res) => {
    const user = req.user as any;
    const sale = await storage.confirmSale(parseInt(req.params.id));
    if (!sale) return res.status(404).json({ message: "Not found" });
    await storage.createActivityLog({
      userId: user.id,
      action: "sale_confirmed",
      details: `Confirmed sale invoice ${sale.invoiceNumber}`,
    });
    res.json(sale);
  });

  // ─── Sales PDF Generation ─────────────────────────────────────────────────
  app.get("/api/sales/:id/pdf", requireAuth, async (req, res) => {
    try {
      const sale = await storage.getSalesInvoice(parseInt(req.params.id));
      if (!sale) return res.status(404).json({ message: "Not found" });
      const settings = await storage.getCompanySettings();

      const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: `Invoice ${sale.invoiceNumber}` } });

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
      doc.fontSize(7).font("Helvetica").fillColor(grey).text("Invoice to:", margin, y);
      y += 12;
      doc.fontSize(10).font("Helvetica-Bold").fillColor(black);
      if (sale.customer.companyName) {
        doc.text(sale.customer.companyName, margin, y); y += 14;
      }
      doc.text(sale.customer.name, margin, y); y += 14;
      doc.font("Helvetica").fontSize(9).fillColor(black);
      sale.customer.address.split("\n").forEach((line) => { doc.text(line, margin, y); y += 13; });
      if (sale.customer.email) { doc.text(sale.customer.email, margin, y); y += 13; }
      if (sale.customer.taxId) { doc.text(`Tax ID: ${sale.customer.taxId}`, margin, y); y += 13; }

      // ── Invoice meta (right side) ─────────────────────────
      const metaX = pageW - margin - 200;
      const metaY = margin + 55;
      const metaData = [
        ["Invoice No.:", sale.invoiceNumber],
        ["Invoice Date:", sale.invoiceDate],
        ...(sale.deliveryDate ? [["Delivery Date:", sale.deliveryDate]] : []),
        ["Payment Terms:", sale.paymentTerms],
      ] as [string, string][];
      let my = metaY;
      for (const [label, val] of metaData) {
        doc.fontSize(8).font("Helvetica").fillColor(grey).text(label, metaX, my, { width: 100, align: "right" });
        doc.fontSize(8).font("Helvetica-Bold").fillColor(black).text(val, metaX + 105, my, { width: 95, align: "left" });
        my += 14;
      }

      y = Math.max(y, my) + 20;

      // ── "INVOICE" heading ────────────────────────────────
      doc.fontSize(16).font("Helvetica-Bold").fillColor(navy).text("INVOICE", margin, y);
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
      doc.text("Description", colDesc, y + 5, { width: 185 });
      doc.text("Serial No.", colSerial, y + 5, { width: 85 });
      doc.text("SKU", colSku, y + 5, { width: 70 });
      doc.text("Qty", colQty, y + 5, { width: 40 });
      doc.text("Unit Price", colPrice, y + 5, { width: 55, align: "right" });
      doc.text("Total", colTotal, y + 5, { width: tableRight - colTotal, align: "right" });
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
      const vatLabel = vatRateNum === 0 ? `VAT 0%` : `VAT ${vatRateNum}%`;
      const totals: [string, string][] = [
        ["Net Total:", `${parseFloat(sale.totalNet).toFixed(2)} €`],
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
      doc.text("Grand Total:", totX, y + 4, { width: totValX - totX - 5, align: "right" });
      doc.text(`${parseFloat(sale.totalGross).toFixed(2)} €`, totValX, y + 4, { width: 80, align: "right" });
      y += 30;

      // VAT note if applicable
      if (sale.vatNote) {
        doc.fontSize(8).font("Helvetica-Oblique").fillColor(grey).text(`Note: ${sale.vatNote}`, margin, y, { width: contentW });
        y += 20;
      }

      // ── Payment section ────────────────────────────────────
      y += 10;
      doc.fontSize(10).font("Helvetica-Bold").fillColor(navy).text("Payment Information", margin, y);
      y += 16;
      doc.fontSize(9).font("Helvetica").fillColor(black);
      if (sale.paymentMethod === "bank_transfer") {
        doc.text(`Bank: ${settings.bankName}`, margin, y); y += 13;
        doc.text(`IBAN: ${settings.iban}`, margin, y); y += 13;
        doc.text(`BIC: ${settings.bic}`, margin, y); y += 13;
        doc.text(`Account Holder: ${settings.accountHolder}`, margin, y); y += 13;
        doc.text(`Reference: ${sale.invoiceNumber}`, margin, y); y += 13;
      } else if (sale.paymentMethod === "cash") {
        doc.text("Payment: Cash received", margin, y); y += 13;
      } else if (sale.paymentMethod === "paypal") {
        doc.text(`Payment via PayPal${settings.paypalEmail ? ` (${settings.paypalEmail})` : ""}`, margin, y); y += 13;
      } else if (sale.paymentMethod === "credit_card") {
        doc.text("Payment via Credit Card", margin, y); y += 13;
      }

      if (sale.notes) {
        y += 10;
        doc.fontSize(9).font("Helvetica-Bold").fillColor(black).text("Notes:", margin, y); y += 13;
        doc.font("Helvetica").fillColor(grey).text(sale.notes, margin, y, { width: contentW }); y += 20;
      }

      // ── Footer ─────────────────────────────────────────────
      const footerY = pageH - 80;
      doc.moveTo(margin, footerY).lineTo(pageW - margin, footerY).strokeColor(grey).lineWidth(0.5).stroke();
      doc.fontSize(7).font("Helvetica").fillColor(grey);
      const footerLine1 = `${settings.companyName} | ${settings.address} | Managing Director: ${settings.managingDirector}`;
      const footerLine2 = `Registry: ${settings.registry} | Tax ID: ${settings.taxId} | VAT ID: ${settings.vatId}`;
      const footerLine3 = `Phone: ${settings.phone} | Web: ${settings.website} | ${settings.bankName} | IBAN: ${settings.iban} | BIC: ${settings.bic}`;
      doc.text(footerLine1, margin, footerY + 8, { width: contentW, align: "center" });
      doc.text(footerLine2, margin, footerY + 20, { width: contentW, align: "center" });
      doc.text(footerLine3, margin, footerY + 32, { width: contentW, align: "center" });

      doc.end();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Price Lists ──────────────────────────────────────────────────
  function normalisePrice(raw: string): number {
    let s: string;
    // German format: 1.529,00 (last separator is comma)
    if (raw.includes(",") && raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
      s = raw.replace(/\./g, "").replace(",", ".");
    } else {
      // English format: 1,529.00 or plain 1529.00
      s = raw.replace(/,/g, "");
    }
    return parseFloat(s);
  }

  // Infer equipment type from product name using keyword + model-family matching.
  // Uses the same 9 categories as the app's equipment types.
  function inferProductType(productName: string): string | null {
    const n = productName.toLowerCase();

    // Bars & control systems — check first (e.g. "Sensor 4 Bar")
    if (/\bbar\b|sensor\b|navigator\b|trust bar|depower bar|control bar|control system|chicken loop/.test(n)) return "bar_lines";

    if (/harness|trapez/.test(n)) return null;
    if (/wetsuit|neoprene|neopren|fullsuit|shorty|steamer/.test(n)) return null;
    if (/helmet|impact vest|impact protection|buoyancy/.test(n)) return null;

    // Foilboards (wingfoil boards) — before generic "foil" check
    if (/wingfoilboard|wing foil board|foilboard/.test(n)) return "foilboard";
    // Known foilboard model families
    if (/\b(roamer|chase)\b/.test(n) && /\d+\s*l\b/.test(n)) return "foilboard";

    // Foil components (frontwings, stabilizers, masts, fuselages)
    if (/frontwing|front wing|stabilizer|rear wing|fuselage|carbon mast|aluminium mast|mastbase|mast base/.test(n)) return "foil";
    // Foil system prefixes (CFS = Core Foil System, SLC = Slice system)
    if (/^(cfs|slc)\s/.test(n) && !/\bkite\b/.test(n)) return "foil";

    // Wings (handheld inflatable wings for wingfoiling)
    // Core wing families: Halo, XC — sizes in m² (2–8)
    if (/\b(halo|halo pro)\b/.test(n)) return "wing";
    if (/^xc\s+\d/.test(n)) return "wing";
    // Generic wing keyword — but avoid "frontwing" and "wingfoilboard"
    if (/\bwing\b/.test(n) && !/frontwing|wingfoilboard/.test(n)) return "wing";

    // Kites — Core kite model families (product names don't contain "kite")
    if (/\bkite\b/.test(n)) return "kite";
    if (/^(xr|pace|nexus|air|section|impact|rebel|bolt|soul|drift|velocity|neo|free|vibe|escape)[\s\d]/.test(n)) return "kite";

    // Kiteboards / boards
    if (/\bboard\b|twintip|twin.tip|directional|waveboard/.test(n)) return "board";
    // Known Core kiteboard families
    if (/\b(imperator|fusion|choice|era|badger|ripper|green room|720)\b/.test(n)) return "board";

    return null;
  }

  // Parse a German price string that uses "." as thousands separator and no mandatory cents.
  // Examples: "2.849 €" → 2849, "849 €" → 849, "2.139,50 €" → 2139.50
  function parseEuroPrice(raw: string): number {
    // Strip currency symbol and whitespace
    let s = raw.replace(/[€\s]/g, "");
    if (!s) return NaN;
    // If there's a comma followed by 2 digits at the end → comma is decimal separator
    if (/,\d{2}$/.test(s)) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // No decimal — just remove dots (thousands separators)
      s = s.replace(/\./g, "");
    }
    return parseFloat(s);
  }

  type PriceListParseResult = {
    items: Array<{ sku: string; productName: string; retailPrice: string; dealerPrice: string | null; productType: string | null }>;
    detectedName: string | null;
    detectedValidFrom: string | null;
  };

  function parsePriceListText(text: string): PriceListParseResult {
    let detectedName: string | null = null;
    let detectedValidFrom: string | null = null;

    const metaRx = /#(\d+),\s*valid\s+from\s+(\d{4}\/\d{2}\/\d{2}|\d{2}\.\d{2}\.\d{4})/i;
    for (const line of text.split(/\r?\n|\r/).slice(0, 40)) {
      const m = line.trim().match(metaRx);
      if (m) {
        detectedName = `#${m[1]}`;
        const raw = m[2];
        if (raw.includes("/")) {
          detectedValidFrom = raw.replace(/\//g, "-");
        } else {
          const [d, mo, y] = raw.split(".");
          detectedValidFrom = `${y}-${mo}-${d}`;
        }
        break;
      }
    }

    // Blocklist — spare parts, fins, bags, pumps, leashes, accessories
    const EXCLUDE_KEYWORDS = [
      "spare", "part", "ersatz", "ersatzteil", "repair", "reparatur",
      "bladder", "valve", "leading edge", "strut", "panel", "canopy",
      "bridle", "pigtail", "knot", "pulley", "cleat", "screw",
      "bolt", "nut", "washer", "connector", "adapter", "plug",
      "fin", "finne", "thruster", "single tab", "us box",
      "bag", "tasche", "cover", "case", "sock", "sleeve",
      "pump", "pumpe", "inflation", "deflation",
      "leash", "leine",
      "shirt", "shorts", "glove", "handschuh", "lycra",
      "rash guard", "rashguard", "sunscreen",
      "sticker", "decal", "keyring", "key ring", "bottle", "book",
      "manual", "gift", "voucher",
      "stomp", "traction", "velcro", "foam", "rubber", "tape", "wax",
    ];

    // Matches prices like "2.849 €", "849 €", "1.299,00 €"
    const EURO_PRICE_RX = /(\d{1,2}\.\d{3}(?:,\d{2})?|\d{3,5}(?:,\d{2})?)\s*€/g;
    // 12 or 13-digit product barcode (UPC-A or EAN-13)
    const UPC_RX = /\b(\d{12,13})\b/g;

    // Lines to skip regardless of content
    const SKIP_LINE_RX = /^(CORE PRICE LIST|Dealer Price|Retail Price|page \d|-- \d|sales@|Purchase orders|Product Information|\+49|#\d+, valid)/i;

    const items: Array<{ sku: string; productName: string; retailPrice: string }> = [];
    const seen = new Set<string>();

    for (const raw of text.split(/\r?\n|\r/)) {
      const line = raw.trim();
      if (!line || SKIP_LINE_RX.test(line)) continue;

      // The Core/Duotone price list is TAB-delimited.
      // Columns: ProductName [TAB] UPC1 [TAB] (UPC2) [TAB] DealerPrice€ [TAB] RetailPrice€
      // Header rows (no price) are filtered by the price regex below.
      const tabs = line.split("\t").map((c) => c.trim()).filter((c) => c.length > 0);
      if (tabs.length < 2) continue;

      // Product name is always the first column
      const productName = tabs[0];
      if (!productName || productName.length < 3) continue;

      // Find all € prices anywhere in the line
      const euroPrices = [...line.matchAll(new RegExp(EURO_PRICE_RX.source, "g"))];
      if (euroPrices.length === 0) continue;

      // Retail price is the LAST € price on the line; dealer price is the second-to-last
      const retailRaw = euroPrices[euroPrices.length - 1][1];
      const retailPrice = parseEuroPrice(retailRaw);
      if (isNaN(retailPrice) || retailPrice < 200 || retailPrice > 100_000) continue;
      const dealerRaw = euroPrices.length >= 2 ? euroPrices[euroPrices.length - 2][1] : null;
      const dealerPrice = dealerRaw ? parseEuroPrice(dealerRaw) : null;

      // Only keep items that have a real 12/13-digit barcode — skip anything without one
      const upcMatches = [...line.matchAll(new RegExp(UPC_RX.source, "g"))];
      if (upcMatches.length === 0) continue;
      const sku = upcMatches[0][1];

      // Skip obvious header/section rows
      if (/^(total|summe|subtotal|mwst|vat|ust|dealer|retail|article|artikel)/i.test(productName)) continue;

      // Keyword blocklist on product name
      const lc = productName.toLowerCase();
      if (EXCLUDE_KEYWORDS.some((kw) => lc.includes(kw))) continue;

      // Deduplicate by product name + retail price
      const key = `${productName}:${retailPrice.toFixed(0)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      items.push({ sku, productName, retailPrice: retailPrice.toFixed(2), dealerPrice: dealerPrice !== null ? dealerPrice.toFixed(2) : null, productType: inferProductType(productName) });
    }

    return { items, detectedName, detectedValidFrom };
  }

  // Parse PDF → preview (no DB save)
  app.post("/api/price-lists/parse", requireAdmin, uploadPdf.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No PDF uploaded" });
      const { text } = await parsePdfBuffer(req.file.buffer);
      const rawLineCount = text.split(/\r?\n|\r/).filter((l) => l.trim().length > 0).length;

      const { items, detectedName, detectedValidFrom } = parsePriceListText(text);
      res.json({ items, rawLineCount, detectedName, detectedValidFrom });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Confirm and save a parsed price list
  app.post("/api/price-lists", requireAdmin, async (req, res) => {
    try {
      const user = req.user as any;
      const { supplier, items, validFrom, validTo, name } = req.body;
      if (!supplier || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "supplier and items[] are required" });
      }
      const pl = await storage.createPriceList(
        {
          supplier: supplier.trim(),
          uploadedBy: user.id,
          validFrom: validFrom ? new Date(validFrom) : null,
          validTo: validTo ? new Date(validTo) : null,
          name: name?.trim() || null,
        },
        items.map((i: any) => ({ sku: i.sku, productName: i.productName, retailPrice: i.retailPrice, dealerPrice: i.dealerPrice || null, productType: i.productType || null })),
      );
      await storage.createActivityLog({
        userId: user.id,
        action: "price_list_created",
        details: `Uploaded price list for ${supplier.trim()}${name ? ` (${name.trim()})` : ""} with ${items.length} items`,
      });
      res.json(pl);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/price-lists", requireHamburg, async (_req, res) => {
    const lists = await storage.getAllPriceLists();
    res.json(lists);
  });

  app.get("/api/price-lists/:id", requireHamburg, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid price list ID" });
    const pl = await storage.getPriceList(id);
    if (!pl) return res.status(404).json({ message: "Price list not found" });
    res.json(pl);
  });

  app.get("/api/price-lists/:id/items", requireHamburg, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid price list ID" });
    const items = await storage.getPriceListItems(id);
    res.json(items);
  });

  app.patch("/api/price-lists/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { validFrom, validTo, name } = req.body;
      const vf = validFrom ? new Date(validFrom) : null;
      const vt = validTo ? new Date(validTo) : null;
      if (vf && isNaN(vf.getTime())) return res.status(400).json({ message: "Invalid validFrom date" });
      if (vt && isNaN(vt.getTime())) return res.status(400).json({ message: "Invalid validTo date" });
      const updated = await storage.updatePriceList(id, { validFrom: vf, validTo: vt, name: name !== undefined ? (name?.trim() || null) : undefined });
      if (!updated) return res.status(404).json({ message: "Price list not found" });
      await storage.createActivityLog({
        userId: (req.user as any).id,
        action: "price_list_updated",
        details: `Updated price list: ${updated.supplier}${updated.name ? ` (${updated.name})` : ""}`,
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/price-lists/:id", requireAdmin, async (req, res) => {
    const pl = await storage.getPriceList(parseInt(req.params.id));
    await storage.deletePriceList(parseInt(req.params.id));
    await storage.createActivityLog({
      userId: (req.user as any).id,
      action: "price_list_deleted",
      details: `Deleted price list: ${pl?.supplier || "Unknown"}${pl?.name ? ` (${pl.name})` : ""}`,
    });
    res.json({ ok: true });
  });

  // Retail price lookup by SKU (used on sale-create + equipment-detail)
  app.get("/api/price-lists/lookup", requireAuth, async (req, res) => {
    const sku = (req.query.sku as string || "").trim();
    const name = (req.query.name as string || "").trim();
    if (sku) {
      const result = await storage.lookupRetailPrice(sku);
      if (result) return res.json(result);
    }
    if (name) {
      const result = await storage.lookupRetailPriceByName(name);
      if (result) return res.json(result);
    }
    res.json(null);
  });

  // ─── Damage Reports ────────────────────────────────────────────────────────

  app.get("/api/damage-reports/open-count", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (!["admin", "manager"].includes(user.role)) return res.json({ count: 0 });
    const reports = await storage.getAllDamageReports();
    const openCount = reports.filter(r => r.status === "open").length;
    res.json({ count: openCount });
  });

  app.get("/api/damage-reports", requireAuth, async (req, res) => {
    const user = req.user as any;
    const reports = await storage.getAllDamageReports();
    if (user.role === "station_lead") {
      return res.json(reports.filter(r => r.stationId === user.stationId));
    }
    res.json(reports);
  });

  app.get("/api/damage-reports/:id", requireAuth, async (req, res) => {
    const report = await storage.getDamageReport(parseInt(req.params.id));
    if (!report) return res.status(404).json({ message: "Not found" });
    const user = req.user as any;
    if (user.role === "station_lead" && report.stationId !== user.stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(report);
  });

  app.get("/api/equipment/:id/damage-reports", requireAuth, async (req, res) => {
    const reports = await storage.getDamageReportsByEquipment(parseInt(req.params.id));
    res.json(reports);
  });

  app.post("/api/damage-reports", requireAuth, async (req, res) => {
    const user = req.user as any;
    const schema = z.object({
      equipmentId: z.number(),
      howItHappened: z.string().min(5),
      customerName: z.string().optional().nullable(),
      bookingReference: z.string().optional().nullable(),
      usageType: z.enum(["rental", "lesson", "other"]),
      customerInsured: z.boolean().default(false),
      repairable: z.boolean(),
      totalLoss: z.boolean(),
      canRepairOnSite: z.boolean().default(false),
      needsSpareParts: z.boolean().default(false),
      sparePartsNeeded: z.string().optional().nullable(),
      stationId: z.number().optional().nullable(),
      estimatedRepairCost: z.string().optional().nullable(),
      estimatedValueLoss: z.string().optional().nullable(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Validation error", errors: parsed.error.errors });

    const data = parsed.data;

    const report = await storage.createDamageReport({
      ...data,
      reportedBy: user.id,
      status: "open",
    });

    const eq = await storage.getEquipment(data.equipmentId);
    const eqLabel = eq ? `${eq.brand} ${eq.model}` : `Equipment #${data.equipmentId}`;

    if (data.totalLoss) {
      await storage.updateEquipment(data.equipmentId, { status: "retired" });
      await storage.createActivityLog({
        userId: user.id,
        action: "equipment_status_changed",
        equipmentId: data.equipmentId,
        stationId: data.stationId ?? undefined,
        details: `${eqLabel} marked as Total Loss — status set to Retired`,
      });
    } else if (data.repairable) {
      const repair = await storage.createRepair({
        equipmentId: data.equipmentId,
        description: `Damage report: ${data.howItHappened}`,
        status: "pending",
        loggedBy: user.id,
      });
      await storage.updateDamageReport(report.id, { repairId: repair.id });
      await storage.updateEquipment(data.equipmentId, { status: "in_repair" });
      await storage.createActivityLog({
        userId: user.id,
        action: "repair_logged",
        equipmentId: data.equipmentId,
        stationId: data.stationId ?? undefined,
        details: `Repair created from damage report for ${eqLabel}`,
      });
    }

    await storage.createActivityLog({
      userId: user.id,
      action: "damage_reported",
      equipmentId: data.equipmentId,
      stationId: data.stationId ?? undefined,
      details: `Damage reported for ${eqLabel}: ${data.howItHappened.substring(0, 100)}`,
    });

    if (data.needsSpareParts) {
      await storage.createActivityLog({
        userId: user.id,
        action: "spare_parts_needed",
        equipmentId: data.equipmentId,
        stationId: data.stationId ?? undefined,
        details: `⚙️ Spare parts needed for ${eqLabel}: ${data.sparePartsNeeded || "–"} (reported by ${user.name})`,
      });
    }

    await storage.updateDamageReport(report.id, { adminNotified: true });

    const stationsList = await storage.getAllStations();
    const stationName = stationsList.find(s => s.id === data.stationId)?.name || (data.stationId ? `Station #${data.stationId}` : "Unknown");

    try {
      const admins = await storage.getAllUsers();
      const adminEmails = admins.filter(u => u.role === "admin").map(u => u.email);
      if (adminEmails.length) {
        const usageLabel = data.usageType === "rental" ? "Rental" : data.usageType === "lesson" ? "Lesson (liability on us)" : "Other";
        sendNotificationEmail(
          adminEmails,
          `Damage Report: ${eqLabel}`,
          [
            `A damage report has been filed by ${user.name}.`,
            ``,
            `Equipment: ${eqLabel}`,
            `Location: ${stationName}`,
            ``,
            `What happened: ${data.howItHappened}`,
            ``,
            `Customer: ${data.customerName || "–"}`,
            `Booking ref: ${data.bookingReference || "–"}`,
            `Usage type: ${usageLabel}`,
            `Customer insured: ${data.customerInsured ? "Yes" : "No"}`,
            ``,
            `Assessment: ${data.totalLoss ? "TOTAL LOSS" : data.repairable ? "Repairable" : "Not repairable"}`,
            `Can repair on-site: ${data.canRepairOnSite ? "Yes" : "No"}`,
            `Needs spare parts: ${data.needsSpareParts ? "Yes" : "No"}`,
            data.needsSpareParts ? `Parts needed: ${data.sparePartsNeeded || "–"}` : "",
            ``,
            `View in KiteTracker: /incidents`,
          ].filter(Boolean).join("\n"),
        );
        if (data.needsSpareParts) {
          sendNotificationEmail(
            adminEmails,
            `⚙️ SPARE PARTS NEEDED: ${eqLabel} — ${stationName}`,
            [
              `SPARE PARTS ORDER REQUIRED`,
              ``,
              `Reported by: ${user.name}`,
              `Location: ${stationName}`,
              `Equipment: ${eqLabel}`,
              ``,
              `Parts needed:`,
              `  ${data.sparePartsNeeded || "–"}`,
              ``,
              `Context:`,
              `  What happened: ${data.howItHappened}`,
              `  Customer: ${data.customerName || "–"}`,
              `  Booking ref: ${data.bookingReference || "–"}`,
              ``,
              `Please order the parts and update the damage report in KiteTracker.`,
              `View in KiteTracker: /incidents`,
            ].join("\n"),
          );
        }
      }
    } catch (_) {}

    res.json(report);
  });

  app.patch("/api/damage-reports/:id/status", requireHamburg, async (req, res) => {
    const user = req.user as any;
    const { status } = req.body;
    if (!["open", "in_review", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const updated = await storage.updateDamageReport(parseInt(req.params.id), { status });
    if (!updated) return res.status(404).json({ message: "Damage report not found" });
    const eq = updated.equipmentId ? await storage.getEquipment(updated.equipmentId) : null;
    await storage.createActivityLog({
      userId: user.id,
      action: "damage_status_changed",
      equipmentId: updated.equipmentId || null,
      details: `Damage report #${req.params.id} status changed to ${status}${eq ? ` (${eq.brand} ${eq.model})` : ""}`,
    });
    res.json(updated);
  });

  app.get("/api/damage-reports/:id/photos/upload-url", requireAuth, async (req, res) => {
    try {
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to get upload URL: " + err.message });
    }
  });

  app.post("/api/damage-reports/:id/photos", requireAuth, async (req, res) => {
    const user = req.user as any;
    const reportId = parseInt(req.params.id);
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: "url is required" });
    const photo = await storage.createDamageReportPhoto({
      damageReportId: reportId,
      url,
      uploadedBy: user.id,
    });
    await storage.createActivityLog({
      userId: user.id,
      action: "damage_photo_added",
      details: `Added photo to damage report #${reportId}`,
    });
    res.json(photo);
  });

  // ─── Damage Report Invoice Generation ────────────────────────────────────────
  app.post("/api/damage-reports/:id/invoice", requireHamburg, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const user = req.user as any;

      const bodySchema = z.object({
        customerType: z.enum(["kww", "external"]),
        customerName: z.string().min(1),
        companyName: z.string().optional().nullable(),
        address: z.string().min(1),
        email: z.string().email().optional().nullable().or(z.literal("")),
        taxId: z.string().optional().nullable(),
        bookingNumber: z.string().optional().nullable(),
        repairCost: z.string().optional().nullable(),
        valueLoss: z.string().optional().nullable(),
        vatType: z.string().default("standard_19"),
        paymentMethod: z.string().default("bank_transfer"),
        notes: z.string().optional().nullable(),
      });

      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Validation error", errors: parsed.error.errors });
      const body = parsed.data;

      if (body.customerType === "kww" && !body.bookingNumber) {
        return res.status(400).json({ message: "Booking number is required for KiteWorldWide customers" });
      }

      const report = await storage.getDamageReport(reportId);
      if (!report) return res.status(404).json({ message: "Damage report not found" });

      const eq = await storage.getEquipment(report.equipmentId);
      const eqLabel = eq ? `${eq.brand} ${eq.model}${eq.serialNumber ? ` (${eq.serialNumber})` : ""}` : `Equipment #${report.equipmentId}`;

      const settings = await storage.getCompanySettings();
      const invoiceNumber = await storage.getNextInvoiceNumber();
      const today = new Date().toISOString().split("T")[0];

      const repairCostNum = parseFloat(body.repairCost || "0") || 0;
      const valueLossNum = parseFloat(body.valueLoss || "0") || 0;
      const vatRateNum = body.vatType === "standard_19" ? 19 : body.vatType === "reduced_7" ? 7 : 0;
      const totalNet = repairCostNum + valueLossNum;
      const totalVat = Math.round(totalNet * vatRateNum) / 100;
      const totalGross = totalNet + totalVat;

      const vatNote = vatRateNum === 0 ? "No VAT charged pursuant to §19 UStG (small business regulation)." : undefined;

      const notesParts: string[] = [];
      if (body.customerType === "kww" && body.bookingNumber) notesParts.push(`KiteWorldWide Booking: ${body.bookingNumber}`);
      if (body.notes) notesParts.push(body.notes);
      notesParts.push(`Damage Report #${reportId} | Equipment: ${eqLabel}`);

      const customer = await storage.createCustomer({
        name: body.customerName,
        companyName: body.companyName || null,
        address: body.address,
        email: body.email || "not-provided@kitetracker.com",
        taxId: body.taxId || null,
      });

      const saleItems: { position: number; description: string; serialNumber?: string; sku?: string; quantity: number; unitPrice: string; total: string; equipmentId?: number }[] = [];
      let pos = 1;
      if (repairCostNum > 0) {
        saleItems.push({ position: pos++, description: `Repair Cost – ${eqLabel}`, quantity: 1, unitPrice: repairCostNum.toFixed(2), total: repairCostNum.toFixed(2), equipmentId: report.equipmentId });
      }
      if (valueLossNum > 0) {
        saleItems.push({ position: pos++, description: `Value Reduction – ${eqLabel}`, quantity: 1, unitPrice: valueLossNum.toFixed(2), total: valueLossNum.toFixed(2), equipmentId: report.equipmentId });
      }
      if (saleItems.length === 0) {
        saleItems.push({ position: 1, description: `Damage costs – ${eqLabel}`, quantity: 1, unitPrice: "0.00", total: "0.00", equipmentId: report.equipmentId });
      }

      const invoice = await storage.createSalesInvoice({
        invoiceNumber,
        invoiceDate: today,
        customerId: customer.id,
        paymentMethod: body.paymentMethod,
        paymentTerms: "14 Tage ohne Abzug",
        vatType: body.vatType,
        vatRate: vatRateNum.toFixed(2),
        vatNote: vatNote || null,
        notes: notesParts.join(" | ") || null,
        totalNet: totalNet.toFixed(2),
        totalVat: totalVat.toFixed(2),
        totalGross: totalGross.toFixed(2),
        status: "confirmed",
        createdBy: user.id,
        damageReportId: reportId,
        customerType: body.customerType,
      } as any, saleItems as any);

      // ── Generate PDF ──────────────────────────────────────────────────────
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: `Damage Invoice ${invoiceNumber}` } });
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      await new Promise<void>((resolve) => {
        doc.on("end", resolve);

        const pageW = 595.28, pageH = 841.89, margin = 50, contentW = pageW - margin * 2;
        const navy = "#1e3a5f", grey = "#6b7280", lightGrey = "#f3f4f6", black = "#111827", red = "#dc2626";

        // ── Company header ──
        doc.fontSize(20).font("Helvetica-Bold").fillColor(navy).text(settings.companyName, margin, margin, { width: contentW * 0.65 });
        doc.fontSize(8).font("Helvetica").fillColor(grey).text(`${settings.companyName} | ${settings.address}`, margin, margin + 28, { width: contentW });
        doc.moveTo(margin, margin + 42).lineTo(pageW - margin, margin + 42).strokeColor(navy).lineWidth(1.5).stroke();

        let y = margin + 55;

        // ── Customer address block ──
        doc.fontSize(7).font("Helvetica").fillColor(grey).text("Invoice to:", margin, y); y += 12;
        doc.fontSize(10).font("Helvetica-Bold").fillColor(black);
        if (customer.companyName) { doc.text(customer.companyName, margin, y); y += 14; }
        doc.text(customer.name, margin, y); y += 14;
        doc.font("Helvetica").fontSize(9).fillColor(black);
        customer.address.split("\n").forEach((line: string) => { doc.text(line, margin, y); y += 13; });
        if (customer.email && customer.email !== "not-provided@kitetracker.com") { doc.text(customer.email, margin, y); y += 13; }
        if (customer.taxId) { doc.text(`Tax No.: ${customer.taxId}`, margin, y); y += 13; }

        // ── Invoice meta ──
        const metaX = pageW - margin - 200, metaY = margin + 55;
        const metaRows: [string, string][] = [
          ["Invoice No.:", invoiceNumber],
          ["Invoice Date:", today],
          ["Type:", body.customerType === "kww" ? "KiteWorldWide Customer" : "External Customer"],
        ];
        if (body.customerType === "kww" && body.bookingNumber) metaRows.push(["Booking No.:", body.bookingNumber]);
        let my = metaY;
        for (const [lbl, val] of metaRows) {
          doc.fontSize(8).font("Helvetica").fillColor(grey).text(lbl, metaX, my, { width: 105, align: "right" });
          doc.fontSize(8).font("Helvetica-Bold").fillColor(black).text(val, metaX + 110, my, { width: 85, align: "left" });
          my += 14;
        }

        y = Math.max(y, my) + 18;

        // ── "DAMAGE INVOICE" heading ──
        doc.fontSize(16).font("Helvetica-Bold").fillColor(red).text("DAMAGE INVOICE", margin, y);
        y += 10;
        doc.fontSize(9).font("Helvetica").fillColor(grey).text(`Damage Report #${reportId}`, margin, y);
        y += 28;

        // ── Damage reference box ──
        doc.rect(margin, y, contentW, 70).fill("#fef2f2").stroke("#fecaca");
        doc.fillColor(black).fontSize(8).font("Helvetica-Bold").text("Damaged Equipment:", margin + 10, y + 8);
        doc.font("Helvetica").text(eqLabel, margin + 10, y + 20, { width: contentW - 20 });
        doc.font("Helvetica-Bold").text("Incident description:", margin + 10, y + 33);
        doc.font("Helvetica").text(report.howItHappened, margin + 10, y + 45, { width: contentW - 20, ellipsis: true });
        y += 82;

        // ── Retail Price reference (if available) ──
        if (eq?.retailPrice) {
          doc.fontSize(8).font("Helvetica-Oblique").fillColor(grey).text(`Reference Retail-Price (UVP): ${parseFloat(eq.retailPrice).toFixed(2)} €  ·  Current value based on age and condition — for reference only.`, margin, y, { width: contentW });
          y += 18;
        }
        y += 8;

        // ── Table header ──
        const colPos = margin, colDesc = margin + 30, colQty = margin + 355, colPrice = margin + 390, colTotal = margin + 445;
        const tableRight = pageW - margin;

        doc.rect(margin, y, contentW, 18).fill(navy);
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
        doc.text("Pos.", colPos, y + 5, { width: 25 });
        doc.text("Description", colDesc, y + 5, { width: 290 });
        doc.text("Qty", colQty, y + 5, { width: 30, align: "center" });
        doc.text("Unit Price", colPrice, y + 5, { width: 60, align: "right" });
        doc.text("Total", colTotal, y + 5, { width: tableRight - colTotal, align: "right" });
        y += 20;

        for (const item of saleItems) {
          if (item.position % 2 === 0) doc.rect(margin, y, contentW, 18).fill(lightGrey);
          doc.fontSize(8).font("Helvetica").fillColor(black);
          doc.text(String(item.position), colPos, y + 5, { width: 25 });
          doc.text(item.description, colDesc, y + 5, { width: 290 });
          doc.text("1", colQty, y + 5, { width: 30, align: "center" });
          doc.text(`${parseFloat(item.unitPrice).toFixed(2)} €`, colPrice, y + 5, { width: 60, align: "right" });
          doc.text(`${parseFloat(item.total).toFixed(2)} €`, colTotal, y + 5, { width: tableRight - colTotal, align: "right" });
          y += 18;
        }

        // ── Totals ──
        y += 10;
        doc.moveTo(margin + contentW * 0.55, y).lineTo(tableRight, y).strokeColor(grey).lineWidth(0.5).stroke();
        y += 6;
        const totX = margin + contentW * 0.55, totValX = tableRight - 80;
        const vatLabel = vatRateNum === 0 ? "VAT 0%" : `VAT ${vatRateNum}%`;
        const totals: [string, string][] = [
          ["Net amount:", `${totalNet.toFixed(2)} €`],
          [vatLabel, `${totalVat.toFixed(2)} €`],
        ];
        for (const [lbl, val] of totals) {
          doc.fontSize(9).font("Helvetica").fillColor(grey).text(lbl, totX, y, { width: totValX - totX - 5, align: "right" });
          doc.font("Helvetica").fillColor(black).text(val, totValX, y, { width: 80, align: "right" }); y += 14;
        }
        doc.rect(totX - 5, y - 2, tableRight - totX + 5, 20).fill(navy);
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#ffffff");
        doc.text("Total amount:", totX, y + 4, { width: totValX - totX - 5, align: "right" });
        doc.text(`${totalGross.toFixed(2)} €`, totValX, y + 4, { width: 80, align: "right" });
        y += 30;

        if (vatNote) {
          doc.fontSize(8).font("Helvetica-Oblique").fillColor(grey).text(`Note: ${vatNote}`, margin, y, { width: contentW }); y += 20;
        }

        // ── Payment section ──
        y += 10;
        doc.fontSize(10).font("Helvetica-Bold").fillColor(navy).text("Payment Information", margin, y); y += 16;
        doc.fontSize(9).font("Helvetica").fillColor(black);
        if (body.paymentMethod === "bank_transfer") {
          doc.text(`Bank: ${settings.bankName}`, margin, y); y += 13;
          doc.text(`IBAN: ${settings.iban}`, margin, y); y += 13;
          doc.text(`BIC: ${settings.bic}`, margin, y); y += 13;
          doc.text(`Account holder: ${settings.accountHolder}`, margin, y); y += 13;
          doc.text(`Reference: ${invoiceNumber}`, margin, y); y += 13;
        } else if (body.paymentMethod === "cash") {
          doc.text("Payment: Cash received", margin, y); y += 13;
        }

        if (notesParts.length > 0) {
          y += 10;
          doc.fontSize(9).font("Helvetica-Bold").fillColor(black).text("Notes:", margin, y); y += 13;
          doc.font("Helvetica").fillColor(grey).text(notesParts.join("\n"), margin, y, { width: contentW }); y += 20;
        }

        // ── Footer ──
        const footerY = pageH - 80;
        doc.moveTo(margin, footerY).lineTo(pageW - margin, footerY).strokeColor(grey).lineWidth(0.5).stroke();
        doc.fontSize(7).font("Helvetica").fillColor(grey);
        doc.text(`${settings.companyName} | ${settings.address} | Managing Director: ${settings.managingDirector}`, margin, footerY + 8, { width: contentW, align: "center" });
        doc.text(`Registry: ${settings.registry} | Tax No.: ${settings.taxId} | VAT ID: ${settings.vatId}`, margin, footerY + 20, { width: contentW, align: "center" });
        doc.text(`Phone: ${settings.phone} | Web: ${settings.website} | ${settings.bankName} | IBAN: ${settings.iban} | BIC: ${settings.bic}`, margin, footerY + 32, { width: contentW, align: "center" });

        doc.end();
      });

      const pdfBuffer = Buffer.concat(chunks);

      // ── Upload PDF to object storage ──
      let pdfUrl: string | null = null;
      try {
        const privateDir = process.env.PRIVATE_OBJECT_DIR || "";
        if (privateDir) {
          const uuid = randomUUID();
          const fullPath = `${privateDir}/invoices/${uuid}.pdf`;
          const parts = (fullPath.startsWith("/") ? fullPath.slice(1) : fullPath).split("/");
          const bucketName = parts[0];
          const objectName = parts.slice(1).join("/");
          const bucket = objectStorageClient.bucket(bucketName);
          const file = bucket.file(objectName);
          await file.save(pdfBuffer, { contentType: "application/pdf", metadata: { cacheControl: "private, max-age=3600" } });
          let entityDir = privateDir.endsWith("/") ? privateDir : privateDir + "/";
          const entityId = `invoices/${uuid}.pdf`;
          pdfUrl = `/objects/${entityId}`;
          await storage.updateSalesInvoice(invoice.id, { pdfUrl });
        }
      } catch (uploadErr) {
        console.error("PDF upload to object storage failed:", uploadErr);
      }

      await storage.createActivityLog({
        userId: user.id,
        action: "damage_invoice_created",
        equipmentId: report.equipmentId,
        stationId: report.stationId ?? undefined,
        details: `Damage invoice ${invoiceNumber} generated for ${eqLabel} — ${totalGross.toFixed(2)} €`,
      });

      res.json({ ...invoice, pdfUrl });
    } catch (err: any) {
      console.error("Damage invoice error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Feedback / Bug Reports ───────────────────────────────────────────────
  app.get("/api/feedback/upload-url", requireAuth, async (req, res) => {
    try {
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (err: any) {
      res.status(500).json({ message: "Failed to get upload URL: " + err.message });
    }
  });

  app.post("/api/feedback", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const schema = z.object({
        pageUrl: z.string(),
        message: z.string().optional().nullable(),
        audioUrl: z.string().optional().nullable(),
        screenshotUrl: z.string().optional().nullable(),
        attachmentUrls: z.array(z.string()).optional(),
      });
      const data = schema.parse(req.body);
      const hasAttachments = (data.attachmentUrls && data.attachmentUrls.length > 0) || data.screenshotUrl;
      if (!data.message && !data.audioUrl && !hasAttachments) {
        return res.status(400).json({ message: "Please provide a message, voice note, or screenshot/photo." });
      }
      const fb = await storage.createFeedback({
        userId: user.id,
        pageUrl: data.pageUrl,
        message: data.message ?? null,
        audioUrl: data.audioUrl ?? null,
        screenshotUrl: null,
        status: "open",
      });
      const allAttachmentUrls = [...(data.attachmentUrls || [])];
      if (data.screenshotUrl) {
        allAttachmentUrls.push(data.screenshotUrl);
      }
      if (allAttachmentUrls.length > 0) {
        await storage.createFeedbackAttachments(fb.id, allAttachmentUrls);
      }
      await storage.createActivityLog({
        userId: user.id,
        action: "feedback_submitted",
        details: `Feedback submitted from ${data.pageUrl}`,
      });
      const allUsers = await storage.getAllUsers();
      const superAdmins = allUsers.filter(u => u.role === "admin" && u.isSuperAdmin && u.id !== user.id);
      const ticketLabel = fb.ticketNumber || `FB-${fb.id}`;
      for (const sa of superAdmins) {
        await storage.createNotification({
          userId: sa.id,
          type: "feedback_new",
          title: `${ticketLabel}: New feedback from ${user.name}`,
          message: data.message
            ? (data.message.length > 80 ? data.message.slice(0, 80) + "…" : data.message)
            : "Voice message sent",
          link: "/feedback",
          read: false,
        });
      }
      const superAdminEmails = superAdmins.map(a => a.email);
      if (superAdminEmails.length) {
        const msgPreview = data.message || "Voice message sent";
        sendNotificationEmail(
          superAdminEmails,
          `${ticketLabel}: New feedback from ${user.name}`,
          `${user.name} submitted new feedback (${ticketLabel}):\n\nPage: ${data.pageUrl}\nMessage: ${msgPreview}\n\nOpen KiteTracker to respond.`
        );
      }
      res.json(fb);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/feedback", requireAuth, async (req, res) => {
    const user = req.user as any;
    const all = await storage.getAllFeedback();
    if (user.role === "admin") {
      res.json(all);
    } else {
      res.json(all.filter(f => f.userId === user.id));
    }
  });

  app.get("/api/feedback/open-count", requireAuth, async (req, res) => {
    const count = await storage.getOpenFeedbackCount();
    res.json({ count });
  });

  app.patch("/api/feedback/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const adminUser = req.user as any;
    const schema = z.object({
      status: z.enum(["open", "in_progress", "resolved"]).optional(),
      adminNotes: z.string().optional().nullable(),
    });
    const data = schema.parse(req.body);
    const updated = await storage.updateFeedback(id, data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    await storage.createActivityLog({
      userId: adminUser.id,
      action: "feedback_updated",
      details: `Feedback #${id} ${data.status ? `status → ${data.status}` : "updated"}`,
    });
    if (updated.userId !== adminUser.id) {
      const ticketLabel = updated.ticketNumber || `FB-${updated.id}`;
      const statusLabels: Record<string, string> = { open: "Open", in_progress: "In Progress", resolved: "Resolved" };
      const statusMsg = data.status
        ? `${ticketLabel}: Status → "${statusLabels[data.status] ?? data.status}"`
        : `${ticketLabel}: Feedback has been updated.`;
      await storage.createNotification({
        userId: updated.userId,
        type: "feedback_status",
        title: `${ticketLabel}: Feedback updated`,
        message: statusMsg,
        link: "/feedback",
        read: false,
      });
      const feedbackAuthor = await storage.getUser(updated.userId);
      if (feedbackAuthor) {
        sendNotificationEmail(
          feedbackAuthor.email,
          `${ticketLabel}: Feedback updated`,
          `Hi ${feedbackAuthor.name},\n\n${statusMsg}\n\nOpen KiteTracker to see details.`
        );
      }
    }
    res.json(updated);
  });

  app.get("/api/feedback/:id/comments", requireAuth, async (req, res) => {
    const feedbackId = parseInt(req.params.id);
    const comments = await storage.getFeedbackComments(feedbackId);
    res.json(comments);
  });

  app.post("/api/feedback/:id/comments", requireAuth, async (req, res) => {
    const user = req.user as any;
    const feedbackId = parseInt(req.params.id);
    const { message } = z.object({ message: z.string().min(1) }).parse(req.body);
    const comment = await storage.createFeedbackComment({ feedbackId, userId: user.id, message });
    const allFeedback = await storage.getAllFeedback();
    const fb = allFeedback.find(f => f.id === feedbackId);
    if (fb) {
      const ticketLabel = fb.ticketNumber || `FB-${fb.id}`;
      const msgPreview = message.length > 80 ? message.slice(0, 80) + "…" : message;
      if (user.role === "admin") {
        if (fb.userId !== user.id) {
          await storage.createNotification({
            userId: fb.userId,
            type: "feedback_comment",
            title: `${ticketLabel}: New reply to your feedback`,
            message: msgPreview,
            link: "/feedback",
            read: false,
          });
          const author = await storage.getUser(fb.userId);
          if (author) {
            sendNotificationEmail(
              author.email,
              `${ticketLabel}: New reply to your feedback`,
              `Hi ${author.name},\n\n${user.name} replied to your feedback (${ticketLabel}):\n\n"${message}"\n\nOpen KiteTracker to respond.`
            );
          }
        }
      } else {
        const allUsers = await storage.getAllUsers();
        const admins = allUsers.filter(u => u.role === "admin" && u.id !== user.id);
        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.id,
            type: "feedback_comment",
            title: `${ticketLabel}: New message from ${user.name}`,
            message: msgPreview,
            link: "/feedback",
            read: false,
          });
        }
        const adminEmails = admins.map(a => a.email);
        if (adminEmails.length) {
          sendNotificationEmail(
            adminEmails,
            `${ticketLabel}: New message from ${user.name}`,
            `${user.name} replied to feedback ${ticketLabel}:\n\n"${message}"\n\nOpen KiteTracker to respond.`
          );
        }
      }
    }
    res.json(comment);
  });

  app.get("/api/notifications", requireAuth, async (req, res) => {
    const user = req.user as any;
    const items = await storage.getNotifications(user.id);
    res.json(items);
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    const user = req.user as any;
    const count = await storage.getUnreadNotificationCount(user.id);
    res.json({ count });
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    const user = req.user as any;
    await storage.markNotificationRead(parseInt(req.params.id), user.id);
    res.json({ ok: true });
  });

  app.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    const user = req.user as any;
    await storage.markAllNotificationsRead(user.id);
    res.json({ ok: true });
  });

  app.get("/api/accessory-categories", requireAuth, async (_req, res) => {
    const cats = await storage.getAllAccessoryCategories();
    res.json(cats);
  });

  app.post("/api/accessory-categories", requireAdmin, async (req, res) => {
    const schema = z.object({ name: z.string().min(1), hasSizes: z.boolean().optional().default(true) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid input" });
    try {
      const cat = await storage.createAccessoryCategory({ name: parsed.data.name, hasSizes: parsed.data.hasSizes, isDefault: false });
      res.json(cat);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/accessory-categories/:id", requireAdmin, async (req, res) => {
    await storage.deleteAccessoryCategory(parseInt(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/accessory-inventory", requireAuth, async (req, res) => {
    const stationId = req.query.stationId ? parseInt(req.query.stationId as string) : undefined;
    const inventory = await storage.getAccessoryInventory(stationId);
    res.json(inventory);
  });

  app.patch("/api/accessory-inventory", requireAdmin, async (req, res) => {
    const user = req.user as any;
    const schema = z.object({
      categoryId: z.number().int().positive(),
      stationId: z.number().int().positive(),
      size: z.string().min(1).default("Einheitsgröße"),
      quantity: z.number().int().min(0),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid input" });
    const { categoryId, stationId, size, quantity } = parsed.data;
    const oldInventory = await storage.getAccessoryInventory(stationId);
    const oldQty = oldInventory.find(i => i.categoryId === categoryId && i.size === size)?.quantity ?? 0;
    const inv = await storage.updateAccessoryInventory(categoryId, stationId, size, quantity);
    if (oldQty !== quantity) {
      const cats = await storage.getAllAccessoryCategories();
      const catName = cats.find(c => c.id === categoryId)?.name ?? "?";
      const stations = await storage.getAllStations();
      const stationName = stations.find(s => s.id === stationId)?.name ?? "?";
      const delta = quantity - oldQty;
      const sizeLabel = size === "Einheitsgröße" ? "" : ` (${size})`;
      await storage.createActivityLog({
        userId: user.id,
        action: "accessory_quantity_changed",
        details: `${catName}${sizeLabel} @ ${stationName}: ${oldQty} → ${quantity} (${delta > 0 ? "+" : ""}${delta})`,
      });
    }
    res.json(inv);
  });

  app.get("/api/accessory-transfers", requireAuth, async (_req, res) => {
    const transfers = await storage.getAllAccessoryTransfers();
    res.json(transfers);
  });

  app.post("/api/accessory-transfers", requireAdmin, async (req, res) => {
    const user = req.user as any;
    const schema = z.object({
      categoryId: z.number().int().positive(),
      size: z.string().min(1).default("Einheitsgröße"),
      quantity: z.number().int().positive(),
      fromStationId: z.number().int().positive(),
      toStationId: z.number().int().positive(),
    }).refine(d => d.fromStationId !== d.toStationId, { message: "Source and destination must differ" });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid input" });
    try {
      const transfer = await storage.createAccessoryTransfer({
        categoryId: parsed.data.categoryId,
        size: parsed.data.size,
        quantity: parsed.data.quantity,
        fromStationId: parsed.data.fromStationId,
        toStationId: parsed.data.toStationId,
        transferredBy: user.id,
      });
      const cats = await storage.getAllAccessoryCategories();
      const catName = cats.find(c => c.id === parsed.data.categoryId)?.name ?? "?";
      const stations = await storage.getAllStations();
      const fromName = stations.find(s => s.id === parsed.data.fromStationId)?.name ?? "?";
      const toName = stations.find(s => s.id === parsed.data.toStationId)?.name ?? "?";
      const sizeLabel = parsed.data.size === "Einheitsgröße" ? "" : ` (${parsed.data.size})`;
      await storage.createActivityLog({
        userId: user.id,
        action: "accessory_transferred",
        details: `${catName}${sizeLabel} ×${parsed.data.quantity}: ${fromName} → ${toName}`,
      });
      res.json(transfer);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/accessory-loss-reports", requireAuth, async (req, res) => {
    const status = req.query.status as string | undefined;
    const reports = await storage.getAccessoryLossReports(status);
    res.json(reports);
  });

  app.post("/api/accessory-loss-reports", requireAuth, async (req, res) => {
    const user = req.user as any;
    const schema = z.object({
      categoryId: z.number().int().positive(),
      stationId: z.number().int().positive(),
      size: z.string().min(1).default("Einheitsgröße"),
      quantity: z.number().int().positive(),
      reason: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid input" });
    try {
      const report = await storage.createAccessoryLossReport({
        ...parsed.data,
        reportedBy: user.id,
      });
      const cats = await storage.getAllAccessoryCategories();
      const catName = cats.find(c => c.id === parsed.data.categoryId)?.name ?? "?";
      const allStations = await storage.getAllStations();
      const stationName = allStations.find(s => s.id === parsed.data.stationId)?.name ?? "?";
      const sizeLabel = parsed.data.size === "Einheitsgröße" ? "" : ` (${parsed.data.size})`;
      await storage.createActivityLog({
        userId: user.id,
        action: "accessory_loss_reported",
        details: `${catName}${sizeLabel} ×${parsed.data.quantity} @ ${stationName}: ${parsed.data.reason}`,
      });
      res.json(report);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/accessory-loss-reports/:id", requireAdmin, async (req, res) => {
    const user = req.user as any;
    const schema = z.object({
      approved: z.boolean(),
      adminNote: z.string().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid input" });
    try {
      const report = await storage.resolveAccessoryLossReport(
        parseInt(req.params.id),
        user.id,
        parsed.data.adminNote ?? null,
        parsed.data.approved,
      );
      res.json(report);
      storage.getAllAccessoryCategories().then(async cats => {
        const catName = cats.find(c => c.id === report.categoryId)?.name ?? "?";
        const allStations = await storage.getAllStations();
        const stationName = allStations.find(s => s.id === report.stationId)?.name ?? "?";
        const sizeLabel = report.size === "Einheitsgröße" ? "" : ` (${report.size})`;
        const action = parsed.data.approved ? "accessory_loss_approved" : "accessory_loss_rejected";
        await storage.createActivityLog({
          userId: user.id,
          action,
          details: `${catName}${sizeLabel} ×${report.quantity} @ ${stationName}${parsed.data.adminNote ? ` – ${parsed.data.adminNote}` : ""}`,
        });
      }).catch(() => {});
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // ─── School Module Routes ─────────────────────────────────────────────────

  app.get("/api/school-configs", requireAuth, async (_req, res) => {
    const configs = await storage.getAllSchoolConfigs();
    res.json(configs);
  });

  app.post("/api/school-configs", requireAdmin, async (req, res) => {
    const schema = z.object({
      stationId: z.number().int().positive(),
      schoolName: z.string().min(1),
      currency: z.string().length(3).default("MAD"),
      isActive: z.boolean().default(true),
      contactEmail: z.string().email().optional().nullable(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid input" });
    try {
      const config = await storage.createSchoolConfig(parsed.data);
      res.json(config);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/school-configs/:id", requireAdmin, async (req, res) => {
    const schema = z.object({
      schoolName: z.string().min(1).optional(),
      currency: z.string().length(3).optional(),
      isActive: z.boolean().optional(),
      contactEmail: z.string().email().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid input" });
    const updated = await storage.updateSchoolConfig(parseInt(req.params.id), parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.get("/api/school-products/:schoolConfigId", requireAuth, async (req, res) => {
    const schoolConfigId = parseInt(req.params.schoolConfigId);
    if (isNaN(schoolConfigId)) return res.status(400).json({ message: "Invalid schoolConfigId" });
    const products = await storage.getSchoolProducts(schoolConfigId);
    res.json(products);
  });

  app.post("/api/school-products", requireAdmin, async (req, res) => {
    const schema = z.object({
      schoolConfigId: z.number().int().positive(),
      name: z.string().min(1),
      description: z.string().nullable().optional(),
      category: z.enum(["Course", "Lesson", "Package", "Rental", "Other"]),
      defaultPrice: z.union([z.string(), z.number()]).transform(v => String(v)),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid input" });
    try {
      const product = await storage.createSchoolProduct(parsed.data);
      res.json(product);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/school-products/import", requireAdmin, async (req, res) => {
    const schema = z.object({
      schoolConfigId: z.number().int().positive(),
      replaceExisting: z.boolean().default(false),
      products: z.array(z.object({
        name: z.string().min(1),
        description: z.string().nullable().optional(),
        category: z.enum(["Course", "Lesson", "Package", "Rental", "Other"]),
        defaultPrice: z.union([z.string(), z.number()]).transform(v => String(v)),
        isActive: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
      })),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid input" });
    try {
      const count = await storage.bulkImportSchoolProducts(
        parsed.data.schoolConfigId,
        parsed.data.products,
        parsed.data.replaceExisting,
      );
      res.json({ imported: count });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/school-products/:id", requireAdmin, async (req, res) => {
    const schema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().nullable().optional(),
      category: z.enum(["Course", "Lesson", "Package", "Rental", "Other"]).optional(),
      defaultPrice: z.union([z.string(), z.number()]).transform(v => String(v)).optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid input" });
    const updated = await storage.updateSchoolProduct(parseInt(req.params.id), parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  // ─── School Customers ───────────────────────────────────────────────────────

  app.get("/api/school-customers/:schoolConfigId", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "admin" && user.role !== "station_lead") {
      return res.status(403).json({ message: "Access denied" });
    }
    const customers = await storage.getSchoolCustomers(parseInt(req.params.schoolConfigId));
    res.json(customers);
  });

  app.get("/api/school-customer/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "admin" && user.role !== "station_lead") {
      return res.status(403).json({ message: "Access denied" });
    }
    const customer = await storage.getSchoolCustomer(parseInt(req.params.id));
    if (!customer) return res.status(404).json({ message: "Not found" });
    res.json(customer);
  });

  app.get("/api/dashboard/customers-summary", requireAuth, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const stationId = req.query.stationId ? parseInt(req.query.stationId as string) : undefined;
    if (!stationId) return res.status(400).json({ message: "stationId required" });

    const days: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }

    const config = await storage.getSchoolConfigByStation(stationId);
    const schoolCustomers = config ? await storage.getSchoolCustomers(config.id) : [];

    const result = days.map(date => ({
      date,
      course: schoolCustomers.filter(c => c.arrivalDate <= date && c.departureDate >= date).length,
      rental: 0,
      arrivals: schoolCustomers.filter(c => c.arrivalDate === date).length,
      departures: schoolCustomers.filter(c => c.departureDate === date).length,
    }));

    res.json(result);
  });

  app.post("/api/school-customers", requireAuth, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "admin" && user.role !== "station_lead") {
      return res.status(403).json({ message: "Access denied" });
    }
    const schema = z.object({
      schoolConfigId: z.number().int(),
      guestType: z.enum(["KiteWorldWide", "Walk-in"]).optional().default("Walk-in"),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      nationality: z.string().min(1),
      dateOfBirth: z.string().min(1),
      kiteLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Pro"]),
      weightKg: z.number().int().nullable().optional(),
      emergencyContact: z.string().min(1),
      arrivalDate: z.string().min(1),
      departureDate: z.string().min(1),
      notes: z.string().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid input" });
    const created = await storage.createSchoolCustomer({ ...parsed.data, createdBy: user.id });
    res.status(201).json(created);
  });

  app.patch("/api/school-customers/:id", requireAdmin, async (req, res) => {
    const schema = z.object({
      guestType: z.enum(["KiteWorldWide", "Walk-in"]).optional(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(1).optional(),
      nationality: z.string().min(1).optional(),
      dateOfBirth: z.string().min(1).optional(),
      kiteLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Pro"]).optional(),
      weightKg: z.number().int().nullable().optional(),
      emergencyContact: z.string().min(1).optional(),
      arrivalDate: z.string().min(1).optional(),
      departureDate: z.string().min(1).optional(),
      notes: z.string().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid input" });
    const updated = await storage.updateSchoolCustomer(parseInt(req.params.id), parsed.data);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  app.delete("/api/school-customers/:id", requireAdmin, async (req, res) => {
    await storage.deleteSchoolCustomer(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/fix-equipment-sizes", requireAdmin, async (req, res) => {
    const { db: dbInstance } = await import("./db");
    const { sql } = await import("drizzle-orm");

    const kitePattern = ' ([0-9]+[.][0-9]+)( |$)';
    const boardPattern = '([0-9]{2,3})x[0-9]{2,3}';

    const kiteResult = await dbInstance.execute(sql`
      UPDATE equipment 
      SET type_specific_fields = jsonb_set(
        type_specific_fields::jsonb, '{size}', 
        to_jsonb((regexp_match(model, ${kitePattern}))[1])
      )
      WHERE type IN ('kite', 'wing') 
        AND model ~ ${kitePattern}
        AND type_specific_fields::jsonb->>'size' != (regexp_match(model, ${kitePattern}))[1]
    `);

    const boardResult = await dbInstance.execute(sql`
      UPDATE equipment 
      SET type_specific_fields = jsonb_set(
        type_specific_fields::jsonb, '{size}', 
        to_jsonb((regexp_match(model, ${boardPattern}))[1])
      )
      WHERE type IN ('board', 'foilboard') 
        AND model ~ ${boardPattern}
        AND type_specific_fields::jsonb->>'size' != (regexp_match(model, ${boardPattern}))[1]
    `);

    res.json({ 
      message: "Equipment sizes fixed",
      kitesFixed: kiteResult.rowCount || 0,
      boardsFixed: boardResult.rowCount || 0,
    });
  });

  // ─── Quick Inventory — Accessory Checks ─────────────────────────────────────

  app.get("/api/stations/:id/accessory-checks", requireAuth, async (req, res) => {
    const user = req.user as any;
    const stationId = parseInt(req.params.id);
    if (user.role === "station_lead" && user.assignedStationId !== stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const checks = await storage.getAccessoryChecks(stationId, limit);
    res.json(checks);
  });

  app.get("/api/accessory-checks/:id/items", requireAuth, async (req, res) => {
    const user = req.user as any;
    const checkId = parseInt(req.params.id);
    if (isNaN(checkId)) return res.status(400).json({ message: "Invalid check ID" });
    const check = await storage.getAccessoryCheckById(checkId);
    if (!check) return res.status(404).json({ message: "Not found" });
    if (user.role === "station_lead" && user.assignedStationId !== check.stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const items = await storage.getAccessoryCheckItems(checkId);
    res.json(items);
  });

  app.post("/api/stations/:id/accessory-checks", requireAuth, async (req, res) => {
    const user = req.user as any;
    const stationId = parseInt(req.params.id);
    if (isNaN(stationId)) return res.status(400).json({ message: "Invalid station ID" });
    if (user.role === "station_lead" && user.assignedStationId !== stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { items } = req.body as { items: { categoryId: number; size: string | null; targetQuantity: number; actualQuantity: number; notes?: string }[] };
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Non-empty items array required" });
    }
    for (const item of items) {
      if (typeof item.categoryId !== "number" || typeof item.actualQuantity !== "number" || typeof item.targetQuantity !== "number") {
        return res.status(400).json({ message: "Each item needs categoryId, actualQuantity, targetQuantity as numbers" });
      }
      if (item.actualQuantity < 0 || item.targetQuantity < 0) {
        return res.status(400).json({ message: "Quantities must be non-negative" });
      }
    }
    const totalDifferences = items.filter(i => i.actualQuantity !== i.targetQuantity).length;
    const check = await storage.createAccessoryCheck({
      stationId,
      checkedBy: user.id,
      totalCategories: items.length,
      totalDifferences,
    });
    const checkItems = await storage.createAccessoryCheckItems(
      items.map(i => ({
        checkId: check.id,
        categoryId: i.categoryId,
        size: i.size,
        targetQuantity: i.targetQuantity,
        actualQuantity: i.actualQuantity,
        notes: i.notes || null,
      }))
    );
    const stationsList = await storage.getAllStations();
    const stationName = stationsList.find(s => s.id === stationId)?.name || `Station #${stationId}`;
    await storage.createActivityLog({
      userId: user.id,
      action: "accessory_check_completed",
      details: `Accessory count at ${stationName}: ${items.length} items checked, ${totalDifferences} differences`,
    });
    res.json({ check, items: checkItems });
  });

  app.get("/api/stations/:id/quick-inventory", requireAuth, async (req, res) => {
    const user = req.user as any;
    const stationId = parseInt(req.params.id);
    if (isNaN(stationId)) return res.status(400).json({ message: "Invalid station ID" });
    if (user.role === "station_lead" && user.assignedStationId !== stationId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const [equipChecks, accChecks, inventory, categories, allStations, currentEquipment] = await Promise.all([
      storage.getInventoryChecks(stationId),
      storage.getAccessoryChecks(stationId, 5),
      storage.getAccessoryInventory(stationId),
      storage.getAllAccessoryCategories(),
      storage.getAllStations(),
      storage.getAllEquipment({ stationId }),
    ]);
    const station = allStations.find(s => s.id === stationId);
    const openEquipCheck = equipChecks.find(c => c.status === "in_progress");
    const recentEquipChecks = equipChecks.filter(c => c.status === "completed").slice(0, 5);
    const allUsers = await Promise.all(
      [...new Set([...recentEquipChecks.map(c => c.startedBy)])].map(id => storage.getUser(id))
    );
    const userMap = new Map(allUsers.filter(Boolean).map(u => [u!.id, u!.name]));
    const enrichedEquipChecks = recentEquipChecks.map(c => ({
      ...c,
      startedByName: userMap.get(c.startedBy) || "Unknown",
    }));
    let openCheckItems: any[] = [];
    if (openEquipCheck) {
      openCheckItems = await storage.getInventoryCheckItems(openEquipCheck.id);
    }
    res.json({
      stationName: station?.name || `Station #${stationId}`,
      openEquipCheck: openEquipCheck ? {
        ...openEquipCheck,
        totalItems: currentEquipment.length,
        checkedCount: openCheckItems.filter(i => i.checked).length,
      } : null,
      openCheckItems: openEquipCheck ? openCheckItems : [],
      openCheckEquipment: openEquipCheck ? currentEquipment : [],
      recentEquipChecks: enrichedEquipChecks,
      recentAccChecks: accChecks,
      accessoryInventory: inventory,
      accessoryCategories: categories,
    });
  });

  // ─── School Bookings ──────────────────────────────────────────────────────

  const STATION_SHORT_CODES: Record<string, string> = {
    dakhla: "DK",
    tatajuba: "TJ",
    hamburg: "HH",
    heidenau: "HD",
  };

  function getStationShortCode(stationName: string): string {
    const lower = stationName.toLowerCase();
    for (const [key, code] of Object.entries(STATION_SHORT_CODES)) {
      if (lower.includes(key)) return code;
    }
    return stationName.substring(0, 2).toUpperCase();
  }

  app.get("/api/school-bookings/:schoolConfigId", requireAuth, async (req, res) => {
    try {
      const schoolConfigId = parseInt(req.params.schoolConfigId);
      if (isNaN(schoolConfigId)) return res.status(400).json({ message: "Invalid school config ID" });
      const user = req.user as any;
      if (user.role === "station_lead") {
        const config = await storage.getSchoolConfig(schoolConfigId);
        if (!config || config.stationId !== user.assignedStationId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      const bookings = await storage.getSchoolBookings(schoolConfigId);
      res.json(bookings);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/school-bookings/detail/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid booking ID" });
      const booking = await storage.getSchoolBooking(id);
      if (!booking) return res.status(404).json({ message: "Not found" });
      const user = req.user as any;
      if (user.role === "station_lead") {
        const config = await storage.getSchoolConfig(booking.schoolConfigId);
        if (!config || config.stationId !== user.assignedStationId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      res.json(booking);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/school-bookings/next-number/:schoolConfigId", requireAuth, async (req, res) => {
    try {
      const schoolConfigId = parseInt(req.params.schoolConfigId);
      if (isNaN(schoolConfigId)) return res.status(400).json({ message: "Invalid school config ID" });
      const config = await storage.getSchoolConfig(schoolConfigId);
      if (!config) return res.status(404).json({ message: "School config not found" });
      const user = req.user as any;
      if (user.role === "station_lead" && config.stationId !== user.assignedStationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const station = await storage.getStation(config.stationId);
      const shortCode = getStationShortCode(station?.name || "XX");
      const bookingNumber = await storage.getNextBookingNumber(schoolConfigId, shortCode);
      res.json({ bookingNumber });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/school-bookings", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== "admin" && user.role !== "manager" && user.role !== "station_lead") {
        return res.status(403).json({ message: "Only admin or center manager can create bookings" });
      }
      const { schoolConfigId, customerId, customerName, customerEmail, paymentStatus, notes, items, currency } = req.body;
      if (!schoolConfigId || !customerName || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "schoolConfigId, customerName, and items are required" });
      }
      for (const item of items) {
        if (!item.productName || typeof item.productName !== "string") {
          return res.status(400).json({ message: "Each item must have a productName" });
        }
        const qty = parseInt(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        if (qty < 1) return res.status(400).json({ message: "Quantity must be at least 1" });
        if (price < 0) return res.status(400).json({ message: "Price cannot be negative" });
      }
      const config = await storage.getSchoolConfig(schoolConfigId);
      if (!config) return res.status(404).json({ message: "School config not found" });
      if (user.role === "station_lead" && config.stationId !== user.assignedStationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const station = await storage.getStation(config.stationId);
      const shortCode = getStationShortCode(station?.name || "XX");
      const bookingNumber = await storage.getNextBookingNumber(schoolConfigId, shortCode);
      const totalAmount = items.reduce((sum: number, i: any) => sum + (parseFloat(i.lineTotal) || 0), 0).toFixed(2);

      const booking = await storage.createSchoolBooking(
        {
          schoolConfigId,
          bookingNumber,
          customerId: customerId || null,
          customerName,
          customerEmail: customerEmail || null,
          paymentStatus: paymentStatus || "unpaid",
          totalAmount,
          currency: currency || config.currency,
          notes: notes || null,
          createdBy: user.id,
        },
        items.map((i: any) => ({
          productId: i.productId || null,
          productName: i.productName,
          category: i.category || "Other",
          quantity: i.quantity || 1,
          unitPrice: String(i.unitPrice),
          lineTotal: String(i.lineTotal),
        }))
      );

      await storage.createActivityLog({
        userId: user.id,
        action: "school_booking_created",
        details: `Booking ${bookingNumber} created for ${customerName} — ${config.currency} ${totalAmount}`,
      });

      const full = await storage.getSchoolBooking(booking.id);
      res.json(full);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/school-bookings/:id/payment", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== "admin" && user.role !== "manager" && user.role !== "station_lead") {
        return res.status(403).json({ message: "Access denied" });
      }
      const id = parseInt(req.params.id);
      const { paymentStatus } = req.body;
      if (!["unpaid", "cash", "credit_card"].includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid payment status" });
      }
      const booking = await storage.getSchoolBooking(id);
      if (!booking) return res.status(404).json({ message: "Not found" });
      if (user.role === "station_lead") {
        const config = await storage.getSchoolConfig(booking.schoolConfigId);
        if (!config || config.stationId !== user.assignedStationId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      const updated = await storage.updateSchoolBookingPayment(id, paymentStatus);
      await storage.createActivityLog({
        userId: user.id,
        action: "school_booking_payment_updated",
        details: `Booking ${booking.bookingNumber} payment changed to ${paymentStatus}`,
      });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/school-bookings/:id/pdf", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getSchoolBooking(id);
      if (!booking) return res.status(404).json({ message: "Not found" });
      const user = req.user as any;
      const config = await storage.getSchoolConfig(booking.schoolConfigId);
      if (!config) return res.status(404).json({ message: "School config not found" });
      if (user.role === "station_lead" && config.stationId !== user.assignedStationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: `Receipt ${booking.bookingNumber}` } });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${booking.bookingNumber}.pdf"`);
      doc.pipe(res);

      const pageW = 595.28;
      const margin = 50;
      const contentW = pageW - margin * 2;
      const navy = "#1e3a5f";
      const grey = "#6b7280";
      const lightGrey = "#f3f4f6";
      const black = "#111827";

      doc.fontSize(20).font("Helvetica-Bold").fillColor(navy).text(config.schoolName, margin, margin, { width: contentW });
      doc.moveTo(margin, margin + 30).lineTo(pageW - margin, margin + 30).strokeColor(navy).lineWidth(1.5).stroke();

      let y = margin + 45;
      doc.fontSize(16).font("Helvetica-Bold").fillColor(navy).text("RECEIPT", margin, y);
      y += 30;

      const metaData: [string, string][] = [
        ["Receipt No.:", booking.bookingNumber],
        ["Date:", booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("de-DE") : "—"],
        ["Customer:", booking.customerName],
        ...(booking.customerEmail ? [["Email:", booking.customerEmail] as [string, string]] : []),
        ["Payment:", booking.paymentStatus === "unpaid" ? "Unpaid" : booking.paymentStatus === "cash" ? "Cash" : "Credit Card"],
      ];

      for (const [label, val] of metaData) {
        doc.fontSize(9).font("Helvetica").fillColor(grey).text(label, margin, y, { width: 100 });
        doc.fontSize(9).font("Helvetica-Bold").fillColor(black).text(val, margin + 105, y, { width: 300 });
        y += 16;
      }
      y += 10;

      const colPos = margin;
      const colName = margin + 30;
      const colCat = margin + 280;
      const colQty = margin + 360;
      const colPrice = margin + 400;
      const colTotal = margin + 450;
      const tableRight = pageW - margin;

      doc.rect(margin, y, contentW, 18).fill(navy);
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text("#", colPos, y + 5, { width: 25 });
      doc.text("Product", colName, y + 5, { width: 245 });
      doc.text("Category", colCat, y + 5, { width: 75 });
      doc.text("Qty", colQty, y + 5, { width: 35, align: "right" });
      doc.text("Price", colPrice, y + 5, { width: 45, align: "right" });
      doc.text("Total", colTotal, y + 5, { width: tableRight - colTotal, align: "right" });
      y += 20;

      booking.items.forEach((item, idx) => {
        const rowH = 18;
        if (idx % 2 === 0) doc.rect(margin, y, contentW, rowH).fill(lightGrey);
        doc.fontSize(8).font("Helvetica").fillColor(black);
        doc.text(String(idx + 1), colPos, y + 5, { width: 25 });
        doc.text(item.productName, colName, y + 5, { width: 245 });
        doc.text(item.category, colCat, y + 5, { width: 75 });
        doc.text(String(item.quantity), colQty, y + 5, { width: 35, align: "right" });
        doc.text(`${booking.currency} ${parseFloat(item.unitPrice).toFixed(2)}`, colPrice, y + 5, { width: 45, align: "right" });
        doc.text(`${booking.currency} ${parseFloat(item.lineTotal).toFixed(2)}`, colTotal, y + 5, { width: tableRight - colTotal, align: "right" });
        y += rowH;
      });

      y += 10;
      doc.moveTo(margin + contentW * 0.6, y).lineTo(pageW - margin, y).strokeColor(grey).lineWidth(0.5).stroke();
      y += 8;
      doc.fontSize(12).font("Helvetica-Bold").fillColor(navy)
        .text(`Total: ${booking.currency} ${parseFloat(booking.totalAmount).toFixed(2)}`, margin, y, { width: contentW, align: "right" });

      doc.end();
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/school-bookings/:id/email", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (user.role !== "admin" && user.role !== "manager" && user.role !== "station_lead") {
        return res.status(403).json({ message: "Access denied" });
      }
      const id = parseInt(req.params.id);
      const booking = await storage.getSchoolBooking(id);
      if (!booking) return res.status(404).json({ message: "Not found" });
      if (!booking.customerEmail) return res.status(400).json({ message: "No customer email" });
      const config = await storage.getSchoolConfig(booking.schoolConfigId);
      if (!config) return res.status(404).json({ message: "School config not found" });
      if (user.role === "station_lead" && config.stationId !== user.assignedStationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const itemsHtml = booking.items.map((i, idx) =>
        `<tr><td>${idx + 1}</td><td>${i.productName}</td><td>${i.category}</td><td>${i.quantity}</td><td>${booking.currency} ${parseFloat(i.unitPrice).toFixed(2)}</td><td>${booking.currency} ${parseFloat(i.lineTotal).toFixed(2)}</td></tr>`
      ).join("");

      const body = `
        <h2>Receipt — ${booking.bookingNumber}</h2>
        <p>Dear ${booking.customerName},</p>
        <p>Thank you for your booking at ${config.schoolName}.</p>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
          <tr style="background:#1e3a5f;color:#fff;"><th>#</th><th>Product</th><th>Category</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          ${itemsHtml}
        </table>
        <p style="font-size:18px;font-weight:bold;margin-top:12px;">Total: ${booking.currency} ${parseFloat(booking.totalAmount).toFixed(2)}</p>
        <p>Payment: ${booking.paymentStatus === "unpaid" ? "Unpaid" : booking.paymentStatus === "cash" ? "Cash" : "Credit Card"}</p>
        <p>Best regards,<br/>${config.schoolName}</p>
      `;

      await sendNotificationEmail(booking.customerEmail, `Receipt ${booking.bookingNumber} — ${config.schoolName}`, body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}
