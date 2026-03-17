# Inventory Check System — Reconnaissance Report

## 1. Datenbankschema

### `inventory_checks`

| Spalte | Typ | Details |
|--------|-----|---------|
| `id` | serial PK | |
| `station_id` | integer FK → stations | |
| `started_by` | integer FK → users | |
| `started_at` | timestamp | defaultNow |
| `completed_at` | timestamp | nullable |
| `status` | enum | `in_progress` \| `completed` |
| `total_items` | integer | Snapshot beim Start |

### `inventory_check_items`

| Spalte | Typ | Details |
|--------|-----|---------|
| `id` | serial PK | |
| `check_id` | integer FK → inventory_checks | |
| `equipment_id` | integer FK → equipment | |
| `checked` | integer | 0 = nein, 1 = ja |
| `condition_rating` | integer | 1–5, nullable |
| `needs_repair` | integer | 0 oder 1 |
| `missing` | integer | 0 oder 1 |
| `notes` | text | nullable |
| `checked_at` | timestamp | nullable |
| `checked_by` | integer FK → users | nullable |

---

## 2. API-Routen

| Method | Route | Funktion |
|--------|-------|----------|
| `POST` | `/api/stations/:id/inventory-checks` | Neue Check-Session erstellen — Snapshot aller Equipment an der Station |
| `GET` | `/api/stations/:id/inventory-checks` | Alle Checks einer Station auflisten |
| `GET` | `/api/inventory-checks/:id` | Check + Items + Equipment laden |
| `PATCH` | `/api/inventory-checks/:id/complete` | Check abschließen |
| `PATCH` | `/api/inventory-checks/:id/items/:equipmentId` | Einzelnes Item aktualisieren (`checked`, `conditionRating`, `needsRepair`, `missing`, `notes`) |

---

## 3. Beteiligte Dateien

| Datei | Rolle |
|-------|-------|
| `client/src/pages/inventory-check.tsx` | Hauptseite für den Check-Ablauf |
| `client/src/pages/station-detail.tsx` | Check starten, vergangene Checks auflisten |
| `client/src/components/barcode-scanner.tsx` | Kamera-Scanner-Komponente (Quagga2) |
| `client/src/App.tsx` | Route `/inventory-check/:id` |

---

## 4. Serial Number auf Equipment

`equipment.serial_number` ist ein `text NOT NULL UNIQUE`-Feld und der primäre Identifier. Der Scanner matcht über:

```ts
e.serialNumber.toLowerCase() === code.toLowerCase()
```

---

## 5. Equipment ohne Seriennummer (Harness, Wetsuit etc.)

**Nicht gelöst im Equipment-Modul.** Jedes Equipment-Objekt muss eine Seriennummer haben (`NOT NULL UNIQUE`). Harnesses und Wetsuits werden als einzelne Equipment-Einträge mit jeweils eigener Seriennummer angelegt. Es gibt kein `quantity`-Feld im `equipment`-Table.

Mengenverwaltung existiert nur im **Accessories-Modul** (`accessory_inventory.quantity`) — das ist jedoch ein separates System für Kleinteile, nicht für inventarisierte Hauptgeräte.

---

## 6. Inventory-Flow aus Sicht des Center Managers / Station Lead

1. Nutzer öffnet **Station Detail** → sieht Sektion "Inventory Checks"
2. Klickt **"Start Inventory Check"** → `POST /api/stations/:id/inventory-checks` erstellt neue Session, navigiert zu `/inventory-check/:id`
3. Auf der Check-Seite: großer **"Scan Barcode / QR Code"**-Button öffnet Kamera-Dialog
4. Scan oder manuelle Eingabe einer Seriennummer → Item wird als `checked` markiert, Screen scrollt und hebt das Element hervor
5. Optional: Item aufklappen → Condition (1–5 Sterne), "Needs Repair", "Missing", Notizen setzen
6. Wenn fertig: **"Complete Check"**-Button → Status wechselt auf `completed`

---

## 7. Barcode / QR-Scanner

**Vollständig implementiert** mit [Quagga2](https://github.com/ericblade/quagga2) (Library bereits im Bundle).

| Eigenschaft | Details |
|-------------|---------|
| Kamera | Rückkamera (`facingMode: environment`), iPhone-optimiert |
| Formate | `code_128`, `code_39` (typische Hersteller-Seriennummern-Barcodes) |
| Ignoriert | EAN-13 / UPC-A (12–13-stellige Zahlen = Produkt-Barcodes) |
| Bestätigung | Erst nach 2× gleichem Treffer (Fehlerreduktion) |
| Fallback | Manuelle Texteingabe im gleichen Dialog |

Seriennummern werden primär per Scan erfasst; manuelle Eingabe ist der Fallback.
