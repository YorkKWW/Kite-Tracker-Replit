import { storage } from "./storage";
import { hashPassword } from "./auth";
import { db } from "./db";
import { users, stations, equipment } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const existingUsers = await storage.getAllUsers();
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database...");

  const [fuerteventura, tarifa, zanzibar] = await Promise.all([
    storage.createStation({ name: "Fuerteventura", location: "Corralejo", country: "Spain" }),
    storage.createStation({ name: "Tarifa", location: "Tarifa", country: "Spain" }),
    storage.createStation({ name: "Zanzibar", location: "Paje", country: "Tanzania" }),
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
    assignedStationId: fuerteventura.id,
  });

  const manager2 = await storage.createUser({
    name: "Sophie Meier",
    email: "manager2@kitetracker.com",
    password: mgr2Pw,
    role: "manager",
    assignedStationId: tarifa.id,
  });

  const equipmentData = [
    {
      serialNumber: "DT-K-2024-001",
      type: "kite" as const,
      brand: "Duotone",
      model: "Rebel SLS",
      yearOfPurchase: 2024,
      currentStationId: fuerteventura.id,
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
      currentStationId: fuerteventura.id,
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
      currentStationId: tarifa.id,
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
      currentStationId: zanzibar.id,
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
      currentStationId: fuerteventura.id,
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
      currentStationId: tarifa.id,
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
      currentStationId: zanzibar.id,
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
      currentStationId: fuerteventura.id,
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
      currentStationId: tarifa.id,
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
      currentStationId: fuerteventura.id,
      status: "active" as const,
      conditionRating: 5,
      purchasePrice: "549.00",
      currentValue: "490.00",
      typeSpecificFields: { lineLength: 24, compatibleSizes: "7-14m" },
    },
    {
      serialNumber: "MY-WS-2024-011",
      type: "wetsuit" as const,
      brand: "Mystic",
      model: "Star Fullsuit 5/3",
      yearOfPurchase: 2024,
      currentStationId: fuerteventura.id,
      status: "active" as const,
      conditionRating: 4,
      purchasePrice: "249.00",
      currentValue: "200.00",
      typeSpecificFields: { thickness: 5, size: "L", wetsuitType: "Full" },
    },
    {
      serialNumber: "IO-WS-2023-012",
      type: "wetsuit" as const,
      brand: "ION",
      model: "Element 4/3",
      yearOfPurchase: 2023,
      currentStationId: tarifa.id,
      status: "active" as const,
      conditionRating: 3,
      purchasePrice: "199.00",
      currentValue: "100.00",
      typeSpecificFields: { thickness: 4, size: "M", wetsuitType: "Full" },
    },
    {
      serialNumber: "MY-H-2024-013",
      type: "harness" as const,
      brand: "Mystic",
      model: "Majestic X",
      yearOfPurchase: 2024,
      currentStationId: fuerteventura.id,
      status: "active" as const,
      conditionRating: 5,
      purchasePrice: "299.00",
      currentValue: "270.00",
      typeSpecificFields: { size: "L", harnessType: "Waist" },
    },
    {
      serialNumber: "MN-H-2023-014",
      type: "harness" as const,
      brand: "Manera",
      model: "Exo",
      yearOfPurchase: 2023,
      currentStationId: zanzibar.id,
      status: "active" as const,
      conditionRating: 3,
      purchasePrice: "249.00",
      currentValue: "130.00",
      typeSpecificFields: { size: "M", harnessType: "Seat" },
    },
    {
      serialNumber: "MY-HS-2024-015",
      type: "helmet_safety" as const,
      brand: "Mystic",
      model: "MK8 X Helmet",
      yearOfPurchase: 2024,
      currentStationId: fuerteventura.id,
      status: "active" as const,
      conditionRating: 5,
      purchasePrice: "89.00",
      currentValue: "80.00",
      typeSpecificFields: { size: "L", gearType: "Helmet" },
    },
    {
      serialNumber: "IO-HS-2023-016",
      type: "helmet_safety" as const,
      brand: "ION",
      model: "Collision Vest",
      yearOfPurchase: 2023,
      currentStationId: tarifa.id,
      status: "retired" as const,
      conditionRating: 1,
      purchasePrice: "79.00",
      currentValue: "0.00",
      salePrice: "15.00",
      typeSpecificFields: { size: "M", gearType: "Impact Vest" },
    },
    {
      serialNumber: "CR-K-2023-017",
      type: "kite" as const,
      brand: "Core",
      model: "Section 4",
      yearOfPurchase: 2023,
      currentStationId: zanzibar.id,
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
      currentStationId: zanzibar.id,
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
  await storage.createRepair({ equipmentId: createdEquipment[15].id, description: "Zipper replacement", cost: "35.00", status: "completed", loggedBy: admin.id });

  const transfer1 = await storage.createTransfer({
    equipmentId: createdEquipment[1].id,
    fromStationId: tarifa.id,
    toStationId: fuerteventura.id,
    initiatedBy: manager2.id,
  });
  await storage.confirmTransfer(transfer1.id, manager1.id);

  await storage.createTransfer({
    equipmentId: createdEquipment[9].id,
    fromStationId: fuerteventura.id,
    toStationId: zanzibar.id,
    initiatedBy: manager1.id,
  });

  await storage.createActivityLog({ userId: admin.id, action: "system_seeded", details: "Database seeded with sample data" });

  console.log("Database seeded successfully!");
  console.log("Admin: admin@kitetracker.com / admin123");
  console.log("Manager 1: manager1@kitetracker.com / manager123");
  console.log("Manager 2: manager2@kitetracker.com / manager123");
}
