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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "manager"]);

export const equipmentTypeEnum = pgEnum("equipment_type", [
  "kite",
  "board",
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
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("manager"),
  assignedStationId: integer("assigned_station_id").references(() => stations.id),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  serialNumber: text("serial_number").notNull().unique(),
  sku: text("sku"),
  type: equipmentTypeEnum("type").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
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

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  kite: "Kites",
  board: "Boards",
  foil: "Foils",
  wing: "Wings",
  bar_lines: "Bars & Lines",
  wetsuit: "Wetsuits",
  harness: "Harnesses",
  helmet_safety: "Helmets & Safety Gear",
};

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
    { key: "boardType", label: "Type", type: "select", options: ["TwinTip", "Directional", "Foilboard"] },
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
