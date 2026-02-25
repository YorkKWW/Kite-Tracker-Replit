import { eq, and, desc, ilike, or, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  stations, users, equipment, conditionRatings, repairs, transfers, photos, activityLog,
  inventoryChecks, inventoryCheckItems, suppliers, invoices,
  companySettings, customers, salesInvoices, saleItems, priceLists, priceListItems,
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

  getEquipment(id: number): Promise<Equipment | undefined>;
  getEquipmentBySerial(serial: string): Promise<Equipment | undefined>;
  getEquipmentByCode(code: string): Promise<Equipment | undefined>;
  getAllEquipment(filters?: {
    stationId?: number;
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
  createRepair(repair: InsertRepair): Promise<Repair>;
  updateRepair(id: number, data: Partial<InsertRepair>): Promise<Repair | undefined>;

  getTransfers(filters?: { stationId?: number; status?: string }): Promise<Transfer[]>;
  getTransfersByEquipment(equipmentId: number): Promise<Transfer[]>;
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  confirmTransfer(id: number, confirmedBy: number): Promise<Transfer | undefined>;
  cancelTransfer(id: number): Promise<Transfer | undefined>;

  getPhotos(equipmentId: number): Promise<Photo[]>;
  getFirstPhotos(equipmentIds: number[]): Promise<Record<number, string>>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<void>;

  getActivityLog(limit?: number): Promise<ActivityLog[]>;
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

  getAllInvoices(): Promise<(Invoice & { supplierName: string })[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(inv: InsertInvoice): Promise<Invoice>;

  getCompanySettings(): Promise<CompanySettings>;
  updateCompanySettings(data: Partial<InsertCompanySettings>): Promise<CompanySettings>;

  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(c: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined>;

  getAllSalesInvoices(): Promise<(SalesInvoice & { customerName: string; itemCount: number })[]>;
  getSalesInvoice(id: number): Promise<(SalesInvoice & { customer: Customer; items: SaleItem[] }) | undefined>;
  createSalesInvoice(inv: InsertSalesInvoice, items: Omit<InsertSaleItem, "saleId">[]): Promise<SalesInvoice>;
  confirmSale(id: number): Promise<SalesInvoice | undefined>;
  getNextInvoiceNumber(): Promise<string>;

  getAllPriceLists(): Promise<PriceList[]>;
  getPriceList(id: number): Promise<PriceList | undefined>;
  createPriceList(pl: InsertPriceList, items: Omit<InsertPriceListItem, "priceListId">[]): Promise<PriceList>;
  deactivatePriceLists(supplier: string): Promise<void>;
  deletePriceList(id: number): Promise<void>;
  getPriceListItems(priceListId: number): Promise<PriceListItem[]>;
  lookupRetailPrice(sku: string): Promise<{ retailPrice: string; dealerPrice: string | null; supplier: string; productName: string } | null>;
}

export class DatabaseStorage implements IStorage {
  async getStation(id: number): Promise<Station | undefined> {
    const [station] = await db.select().from(stations).where(eq(stations.id, id));
    return station;
  }

  async getAllStations(): Promise<Station[]> {
    return db.select().from(stations);
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
    await db.delete(users).where(eq(users.id, id));
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
    type?: string;
    status?: string;
    conditionRating?: number;
    search?: string;
  }): Promise<Equipment[]> {
    const conditions: any[] = [];
    if (filters?.stationId) {
      conditions.push(eq(equipment.currentStationId, filters.stationId));
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
    await db.delete(photos).where(eq(photos.equipmentId, id));
    await db.delete(conditionRatings).where(eq(conditionRatings.equipmentId, id));
    await db.delete(repairs).where(eq(repairs.equipmentId, id));
    await db.delete(transfers).where(eq(transfers.equipmentId, id));
    await db.delete(activityLog).where(eq(activityLog.equipmentId, id));
    await db.delete(equipment).where(eq(equipment.id, id));
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

  async confirmTransfer(id: number, confirmedBy: number): Promise<Transfer | undefined> {
    const [transfer] = await db.select().from(transfers).where(eq(transfers.id, id));
    if (!transfer) return undefined;

    const [updated] = await db.update(transfers)
      .set({ status: "confirmed", confirmedBy, confirmedAt: new Date() })
      .where(eq(transfers.id, id))
      .returning();

    await db.update(equipment)
      .set({ currentStationId: transfer.toStationId, status: "active" })
      .where(eq(equipment.id, transfer.equipmentId));

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
      .set({ status: "active" })
      .where(eq(equipment.id, transfer.equipmentId));

    return updated;
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

  async getActivityLog(limit = 50): Promise<ActivityLog[]> {
    return db.select().from(activityLog)
      .orderBy(desc(activityLog.timestamp))
      .limit(limit);
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
    const allEquipment = stationId
      ? await db.select().from(equipment).where(eq(equipment.currentStationId, stationId))
      : await db.select().from(equipment);

    const allStations = await db.select().from(stations);

    const equipmentPerStation = allStations.map((s) => {
      const stEq = allEquipment.filter((e) => e.currentStationId === s.id);
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

    const inTransferEq = allEquipment.filter((e) => e.status === "in_transfer");

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

  async getAllInvoices(): Promise<(Invoice & { supplierName: string })[]> {
    const rows = await db
      .select({ invoice: invoices, supplierName: suppliers.name })
      .from(invoices)
      .innerJoin(suppliers, eq(invoices.supplierId, suppliers.id))
      .orderBy(desc(invoices.importedAt));
    return rows.map((r) => ({ ...r.invoice, supplierName: r.supplierName }));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
    return inv;
  }

  async createInvoice(inv: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(inv).returning();
    return created;
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

  async lookupRetailPrice(sku: string): Promise<{ retailPrice: string; dealerPrice: string | null; supplier: string; productName: string } | null> {
    if (!sku) return null;
    const rows = await db
      .select({
        retailPrice: priceListItems.retailPrice,
        dealerPrice: priceListItems.dealerPrice,
        supplier: priceLists.supplier,
        productName: priceListItems.productName,
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
    };
  }
}

export const storage = new DatabaseStorage();
