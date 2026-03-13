import { storage } from "./storage";
import { hashPassword } from "./auth";
import { db } from "./db";
import { users, stations, equipment, accessoryCategories, accessoryInventory } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

const DEFAULT_SUPPLIERS = [
  { name: "Duotone", color: "#8b5cf6" },
  { name: "Core", color: "#f97316" },
  { name: "North", color: "#0ea5e9" },
  { name: "Eleveight", color: "#10b981" },
  { name: "Cabrinha", color: "#ef4444" },
  { name: "ION", color: "#64748b" },
  { name: "Mystic", color: "#f59e0b" },
  { name: "Manera", color: "#ec4899" },
];

async function seedSuppliers() {
  const existing = await storage.getAllSuppliers();
  const existingNames = new Set(existing.map(s => s.name));
  const missing = DEFAULT_SUPPLIERS.filter(s => !existingNames.has(s.name));
  if (missing.length === 0) return;
  console.log(`Adding ${missing.length} missing suppliers...`);
  for (const s of missing) {
    await storage.createSupplier(s);
  }
  console.log(`Inserted ${missing.length} suppliers: ${missing.map(s => s.name).join(", ")}`);
}

const DEFAULT_ACCESSORY_CATEGORIES = [
  { name: "Impact Vest", hasSizes: true, isDefault: true, sortOrder: 10 },
  { name: "Helmet", hasSizes: true, isDefault: true, sortOrder: 20 },
  { name: "Wetsuit", hasSizes: true, isDefault: true, sortOrder: 30 },
  { name: "Waist Harness", hasSizes: true, isDefault: true, sortOrder: 40 },
  { name: "Seat Harness", hasSizes: true, isDefault: true, sortOrder: 41 },
  { name: "Pump", hasSizes: false, isDefault: true, sortOrder: 50 },
];

async function seedAccessoryCategories() {
  const existing = await storage.getAllAccessoryCategories();
  const existingNames = new Set(existing.map(c => c.name));
  const missing = DEFAULT_ACCESSORY_CATEGORIES.filter(c => !existingNames.has(c.name));
  if (missing.length === 0) return;
  console.log(`Adding ${missing.length} accessory categories...`);
  for (const cat of missing) {
    await storage.createAccessoryCategory(cat);
  }
  console.log(`Inserted accessory categories: ${missing.map(c => c.name).join(", ")}`);
}

async function migrateEquipmentToAccessories() {
  const { sql: rawSql } = await import("drizzle-orm");
  const eqItems = await db.select().from(equipment).where(
    rawSql`${equipment.type} IN ('wetsuit', 'harness', 'helmet_safety')`
  );
  if (eqItems.length === 0) return;

  console.log(`Migrating ${eqItems.length} equipment items to accessories...`);

  const categories = await storage.getAllAccessoryCategories();
  const catByName = (name: string) => categories.find(c => c.name === name)?.id;

  function resolveCategory(item: typeof eqItems[0]): number | undefined {
    const fields = (item.typeSpecificFields || {}) as Record<string, any>;
    if (item.type === "wetsuit") return catByName("Wetsuit");
    if (item.type === "harness") {
      const harnessType = (fields.harnessType || "").toLowerCase();
      if (harnessType === "seat") return catByName("Seat Harness");
      return catByName("Waist Harness");
    }
    if (item.type === "helmet_safety") {
      const gearType = (fields.gearType || "").toLowerCase();
      if (gearType === "impact vest" || gearType === "vest") return catByName("Impact Vest");
      return catByName("Helmet");
    }
    return undefined;
  }

  const grouped: Record<string, number> = {};
  for (const item of eqItems) {
    const catId = resolveCategory(item);
    if (!catId || !item.currentStationId) continue;
    const fields = (item.typeSpecificFields || {}) as Record<string, any>;
    const size = fields.size || "Einheitsgröße";
    const key = `${catId}:${item.currentStationId}:${size}`;
    grouped[key] = (grouped[key] || 0) + 1;
  }

  for (const [key, count] of Object.entries(grouped)) {
    const [catId, stationId, size] = key.split(":");
    const existing = await storage.getAccessoryInventory(parseInt(stationId));
    const current = existing.find(i => i.categoryId === parseInt(catId) && i.size === size);
    const newQty = (current?.quantity || 0) + count;
    await storage.updateAccessoryInventory(parseInt(catId), parseInt(stationId), size, newQty);
  }

  const eqIds = eqItems.map(e => e.id);
  await db.execute(rawSql`DELETE FROM photos WHERE equipment_id = ANY(${eqIds})`);
  await db.execute(rawSql`DELETE FROM condition_ratings WHERE equipment_id = ANY(${eqIds})`);
  await db.execute(rawSql`DELETE FROM repairs WHERE equipment_id = ANY(${eqIds})`);
  await db.execute(rawSql`DELETE FROM transfers WHERE equipment_id = ANY(${eqIds})`);
  await db.execute(rawSql`DELETE FROM activity_log WHERE equipment_id = ANY(${eqIds})`);
  await db.execute(rawSql`DELETE FROM sale_items WHERE equipment_id = ANY(${eqIds})`);
  await db.execute(rawSql`DELETE FROM inventory_check_items WHERE equipment_id = ANY(${eqIds})`);
  await db.execute(rawSql`UPDATE sales_invoices SET damage_report_id = NULL WHERE damage_report_id IN (SELECT id FROM damage_reports WHERE equipment_id = ANY(${eqIds}))`);
  await db.execute(rawSql`DELETE FROM damage_report_photos WHERE damage_report_id IN (SELECT id FROM damage_reports WHERE equipment_id = ANY(${eqIds}))`);
  await db.execute(rawSql`DELETE FROM damage_reports WHERE equipment_id = ANY(${eqIds})`);
  await db.delete(equipment).where(inArray(equipment.id, eqIds));

  console.log(`Migrated ${eqItems.length} items into accessory inventory and removed from equipment.`);
}

export async function seedDatabase() {
  await seedSuppliers();
  await seedAccessoryCategories();
  await migrateEquipmentToAccessories();

  const existingUsers = await storage.getAllUsers();
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database...");

  const [dakhla, tatajuba] = await Promise.all([
    storage.createStation({ name: "Dakhla", location: "Dakhla", country: "Morocco" }),
    storage.createStation({ name: "Tatajuba", location: "Tatajuba", country: "Brazil" }),
  ]);

  await Promise.all([
    storage.createStation({ name: "Office Hamburg Warehouse", location: "Hamburg", country: "Germany" }),
    storage.createStation({ name: "Service Center Heidenau", location: "Heidenau", country: "Germany" }),
  ]);

  const adminPw = await hashPassword("admin123");
  const mgr1Pw = await hashPassword("manager123");
  const mgr2Pw = await hashPassword("manager123");

  const admin = await storage.createUser({
    name: "Admin",
    email: "admin@kitetracker.com",
    password: adminPw,
    role: "admin",
    assignedStationId: null,
  });

  const manager1 = await storage.createUser({
    name: "Carlos Rivera",
    email: "manager1@kitetracker.com",
    password: mgr1Pw,
    role: "manager",
    assignedStationId: dakhla.id,
  });

  const manager2 = await storage.createUser({
    name: "Sophie Meier",
    email: "manager2@kitetracker.com",
    password: mgr2Pw,
    role: "manager",
    assignedStationId: tatajuba.id,
  });

  const equipmentData = [
    {
      serialNumber: "DT-K-2024-001",
      type: "kite" as const,
      brand: "Duotone",
      model: "Rebel SLS",
      yearOfPurchase: 2024,
      currentStationId: dakhla.id,
      status: "active" as const,
      conditionRating: 5,
      purchasePrice: "1499.00",
      currentValue: "1350.00",
      typeSpecificFields: { size: 12, color: "Orange/Blue" },
    },
    {
      serialNumber: "DT-K-2023-002",
      type: "kite" as const,
      brand: "Duotone",
      model: "Neo SLS",
      yearOfPurchase: 2023,
      currentStationId: dakhla.id,
      status: "active" as const,
      conditionRating: 4,
      purchasePrice: "1399.00",
      currentValue: "900.00",
      typeSpecificFields: { size: 9, color: "Red/Black" },
    },
    {
      serialNumber: "NR-K-2024-003",
      type: "kite" as const,
      brand: "North",
      model: "Reach",
      yearOfPurchase: 2024,
      currentStationId: tatajuba.id,
      status: "active" as const,
      conditionRating: 5,
      purchasePrice: "1550.00",
      currentValue: "1400.00",
      typeSpecificFields: { size: 10, color: "Mint/White" },
    },
    {
      serialNumber: "CR-K-2022-004",
      type: "kite" as const,
      brand: "Core",
      model: "XR7",
      yearOfPurchase: 2022,
      currentStationId: dakhla.id,
      status: "active" as const,
      conditionRating: 2,
      purchasePrice: "1450.00",
      currentValue: "500.00",
      typeSpecificFields: { size: 14, color: "Yellow/Grey" },
    },
    {
      serialNumber: "CB-B-2024-005",
      type: "board" as const,
      brand: "Cabrinha",
      model: "Stylus",
      yearOfPurchase: 2024,
      currentStationId: dakhla.id,
      status: "active" as const,
      conditionRating: 5,
      purchasePrice: "599.00",
      currentValue: "520.00",
      typeSpecificFields: { size: 140, boardType: "TwinTip" },
    },
    {
      serialNumber: "DT-B-2023-006",
      type: "board" as const,
      brand: "Duotone",
      model: "Select",
      yearOfPurchase: 2023,
      currentStationId: tatajuba.id,
      status: "active" as const,
      conditionRating: 3,
      purchasePrice: "649.00",
      currentValue: "350.00",
      typeSpecificFields: { size: 138, boardType: "TwinTip" },
    },
    {
      serialNumber: "NR-B-2024-007",
      type: "board" as const,
      brand: "North",
      model: "Atmos",
      yearOfPurchase: 2024,
      currentStationId: dakhla.id,
      status: "in_repair" as const,
      conditionRating: 2,
      purchasePrice: "799.00",
      currentValue: "400.00",
      typeSpecificFields: { size: 142, boardType: "Directional" },
    },
    {
      serialNumber: "DT-F-2024-008",
      type: "foil" as const,
      brand: "Duotone",
      model: "Spirit GT",
      yearOfPurchase: 2024,
      currentStationId: dakhla.id,
      status: "active" as const,
      conditionRating: 5,
      purchasePrice: "2200.00",
      currentValue: "2000.00",
      typeSpecificFields: { mastLength: 75, wingSize: "1100cm2" },
    },
    {
      serialNumber: "DT-W-2024-009",
      type: "wing" as const,
      brand: "Duotone",
      model: "Slick SLS",
      yearOfPurchase: 2024,
      currentStationId: tatajuba.id,
      status: "active" as const,
      conditionRating: 4,
      purchasePrice: "1099.00",
      currentValue: "900.00",
      typeSpecificFields: { size: 5, color: "Blue/White" },
    },
    {
      serialNumber: "DT-BL-2024-010",
      type: "bar_lines" as const,
      brand: "Duotone",
      model: "Trust Bar",
      yearOfPurchase: 2024,
      currentStationId: dakhla.id,
      status: "active" as const,
      conditionRating: 5,
      purchasePrice: "549.00",
      currentValue: "490.00",
      typeSpecificFields: { lineLength: 24, compatibleSizes: "7-14m" },
    },
    {
      serialNumber: "CR-K-2023-017",
      type: "kite" as const,
      brand: "Core",
      model: "Section 4",
      yearOfPurchase: 2023,
      currentStationId: dakhla.id,
      status: "active" as const,
      conditionRating: 3,
      purchasePrice: "1599.00",
      currentValue: "800.00",
      typeSpecificFields: { size: 11, color: "Black/Red" },
    },
    {
      serialNumber: "CB-BL-2024-018",
      type: "bar_lines" as const,
      brand: "Cabrinha",
      model: "Overdrive 1X",
      yearOfPurchase: 2024,
      currentStationId: dakhla.id,
      status: "active" as const,
      conditionRating: 4,
      purchasePrice: "499.00",
      currentValue: "420.00",
      typeSpecificFields: { lineLength: 22, compatibleSizes: "5-12m" },
    },
  ];

  const createdEquipment = [];
  for (const eq of equipmentData) {
    const created = await storage.createEquipment(eq as any);
    createdEquipment.push(created);
  }

  await storage.createConditionRating({ equipmentId: createdEquipment[3].id, rating: 3, ratedBy: manager1.id, notes: "Leading edge showing wear" });
  await storage.createConditionRating({ equipmentId: createdEquipment[3].id, rating: 2, ratedBy: manager1.id, notes: "Bladder has slow leak, needs repair" });
  await storage.createConditionRating({ equipmentId: createdEquipment[5].id, rating: 4, ratedBy: manager2.id, notes: "Minor scratches on base" });
  await storage.createConditionRating({ equipmentId: createdEquipment[5].id, rating: 3, ratedBy: manager2.id, notes: "Base scratches getting deeper" });

  await storage.createRepair({ equipmentId: createdEquipment[6].id, description: "Delamination repair on rail", cost: "120.00", status: "pending", loggedBy: admin.id });
  await storage.createRepair({ equipmentId: createdEquipment[3].id, description: "Bladder replacement", cost: "85.00", status: "completed", loggedBy: admin.id });

  const transfer1 = await storage.createTransfer({
    equipmentId: createdEquipment[1].id,
    fromStationId: tatajuba.id,
    toStationId: dakhla.id,
    initiatedBy: manager2.id,
  });
  await storage.confirmTransfer(transfer1.id, manager1.id);

  await storage.createTransfer({
    equipmentId: createdEquipment[9].id,
    fromStationId: dakhla.id,
    toStationId: tatajuba.id,
    initiatedBy: manager1.id,
  });

  await storage.createActivityLog({ userId: admin.id, action: "system_seeded", details: "Database seeded with sample data" });

  console.log("Database seeded successfully!");
  console.log("Admin: admin@kitetracker.com / admin123");
  console.log("Manager 1: manager1@kitetracker.com / manager123");
  console.log("Manager 2: manager2@kitetracker.com / manager123");
}
