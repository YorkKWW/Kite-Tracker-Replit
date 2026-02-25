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

## User Roles
- **Admin**: Full access to all stations, equipment, financial data, user/station management
- **Station Manager**: Access limited to their assigned station, no financial data visibility

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
    activity.tsx      - Activity log (admin)
    settings.tsx      - Settings + CSV import
```

## Database Tables
stations, users, equipment, condition_ratings, repairs, transfers, photos, activity_log, inventory_checks, inventory_check_items, suppliers, invoices

## Equipment Types
kite, board, foil, wing, bar_lines, wetsuit, harness, helmet_safety
Each uses a JSONB column `type_specific_fields` for type-specific attributes.

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
- Activity logging
- Role-based access control (financial data hidden from managers)

## Object Storage
Photos uploaded via Replit Object Storage presigned URL flow:
1. Client GETs upload URL from /api/equipment/:id/photos/upload-url
2. Client PUTs file directly to presigned URL
3. Client POSTs {url} to /api/equipment/:id/photos to save metadata
Served via /objects/:path proxy route.

## Inventory Check Flow
POST /api/stations/:id/inventory-checks → creates check + items for all station equipment
GET /api/inventory-checks/:id → returns {check, items, equipment}
PATCH /api/inventory-checks/:id/items/:equipmentId → update checked/condition/flags
PATCH /api/inventory-checks/:id/complete → mark completed
