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
  pages/
    login.tsx         - Login page
    dashboard.tsx     - Dashboard with stats
    equipment-list.tsx - Equipment list with filters
    equipment-detail.tsx - Equipment detail with tabs (photos, condition, repairs, transfers)
    equipment-form.tsx - Add equipment form (admin only)
    transfers.tsx     - Transfer management
    stations.tsx      - Station management (admin)
    users-page.tsx    - User management (admin)
    activity.tsx      - Activity log (admin)
    settings.tsx      - Settings + CSV import
```

## Database Tables
stations, users, equipment, condition_ratings, repairs, transfers, photos, activity_log

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
- Photo upload (stored in /uploads)
- CSV import for bulk equipment
- Activity logging
- Role-based access control (financial data hidden from managers)

## File Upload
Photos stored in /uploads directory, served via static route.
