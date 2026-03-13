import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  jsonb,
  serial,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "station_lead"]);

export const equipmentTypeEnum = pgEnum("equipment_type", [
  "kite",
  "board",
  "foilboard",
  "foil",
  "wing",
  "bar_lines",
  "wetsuit",
  "harness",
  "helmet_safety",
]);

export const equipmentStatusEnum = pgEnum("equipment_status", [
  "active",
  "in_repair",
  "retired",
  "sold",
  "in_transfer",
  "missing",
]);

export const transferStatusEnum = pgEnum("transfer_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

export const repairStatusEnum = pgEnum("repair_status", [
  "pending",
  "completed",
]);

export const inventoryCheckStatusEnum = pgEnum("inventory_check_status", [
  "in_progress",
  "completed",
]);

export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  country: text("country"),
  isVirtual: boolean("is_virtual").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(99),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("manager"),
  assignedStationId: integer("assigned_station_id").references(() => stations.id),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  serialNumber: text("serial_number").notNull().unique(),
  sku: text("sku"),
  type: equipmentTypeEnum("type").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  purchaseDate: timestamp("purchase_date"),
  yearOfPurchase: integer("year_of_purchase"),
  currentStationId: integer("current_station_id").references(() => stations.id),
  status: equipmentStatusEnum("status").notNull().default("active"),
  conditionRating: integer("condition_rating").notNull().default(5),
  lastInspectionDate: timestamp("last_inspection_date"),
  notes: text("notes"),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  typeSpecificFields: jsonb("type_specific_fields").$type<Record<string, any>>(),
  invoiceId: integer("invoice_id"),
  invoiceReference: text("invoice_reference"),
  priceListId: integer("price_list_id").references(() => priceLists.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conditionRatings = pgTable("condition_ratings", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id")
    .notNull()
    .references(() => equipment.id),
  rating: integer("rating").notNull(),
  ratedBy: integer("rated_by")
    .notNull()
    .references(() => users.id),
  ratedAt: timestamp("rated_at").defaultNow(),
  notes: text("notes"),
});

export const repairs = pgTable("repairs", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id")
    .notNull()
    .references(() => equipment.id),
  description: text("description").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  status: repairStatusEnum("status").notNull().default("pending"),
  loggedBy: integer("logged_by")
    .notNull()
    .references(() => users.id),
  date: timestamp("date").defaultNow(),
});

export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id")
    .notNull()
    .references(() => equipment.id),
  fromStationId: integer("from_station_id")
    .notNull()
    .references(() => stations.id),
  toStationId: integer("to_station_id")
    .notNull()
    .references(() => stations.id),
  initiatedBy: integer("initiated_by")
    .notNull()
    .references(() => users.id),
  confirmedBy: integer("confirmed_by").references(() => users.id),
  initiatedAt: timestamp("initiated_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  status: transferStatusEnum("status").notNull().default("pending"),
  arrivedCondition: integer("arrived_condition"),
  missing: boolean("missing").notNull().default(false),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id")
    .notNull()
    .references(() => equipment.id),
  url: text("url").notNull(),
  uploadedBy: integer("uploaded_by")
    .notNull()
    .references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  caption: text("caption"),
});

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  equipmentId: integer("equipment_id").references(() => equipment.id),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const inventoryChecks = pgTable("inventory_checks", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id").notNull().references(() => stations.id),
  startedBy: integer("started_by").notNull().references(() => users.id),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  status: inventoryCheckStatusEnum("status").notNull().default("in_progress"),
  totalItems: integer("total_items").notNull().default(0),
});

export const inventoryCheckItems = pgTable("inventory_check_items", {
  id: serial("id").primaryKey(),
  checkId: integer("check_id").notNull().references(() => inventoryChecks.id),
  equipmentId: integer("equipment_id").notNull().references(() => equipment.id),
  checked: integer("checked").notNull().default(0),
  conditionRating: integer("condition_rating"),
  needsRepair: integer("needs_repair").notNull().default(0),
  missing: integer("missing").notNull().default(0),
  notes: text("notes"),
  checkedAt: timestamp("checked_at"),
  checkedBy: integer("checked_by").references(() => users.id),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceDate: text("invoice_date"),
  deliveryDate: text("delivery_date"),
  orderNumber: text("order_number"),
  totalNet: decimal("total_net", { precision: 10, scale: 2 }),
  totalGross: decimal("total_gross", { precision: 10, scale: 2 }),
  importedAt: timestamp("imported_at").defaultNow(),
  importedBy: integer("imported_by").references(() => users.id),
  itemCount: integer("item_count"),
});

export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default("KiteWorldWide GmbH"),
  address: text("address").notNull().default("Steindamm 97, D-20099 Hamburg"),
  registry: text("registry").notNull().default("Amtsgericht Hamburg, HRB 105108"),
  taxId: text("tax_id").notNull().default("46/736/04728"),
  vatId: text("vat_id").notNull().default("DE259606444"),
  managingDirector: text("managing_director").notNull().default("York Neumann"),
  phone: text("phone").notNull().default("+49 40 2093 45090"),
  website: text("website").notNull().default("www.kiteworldwide.com"),
  bankName: text("bank_name").notNull().default("Commerzbank"),
  iban: text("iban").notNull().default("DE69 2004 0000 0898 2100 00"),
  bic: text("bic").notNull().default("COBADEFFXXX"),
  accountHolder: text("account_holder").notNull().default("KiteWorldWide GmbH"),
  logoUrl: text("logo_url"),
  paypalEmail: text("paypal_email"),
  invoicePrefix: text("invoice_prefix").notNull().default("Inv-KWS"),
  invoiceNextNumber: integer("invoice_next_number").notNull().default(1001),
  invoiceYear: integer("invoice_year").notNull().default(2026),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyName: text("company_name"),
  address: text("address").notNull(),
  email: text("email").notNull(),
  taxId: text("tax_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const damageReports = pgTable("damage_reports", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull().references(() => equipment.id),
  reportedBy: integer("reported_by").notNull().references(() => users.id),
  reportedAt: timestamp("reported_at").defaultNow(),
  howItHappened: text("how_it_happened").notNull(),
  customerName: text("customer_name"),
  bookingReference: text("booking_reference"),
  usageType: text("usage_type").notNull().default("rental"),
  customerInsured: boolean("customer_insured").notNull().default(false),
  repairable: boolean("repairable").notNull().default(true),
  totalLoss: boolean("total_loss").notNull().default(false),
  canRepairOnSite: boolean("can_repair_on_site").notNull().default(false),
  needsSpareParts: boolean("needs_spare_parts").notNull().default(false),
  sparePartsNeeded: text("spare_parts_needed"),
  stationId: integer("station_id").references(() => stations.id),
  status: text("status").notNull().default("open"),
  adminNotified: boolean("admin_notified").notNull().default(false),
  repairId: integer("repair_id").references(() => repairs.id),
  estimatedRepairCost: decimal("estimated_repair_cost", { precision: 10, scale: 2 }),
  estimatedValueLoss: decimal("estimated_value_loss", { precision: 10, scale: 2 }),
});

export const damageReportPhotos = pgTable("damage_report_photos", {
  id: serial("id").primaryKey(),
  damageReportId: integer("damage_report_id").notNull().references(() => damageReports.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const salesInvoices = pgTable("sales_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  invoiceDate: text("invoice_date").notNull(),
  deliveryDate: text("delivery_date"),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  paymentMethod: text("payment_method").notNull().default("bank_transfer"),
  paymentTerms: text("payment_terms").notNull().default("14 Tage ohne Abzug"),
  vatType: text("vat_type").notNull().default("standard_19"),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("19.00"),
  vatNote: text("vat_note"),
  notes: text("notes"),
  totalNet: decimal("total_net", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalVat: decimal("total_vat", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalGross: decimal("total_gross", { precision: 10, scale: 2 }).notNull().default("0.00"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  damageReportId: integer("damage_report_id").references(() => damageReports.id),
  pdfUrl: text("pdf_url"),
  customerType: text("customer_type"),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => salesInvoices.id),
  equipmentId: integer("equipment_id").references(() => equipment.id),
  position: integer("position").notNull().default(1),
  description: text("description").notNull(),
  serialNumber: text("serial_number"),
  sku: text("sku"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const priceLists = pgTable("price_lists", {
  id: serial("id").primaryKey(),
  name: text("name"),
  supplier: text("supplier").notNull(),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  itemCount: integer("item_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  uploadedBy: integer("uploaded_by").references(() => users.id),
});

export const priceListItems = pgTable("price_list_items", {
  id: serial("id").primaryKey(),
  priceListId: integer("price_list_id").notNull().references(() => priceLists.id, { onDelete: "cascade" }),
  sku: text("sku").notNull(),
  productName: text("product_name").notNull(),
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).notNull(),
  dealerPrice: decimal("dealer_price", { precision: 10, scale: 2 }),
  productType: text("product_type"),
});

export const insertStationSchema = createInsertSchema(stations).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertEquipmentSchema = createInsertSchema(equipment).omit({ id: true, createdAt: true });
export const insertConditionRatingSchema = createInsertSchema(conditionRatings).omit({ id: true, ratedAt: true });
export const insertRepairSchema = createInsertSchema(repairs).omit({ id: true, date: true });
export const insertTransferSchema = createInsertSchema(transfers).omit({ id: true, initiatedAt: true, confirmedAt: true, confirmedBy: true, status: true });
export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true, uploadedAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, timestamp: true });
export const insertInventoryCheckSchema = createInsertSchema(inventoryChecks).omit({ id: true, startedAt: true, completedAt: true });
export const insertInventoryCheckItemSchema = createInsertSchema(inventoryCheckItems).omit({ id: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, importedAt: true });
export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertSalesInvoiceSchema = createInsertSchema(salesInvoices).omit({ id: true, createdAt: true });
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({ id: true });
export const insertPriceListSchema = createInsertSchema(priceLists).omit({ id: true, uploadedAt: true });
export const insertPriceListItemSchema = createInsertSchema(priceListItems).omit({ id: true });
export const insertDamageReportSchema = createInsertSchema(damageReports).omit({ id: true, reportedAt: true, adminNotified: true, repairId: true });
export const insertDamageReportPhotoSchema = createInsertSchema(damageReportPhotos).omit({ id: true, uploadedAt: true });

export type InsertStation = z.infer<typeof insertStationSchema>;
export type Station = typeof stations.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = typeof equipment.$inferSelect;

export type InsertConditionRating = z.infer<typeof insertConditionRatingSchema>;
export type ConditionRating = typeof conditionRatings.$inferSelect;

export type InsertRepair = z.infer<typeof insertRepairSchema>;
export type Repair = typeof repairs.$inferSelect;

export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transfers.$inferSelect;

export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;

export type InsertInventoryCheck = z.infer<typeof insertInventoryCheckSchema>;
export type InventoryCheck = typeof inventoryChecks.$inferSelect;

export type InsertInventoryCheckItem = z.infer<typeof insertInventoryCheckItemSchema>;
export type InventoryCheckItem = typeof inventoryCheckItems.$inferSelect;

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertSalesInvoice = z.infer<typeof insertSalesInvoiceSchema>;
export type SalesInvoice = typeof salesInvoices.$inferSelect;

export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = typeof saleItems.$inferSelect;

export type InsertPriceList = z.infer<typeof insertPriceListSchema>;
export type PriceList = typeof priceLists.$inferSelect;

export type InsertPriceListItem = z.infer<typeof insertPriceListItemSchema>;
export type PriceListItem = typeof priceListItems.$inferSelect;

export type InsertDamageReport = z.infer<typeof insertDamageReportSchema>;
export type DamageReport = typeof damageReports.$inferSelect;

export type InsertDamageReportPhoto = z.infer<typeof insertDamageReportPhotoSchema>;
export type DamageReportPhoto = typeof damageReportPhotos.$inferSelect;

// Feedback / bug reports from station leads
export const feedbackStatusEnum = pgEnum("feedback_status", ["open", "in_progress", "resolved"]);

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  pageUrl: text("page_url").notNull(),
  message: text("message"),
  audioUrl: text("audio_url"),
  screenshotUrl: text("screenshot_url"),
  status: feedbackStatusEnum("status").notNull().default("open"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true });

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

export const feedbackComments = pgTable("feedback_comments", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id").notNull().references(() => feedback.id),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFeedbackCommentSchema = createInsertSchema(feedbackComments).omit({ id: true, createdAt: true });
export type InsertFeedbackComment = z.infer<typeof insertFeedbackCommentSchema>;
export type FeedbackComment = typeof feedbackComments.$inferSelect;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  kite: "Kites",
  board: "Kiteboards",
  wing: "Wings",
  foilboard: "Wing Foil Boards",
  foil: "Foils",
  bar_lines: "Bars",
  wetsuit: "Wetsuits",
  harness: "Harnesses",
  helmet_safety: "Helmets",
};

export const EQUIPMENT_TYPE_OPTIONS = [
  "kite",
  "board",
  "wing",
  "foilboard",
  "bar_lines",
  "wetsuit",
  "harness",
  "helmet_safety",
] as const;

export const TYPES_WITHOUT_SERIAL = ["helmet_safety", "harness", "wetsuit"] as const;

export const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  in_repair: "In Repair",
  retired: "Retired",
  sold: "Sold",
  in_transfer: "In Transfer",
};

export const TYPE_SPECIFIC_FIELDS: Record<string, { key: string; label: string; type: string; options?: string[] }[]> = {
  kite: [
    { key: "size", label: "Size (m\u00b2)", type: "number" },
    { key: "color", label: "Color", type: "text" },
  ],
  board: [
    { key: "size", label: "Size (cm)", type: "number" },
    { key: "boardType", label: "Type", type: "select", options: ["TwinTip", "Directional"] },
  ],
  foilboard: [
    { key: "size", label: "Size (cm)", type: "number" },
    { key: "volume", label: "Volume (L)", type: "number" },
  ],
  foil: [
    { key: "mastLength", label: "Mast Length (cm)", type: "number" },
    { key: "wingSize", label: "Wing Size", type: "text" },
  ],
  wing: [
    { key: "size", label: "Size (m\u00b2)", type: "number" },
    { key: "color", label: "Color", type: "text" },
  ],
  bar_lines: [
    { key: "lineLength", label: "Line Length (m)", type: "number" },
    { key: "compatibleSizes", label: "Compatible Kite Sizes", type: "text" },
  ],
  wetsuit: [
    { key: "thickness", label: "Thickness (mm)", type: "number" },
    { key: "size", label: "Size", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] },
    { key: "wetsuitType", label: "Type", type: "select", options: ["Full", "Shorty", "Top"] },
  ],
  harness: [
    { key: "size", label: "Size", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] },
    { key: "harnessType", label: "Type", type: "select", options: ["Waist", "Seat"] },
  ],
  helmet_safety: [
    { key: "size", label: "Size", type: "text" },
    { key: "gearType", label: "Type", type: "select", options: ["Helmet", "Impact Vest", "Other"] },
  ],
};
