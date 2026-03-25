# KiteTracker - Equipment Management System

## Overview
Full-stack web application for managing kitesurf school equipment across multiple stations worldwide. Mobile-first design optimized for iPhone Safari.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Passport.js local strategy with sessions (connect-pg-simple for session store)
- **Routing**: wouter (frontend), Express (backend)
- **State**: TanStack Query v5

## User Roles (4 tiers)
- **Super Admin** (`admin` + `isSuperAdmin=true`): Everything an Admin can do, plus: user CRUD, station deletion, equipment deletion, invoice deletion
- **Admin** (`admin`): Full access to features (equipment, imports, transfers, sales, price lists, activity log, stations), but cannot manage users or delete equipment/invoices/stations
- **Hamburg Manager** (`manager`): Equipment CRUD, transfers, invoice imports — no user management, no financial data, no activity log
- **Station Lead** (`station_lead`): Own station only, no purchase prices, no transfers/equipment creation, sees station activity

### Super-Admin-only actions (requireSuperAdmin middleware)
- POST/PATCH/DELETE `/api/users` — user CRUD
- DELETE `/api/stations/:id` — station deletion
- DELETE `/api/equipment/:id` — equipment deletion
- POST `/api/equipment/bulk-delete` — bulk equipment deletion
- DELETE `/api/invoices/:id` — invoice deletion

## Damage Report / Incidents Module
Full damage reporting workflow for station leads and managers.
- **DB Tables**: `damage_reports`, `damage_report_photos`
- **Triggers**: Equipment set to `in_repair` (auto-repair created) or `retired` (total loss) on submission
- **Photos**: Up to 3 damage photos via object storage (same presigned URL flow as equipment photos)
- **Admin notification**: Email sent on submission (SMTP env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
- **Status flow**: open → in_review → resolved (admin/manager only)
- **Routes**: `GET/POST /api/damage-reports`, `GET /api/damage-reports/:id`, `PATCH /api/damage-reports/:id/status`, `GET /api/equipment/:id/damage-reports`, `GET /api/damage-reports/:id/photos/upload-url`, `POST /api/damage-reports/:id/photos`
- **UI**: `/incidents` page (nav + bottom bar), "Report Damage" button on equipment detail, Damage tab on equipment detail

## Activity Log (System-wide Audit Trail)
All events are logged to `activity_log` table: equipment CRUD, transfers, repairs, photos, sales, inventory checks, logins, damage reports.
- Joined with user names and equipment labels in queries
- Global page: `/activity` — visible to all roles, station leads see their station only
- Equipment detail "History" tab: timeline view per item
- Routes: `GET /api/activity?userId=&action=&stationId=&dateFrom=&dateTo=` and `GET /api/equipment/:id/activity`

## Project Structure
```
shared/schema.ts      - Database schema (Drizzle), types, constants
server/
  index.ts            - Express server entry
  db.ts               - Database connection
  storage.ts          - Data access layer (IStorage interface + DatabaseStorage)
  routes.ts           - API routes
  auth.ts             - Authentication (passport, password hashing)
  seed.ts             - Sample data seeder
client/src/
  App.tsx             - Root with auth + routing
  lib/auth.tsx        - Auth context provider
  lib/queryClient.ts  - TanStack Query config
  components/
    layout.tsx        - Main layout with nav (header + bottom tabs)
    condition-badge.tsx - Condition/status badge components
  components/
    barcode-scanner.tsx - html5-qrcode modal scanner with manual fallback
  pages/
    login.tsx         - Login page
    dashboard.tsx     - Dashboard with stats
    equipment-list.tsx - Equipment list with filters, scan button, photo thumbnails
    equipment-detail.tsx - Equipment detail with tabs (photos, condition, repairs, transfers)
    equipment-form.tsx - Add equipment form (admin only); serial pre-fill via ?serial= URL param
    transfers.tsx     - Transfer management
    stations.tsx      - Station management (admin)
    station-detail.tsx - Station detail with inventory check button + past reports
    inventory-check.tsx - Inventory check workflow (checklist, scanner, progress)
    invoice-import.tsx - 4-step PDF invoice import wizard (admin only)
    users-page.tsx    - User management (admin)
    accessories.tsx   - Accessories (Zubehör) quantity management per station
    activity.tsx      - Activity log (admin)
    settings.tsx      - Settings + CSV import
```

## Feedback / Bug Report System
Floating feedback button (bottom-right) visible to all authenticated users. Supports:
- **Voice recording**: MediaRecorder API for audio messages (stored in Object Storage)
- **Text messages**: Optional text field
- **Screenshots/photos**: Optional image attachment (stored in Object Storage)
- **Auto page tracking**: Current URL/page automatically captured with each submission
- **Admin view**: `/feedback` page — admins see all feedback, non-admins see their own. Status management (open/in_progress/resolved), filters, audio playback, admin notes
- **Comment thread**: Each feedback item has a comment section for back-and-forth dialogue between submitter and admin
- **DB Tables**: `feedback` (id, userId, pageUrl, message, audioUrl, screenshotUrl, status, adminNotes, createdAt), `feedback_comments` (id, feedbackId, userId, message, createdAt)
- **Routes**: `GET /api/feedback` (all — filtered by role), `POST /api/feedback` (all), `PATCH /api/feedback/:id` (admin), `GET /api/feedback/open-count`, `GET /api/feedback/upload-url`, `GET /api/feedback/:id/comments`, `POST /api/feedback/:id/comments`

## In-App Notifications
Bell icon in header with unread badge count. Notifications created automatically for:
- **New feedback**: All admins notified when any user submits feedback
- **Feedback status change**: Feedback author notified when admin updates status
- **Feedback comment**: Other party notified when a comment is posted (admin→author or author→admins)
- **E-Mail notifications**: All feedback events (new, status change, comment) + damage reports send emails via Resend when configured (RESEND_API_KEY env var). Optional EMAIL_FROM for custom sender. Shared helper `sendNotificationEmail()` in routes.ts.
- **Dashboard alert**: Orange card on admin dashboard shows open feedback count with link
- **DB Table**: `notifications` (id, userId, type, title, message, link, read, createdAt)
- **Routes**: `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/mark-all-read`

## Quick Inventory (Center Manager)
Mobile-first page for station staff to perform two independent inventory tasks:
- **Equipment Scan**: Reuses existing inventory_checks/inventory_check_items system (barcode scanner, serial-number based)
- **Accessory Count**: New count-based workflow for accessories (harnesses, wetsuits, helmets, etc.)
  - Loads station's accessory_inventory as target quantities
  - Per-row +/- buttons and number input for actual counts
  - Green/red visual feedback for match/difference
  - Notes field auto-shows on differences
  - Saves to `accessory_checks` + `accessory_check_items` (historical, never overwritten)
- **History**: Last 5 completed equipment checks and accessory counts
- **Simulation mode**: Admin users simulating station_lead can pick a station
- **DB Tables**: `accessory_checks` (session header), `accessory_check_items` (per-category counts)
- **Routes**: `GET /api/stations/:id/quick-inventory`, `GET/POST /api/stations/:id/accessory-checks`, `GET /api/accessory-checks/:id/items`
- **Nav**: Visible for station_lead role; first item in mobile bottom tabs

## Database Tables
stations, users, equipment, condition_ratings, repairs, transfers, photos, activity_log, inventory_checks, inventory_check_items, suppliers, invoices, feedback, feedback_comments, notifications, accessory_categories, accessory_inventory, accessory_transfers, accessory_checks, accessory_check_items, school_configs, school_products, school_customers, school_bookings, school_booking_items

## Equipment Types
kite, board, foil, wing, bar_lines
Each uses a JSONB column `type_specific_fields` for type-specific attributes.

## Accessories (Zubehör)
Quantity-based inventory managed per station (not individual items like equipment).
- **Categories**: Weste, Helm, Neopren, Sitztrapez, Hüfttrapez, Pumpe (defaults), custom categories can be added
- **Sizes**: XS, S, M, L, XL for sized categories; "Einheitsgröße" for one-size items (e.g. Pumpe)
- **Transfers**: Move quantities between stations with stock validation (transactional)
- **DB Tables**: `accessory_categories`, `accessory_inventory` (unique per category+station+size), `accessory_transfers`
- **Routes**: `GET/POST/DELETE /api/accessory-categories`, `GET/PATCH /api/accessory-inventory`, `GET/POST /api/accessory-transfers`
- **Auth**: Category CRUD requires admin; inventory/transfer accessible to all authenticated users
- **UI**: `/accessories` page with station-grouped tables, +/- quantity buttons, transfer dialog, category management
- **Migration**: wetsuit, harness, helmet_safety removed from equipment types; these are now managed as accessories

## Sample Accounts
- admin@kitetracker.com / admin123 (Admin)
- manager1@kitetracker.com / manager123 (Manager, Fuerteventura)
- manager2@kitetracker.com / manager123 (Manager, Tarifa)

## Key Features
- Equipment CRUD with type-specific fields
- Condition rating history (1-5 scale)
- Repair logging
- Equipment transfers between stations
- Photo upload via Replit Object Storage (presigned URL flow; mobile: Take Photo + Library buttons)
- Photo lightbox viewer with uploader name + timestamp
- Photo thumbnails on equipment list cards
- Barcode/QR scanner (html5-qrcode, in nav header + equipment list; scan → detail or pre-fill new form)
- Inventory Check Mode: station checklist, progress bar, condition stars, repair/missing flags, auto-check on scan
- Inventory reports per station (admin: past checks history)
- CSV import for bulk equipment
- Invoice import: Core (PDF) + Duotone (PDF) supplier invoices with duplicate serial detection
- Duplicate serial detection: both during invoice import (auto-skip + link) and manual entry (real-time check + confirm)
- Sales section (admin only): create outgoing sales invoices, customer management, equipment selection, VAT/payment options
- PDF invoice generation (pdfkit, server-side) with German GmbH legal footer
- Company settings management (logo, bank details, invoice prefix, all GmbH required fields)
- Sales overview with confirm/PDF download per invoice; confirming marks equipment as Sold
- Price Lists (admin only): upload manufacturer PDF price lists per supplier; heuristic SKU/name/price parser; preview + confirm before saving; one active list per supplier; UVP shown on sale create + equipment detail; validity dates (validFrom/validTo) per price list; equipment.priceListId references which price list was used at purchase time; PATCH /api/price-lists/:id for updating validity dates
- Activity logging
- Role-based access control (financial data hidden from managers)

## School Module
- **School Configs**: Per-station school setup with name, currency (MAD/EUR/BRL), active flag
- **Product Catalog**: Course, Lesson, Package, Rental, Other categories with per-school pricing
- **CSV Import/Export**: RFC4180-compliant parser supporting quoted fields, embedded commas. Import preview with category auto-mapping (Kite Service/Licence → Other). Option to replace or append. Export current products. Download CSV template.
- **Bulk Import Endpoint**: `POST /api/school-products/import` — accepts array of products + replaceExisting flag, atomic transaction
- **DB Tables**: `school_configs`, `school_products`
- **Routes**: `GET /api/school-configs`, `POST /api/school-configs`, `PATCH /api/school-configs/:id`, `GET /api/school-products/:schoolConfigId`, `POST /api/school-products`, `POST /api/school-products/import`, `PATCH /api/school-products/:id`
- **UI**: `/school-admin` page (admin only)
- **Current Data**: Dakhla = schoolConfigId 1, 29 products in MAD

## Customer Management
- **DB Table**: `school_customers` with `guest_type` enum (`KiteWorldWide` | `Walk-in`)
- **Guest Types**: KiteWorldWide = pre-booked via ERP (future auto-import), Walk-in = direct booking billed on-site
- **Kite Level**: `kite_level` enum (Beginner/Intermediate/Advanced/Pro)
- **Access**: Center Manager (station_lead) and Admin; nav visible for station_lead only
- **Routes**: `/customers` page; API: GET/POST/PATCH/DELETE `/api/school-customers`
- **Fields**: guestType, firstName, lastName, email, phone, nationality, dateOfBirth, kiteLevel, weightKg, emergencyContact, arrivalDate, departureDate, notes
- **Seed data**: 4 sample guests at Dakhla (2 KWW + 2 Walk-in)

## School Bookings & Receipts
- **Access**: Admin + Station Lead only (station_lead scoped to their station)
- **DB Tables**: `school_bookings` (bookingNumber, customerName, customerEmail, bookingDate, paymentStatus, totalAmount, currency, pdfUrl, emailSentAt), `school_booking_items` (productName, category, quantity, unitPrice, lineTotal)
- **Booking Number**: Auto-generated format `SCH-{stationCode}-{year}-{seq}` (e.g. SCH-DK-2026-001)
- **Station Short Codes**: DK=Dakhla, TJ=Tatajuba, HH=Hamburg, HD=Heidenau
- **Payment Status**: unpaid, cash, credit_card
- **PDF Receipt**: Generated on-the-fly via pdfkit (A4, branded header, itemized table)
- **Email**: Sends receipt email with PDF attachment, records emailSentAt timestamp
- **Routes**: `GET /api/school-bookings/detail/:id`, `GET /api/school-bookings/next-number/:schoolConfigId`, `GET /api/school-bookings/:schoolConfigId`, `POST /api/school-bookings`, `PATCH /api/school-bookings/:id/payment`, `GET /api/school-bookings/:id/pdf`, `POST /api/school-bookings/:id/email`
- **Route Order**: Static paths (detail, next-number) registered before parameterized /:schoolConfigId
- **UI**: `/bookings` page with school selector, search, payment filter, date range filter, create dialog with product picker

## Object Storage
Photos uploaded via Replit Object Storage presigned URL flow:
1. Client GETs upload URL from /api/equipment/:id/photos/upload-url
2. Client PUTs file directly to presigned URL
3. Client POSTs {url} to /api/equipment/:id/photos to save metadata
Served via `/objects/{*objectPath}` route which redirects to a signed GET URL (not streamed).
URLs stored in DB already include `/objects/` prefix — do NOT double-prefix in UI templates.

## Inventory Check Flow
POST /api/stations/:id/inventory-checks → creates check + items for all station equipment
GET /api/inventory-checks/:id → returns {check, items, equipment}
PATCH /api/inventory-checks/:id/items/:equipmentId → update checked/condition/flags
PATCH /api/inventory-checks/:id/complete → mark completed
