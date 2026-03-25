import { eq, and, desc, ilike, or, sql, inArray, isNull } from "drizzle-orm";
import { db } from "./db";

export interface ActiveRepairItem {
  repairId: number;
  repairDescription: string;
  repairStatus: string;
  repairDate: Date | null;
  repairCost: string | null;
  loggedByName: string;
  equipmentId: number;
  equipmentSerial: string;
  equipmentBrand: string;
  equipmentModel: string;
  equipmentType: string;
  stationId: number | null;
  stationName: string | null;
  damageReportId: number | null;
  damageReportStatus: string | null;
  damageReportedAt: Date | null;
  estimatedRepairCost: string | null;
  estimatedValueLoss: string | null;
  sparePartsNeeded: string | null;
  needsSpareParts: boolean;
  customerName: string | null;
  bookingReference: string | null;
  usageType: string | null;
  repairable: boolean;
  totalLoss: boolean;
}
import {
  stations, users, equipment, conditionRatings, repairs, transfers, photos, activityLog,
  inventoryChecks, inventoryCheckItems, suppliers, invoices,
  companySettings, customers, salesInvoices, saleItems, priceLists, priceListItems,
  damageReports, damageReportPhotos, feedback, feedbackAttachments, feedbackComments, notifications,
  accessoryCategories, accessoryInventory, accessoryTransfers, accessoryLossReports,
  schoolConfigs, schoolProducts, schoolCustomers, schoolBookings, schoolBookingItems, passwordResetTokens,
  type Station, type InsertStation,
  type User, type InsertUser,
  type Equipment, type InsertEquipment,
  type ConditionRating, type InsertConditionRating,
  type Repair, type InsertRepair,
  type Transfer, type InsertTransfer,
  type Photo, type InsertPhoto,
  type ActivityLog, type InsertActivityLog,
  type InventoryCheck, type InsertInventoryCheck,
  type InventoryCheckItem, type InsertInventoryCheckItem,
  type Supplier, type InsertSupplier,
  type Invoice, type InsertInvoice,
  type CompanySettings, type InsertCompanySettings,
  type Customer, type InsertCustomer,
  type SalesInvoice, type InsertSalesInvoice,
  type SaleItem, type InsertSaleItem,
  type PriceList, type InsertPriceList,
  type PriceListItem, type InsertPriceListItem,
  type DamageReport, type InsertDamageReport,
  type DamageReportPhoto, type InsertDamageReportPhoto,
  type Feedback, type InsertFeedback,
  type FeedbackAttachment, type InsertFeedbackAttachment,
  type FeedbackComment, type InsertFeedbackComment,
  type Notification, type InsertNotification,
  type AccessoryCategory, type InsertAccessoryCategory,
  type AccessoryInventory, type InsertAccessoryInventory,
  type AccessoryTransfer, type InsertAccessoryTransfer,
  type AccessoryLossReport, type InsertAccessoryLossReport,
  accessoryChecks, accessoryCheckItems,
  type AccessoryCheck, type InsertAccessoryCheck,
  type AccessoryCheckItem, type InsertAccessoryCheckItem,
  type SchoolConfig, type InsertSchoolConfig,
  type SchoolProduct, type InsertSchoolProduct,
  type SchoolCustomer, type InsertSchoolCustomer,
  type SchoolBooking, type InsertSchoolBooking,
  type SchoolBookingItem, type InsertSchoolBookingItem,
} from "@shared/schema";

export interface IStorage {
  getStation(id: number): Promise<Station | undefined>;
  getAllStations(): Promise<Station[]>;
  createStation(station: InsertStation): Promise<Station>;
  updateStation(id: number, data: Partial<InsertStation>): Promise<Station | undefined>;
  deleteStation(id: number): Promise<void>;

  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  getValidPasswordResetToken(token: string): Promise<{ id: number; userId: number } | undefined>;
  markPasswordResetTokenUsed(id: number): Promise<void>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;

  getEquipment(id: number): Promise<Equipment | undefined>;
  getEquipmentBySerial(serial: string): Promise<Equipment | undefined>;
  getEquipmentByCode(code: string): Promise<Equipment | undefined>;
  getAllEquipment(filters?: {
    stationId?: number;
    includeTransfersForStation?: boolean;
    unassigned?: boolean;
    type?: string;
    status?: string;
    conditionRating?: number;
    search?: string;
  }): Promise<Equipment[]>;
  createEquipment(eq: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, data: Partial<InsertEquipment>): Promise<Equipment | undefined>;
  deleteEquipment(id: number): Promise<void>;

  getConditionRatings(equipmentId: number): Promise<ConditionRating[]>;
  createConditionRating(rating: InsertConditionRating): Promise<ConditionRating>;

  getRepairs(equipmentId: number): Promise<Repair[]>;
  getAllRepairs(): Promise<Repair[]>;
  getActiveRepairsWithDetails(stationId?: number): Promise<ActiveRepairItem[]>;
  createRepair(repair: InsertRepair): Promise<Repair>;
  updateRepair(id: number, data: Partial<InsertRepair>): Promise<Repair | undefined>;

  getTransfers(filters?: { stationId?: number; status?: string }): Promise<Transfer[]>;
  getTransfersByEquipment(equipmentId: number): Promise<Transfer[]>;
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  confirmTransfer(id: number, confirmedBy: number): Promise<Transfer | undefined>;
  cancelTransfer(id: number): Promise<Transfer | undefined>;

  getPhotos(equipmentId: number): Promise<Photo[]>;
  getPhoto(id: number): Promise<Photo | undefined>;
  getFirstPhotos(equipmentIds: number[]): Promise<Record<number, string>>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<void>;

  getActivityLog(opts?: { limit?: number; userId?: number; action?: string; stationId?: number; equipmentId?: number; dateFrom?: Date; dateTo?: Date }): Promise<(ActivityLog & { userName: string; equipmentLabel?: string; stationName?: string })[]>;
  getEquipmentActivityLog(equipmentId: number): Promise<(ActivityLog & { userName: string })[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  getDashboardStats(stationId?: number): Promise<{
    totalEquipment: number;
    equipmentPerStation: { stationId: number; stationName: string; count: number }[];
    needsAttention: number;
    inTransfer: number;
  }>;

  createInventoryCheck(check: InsertInventoryCheck): Promise<InventoryCheck>;
  getInventoryChecks(stationId: number): Promise<InventoryCheck[]>;
  getInventoryCheck(id: number): Promise<InventoryCheck | undefined>;
  completeInventoryCheck(id: number): Promise<InventoryCheck | undefined>;
  getInventoryCheckItems(checkId: number): Promise<InventoryCheckItem[]>;
  upsertInventoryCheckItem(data: Partial<InsertInventoryCheckItem> & { checkId: number; equipmentId: number }): Promise<InventoryCheckItem>;

  getAllSuppliers(): Promise<Supplier[]>;
  createSupplier(s: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined>;

  getAllInvoices(): Promise<(Invoice & { supplierName: string; importedByName: string | null })[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(inv: InsertInvoice): Promise<Invoice>;
  getEquipmentByInvoice(invoiceId: number): Promise<Equipment[]>;
  deleteInvoice(id: number): Promise<void>;

  getCompanySettings(): Promise<CompanySettings>;
  updateCompanySettings(data: Partial<InsertCompanySettings>): Promise<CompanySettings>;

  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(c: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined>;

  getAllSalesInvoices(): Promise<(SalesInvoice & { customerName: string; itemCount: number })[]>;
  getSalesInvoice(id: number): Promise<(SalesInvoice & { customer: Customer; items: SaleItem[] }) | undefined>;
  createSalesInvoice(inv: InsertSalesInvoice, items: Omit<InsertSaleItem, "saleId">[]): Promise<SalesInvoice>;
  updateSalesInvoice(id: number, data: Partial<SalesInvoice>): Promise<SalesInvoice | undefined>;
  confirmSale(id: number): Promise<SalesInvoice | undefined>;
  getNextInvoiceNumber(): Promise<string>;

  getAllPriceLists(): Promise<PriceList[]>;
  getPriceList(id: number): Promise<PriceList | undefined>;
  createPriceList(pl: InsertPriceList, items: Omit<InsertPriceListItem, "priceListId">[]): Promise<PriceList>;
  updatePriceList(id: number, data: { validFrom: Date | null; validTo: Date | null; name?: string | null }): Promise<PriceList | undefined>;
  deactivatePriceLists(supplier: string): Promise<void>;
  deletePriceList(id: number): Promise<void>;
  getPriceListItems(priceListId: number): Promise<PriceListItem[]>;
  lookupRetailPrice(sku: string): Promise<{ retailPrice: string; dealerPrice: string | null; supplier: string; productName: string; priceListId: number; validFrom: Date | null; validTo: Date | null } | null>;
  lookupRetailPriceByName(name: string): Promise<{ retailPrice: string; dealerPrice: string | null; supplier: string; productName: string; priceListId: number; validFrom: Date | null; validTo: Date | null } | null>;

  getAllDamageReports(): Promise<(DamageReport & { equipmentLabel: string; reporterName: string; stationName?: string; photos: DamageReportPhoto[]; invoiceId?: number; invoiceNumber?: string; invoicePdfUrl?: string })[]>;
  getDamageReport(id: number): Promise<(DamageReport & { equipmentLabel: string; reporterName: string; stationName?: string; photos: DamageReportPhoto[]; invoiceId?: number; invoiceNumber?: string; invoicePdfUrl?: string }) | undefined>;
  getDamageReportsByEquipment(equipmentId: number): Promise<(DamageReport & { reporterName: string; photos: DamageReportPhoto[] })[]>;
  createDamageReport(report: InsertDamageReport): Promise<DamageReport>;
  updateDamageReport(id: number, data: Partial<DamageReport>): Promise<DamageReport | undefined>;
  createDamageReportPhoto(photo: InsertDamageReportPhoto): Promise<DamageReportPhoto>;

  getAllFeedback(): Promise<(Feedback & { userName: string; userRole: string; attachments: FeedbackAttachment[] })[]>;
  createFeedback(fb: InsertFeedback): Promise<Feedback>;
  updateFeedback(id: number, data: Partial<Feedback>): Promise<Feedback | undefined>;
  getOpenFeedbackCount(): Promise<number>;
  createFeedbackAttachments(feedbackId: number, urls: string[]): Promise<FeedbackAttachment[]>;
  getFeedbackAttachments(feedbackId: number): Promise<FeedbackAttachment[]>;

  getFeedbackComments(feedbackId: number): Promise<(FeedbackComment & { userName: string })[]>;
  createFeedbackComment(comment: InsertFeedbackComment): Promise<FeedbackComment>;

  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(n: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number, userId: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  getAdminUserIds(): Promise<number[]>;

  getAllAccessoryCategories(): Promise<AccessoryCategory[]>;
  createAccessoryCategory(cat: InsertAccessoryCategory): Promise<AccessoryCategory>;
  deleteAccessoryCategory(id: number): Promise<void>;

  getAccessoryInventory(stationId?: number): Promise<AccessoryInventory[]>;
  updateAccessoryInventory(categoryId: number, stationId: number, size: string, quantity: number): Promise<AccessoryInventory>;

  getAllAccessoryTransfers(): Promise<(AccessoryTransfer & { categoryName: string; fromStationName: string; toStationName: string; transferredByName: string | null })[]>;
  createAccessoryTransfer(transfer: InsertAccessoryTransfer): Promise<AccessoryTransfer>;

  getAccessoryLossReports(status?: string): Promise<any[]>;
  createAccessoryLossReport(report: InsertAccessoryLossReport): Promise<AccessoryLossReport>;
  resolveAccessoryLossReport(id: number, resolvedBy: number, adminNote: string | null, approved: boolean): Promise<AccessoryLossReport>;

  createAccessoryCheck(check: InsertAccessoryCheck): Promise<AccessoryCheck>;
  getAccessoryCheckById(id: number): Promise<AccessoryCheck | undefined>;
  getAccessoryChecks(stationId: number, limit?: number): Promise<(AccessoryCheck & { checkedByName: string })[]>;
  createAccessoryCheckItems(items: InsertAccessoryCheckItem[]): Promise<AccessoryCheckItem[]>;
  getAccessoryCheckItems(checkId: number): Promise<(AccessoryCheckItem & { categoryName: string })[]>;

  // School module
  getAllSchoolConfigs(): Promise<(SchoolConfig & { stationName: string })[]>;
  getSchoolConfig(id: number): Promise<SchoolConfig | undefined>;
  getSchoolConfigByStation(stationId: number): Promise<SchoolConfig | undefined>;
  createSchoolConfig(config: InsertSchoolConfig): Promise<SchoolConfig>;
  updateSchoolConfig(id: number, data: Partial<InsertSchoolConfig>): Promise<SchoolConfig | undefined>;
  getSchoolProducts(schoolConfigId: number): Promise<SchoolProduct[]>;
  createSchoolProduct(product: InsertSchoolProduct): Promise<SchoolProduct>;
  updateSchoolProduct(id: number, data: Partial<InsertSchoolProduct>): Promise<SchoolProduct | undefined>;
  bulkImportSchoolProducts(schoolConfigId: number, products: Omit<InsertSchoolProduct, "schoolConfigId">[], replaceExisting: boolean): Promise<number>;

  getSchoolBookings(schoolConfigId: number): Promise<(SchoolBooking & { items: SchoolBookingItem[]; createdByName: string | null })[]>;
  getSchoolBooking(id: number): Promise<(SchoolBooking & { items: SchoolBookingItem[]; createdByName: string | null }) | undefined>;
  createSchoolBooking(booking: InsertSchoolBooking, items: Omit<InsertSchoolBookingItem, "bookingId">[]): Promise<SchoolBooking>;
  updateSchoolBookingPayment(id: number, paymentStatus: string): Promise<SchoolBooking | undefined>;
  getNextBookingNumber(schoolConfigId: number, stationShortCode: string): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  async getStation(id: number): Promise<Station | undefined> {
    const [station] = await db.select().from(stations).where(eq(stations.id, id));
    return station;
  }

  async getAllStations(): Promise<Station[]> {
    return db.select().from(stations).orderBy(stations.sortOrder, stations.id);
  }

  async createStation(station: InsertStation): Promise<Station> {
    const [created] = await db.insert(stations).values(station).returning();
    return created;
  }

  async updateStation(id: number, data: Partial<InsertStation>): Promise<Station | undefined> {
    const [updated] = await db.update(stations).set(data).where(eq(stations.id, id)).returning();
    return updated;
  }

  async deleteStation(id: number): Promise<void> {
    await db.delete(stations).where(eq(stations.id, id));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Nullify all (now nullable) FK references
      await tx.execute(sql`UPDATE activity_log SET user_id = NULL WHERE user_id = ${id}`);
      await tx.execute(sql`UPDATE transfers SET initiated_by = NULL WHERE initiated_by = ${id}`);
      await tx.execute(sql`UPDATE transfers SET confirmed_by = NULL WHERE confirmed_by = ${id}`);
      await tx.execute(sql`UPDATE photos SET uploaded_by = NULL WHERE uploaded_by = ${id}`);
      await tx.execute(sql`UPDATE inventory_check_items SET checked_by = NULL WHERE checked_by = ${id}`);
      await tx.execute(sql`UPDATE invoices SET imported_by = NULL WHERE imported_by = ${id}`);
      await tx.execute(sql`UPDATE repairs SET logged_by = NULL WHERE logged_by = ${id}`);
      await tx.execute(sql`UPDATE sales_invoices SET created_by = NULL WHERE created_by = ${id}`);
      await tx.execute(sql`UPDATE price_lists SET uploaded_by = NULL WHERE uploaded_by = ${id}`);
      await tx.execute(sql`UPDATE condition_ratings SET rated_by = NULL WHERE rated_by = ${id}`);
      // For remaining NOT NULL FKs: delete dependent records or reassign to admin
      await tx.execute(sql`DELETE FROM damage_report_photos WHERE uploaded_by = ${id}`);
      await tx.execute(sql`DELETE FROM inventory_check_items WHERE check_id IN (SELECT id FROM inventory_checks WHERE started_by = ${id})`);
      await tx.execute(sql`DELETE FROM inventory_checks WHERE started_by = ${id}`);
      // Reassign damage reports to user 1 (admin) — avoids losing damage history
      await tx.execute(sql`UPDATE damage_reports SET reported_by = 1 WHERE reported_by = ${id} AND ${id} != 1`);
      // Finally delete the user
      await tx.execute(sql`DELETE FROM users WHERE id = ${id}`);
    });
  }

  async createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    // Invalidate old tokens for this user first
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
  }

  async getValidPasswordResetToken(token: string): Promise<{ id: number; userId: number } | undefined> {
    const [row] = await db
      .select({ id: passwordResetTokens.id, userId: passwordResetTokens.userId })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt),
          sql`${passwordResetTokens.expiresAt} > NOW()`
        )
      );
    return row;
  }

  async markPasswordResetTokenUsed(id: number): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async getEquipment(id: number): Promise<Equipment | undefined> {
    const [item] = await db.select().from(equipment).where(eq(equipment.id, id));
    return item;
  }

  async getEquipmentBySerial(serial: string): Promise<Equipment | undefined> {
    const [item] = await db.select().from(equipment).where(eq(equipment.serialNumber, serial));
    return item;
  }

  async getEquipmentByCode(code: string): Promise<Equipment | undefined> {
    const [item] = await db.select().from(equipment).where(
      or(
        eq(equipment.serialNumber, code),
        eq(equipment.sku, code)
      )
    );
    return item;
  }

  async getAllEquipment(filters?: {
    stationId?: number;
    includeTransfersForStation?: boolean;
    unassigned?: boolean;
    type?: string;
    status?: string;
    conditionRating?: number;
    search?: string;
  }): Promise<Equipment[]> {
    const conditions: any[] = [];
    if (filters?.unassigned) {
      conditions.push(isNull(equipment.currentStationId));
    } else if (filters?.stationId) {
      if (filters?.includeTransfersForStation) {
        const sid = filters.stationId;
        const pendingTransferEqIds = db
          .select({ equipmentId: transfers.equipmentId })
          .from(transfers)
          .where(
            and(
              eq(transfers.status, "pending"),
              or(
                eq(transfers.fromStationId, sid),
                eq(transfers.toStationId, sid)
              )
            )
          );
        conditions.push(
          or(
            eq(equipment.currentStationId, sid),
            inArray(equipment.id, pendingTransferEqIds)
          )
        );
      } else {
        conditions.push(eq(equipment.currentStationId, filters.stationId));
      }
    }
    if (filters?.type) {
      conditions.push(eq(equipment.type, filters.type as any));
    }
    if (filters?.status) {
      conditions.push(eq(equipment.status, filters.status as any));
    }
    if (filters?.conditionRating) {
      conditions.push(eq(equipment.conditionRating, filters.conditionRating));
    }
    if (filters?.search) {
      const s = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(equipment.serialNumber, s),
          ilike(equipment.sku, s),
          ilike(equipment.brand, s),
          ilike(equipment.model, s)
        )
      );
    }
    if (conditions.length === 0) {
      return db.select().from(equipment).orderBy(desc(equipment.createdAt));
    }
    return db.select().from(equipment).where(and(...conditions)).orderBy(desc(equipment.createdAt));
  }

  async createEquipment(eq_data: InsertEquipment): Promise<Equipment> {
    const [created] = await db.insert(equipment).values(eq_data).returning();
    return created;
  }

  async updateEquipment(id: number, data: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const [updated] = await db.update(equipment).set(data).where(eq(equipment.id, id)).returning();
    return updated;
  }

  async deleteEquipment(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.execute(sql`UPDATE sales_invoices SET damage_report_id = NULL WHERE damage_report_id IN (SELECT id FROM damage_reports WHERE equipment_id = ${id})`);
      await tx.execute(sql`DELETE FROM damage_report_photos WHERE damage_report_id IN (SELECT id FROM damage_reports WHERE equipment_id = ${id})`);
      await tx.execute(sql`DELETE FROM damage_reports WHERE equipment_id = ${id}`);
      await tx.execute(sql`DELETE FROM sale_items WHERE equipment_id = ${id}`);
      await tx.execute(sql`DELETE FROM inventory_check_items WHERE equipment_id = ${id}`);
      await tx.delete(photos).where(eq(photos.equipmentId, id));
      await tx.delete(conditionRatings).where(eq(conditionRatings.equipmentId, id));
      await tx.delete(repairs).where(eq(repairs.equipmentId, id));
      await tx.delete(transfers).where(eq(transfers.equipmentId, id));
      await tx.delete(activityLog).where(eq(activityLog.equipmentId, id));
      await tx.delete(equipment).where(eq(equipment.id, id));
    });
  }

  async bulkDeleteEquipment(ids: number[]): Promise<{ deleted: number; errors: string[] }> {
    let deleted = 0;
    const errors: string[] = [];
    for (const id of ids) {
      try {
        await db.transaction(async (tx) => {
          await tx.execute(sql`UPDATE sales_invoices SET damage_report_id = NULL WHERE damage_report_id IN (SELECT id FROM damage_reports WHERE equipment_id = ${id})`);
          await tx.execute(sql`DELETE FROM damage_report_photos WHERE damage_report_id IN (SELECT id FROM damage_reports WHERE equipment_id = ${id})`);
          await tx.execute(sql`DELETE FROM damage_reports WHERE equipment_id = ${id}`);
          await tx.execute(sql`DELETE FROM sale_items WHERE equipment_id = ${id}`);
          await tx.execute(sql`DELETE FROM inventory_check_items WHERE equipment_id = ${id}`);
          await tx.delete(photos).where(eq(photos.equipmentId, id));
          await tx.delete(conditionRatings).where(eq(conditionRatings.equipmentId, id));
          await tx.delete(repairs).where(eq(repairs.equipmentId, id));
          await tx.delete(transfers).where(eq(transfers.equipmentId, id));
          await tx.delete(activityLog).where(eq(activityLog.equipmentId, id));
          await tx.delete(equipment).where(eq(equipment.id, id));
        });
        deleted++;
      } catch (err: any) {
        errors.push(`#${id}: ${err.message}`);
      }
    }
    return { deleted, errors };
  }

  async getConditionRatings(equipmentId: number): Promise<ConditionRating[]> {
    return db.select().from(conditionRatings)
      .where(eq(conditionRatings.equipmentId, equipmentId))
      .orderBy(desc(conditionRatings.ratedAt));
  }

  async createConditionRating(rating: InsertConditionRating): Promise<ConditionRating> {
    const [created] = await db.insert(conditionRatings).values(rating).returning();
    await db.update(equipment)
      .set({ conditionRating: rating.rating, lastInspectionDate: new Date() })
      .where(eq(equipment.id, rating.equipmentId));
    return created;
  }

  async getRepairs(equipmentId: number): Promise<Repair[]> {
    return db.select().from(repairs)
      .where(eq(repairs.equipmentId, equipmentId))
      .orderBy(desc(repairs.date));
  }

  async getAllRepairs(): Promise<Repair[]> {
    return db.select().from(repairs).orderBy(desc(repairs.date));
  }

  async getActiveRepairsWithDetails(stationId?: number): Promise<ActiveRepairItem[]> {
    const equipInRepair = await db
      .select({ id: equipment.id })
      .from(equipment)
      .where(eq(equipment.status, "in_repair"));

    if (!equipInRepair.length) return [];

    const equipIds = equipInRepair.map(e => e.id);

    const [allEquip, allRepairs, allUsers, allStations, allDamageReports] = await Promise.all([
      db.select().from(equipment).where(inArray(equipment.id, equipIds)),
      db.select().from(repairs).where(and(inArray(repairs.equipmentId, equipIds), eq(repairs.status, "pending"))).orderBy(desc(repairs.date)),
      db.select({ id: users.id, name: users.name }).from(users),
      db.select({ id: stations.id, name: stations.name }).from(stations),
      db.select().from(damageReports).where(inArray(damageReports.equipmentId, equipIds)),
    ]);

    const equipMap = Object.fromEntries(allEquip.map(e => [e.id, e]));
    const userMap = Object.fromEntries(allUsers.map(u => [u.id, u.name]));
    const stationMap = Object.fromEntries(allStations.map(s => [s.id, s.name]));
    const damageMap: Record<number, typeof allDamageReports[0]> = {};
    for (const dr of allDamageReports) {
      if (!damageMap[dr.equipmentId] || dr.reportedAt > damageMap[dr.equipmentId].reportedAt) {
        damageMap[dr.equipmentId] = dr;
      }
    }

    const repairMap: Record<number, typeof allRepairs[0]> = {};
    for (const r of allRepairs) {
      if (!repairMap[r.equipmentId]) repairMap[r.equipmentId] = r;
    }

    const results: ActiveRepairItem[] = [];
    for (const eqId of equipIds) {
      const eq_ = equipMap[eqId];
      if (!eq_) continue;
      if (stationId && eq_.currentStationId !== stationId) continue;
      const repair = repairMap[eqId];
      if (!repair) continue;
      const dr = damageMap[eqId];
      results.push({
        repairId: repair.id,
        repairDescription: repair.description,
        repairStatus: repair.status,
        repairDate: repair.date,
        repairCost: repair.cost,
        loggedByName: userMap[repair.loggedBy] ?? "Unknown",
        equipmentId: eqId,
        equipmentSerial: eq_.serialNumber,
        equipmentBrand: eq_.brand,
        equipmentModel: eq_.model,
        equipmentType: eq_.type,
        stationId: eq_.currentStationId,
        stationName: eq_.currentStationId ? stationMap[eq_.currentStationId] ?? null : null,
        damageReportId: dr?.id ?? null,
        damageReportStatus: dr?.status ?? null,
        damageReportedAt: dr?.reportedAt ?? null,
        estimatedRepairCost: dr?.estimatedRepairCost ?? null,
        estimatedValueLoss: dr?.estimatedValueLoss ?? null,
        sparePartsNeeded: dr?.sparePartsNeeded ?? null,
        needsSpareParts: dr?.needsSpareParts ?? false,
        customerName: dr?.customerName ?? null,
        bookingReference: dr?.bookingReference ?? null,
        usageType: dr?.usageType ?? null,
        repairable: dr?.repairable ?? true,
        totalLoss: dr?.totalLoss ?? false,
      });
    }
    results.sort((a, b) => {
      const aTime = (a.damageReportedAt ?? a.repairDate)?.getTime() ?? 0;
      const bTime = (b.damageReportedAt ?? b.repairDate)?.getTime() ?? 0;
      return bTime - aTime;
    });
    return results;
  }

  async createRepair(repair: InsertRepair): Promise<Repair> {
    const [created] = await db.insert(repairs).values(repair).returning();
    return created;
  }

  async updateRepair(id: number, data: Partial<InsertRepair>): Promise<Repair | undefined> {
    const [updated] = await db.update(repairs).set(data).where(eq(repairs.id, id)).returning();
    return updated;
  }

  async getTransfers(filters?: { stationId?: number; status?: string }): Promise<Transfer[]> {
    const conditions: any[] = [];
    if (filters?.stationId) {
      conditions.push(
        or(
          eq(transfers.fromStationId, filters.stationId),
          eq(transfers.toStationId, filters.stationId)
        )
      );
    }
    if (filters?.status) {
      conditions.push(eq(transfers.status, filters.status as any));
    }
    if (conditions.length === 0) {
      return db.select().from(transfers).orderBy(desc(transfers.initiatedAt));
    }
    return db.select().from(transfers).where(and(...conditions)).orderBy(desc(transfers.initiatedAt));
  }

  async getTransfersByEquipment(equipmentId: number): Promise<Transfer[]> {
    return db.select().from(transfers)
      .where(eq(transfers.equipmentId, equipmentId))
      .orderBy(desc(transfers.initiatedAt));
  }

  async createTransfer(transfer: InsertTransfer): Promise<Transfer> {
    const [created] = await db.insert(transfers).values(transfer).returning();
    await db.update(equipment)
      .set({ status: "in_transfer" })
      .where(eq(equipment.id, transfer.equipmentId));
    return created;
  }

  async confirmTransfer(id: number, confirmedBy: number, opts: { arrived: boolean; condition?: number }): Promise<Transfer | undefined> {
    const [transfer] = await db.select().from(transfers).where(eq(transfers.id, id));
    if (!transfer) return undefined;

    const [updated] = await db.update(transfers)
      .set({
        status: "confirmed",
        confirmedBy,
        confirmedAt: new Date(),
        arrivedCondition: opts.arrived ? (opts.condition ?? null) : null,
        missing: !opts.arrived,
      })
      .where(eq(transfers.id, id))
      .returning();

    if (opts.arrived) {
      await db.update(equipment)
        .set({
          currentStationId: transfer.toStationId,
          status: "active",
          ...(opts.condition ? { conditionRating: opts.condition } : {}),
        })
        .where(eq(equipment.id, transfer.equipmentId));
    } else {
      await db.update(equipment)
        .set({ status: "missing" })
        .where(eq(equipment.id, transfer.equipmentId));
    }

    return updated;
  }

  async cancelTransfer(id: number): Promise<Transfer | undefined> {
    const [transfer] = await db.select().from(transfers).where(eq(transfers.id, id));
    if (!transfer) return undefined;

    const [updated] = await db.update(transfers)
      .set({ status: "cancelled" })
      .where(eq(transfers.id, id))
      .returning();

    await db.update(equipment)
      .set({ status: "active", currentStationId: transfer.fromStationId })
      .where(eq(equipment.id, transfer.equipmentId));

    return updated;
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    return photo;
  }

  async getPhotos(equipmentId: number): Promise<Photo[]> {
    return db.select().from(photos)
      .where(eq(photos.equipmentId, equipmentId))
      .orderBy(desc(photos.uploadedAt));
  }

  async getFirstPhotos(equipmentIds: number[]): Promise<Record<number, string>> {
    if (equipmentIds.length === 0) return {};
    const rows = await db.select().from(photos)
      .where(inArray(photos.equipmentId, equipmentIds))
      .orderBy(desc(photos.uploadedAt));
    const result: Record<number, string> = {};
    for (const row of rows) {
      if (!result[row.equipmentId]) {
        result[row.equipmentId] = row.url;
      }
    }
    return result;
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [created] = await db.insert(photos).values(photo).returning();
    return created;
  }

  async deletePhoto(id: number): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  }

  async getActivityLog(opts: { limit?: number; userId?: number; action?: string; stationId?: number; equipmentId?: number; dateFrom?: Date; dateTo?: Date } = {}): Promise<(ActivityLog & { userName: string; equipmentLabel?: string })[]> {
    const { limit = 100, userId, action, stationId, equipmentId, dateFrom, dateTo } = opts;

    const conditions: ReturnType<typeof eq>[] = [];
    if (userId) conditions.push(eq(activityLog.userId, userId));
    if (action) conditions.push(eq(activityLog.action, action));
    if (equipmentId) conditions.push(eq(activityLog.equipmentId, equipmentId));
    if (dateFrom) conditions.push(sql`${activityLog.timestamp} >= ${dateFrom}` as any);
    if (dateTo) conditions.push(sql`${activityLog.timestamp} <= ${dateTo}` as any);

    const baseQuery = db
      .select({
        id: activityLog.id,
        userId: activityLog.userId,
        action: activityLog.action,
        equipmentId: activityLog.equipmentId,
        details: activityLog.details,
        timestamp: activityLog.timestamp,
        userName: users.name,
        equipmentBrand: equipment.brand,
        equipmentModel: equipment.model,
        equipmentStation: equipment.currentStationId,
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .leftJoin(equipment, eq(activityLog.equipmentId, equipment.id));

    const withWhere = conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    const rows = await withWhere.orderBy(desc(activityLog.timestamp)).limit(limit);

    let filtered = rows;
    if (stationId) {
      filtered = rows.filter(r => r.equipmentStation === stationId);
    }

    return filtered.map(r => ({
      id: r.id,
      userId: r.userId,
      action: r.action,
      equipmentId: r.equipmentId,
      details: r.details,
      timestamp: r.timestamp,
      userName: r.userName || "Unknown",
      equipmentLabel: r.equipmentBrand && r.equipmentModel ? `${r.equipmentBrand} ${r.equipmentModel}` : undefined,
    }));
  }

  async getEquipmentActivityLog(equipmentId: number): Promise<(ActivityLog & { userName: string })[]> {
    const rows = await db
      .select({
        id: activityLog.id,
        userId: activityLog.userId,
        action: activityLog.action,
        equipmentId: activityLog.equipmentId,
        details: activityLog.details,
        timestamp: activityLog.timestamp,
        userName: users.name,
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .where(eq(activityLog.equipmentId, equipmentId))
      .orderBy(desc(activityLog.timestamp))
      .limit(200);
    return rows.map(r => ({ ...r, userName: r.userName || "Unknown" }));
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db.insert(activityLog).values(log).returning();
    return created;
  }

  async createInventoryCheck(check: InsertInventoryCheck): Promise<InventoryCheck> {
    const [created] = await db.insert(inventoryChecks).values(check).returning();
    return created;
  }

  async getInventoryChecks(stationId: number): Promise<InventoryCheck[]> {
    return db.select().from(inventoryChecks)
      .where(eq(inventoryChecks.stationId, stationId))
      .orderBy(desc(inventoryChecks.startedAt));
  }

  async getInventoryCheck(id: number): Promise<InventoryCheck | undefined> {
    const [check] = await db.select().from(inventoryChecks).where(eq(inventoryChecks.id, id));
    return check;
  }

  async completeInventoryCheck(id: number): Promise<InventoryCheck | undefined> {
    const [updated] = await db.update(inventoryChecks)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(inventoryChecks.id, id))
      .returning();
    return updated;
  }

  async getInventoryCheckItems(checkId: number): Promise<InventoryCheckItem[]> {
    return db.select().from(inventoryCheckItems)
      .where(eq(inventoryCheckItems.checkId, checkId));
  }

  async upsertInventoryCheckItem(data: Partial<InsertInventoryCheckItem> & { checkId: number; equipmentId: number }): Promise<InventoryCheckItem> {
    const existing = await db.select().from(inventoryCheckItems)
      .where(and(eq(inventoryCheckItems.checkId, data.checkId), eq(inventoryCheckItems.equipmentId, data.equipmentId)));
    if (existing.length > 0) {
      const [updated] = await db.update(inventoryCheckItems)
        .set(data)
        .where(and(eq(inventoryCheckItems.checkId, data.checkId), eq(inventoryCheckItems.equipmentId, data.equipmentId)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(inventoryCheckItems).values(data as InsertInventoryCheckItem).returning();
      return created;
    }
  }

  async getDashboardStats(stationId?: number) {
    if (stationId) {
      // Station-scoped view: only own station + in-transfer to/from it
      const pendingTransfersForStation = await db
        .select()
        .from(transfers)
        .where(
          and(
            eq(transfers.status, "pending"),
            or(
              eq(transfers.fromStationId, stationId),
              eq(transfers.toStationId, stationId)
            )
          )
        );

      const inTransferEqIds = pendingTransfersForStation.map((t) => t.equipmentId);

      const ownEq = await db.select().from(equipment).where(eq(equipment.currentStationId, stationId));
      const inTransferEq = inTransferEqIds.length > 0
        ? await db.select().from(equipment).where(
            and(
              inArray(equipment.id, inTransferEqIds),
              eq(equipment.status, "in_transfer")
            )
          )
        : [];

      const stationRecord = await db.select().from(stations).where(eq(stations.id, stationId));
      const stationName = stationRecord[0]?.name ?? `Station ${stationId}`;

      const activeOwn = ownEq.filter((e) => e.status !== "in_transfer");

      const equipmentPerStation = [{
        stationId,
        stationName,
        count: activeOwn.length,
        kites: activeOwn.filter((e) => e.type === "kite").length,
        wings: activeOwn.filter((e) => e.type === "wing").length,
        boards: activeOwn.filter((e) => e.type === "board" || e.type === "foilboard").length,
        totalValue: activeOwn.reduce((sum, e) => sum + (parseFloat(e.currentValue ?? "0") || 0), 0),
      }];

      const byType = inTransferEq.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEquipment: activeOwn.length + inTransferEq.length,
        equipmentPerStation,
        needsAttention: [...ownEq, ...inTransferEq].filter((e) => e.conditionRating <= 2).length,
        inTransfer: inTransferEq.length,
        inTransferBreakdown: {
          kites: inTransferEq.filter((e) => e.type === "kite").length,
          wings: inTransferEq.filter((e) => e.type === "wing").length,
          boards: inTransferEq.filter((e) => e.type === "board" || e.type === "foilboard").length,
          totalValue: inTransferEq.reduce((sum, e) => sum + (parseFloat(e.currentValue ?? "0") || 0), 0),
          byType,
        },
      };
    }

    // Admin / full view
    const allEquipment = await db.select().from(equipment);
    const allStations = await db.select().from(stations);

    const equipmentPerStation = allStations.map((s) => {
      const stEq = allEquipment.filter((e) => e.currentStationId === s.id && e.status !== "in_transfer");
      return {
        stationId: s.id,
        stationName: s.name,
        count: stEq.length,
        kites: stEq.filter((e) => e.type === "kite").length,
        wings: stEq.filter((e) => e.type === "wing").length,
        boards: stEq.filter((e) => e.type === "board" || e.type === "foilboard").length,
        totalValue: stEq.reduce((sum, e) => sum + (parseFloat(e.currentValue ?? "0") || 0), 0),
      };
    });

    const unassignedEq = allEquipment.filter((e) => e.currentStationId === null && e.status !== "in_transfer");
    if (unassignedEq.length > 0) {
      equipmentPerStation.push({
        stationId: 0,
        stationName: "Unassigned",
        count: unassignedEq.length,
        kites: unassignedEq.filter((e) => e.type === "kite").length,
        wings: unassignedEq.filter((e) => e.type === "wing").length,
        boards: unassignedEq.filter((e) => e.type === "board" || e.type === "foilboard").length,
        totalValue: unassignedEq.reduce((sum, e) => sum + (parseFloat(e.currentValue ?? "0") || 0), 0),
      });
    }

    const inTransferEq = allEquipment.filter((e) => e.status === "in_transfer");
    const byType = inTransferEq.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEquipment: allEquipment.length,
      equipmentPerStation,
      needsAttention: allEquipment.filter((e) => e.conditionRating <= 2).length,
      inTransfer: inTransferEq.length,
      inTransferBreakdown: {
        kites: inTransferEq.filter((e) => e.type === "kite").length,
        wings: inTransferEq.filter((e) => e.type === "wing").length,
        boards: inTransferEq.filter((e) => e.type === "board" || e.type === "foilboard").length,
        totalValue: inTransferEq.reduce((sum, e) => sum + (parseFloat(e.currentValue ?? "0") || 0), 0),
        byType,
      },
    };
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).orderBy(suppliers.name);
  }

  async createSupplier(s: InsertSupplier): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values(s).returning();
    return created;
  }

  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
    return updated;
  }

  async getAllInvoices(): Promise<(Invoice & { supplierName: string; importedByName: string | null })[]> {
    const rows = await db
      .select({ invoice: invoices, supplierName: suppliers.name, importedByName: users.name })
      .from(invoices)
      .innerJoin(suppliers, eq(invoices.supplierId, suppliers.id))
      .leftJoin(users, eq(invoices.importedBy, users.id))
      .orderBy(desc(invoices.importedAt));
    return rows.map((r) => ({ ...r.invoice, supplierName: r.supplierName, importedByName: r.importedByName }));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
    return inv;
  }

  async createInvoice(inv: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(inv).returning();
    return created;
  }

  async getEquipmentByInvoice(invoiceId: number): Promise<Equipment[]> {
    return db.select().from(equipment).where(eq(equipment.invoiceId, invoiceId));
  }

  async deleteInvoice(id: number): Promise<void> {
    await db.update(equipment).set({ invoiceId: null, invoiceReference: null }).where(eq(equipment.invoiceId, id));
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async getCompanySettings(): Promise<CompanySettings> {
    const [row] = await db.select().from(companySettings).where(eq(companySettings.id, 1));
    if (row) return row;
    const [created] = await db.insert(companySettings).values({ id: 1 } as any).returning();
    return created;
  }

  async updateCompanySettings(data: Partial<InsertCompanySettings>): Promise<CompanySettings> {
    const [updated] = await db.update(companySettings).set(data).where(eq(companySettings.id, 1)).returning();
    return updated;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(customers.name);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.id, id));
    return c;
  }

  async createCustomer(c: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(c).returning();
    return created;
  }

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return updated;
  }

  async getAllSalesInvoices(): Promise<(SalesInvoice & { customerName: string; itemCount: number })[]> {
    const rows = await db
      .select({ inv: salesInvoices, customerName: customers.name })
      .from(salesInvoices)
      .innerJoin(customers, eq(salesInvoices.customerId, customers.id))
      .orderBy(desc(salesInvoices.createdAt));
    const allItems = await db.select().from(saleItems);
    return rows.map((r) => ({
      ...r.inv,
      customerName: r.customerName,
      itemCount: allItems.filter((i) => i.saleId === r.inv.id).length,
    }));
  }

  async getSalesInvoice(id: number): Promise<(SalesInvoice & { customer: Customer; items: SaleItem[] }) | undefined> {
    const [row] = await db
      .select({ inv: salesInvoices, customer: customers })
      .from(salesInvoices)
      .innerJoin(customers, eq(salesInvoices.customerId, customers.id))
      .where(eq(salesInvoices.id, id));
    if (!row) return undefined;
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id)).orderBy(saleItems.position);
    return { ...row.inv, customer: row.customer, items };
  }

  async createSalesInvoice(inv: InsertSalesInvoice, itemsData: Omit<InsertSaleItem, "saleId">[]): Promise<SalesInvoice> {
    const [created] = await db.insert(salesInvoices).values(inv).returning();
    if (itemsData.length > 0) {
      await db.insert(saleItems).values(itemsData.map((i) => ({ ...i, saleId: created.id })));
    }
    return created;
  }

  async updateSalesInvoice(id: number, data: Partial<SalesInvoice>): Promise<SalesInvoice | undefined> {
    const [updated] = await db.update(salesInvoices).set(data).where(eq(salesInvoices.id, id)).returning();
    return updated;
  }

  async confirmSale(id: number): Promise<SalesInvoice | undefined> {
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
    for (const item of items) {
      await db.update(equipment)
        .set({ status: "sold", salePrice: item.unitPrice })
        .where(eq(equipment.id, item.equipmentId));
    }
    const [updated] = await db.update(salesInvoices)
      .set({ status: "confirmed" })
      .where(eq(salesInvoices.id, id))
      .returning();
    return updated;
  }

  async getNextInvoiceNumber(): Promise<string> {
    const settings = await this.getCompanySettings();
    const currentYear = new Date().getFullYear();
    let nextNum = settings.invoiceNextNumber;
    let year = settings.invoiceYear;
    if (year !== currentYear) {
      year = currentYear;
      nextNum = 1001;
    }
    const numStr = String(nextNum).padStart(4, "0");
    const invoiceNumber = `${settings.invoicePrefix}-${year}-${numStr}`;
    await db.update(companySettings)
      .set({ invoiceNextNumber: nextNum + 1, invoiceYear: year })
      .where(eq(companySettings.id, 1));
    return invoiceNumber;
  }

  async getAllPriceLists(): Promise<PriceList[]> {
    return db.select().from(priceLists).orderBy(desc(priceLists.uploadedAt));
  }

  async getPriceList(id: number): Promise<PriceList | undefined> {
    const [row] = await db.select().from(priceLists).where(eq(priceLists.id, id));
    return row;
  }

  async createPriceList(pl: InsertPriceList, items: Omit<InsertPriceListItem, "priceListId">[]): Promise<PriceList> {
    await this.deactivatePriceLists(pl.supplier);
    const [created] = await db.insert(priceLists)
      .values({ ...pl, itemCount: items.length, isActive: true })
      .returning();
    if (items.length > 0) {
      await db.insert(priceListItems).values(items.map((i) => ({ ...i, priceListId: created.id })));
    }
    return created;
  }

  async updatePriceList(id: number, data: { validFrom: Date | null; validTo: Date | null; name?: string | null }): Promise<PriceList | undefined> {
    const setData: Record<string, any> = { validFrom: data.validFrom, validTo: data.validTo };
    if (data.name !== undefined) setData.name = data.name;
    const [updated] = await db.update(priceLists)
      .set(setData)
      .where(eq(priceLists.id, id))
      .returning();
    return updated;
  }

  async deactivatePriceLists(supplier: string): Promise<void> {
    await db.update(priceLists)
      .set({ isActive: false })
      .where(and(eq(priceLists.supplier, supplier), eq(priceLists.isActive, true)));
  }

  async deletePriceList(id: number): Promise<void> {
    await db.delete(priceLists).where(eq(priceLists.id, id));
  }

  async getPriceListItems(priceListId: number): Promise<PriceListItem[]> {
    return db.select().from(priceListItems).where(eq(priceListItems.priceListId, priceListId));
  }

  async lookupRetailPrice(sku: string): Promise<{ retailPrice: string; dealerPrice: string | null; supplier: string; productName: string; priceListId: number; validFrom: Date | null; validTo: Date | null } | null> {
    if (!sku) return null;
    const rows = await db
      .select({
        retailPrice: priceListItems.retailPrice,
        dealerPrice: priceListItems.dealerPrice,
        supplier: priceLists.supplier,
        productName: priceListItems.productName,
        priceListId: priceLists.id,
        validFrom: priceLists.validFrom,
        validTo: priceLists.validTo,
      })
      .from(priceListItems)
      .innerJoin(priceLists, and(
        eq(priceListItems.priceListId, priceLists.id),
        eq(priceLists.isActive, true),
      ))
      .where(ilike(priceListItems.sku, sku))
      .limit(1);
    if (!rows.length) return null;
    return {
      retailPrice: rows[0].retailPrice ?? "0",
      dealerPrice: rows[0].dealerPrice ?? null,
      supplier: rows[0].supplier,
      productName: rows[0].productName,
      priceListId: rows[0].priceListId,
      validFrom: rows[0].validFrom,
      validTo: rows[0].validTo,
    };
  }

  async lookupRetailPriceByName(name: string): Promise<{ retailPrice: string; dealerPrice: string | null; supplier: string; productName: string; priceListId: number; validFrom: Date | null; validTo: Date | null } | null> {
    if (!name || name.length < 3) return null;
    const rows = await db
      .select({
        retailPrice: priceListItems.retailPrice,
        dealerPrice: priceListItems.dealerPrice,
        supplier: priceLists.supplier,
        productName: priceListItems.productName,
        priceListId: priceLists.id,
        validFrom: priceLists.validFrom,
        validTo: priceLists.validTo,
      })
      .from(priceListItems)
      .innerJoin(priceLists, and(
        eq(priceListItems.priceListId, priceLists.id),
        eq(priceLists.isActive, true),
      ))
      .where(ilike(priceListItems.productName, `%${name}%`))
      .limit(1);
    if (!rows.length) return null;
    return {
      retailPrice: rows[0].retailPrice ?? "0",
      dealerPrice: rows[0].dealerPrice ?? null,
      supplier: rows[0].supplier,
      productName: rows[0].productName,
      priceListId: rows[0].priceListId,
      validFrom: rows[0].validFrom,
      validTo: rows[0].validTo,
    };
  }

  private async enrichDamageReports(reports: DamageReport[]): Promise<(DamageReport & { equipmentLabel: string; reporterName: string; stationName?: string; photos: DamageReportPhoto[]; invoiceId?: number; invoiceNumber?: string; invoicePdfUrl?: string })[]> {
    if (!reports.length) return [];
    const equipIds = [...new Set(reports.map(r => r.equipmentId))];
    const userIds = [...new Set(reports.map(r => r.reportedBy))];
    const stationIds = [...new Set(reports.map(r => r.stationId).filter(Boolean))] as number[];
    const reportIds = reports.map(r => r.id);

    const [equips, reportUsers, reportStations, allPhotos, linkedInvoices] = await Promise.all([
      db.select({ id: equipment.id, brand: equipment.brand, model: equipment.model }).from(equipment).where(inArray(equipment.id, equipIds)),
      db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds)),
      stationIds.length ? db.select({ id: stations.id, name: stations.name }).from(stations).where(inArray(stations.id, stationIds)) : Promise.resolve([]),
      db.select().from(damageReportPhotos).where(inArray(damageReportPhotos.damageReportId, reportIds)).orderBy(damageReportPhotos.uploadedAt),
      db.select({ id: salesInvoices.id, invoiceNumber: salesInvoices.invoiceNumber, damageReportId: salesInvoices.damageReportId, pdfUrl: salesInvoices.pdfUrl })
        .from(salesInvoices)
        .where(inArray(salesInvoices.damageReportId, reportIds)),
    ]);

    const equipMap = Object.fromEntries(equips.map(e => [e.id, `${e.brand} ${e.model}`]));
    const userMap = Object.fromEntries(reportUsers.map(u => [u.id, u.name]));
    const stationMap = Object.fromEntries(reportStations.map(s => [s.id, s.name]));
    const photoMap: Record<number, DamageReportPhoto[]> = {};
    for (const p of allPhotos) {
      if (!photoMap[p.damageReportId]) photoMap[p.damageReportId] = [];
      photoMap[p.damageReportId].push(p);
    }
    const invoiceMap: Record<number, { id: number; invoiceNumber: string; pdfUrl: string | null }> = {};
    for (const inv of linkedInvoices) {
      if (inv.damageReportId) invoiceMap[inv.damageReportId] = { id: inv.id, invoiceNumber: inv.invoiceNumber, pdfUrl: inv.pdfUrl ?? null };
    }

    return reports.map(r => ({
      ...r,
      equipmentLabel: equipMap[r.equipmentId] ?? `Equipment #${r.equipmentId}`,
      reporterName: userMap[r.reportedBy] ?? "Unknown",
      stationName: r.stationId ? stationMap[r.stationId] : undefined,
      photos: photoMap[r.id] ?? [],
      invoiceId: invoiceMap[r.id]?.id,
      invoiceNumber: invoiceMap[r.id]?.invoiceNumber,
      invoicePdfUrl: invoiceMap[r.id]?.pdfUrl ?? undefined,
    }));
  }

  async getAllDamageReports(): Promise<(DamageReport & { equipmentLabel: string; reporterName: string; stationName?: string; photos: DamageReportPhoto[] })[]> {
    const rows = await db.select().from(damageReports).orderBy(desc(damageReports.reportedAt));
    return this.enrichDamageReports(rows);
  }

  async getDamageReport(id: number): Promise<(DamageReport & { equipmentLabel: string; reporterName: string; stationName?: string; photos: DamageReportPhoto[] }) | undefined> {
    const [row] = await db.select().from(damageReports).where(eq(damageReports.id, id));
    if (!row) return undefined;
    const [enriched] = await this.enrichDamageReports([row]);
    return enriched;
  }

  async getDamageReportsByEquipment(equipmentId: number): Promise<(DamageReport & { reporterName: string; photos: DamageReportPhoto[] })[]> {
    const rows = await db.select().from(damageReports).where(eq(damageReports.equipmentId, equipmentId)).orderBy(desc(damageReports.reportedAt));
    return this.enrichDamageReports(rows);
  }

  async createDamageReport(report: InsertDamageReport): Promise<DamageReport> {
    const [created] = await db.insert(damageReports).values(report).returning();
    return created;
  }

  async updateDamageReport(id: number, data: Partial<DamageReport>): Promise<DamageReport | undefined> {
    const [updated] = await db.update(damageReports).set(data).where(eq(damageReports.id, id)).returning();
    return updated;
  }

  async createDamageReportPhoto(photo: InsertDamageReportPhoto): Promise<DamageReportPhoto> {
    const [created] = await db.insert(damageReportPhotos).values(photo).returning();
    return created;
  }

  async getAllFeedback(): Promise<(Feedback & { userName: string; userRole: string; attachments: FeedbackAttachment[] })[]> {
    const rows = await db
      .select({
        id: feedback.id,
        ticketNumber: feedback.ticketNumber,
        userId: feedback.userId,
        pageUrl: feedback.pageUrl,
        message: feedback.message,
        audioUrl: feedback.audioUrl,
        screenshotUrl: feedback.screenshotUrl,
        status: feedback.status,
        adminNotes: feedback.adminNotes,
        createdAt: feedback.createdAt,
        userName: users.name,
        userRole: users.role,
      })
      .from(feedback)
      .leftJoin(users, eq(feedback.userId, users.id))
      .orderBy(desc(feedback.createdAt));

    const allAttachments = await db.select().from(feedbackAttachments).orderBy(feedbackAttachments.createdAt);
    const attachmentsByFeedback = new Map<number, FeedbackAttachment[]>();
    for (const att of allAttachments) {
      const list = attachmentsByFeedback.get(att.feedbackId) || [];
      list.push(att);
      attachmentsByFeedback.set(att.feedbackId, list);
    }

    return rows.map(r => ({
      ...r,
      userName: r.userName ?? "Unknown",
      userRole: r.userRole ?? "station_lead",
      attachments: attachmentsByFeedback.get(r.id) || [],
    }));
  }

  async createFeedback(fb: InsertFeedback): Promise<Feedback> {
    const [created] = await db.insert(feedback).values(fb).returning();
    const ticketNumber = `FB-${String(created.id).padStart(4, '0')}`;
    const [updated] = await db.update(feedback).set({ ticketNumber }).where(eq(feedback.id, created.id)).returning();
    return updated;
  }

  async updateFeedback(id: number, data: Partial<Feedback>): Promise<Feedback | undefined> {
    const [updated] = await db.update(feedback).set(data).where(eq(feedback.id, id)).returning();
    return updated;
  }

  async getOpenFeedbackCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(feedback).where(eq(feedback.status, "open"));
    return result?.count ?? 0;
  }

  async createFeedbackAttachments(feedbackId: number, urls: string[]): Promise<FeedbackAttachment[]> {
    if (urls.length === 0) return [];
    const values = urls.map(url => ({ feedbackId, url, type: "image" as const }));
    return db.insert(feedbackAttachments).values(values).returning();
  }

  async getFeedbackAttachments(feedbackId: number): Promise<FeedbackAttachment[]> {
    return db.select().from(feedbackAttachments).where(eq(feedbackAttachments.feedbackId, feedbackId)).orderBy(feedbackAttachments.createdAt);
  }

  async getFeedbackComments(feedbackId: number): Promise<(FeedbackComment & { userName: string })[]> {
    const rows = await db
      .select({
        id: feedbackComments.id,
        feedbackId: feedbackComments.feedbackId,
        userId: feedbackComments.userId,
        message: feedbackComments.message,
        createdAt: feedbackComments.createdAt,
        userName: sql<string>`coalesce(${users.name}, 'Unknown')`,
      })
      .from(feedbackComments)
      .leftJoin(users, eq(feedbackComments.userId, users.id))
      .where(eq(feedbackComments.feedbackId, feedbackId))
      .orderBy(feedbackComments.createdAt);
    return rows;
  }

  async createFeedbackComment(comment: InsertFeedbackComment): Promise<FeedbackComment> {
    const [created] = await db.insert(feedbackComments).values(comment).returning();
    return created;
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(n: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(n).returning();
    return created;
  }

  async markNotificationRead(id: number, userId: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return result?.count ?? 0;
  }

  async getAdminUserIds(): Promise<number[]> {
    const rows = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    return rows.map(r => r.id);
  }

  async getAllAccessoryCategories(): Promise<AccessoryCategory[]> {
    return db.select().from(accessoryCategories).orderBy(accessoryCategories.sortOrder, accessoryCategories.name);
  }

  async createAccessoryCategory(cat: InsertAccessoryCategory): Promise<AccessoryCategory> {
    const [created] = await db.insert(accessoryCategories).values(cat).returning();
    return created;
  }

  async deleteAccessoryCategory(id: number): Promise<void> {
    await db.delete(accessoryInventory).where(eq(accessoryInventory.categoryId, id));
    await db.delete(accessoryTransfers).where(eq(accessoryTransfers.categoryId, id));
    await db.delete(accessoryCategories).where(eq(accessoryCategories.id, id));
  }

  async getAccessoryInventory(stationId?: number): Promise<AccessoryInventory[]> {
    if (stationId) {
      return db.select().from(accessoryInventory).where(eq(accessoryInventory.stationId, stationId));
    }
    return db.select().from(accessoryInventory);
  }

  async updateAccessoryInventory(categoryId: number, stationId: number, size: string, quantity: number): Promise<AccessoryInventory> {
    const [result] = await db.insert(accessoryInventory)
      .values({ categoryId, stationId, size, quantity })
      .onConflictDoUpdate({
        target: [accessoryInventory.categoryId, accessoryInventory.stationId, accessoryInventory.size],
        set: { quantity },
      })
      .returning();
    return result;
  }

  async getAllAccessoryTransfers(): Promise<(AccessoryTransfer & { categoryName: string; fromStationName: string; toStationName: string; transferredByName: string | null })[]> {
    const rows = await db.select().from(accessoryTransfers).orderBy(desc(accessoryTransfers.transferredAt));
    if (!rows.length) return [];

    const catIds = [...new Set(rows.map(r => r.categoryId))];
    const stationIds = [...new Set(rows.flatMap(r => [r.fromStationId, r.toStationId]))];
    const userIds = [...new Set(rows.map(r => r.transferredBy).filter(Boolean))] as number[];

    const [cats, sts, usrs] = await Promise.all([
      db.select().from(accessoryCategories).where(inArray(accessoryCategories.id, catIds)),
      db.select().from(stations).where(inArray(stations.id, stationIds)),
      userIds.length ? db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds)) : Promise.resolve([]),
    ]);

    const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
    const stMap = Object.fromEntries(sts.map(s => [s.id, s.name]));
    const uMap = Object.fromEntries(usrs.map(u => [u.id, u.name]));

    return rows.map(r => ({
      ...r,
      categoryName: catMap[r.categoryId] ?? "Unknown",
      fromStationName: stMap[r.fromStationId] ?? "Unknown",
      toStationName: stMap[r.toStationId] ?? "Unknown",
      transferredByName: r.transferredBy ? (uMap[r.transferredBy] ?? null) : null,
    }));
  }

  async createAccessoryTransfer(transfer: InsertAccessoryTransfer): Promise<AccessoryTransfer> {
    const size = transfer.size ?? "Einheitsgröße";
    const transferQty = transfer.quantity ?? 1;

    return await db.transaction(async (tx) => {
      const fromInv = await tx.select().from(accessoryInventory).where(
        and(
          eq(accessoryInventory.categoryId, transfer.categoryId),
          eq(accessoryInventory.stationId, transfer.fromStationId),
          eq(accessoryInventory.size, size),
        )
      );
      const currentQty = fromInv[0]?.quantity ?? 0;
      if (currentQty < transferQty) {
        throw new Error("Not enough stock at source station");
      }

      if (fromInv[0]) {
        await tx.update(accessoryInventory).set({ quantity: currentQty - transferQty }).where(eq(accessoryInventory.id, fromInv[0].id));
      }

      const toInv = await tx.select().from(accessoryInventory).where(
        and(
          eq(accessoryInventory.categoryId, transfer.categoryId),
          eq(accessoryInventory.stationId, transfer.toStationId),
          eq(accessoryInventory.size, size),
        )
      );
      const toQty = toInv[0]?.quantity ?? 0;
      if (toInv[0]) {
        await tx.update(accessoryInventory).set({ quantity: toQty + transferQty }).where(eq(accessoryInventory.id, toInv[0].id));
      } else {
        await tx.insert(accessoryInventory).values({ categoryId: transfer.categoryId, stationId: transfer.toStationId, size, quantity: transferQty });
      }

      const [created] = await tx.insert(accessoryTransfers).values(transfer).returning();
      return created;
    });
  }

  async getAccessoryLossReports(status?: string): Promise<any[]> {
    const rows = status
      ? await db.select().from(accessoryLossReports).where(eq(accessoryLossReports.status, status)).orderBy(desc(accessoryLossReports.reportedAt))
      : await db.select().from(accessoryLossReports).orderBy(desc(accessoryLossReports.reportedAt));
    if (!rows.length) return [];

    const catIds = [...new Set(rows.map(r => r.categoryId))];
    const stationIds = [...new Set(rows.map(r => r.stationId))];
    const userIds = [...new Set([...rows.map(r => r.reportedBy), ...rows.map(r => r.resolvedBy).filter(Boolean)])] as number[];

    const [cats, sts, usrs] = await Promise.all([
      db.select().from(accessoryCategories).where(inArray(accessoryCategories.id, catIds)),
      db.select().from(stations).where(inArray(stations.id, stationIds)),
      userIds.length ? db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds)) : Promise.resolve([]),
    ]);

    const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
    const stMap = Object.fromEntries(sts.map(s => [s.id, s.name]));
    const uMap = Object.fromEntries(usrs.map(u => [u.id, u.name]));

    return rows.map(r => ({
      ...r,
      categoryName: catMap[r.categoryId] ?? "?",
      stationName: stMap[r.stationId] ?? "?",
      reportedByName: uMap[r.reportedBy] ?? "?",
      resolvedByName: r.resolvedBy ? (uMap[r.resolvedBy] ?? null) : null,
    }));
  }

  async createAccessoryLossReport(report: InsertAccessoryLossReport): Promise<AccessoryLossReport> {
    const [created] = await db.insert(accessoryLossReports).values(report).returning();
    return created;
  }

  async resolveAccessoryLossReport(id: number, resolvedBy: number, adminNote: string | null, approved: boolean): Promise<AccessoryLossReport> {
    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(accessoryLossReports)
        .set({
          status: approved ? "approved" : "rejected",
          resolvedBy,
          resolvedAt: new Date(),
          adminNote,
        })
        .where(and(eq(accessoryLossReports.id, id), eq(accessoryLossReports.status, "pending")))
        .returning();
      if (!updated) throw new Error("Report not found or already resolved");

      if (approved) {
        const inv = await tx.select().from(accessoryInventory).where(
          and(
            eq(accessoryInventory.categoryId, updated.categoryId),
            eq(accessoryInventory.stationId, updated.stationId),
            eq(accessoryInventory.size, updated.size),
          )
        );
        if (inv[0]) {
          const newQty = Math.max(0, inv[0].quantity - updated.quantity);
          await tx.update(accessoryInventory).set({ quantity: newQty }).where(eq(accessoryInventory.id, inv[0].id));
        }
      }

      return updated;
    });
  }

  // ─── School Module ───────────────────────────────────────────────────────────

  async getAllSchoolConfigs(): Promise<(SchoolConfig & { stationName: string })[]> {
    const rows = await db.select().from(schoolConfigs);
    const sts = await db.select().from(stations);
    const stMap = Object.fromEntries(sts.map(s => [s.id, s.name]));
    return rows.map(r => ({ ...r, stationName: stMap[r.stationId] ?? "?" }));
  }

  async getSchoolConfig(id: number): Promise<SchoolConfig | undefined> {
    const [row] = await db.select().from(schoolConfigs).where(eq(schoolConfigs.id, id));
    return row;
  }

  async getSchoolConfigByStation(stationId: number): Promise<SchoolConfig | undefined> {
    const [row] = await db.select().from(schoolConfigs).where(eq(schoolConfigs.stationId, stationId));
    return row;
  }

  async createSchoolConfig(config: InsertSchoolConfig): Promise<SchoolConfig> {
    const [created] = await db.insert(schoolConfigs).values(config).returning();
    return created;
  }

  async updateSchoolConfig(id: number, data: Partial<InsertSchoolConfig>): Promise<SchoolConfig | undefined> {
    const [updated] = await db.update(schoolConfigs).set(data).where(eq(schoolConfigs.id, id)).returning();
    return updated;
  }

  async getSchoolProducts(schoolConfigId: number): Promise<SchoolProduct[]> {
    return db.select().from(schoolProducts)
      .where(eq(schoolProducts.schoolConfigId, schoolConfigId))
      .orderBy(schoolProducts.sortOrder, schoolProducts.name);
  }

  async createSchoolProduct(product: InsertSchoolProduct): Promise<SchoolProduct> {
    const [created] = await db.insert(schoolProducts).values(product).returning();
    return created;
  }

  async updateSchoolProduct(id: number, data: Partial<InsertSchoolProduct>): Promise<SchoolProduct | undefined> {
    const [updated] = await db.update(schoolProducts).set(data).where(eq(schoolProducts.id, id)).returning();
    return updated;
  }

  async bulkImportSchoolProducts(schoolConfigId: number, products: Omit<InsertSchoolProduct, "schoolConfigId">[], replaceExisting: boolean): Promise<number> {
    return db.transaction(async (tx) => {
      if (replaceExisting) {
        await tx.delete(schoolProducts).where(eq(schoolProducts.schoolConfigId, schoolConfigId));
      }
      let count = 0;
      for (const p of products) {
        await tx.insert(schoolProducts).values({ ...p, schoolConfigId });
        count++;
      }
      return count;
    });
  }

  // ─── School Customers ─────────────────────────────────────────────────────────

  async getSchoolCustomers(schoolConfigId: number): Promise<SchoolCustomer[]> {
    return db.select().from(schoolCustomers)
      .where(eq(schoolCustomers.schoolConfigId, schoolConfigId))
      .orderBy(desc(schoolCustomers.createdAt));
  }

  async getSchoolCustomer(id: number): Promise<SchoolCustomer | undefined> {
    const [row] = await db.select().from(schoolCustomers).where(eq(schoolCustomers.id, id));
    return row;
  }

  async createSchoolCustomer(customer: InsertSchoolCustomer): Promise<SchoolCustomer> {
    const [created] = await db.insert(schoolCustomers).values(customer).returning();
    return created;
  }

  async updateSchoolCustomer(id: number, data: Partial<InsertSchoolCustomer>): Promise<SchoolCustomer | undefined> {
    const [updated] = await db.update(schoolCustomers).set(data).where(eq(schoolCustomers.id, id)).returning();
    return updated;
  }

  async deleteSchoolCustomer(id: number): Promise<void> {
    await db.delete(schoolCustomers).where(eq(schoolCustomers.id, id));
  }

  async createAccessoryCheck(check: InsertAccessoryCheck): Promise<AccessoryCheck> {
    const [created] = await db.insert(accessoryChecks).values(check).returning();
    return created;
  }

  async getAccessoryCheckById(id: number): Promise<AccessoryCheck | undefined> {
    const [row] = await db.select().from(accessoryChecks).where(eq(accessoryChecks.id, id));
    return row;
  }

  async getAccessoryChecks(stationId: number, limit = 10): Promise<(AccessoryCheck & { checkedByName: string })[]> {
    const rows = await db
      .select({
        id: accessoryChecks.id,
        stationId: accessoryChecks.stationId,
        checkedBy: accessoryChecks.checkedBy,
        checkedAt: accessoryChecks.checkedAt,
        totalCategories: accessoryChecks.totalCategories,
        totalDifferences: accessoryChecks.totalDifferences,
        checkedByName: sql<string>`COALESCE(${users.name}, 'Unknown')`,
      })
      .from(accessoryChecks)
      .leftJoin(users, eq(accessoryChecks.checkedBy, users.id))
      .where(eq(accessoryChecks.stationId, stationId))
      .orderBy(desc(accessoryChecks.checkedAt))
      .limit(limit);
    return rows;
  }

  async createAccessoryCheckItems(items: InsertAccessoryCheckItem[]): Promise<AccessoryCheckItem[]> {
    if (items.length === 0) return [];
    return db.insert(accessoryCheckItems).values(items).returning();
  }

  async getAccessoryCheckItems(checkId: number): Promise<(AccessoryCheckItem & { categoryName: string })[]> {
    return db
      .select({
        id: accessoryCheckItems.id,
        checkId: accessoryCheckItems.checkId,
        categoryId: accessoryCheckItems.categoryId,
        size: accessoryCheckItems.size,
        targetQuantity: accessoryCheckItems.targetQuantity,
        actualQuantity: accessoryCheckItems.actualQuantity,
        notes: accessoryCheckItems.notes,
        categoryName: accessoryCategories.name,
      })
      .from(accessoryCheckItems)
      .innerJoin(accessoryCategories, eq(accessoryCheckItems.categoryId, accessoryCategories.id))
      .where(eq(accessoryCheckItems.checkId, checkId));
  }
  async getSchoolBookings(schoolConfigId: number): Promise<(SchoolBooking & { items: SchoolBookingItem[]; createdByName: string | null })[]> {
    const rows = await db
      .select({
        id: schoolBookings.id,
        schoolConfigId: schoolBookings.schoolConfigId,
        bookingNumber: schoolBookings.bookingNumber,
        customerId: schoolBookings.customerId,
        customerName: schoolBookings.customerName,
        customerEmail: schoolBookings.customerEmail,
        bookingDate: schoolBookings.bookingDate,
        paymentStatus: schoolBookings.paymentStatus,
        totalAmount: schoolBookings.totalAmount,
        currency: schoolBookings.currency,
        notes: schoolBookings.notes,
        emailSentAt: schoolBookings.emailSentAt,
        createdAt: schoolBookings.createdAt,
        createdBy: schoolBookings.createdBy,
        createdByName: sql<string | null>`COALESCE(${users.name}, NULL)`,
      })
      .from(schoolBookings)
      .leftJoin(users, eq(schoolBookings.createdBy, users.id))
      .where(eq(schoolBookings.schoolConfigId, schoolConfigId))
      .orderBy(desc(schoolBookings.createdAt));

    const bookingIds = rows.map(r => r.id);
    if (bookingIds.length === 0) return rows.map(r => ({ ...r, items: [] }));

    const allItems = await db.select().from(schoolBookingItems)
      .where(sql`${schoolBookingItems.bookingId} IN (${sql.join(bookingIds.map(id => sql`${id}`), sql`, `)})`);

    const itemsByBooking = new Map<number, SchoolBookingItem[]>();
    for (const item of allItems) {
      const arr = itemsByBooking.get(item.bookingId) || [];
      arr.push(item);
      itemsByBooking.set(item.bookingId, arr);
    }

    return rows.map(r => ({ ...r, items: itemsByBooking.get(r.id) || [] }));
  }

  async getSchoolBooking(id: number): Promise<(SchoolBooking & { items: SchoolBookingItem[]; createdByName: string | null }) | undefined> {
    const [row] = await db
      .select({
        id: schoolBookings.id,
        schoolConfigId: schoolBookings.schoolConfigId,
        bookingNumber: schoolBookings.bookingNumber,
        customerId: schoolBookings.customerId,
        customerName: schoolBookings.customerName,
        customerEmail: schoolBookings.customerEmail,
        bookingDate: schoolBookings.bookingDate,
        paymentStatus: schoolBookings.paymentStatus,
        totalAmount: schoolBookings.totalAmount,
        currency: schoolBookings.currency,
        notes: schoolBookings.notes,
        emailSentAt: schoolBookings.emailSentAt,
        createdAt: schoolBookings.createdAt,
        createdBy: schoolBookings.createdBy,
        createdByName: sql<string | null>`COALESCE(${users.name}, NULL)`,
      })
      .from(schoolBookings)
      .leftJoin(users, eq(schoolBookings.createdBy, users.id))
      .where(eq(schoolBookings.id, id));
    if (!row) return undefined;

    const items = await db.select().from(schoolBookingItems)
      .where(eq(schoolBookingItems.bookingId, id));

    return { ...row, items };
  }

  async createSchoolBooking(booking: InsertSchoolBooking, items: Omit<InsertSchoolBookingItem, "bookingId">[]): Promise<SchoolBooking> {
    return await db.transaction(async (tx) => {
      const [created] = await tx.insert(schoolBookings).values(booking).returning();
      if (items.length > 0) {
        await tx.insert(schoolBookingItems).values(
          items.map(item => ({ ...item, bookingId: created.id }))
        );
      }
      return created;
    });
  }

  async updateSchoolBookingPayment(id: number, paymentStatus: string): Promise<SchoolBooking | undefined> {
    const [updated] = await db.update(schoolBookings)
      .set({ paymentStatus: paymentStatus as any })
      .where(eq(schoolBookings.id, id))
      .returning();
    return updated;
  }

  async getNextBookingNumber(schoolConfigId: number, stationShortCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SCH-${stationShortCode}-${year}-`;
    const [result] = await db
      .select({ bookingNumber: schoolBookings.bookingNumber })
      .from(schoolBookings)
      .where(sql`${schoolBookings.bookingNumber} LIKE ${prefix + '%'} AND ${schoolBookings.schoolConfigId} = ${schoolConfigId}`)
      .orderBy(desc(schoolBookings.bookingNumber))
      .limit(1);

    if (!result) return `${prefix}001`;
    const lastNum = parseInt(result.bookingNumber.split("-").pop() || "0", 10);
    return `${prefix}${String(lastNum + 1).padStart(3, "0")}`;
  }
}

export const storage = new DatabaseStorage();
