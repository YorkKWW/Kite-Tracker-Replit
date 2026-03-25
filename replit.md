# KiteTracker - Equipment Management System

## Overview
KiteTracker is a full-stack web application designed for comprehensive equipment management in kitesurf schools globally. It provides a robust system for tracking, maintaining, and managing kitesurfing gear across multiple stations. The primary goal is to streamline operations for kitesurf schools, ensuring efficient inventory control, damage reporting, sales, and school-specific services. The application boasts a mobile-first design, specifically optimized for iPhone Safari, aiming for a seamless user experience on the go. Its capabilities extend from basic equipment CRUD to complex features like invoice processing, activity logging, and a dedicated school module for managing products, customers, and bookings.

## User Preferences
I want to work with a mobile-first approach, prioritizing responsive design and touch-friendly interfaces. I prefer clear, concise explanations and iterative development. Ask me before making any major architectural changes or introducing new external dependencies.

## System Architecture
KiteTracker is built as a full-stack web application.

**Frontend**: Developed with React, TypeScript, Vite, TailwindCSS, and shadcn/ui, it ensures a modern and responsive user interface. State management is handled by TanStack Query v5, and client-side routing uses wouter. The UI/UX prioritizes a clean, intuitive design with components like condition badges and a barcode scanner for efficient equipment handling. The main layout includes a header and bottom tab navigation for mobile accessibility.

**Backend**: Implemented using Express.js with TypeScript, providing a robust API layer. Authentication is managed via Passport.js with a local strategy and session-based authentication, using connect-pg-simple for session storage.

**Database**: PostgreSQL is used as the primary data store, with Drizzle ORM for type-safe database interactions. The database schema includes tables for equipment, users, stations, sales, repairs, damage reports, activity logs, feedback, notifications, and school-specific modules.

**Core Features & Technical Implementations**:
- **Role-Based Access Control**: A 4-tier system (Super Admin, Admin, Manager, Station Lead) dictates feature access and data visibility. Specific actions, like user or station deletion, are restricted to Super Admins.
- **Equipment Management**: Supports CRUD operations for various equipment types (kite, board, foil, wing, bar_lines) with type-specific fields stored in JSONB columns. Includes condition rating history, repair logging, and inter-station transfers.
- **Photo Management**: Uses Replit Object Storage for storing equipment, damage report, and feedback photos, utilizing a presigned URL workflow for secure uploads. Photos are displayed with lightbox viewers and thumbnails.
- **Barcode/QR Scanning**: Integrates `html5-qrcode` for efficient equipment identification and inventory processes.
- **Inventory & Stock Control**: Features include detailed inventory checks with progress tracking, bulk CSV imports, and duplicate serial detection during manual entry and invoice imports. A "Quick Inventory" module facilitates equipment scanning and accessory counting for station staff.
- **Sales & Invoicing**: Provides tools for creating outgoing sales invoices, customer management, PDF invoice generation (server-side with pdfkit), and tracking equipment sales. Price lists can be uploaded and managed, influencing sales pricing.
- **Damage Reporting**: A comprehensive workflow for tracking equipment incidents, including photo uploads and status management, with automatic equipment status updates (in_repair, retired) and admin notifications.
- **Activity Logging**: A system-wide audit trail logs all significant events, providing transparency and accountability.
- **Feedback System**: A floating feedback button allows users to submit voice recordings, text messages, and screenshots. Admins have a dedicated view to manage feedback, track status, and engage in comment threads.
- **In-App Notifications**: Real-time notifications for feedback status changes, comments, and new damage reports, delivered via an in-app bell icon and optionally via email using Resend.
- **School Module**: Manages school-specific configurations, product catalogs (courses, rentals), customer data, and booking management with auto-generated booking numbers and PDF receipt generation. Accessory inventory is managed by quantity per station, with categories and size variations.
- **Center Page** (`/center`): Consolidated hub for station operations with 5 tabs: Customers | Bookings | Forecast | Sales | Incidents. Station leads auto-resolve their school from `assignedStationId`. Customers tab shows list with payment status indicators (green/red dots), customer detail includes booking history with payment update, PDF, and email actions. Bookings has sub-tabs: New Booking and Timeline (Gantt view). Forecast tab shows 35-day occupancy bar chart with summary cards (guests today, arrivals/departures this week, open payments). Admins see a school selector dropdown. Supports simulation mode via `simStationId`.

**Project Structure**: The codebase is organized into `shared`, `server`, and `client` directories. `shared/schema.ts` defines database schemas and types. The `server` directory contains API routes, database connection, storage logic, and authentication. The `client/src` directory houses React components, pages, and application logic, with `lib/auth.tsx` for authentication context and `lib/queryClient.ts` for TanStack Query configuration.

## External Dependencies
- **PostgreSQL**: Relational database for all application data.
- **Replit Object Storage**: For storing and serving image and audio files (equipment photos, damage report photos, feedback audio/screenshots).
- **Resend**: Optional email service for sending notifications (feedback, damage reports). Requires `RESEND_API_KEY`.
- **Passport.js**: Authentication middleware.
- **connect-pg-simple**: PostgreSQL-backed session store for Passport.js.
- **TanStack Query v5**: Frontend data fetching and state management.
- **html5-qrcode**: For barcode and QR code scanning functionality.
- **pdfkit**: Server-side PDF generation for invoices and booking receipts.
- **Stripe**: (Implied/Potential for future payment gateway integration in sales module, not explicitly detailed as integrated yet but common for sales features).