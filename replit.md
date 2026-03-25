# KiteTracker - Equipment Management System

## Overview
KiteTracker is a full-stack web application designed to manage kitesurf school equipment across multiple global stations. It aims to streamline equipment tracking, damage reporting, inventory management, and sales processes. The project's vision is to provide a comprehensive, mobile-first solution for kitesurf schools to efficiently operate and manage their valuable assets, ultimately enhancing operational efficiency and customer satisfaction.

## User Preferences
I prefer clear, concise explanations and a systematic approach to development. Please ask before making any major architectural changes or significant modifications to existing features. I value iterative development with regular updates on progress.

## System Architecture

### UI/UX Decisions
The application features a mobile-first design, specifically optimized for iPhone Safari. It uses React with TypeScript, Vite, TailwindCSS, and `shadcn/ui` for a modern and responsive user interface. Key UI components include:
- A main layout with a persistent header and bottom navigation tabs for mobile.
- Condition/status badges for equipment.
- A barcode scanner (`html5-qrcode`) for efficient equipment identification.
- Dedicated pages for various modules like Login, Dashboard, Equipment List/Detail/Form, Transfers, Stations, Inventory Check, Invoice Import, User Management, Accessories, Activity Log, and Settings.
- A floating feedback button for authenticated users, supporting voice, text, and photo submissions.
- An in-app notification system with a bell icon and unread count, displaying alerts for new feedback, status changes, and comments.

### Technical Implementations
- **Frontend**: Built with React, TypeScript, Vite, TailwindCSS, and `shadcn/ui`. `wouter` is used for client-side routing, and `TanStack Query v5` for state management.
- **Backend**: Developed using Express.js with TypeScript.
- **Database**: PostgreSQL is used with Drizzle ORM for data persistence.
- **Authentication**: Passport.js with a local strategy and session management (using `connect-pg-simple` for session store) handles user authentication and authorization.
- **Role-Based Access Control**: Four tiers of user roles (Super Admin, Admin, Manager, Station Lead) are implemented with specific permissions and access restrictions, including Super-Admin-only actions enforced by middleware.
- **Object Storage**: For photo uploads (equipment, damage reports, feedback), a presigned URL flow is used to securely upload directly to Replit Object Storage. URLs are stored in the database with a `/objects/` prefix and served via a redirect route.
- **PDF Generation**: `pdfkit` is used server-side for generating sales invoices and school booking receipts, including German GmbH legal footer requirements.
- **Activity Logging**: A system-wide audit trail logs all significant events to the `activity_log` table, visible to relevant users with filtering capabilities.

### Feature Specifications
- **Equipment Management**: Comprehensive CRUD operations for various equipment types (kite, board, foil, wing, bar_lines) with type-specific JSONB fields. Includes condition rating history, repair logging, transfers between stations, and photo management.
- **Inventory Management**: Features an Inventory Check Mode with barcode scanning, progress tracking, and inventory reports. A "Quick Inventory" module specifically for station staff handles both equipment scans and accessory counts, with visual feedback and historical data.
- **Accessories (Zubehör)**: Quantity-based inventory managed per station, supporting categories, sizes, and transfers between stations with stock validation.
- **Damage Report / Incidents Module**: A full workflow for reporting and managing equipment damage, including photo uploads, status tracking, and admin notifications.
- **Sales Module**: Allows admins to create outgoing sales invoices, manage customers, select equipment, handle VAT, and generate PDF invoices. Integrates with price lists.
- **Invoice Import**: Supports PDF invoice import (Core, Duotone) with duplicate serial detection.
- **Price Lists**: Admins can upload manufacturer PDF price lists, parse SKUs/names/prices, and manage their validity.
- **Feedback System**: A floating button allows users to submit feedback with voice, text, and image attachments, including automatic page tracking. Admins can view, manage status, and engage in comment threads.
- **In-App & Email Notifications**: Automatic notifications for feedback events, damage reports, and other system activities, delivered in-app and via email (if configured).
- **School Module**: Per-station configuration for school services, including product catalogs (courses, lessons, rentals), CSV import/export for products, and customer management (guest types, kite levels).
- **School Bookings**: Allows creation of bookings from school products, payment status tracking, PDF receipt generation, and email functionality.

## External Dependencies
- **PostgreSQL**: Primary database for all application data.
- **Replit Object Storage**: Used for storing uploaded images (equipment photos, damage report photos, feedback attachments) and voice recordings.
- **Passport.js**: Authentication middleware.
- **`connect-pg-simple`**: PostgreSQL-backed session store for Passport.js.
- **`html5-qrcode`**: For barcode and QR scanning functionality.
- **`pdfkit`**: Server-side library for generating PDF documents (invoices, receipts).
- **Resend**: Optional email service for sending notifications (requires `RESEND_API_KEY`).
- **SMTP**: For sending admin notifications (requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).