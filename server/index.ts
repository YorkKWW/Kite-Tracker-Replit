import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  const { seedDatabase } = await import("./seed");
  await seedDatabase();

  const { db: dbInstance } = await import("./db");
  const { sql } = await import("drizzle-orm");
  try {
    const kitePattern = ' ([0-9]+[.][0-9]+)( |$)';
    const boardPattern = '([0-9]{2,3})x[0-9]{2,3}';

    const typeFixRes = await dbInstance.execute(sql`
      UPDATE equipment SET type = 'board'
      WHERE type = 'kite'
        AND (model ~* 'freeride|choice|deluxe|fusion' OR model ~ '[0-9]{3}x[0-9]{2}')
        AND model !~* 'nexus|xr[0-9]|gts[0-9]|rebel|evo|delta'
    `);

    const kiteRes = await dbInstance.execute(sql`
      UPDATE equipment 
      SET type_specific_fields = jsonb_set(
        type_specific_fields::jsonb, '{size}', 
        to_jsonb((regexp_match(model, ${kitePattern}))[1])
      )
      WHERE type IN ('kite', 'wing') 
        AND model ~ ${kitePattern}
        AND type_specific_fields::jsonb->>'size' != (regexp_match(model, ${kitePattern}))[1]
    `);
    const boardRes = await dbInstance.execute(sql`
      UPDATE equipment 
      SET type_specific_fields = jsonb_set(
        type_specific_fields::jsonb, '{size}', 
        to_jsonb((regexp_match(model, ${boardPattern}))[1])
      )
      WHERE type IN ('board', 'foilboard') 
        AND model ~ ${boardPattern}
        AND type_specific_fields::jsonb->>'size' != (regexp_match(model, ${boardPattern}))[1]
    `);
    console.log(`Equipment size migration: ${typeFixRes.rowCount} type fixes, ${kiteRes.rowCount} kites, ${boardRes.rowCount} boards`);

    const stationFixes = [
      { oldName: "Fuerteventura", newName: "Dakhla", location: "Dakhla", country: "Morocco" },
      { oldName: "Zanzibar", newName: "Tatajuba", location: "Tatajuba", country: "Brazil" },
      { oldName: "Office Hamburg Shop", newName: "Office Hamburg Warehouse", location: "Hamburg", country: "Germany" },
      { oldName: "Office Hamburg Warehouse/Incoming", newName: "Incoming – Not Yet Assigned", location: "Hamburg", country: "Germany" },
    ];
    for (const fix of stationFixes) {
      const res = await dbInstance.execute(sql`
        UPDATE stations SET name = ${fix.newName}, location = ${fix.location}, country = ${fix.country}
        WHERE name = ${fix.oldName}
      `);
      if (res.rowCount && res.rowCount > 0) {
        console.log(`Station renamed: "${fix.oldName}" → "${fix.newName}"`);
      }
    }
    const stationsToRemove = ['Tarifa', 'Incoming – Not Yet Assigned'];
    for (const stName of stationsToRemove) {
      await dbInstance.execute(sql`
        UPDATE equipment SET current_station_id = NULL WHERE current_station_id IN (
          SELECT id FROM stations WHERE name = ${stName}
        )
      `);
      const delRes = await dbInstance.execute(sql`
        DELETE FROM stations WHERE name = ${stName}
      `);
      if (delRes.rowCount && delRes.rowCount > 0) {
        console.log(`Removed station: "${stName}"`);
      }
    }

    const stationOrder = [
      { name: "Dakhla", sort: 1 },
      { name: "Tatajuba", sort: 2 },
      { name: "Office Hamburg Warehouse", sort: 3 },
      { name: "Service Center Heidenau", sort: 4 },
    ];
    for (const so of stationOrder) {
      await dbInstance.execute(sql`
        UPDATE stations SET sort_order = ${so.sort} WHERE name = ${so.name}
      `);
    }
    await dbInstance.execute(sql`
      DELETE FROM stations WHERE name = 'Andesheim'
        AND NOT EXISTS (SELECT 1 FROM equipment WHERE current_station_id = stations.id)
    `);

    await dbInstance.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false
    `);
    await dbInstance.execute(sql`
      UPDATE users SET is_super_admin = true WHERE email = 'admin@kitetracker.com' AND is_super_admin = false
    `);
    await dbInstance.execute(sql`
      UPDATE users SET is_super_admin = true, role = 'admin' WHERE email = 'york@kiteworldwide.com' AND is_super_admin = false
    `);

    await dbInstance.execute(sql`
      CREATE TABLE IF NOT EXISTS feedback_comments (
        id SERIAL PRIMARY KEY,
        feedback_id INTEGER NOT NULL REFERENCES feedback(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await dbInstance.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await dbInstance.execute(sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await dbInstance.execute(sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read)`);
    await dbInstance.execute(sql`CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback_id ON feedback_comments(feedback_id)`);

    await dbInstance.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS can_edit_equipment boolean NOT NULL DEFAULT false
    `);

    await dbInstance.execute(sql`
      CREATE TABLE IF NOT EXISTS feedback_attachments (
        id SERIAL PRIMARY KEY,
        feedback_id INTEGER NOT NULL REFERENCES feedback(id),
        url TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'image',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await dbInstance.execute(sql`
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ticket_number TEXT
    `);

    // Assign ticket numbers to existing feedback that don't have one
    await dbInstance.execute(sql`
      UPDATE feedback SET ticket_number = 'FB-' || LPAD(id::text, 4, '0')
      WHERE ticket_number IS NULL
    `);

    // Accessory tables
    await dbInstance.execute(sql`
      CREATE TABLE IF NOT EXISTS accessory_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        has_sizes BOOLEAN NOT NULL DEFAULT true,
        is_default BOOLEAN NOT NULL DEFAULT false,
        sort_order INTEGER NOT NULL DEFAULT 100
      )
    `);

    await dbInstance.execute(sql`
      CREATE TABLE IF NOT EXISTS accessory_inventory (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES accessory_categories(id),
        station_id INTEGER NOT NULL REFERENCES stations(id),
        size TEXT NOT NULL DEFAULT 'One Size',
        quantity INTEGER NOT NULL DEFAULT 0
      )
    `);

    await dbInstance.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS accessory_inventory_unique
      ON accessory_inventory (category_id, station_id, size)
    `);

    await dbInstance.execute(sql`
      CREATE TABLE IF NOT EXISTS accessory_transfers (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES accessory_categories(id),
        size TEXT NOT NULL DEFAULT 'One Size',
        quantity INTEGER NOT NULL DEFAULT 1,
        from_station_id INTEGER NOT NULL REFERENCES stations(id),
        to_station_id INTEGER NOT NULL REFERENCES stations(id),
        transferred_by INTEGER REFERENCES users(id),
        transferred_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // School module tables
    await dbInstance.execute(sql`
      DO $$ BEGIN
        CREATE TYPE school_product_category AS ENUM ('Course','Lesson','Package','Rental','Other');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await dbInstance.execute(sql`
      CREATE TABLE IF NOT EXISTS school_configs (
        id SERIAL PRIMARY KEY,
        station_id INTEGER NOT NULL UNIQUE REFERENCES stations(id),
        school_name TEXT NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'MAD',
        is_active BOOLEAN NOT NULL DEFAULT true,
        contact_email TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await dbInstance.execute(sql`
      CREATE TABLE IF NOT EXISTS school_products (
        id SERIAL PRIMARY KEY,
        school_config_id INTEGER NOT NULL REFERENCES school_configs(id),
        name TEXT NOT NULL,
        description TEXT,
        category school_product_category NOT NULL,
        default_price DECIMAL(10,2) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Seed Dakhla school if not exists
    await dbInstance.execute(sql`
      INSERT INTO school_configs (station_id, school_name, currency, is_active, contact_email)
      SELECT id, 'KiteWorldWide Dakhla School', 'MAD', true, NULL
      FROM stations WHERE name ILIKE '%dakhla%'
      AND NOT EXISTS (SELECT 1 FROM school_configs sc JOIN stations st ON sc.station_id = st.id WHERE st.name ILIKE '%dakhla%')
      LIMIT 1
    `);

    await dbInstance.execute(sql`
      INSERT INTO school_products (school_config_id, name, category, default_price, sort_order)
      SELECT sc.id, p.name, p.cat::school_product_category, p.price, p.ord
      FROM school_configs sc
      JOIN stations st ON sc.station_id = st.id
      CROSS JOIN (VALUES
        ('5-Day Beginner Course',   'Course',  6500, 1),
        ('3-Day Refresher Course',  'Course',  4200, 2),
        ('Private Lesson 1h',       'Lesson',   800, 3),
        ('Private Lesson 2h',       'Lesson',  1400, 4),
        ('3h Lesson Package',       'Package', 2100, 5),
        ('Kite Rental per Day',     'Rental',   500, 6),
        ('Harness Rental per Day',  'Rental',   200, 7),
        ('Foil Lesson 1h',          'Lesson',  1000, 8),
        ('Wing Lesson 1h',          'Lesson',   900, 9),
        ('Downwinder Tour',         'Other',   1200, 10)
      ) AS p(name, cat, price, ord)
      WHERE st.name ILIKE '%dakhla%'
      AND NOT EXISTS (SELECT 1 FROM school_products sp WHERE sp.school_config_id = sc.id)
    `);

    await dbInstance.execute(sql`
      CREATE TABLE IF NOT EXISTS school_customers (
        id SERIAL PRIMARY KEY,
        school_config_id INTEGER NOT NULL REFERENCES school_configs(id),
        guest_type TEXT NOT NULL DEFAULT 'Walk-in',
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        nationality TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        kite_level TEXT NOT NULL,
        weight_kg INTEGER,
        emergency_contact TEXT NOT NULL,
        arrival_date TEXT NOT NULL,
        departure_date TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id)
      )
    `);

    await dbInstance.execute(sql`
      ALTER TABLE school_customers ADD COLUMN IF NOT EXISTS guest_type TEXT NOT NULL DEFAULT 'Walk-in'
    `);

    // Convert enum columns to text if they were previously created as enums
    await dbInstance.execute(sql.raw(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'school_customers' AND column_name = 'kite_level'
            AND data_type = 'USER-DEFINED'
        ) THEN
          ALTER TABLE school_customers ALTER COLUMN kite_level DROP DEFAULT;
          ALTER TABLE school_customers ALTER COLUMN kite_level TYPE TEXT USING kite_level::TEXT;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'school_customers' AND column_name = 'guest_type'
            AND data_type = 'USER-DEFINED'
        ) THEN
          ALTER TABLE school_customers ALTER COLUMN guest_type DROP DEFAULT;
          ALTER TABLE school_customers ALTER COLUMN guest_type TYPE TEXT USING guest_type::TEXT;
          ALTER TABLE school_customers ALTER COLUMN guest_type SET DEFAULT 'Walk-in';
        END IF;
      END $$
    `));

    await dbInstance.execute(sql`
      INSERT INTO school_customers (school_config_id, guest_type, first_name, last_name, email, phone, nationality, date_of_birth, kite_level, weight_kg, emergency_contact, arrival_date, departure_date, notes)
      SELECT sc.id, c.gt, c.fn, c.ln, c.em, c.ph, c.nat, c.dob, c.kl, c.wt, c.ec, c.arr, c.dep, c.nt
      FROM school_configs sc
      JOIN stations st ON sc.station_id = st.id
      CROSS JOIN (VALUES
        ('KiteWorldWide', 'Sophie', 'Müller', 'sophie.mueller@gmail.com', '+49 170 1234567', 'Germany', '1992-05-15', 'Beginner', 62, 'Hans Müller +49 170 9876543', '2026-03-14', '2026-03-21', 'First kite trip, very excited'),
        ('KiteWorldWide', 'Jean-Pierre', 'Dubois', 'jp.dubois@outlook.fr', '+33 6 12345678', 'France', '1988-11-20', 'Intermediate', 78, 'Marie Dubois +33 6 87654321', '2026-03-15', '2026-03-22', NULL),
        ('Walk-in', 'Carlos', 'Rodriguez', 'carlos.r@yahoo.es', '+34 612 345 678', 'Spain', '1995-03-08', 'Advanced', 82, 'Ana Rodriguez +34 612 876 543', '2026-03-16', '2026-03-18', 'Wants to try foiling'),
        ('Walk-in', 'Emma', 'Thompson', 'emma.t@icloud.com', '+44 7700 123456', 'United Kingdom', '1990-08-25', 'Pro', 65, 'James Thompson +44 7700 654321', '2026-03-10', '2026-03-24', 'Competition rider, bringing own gear')
      ) AS c(gt, fn, ln, em, ph, nat, dob, kl, wt, ec, arr, dep, nt)
      WHERE st.name ILIKE '%dakhla%'
      AND NOT EXISTS (SELECT 1 FROM school_customers cst WHERE cst.school_config_id = sc.id)
    `);

    await dbInstance.execute(sql`
      CREATE TABLE IF NOT EXISTS accessory_loss_reports (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES accessory_categories(id),
        station_id INTEGER NOT NULL REFERENCES stations(id),
        size TEXT NOT NULL DEFAULT 'One Size',
        quantity INTEGER NOT NULL DEFAULT 1,
        reason TEXT NOT NULL,
        reported_by INTEGER NOT NULL REFERENCES users(id),
        reported_at TIMESTAMP DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'pending',
        resolved_by INTEGER REFERENCES users(id),
        resolved_at TIMESTAMP,
        admin_note TEXT
      )
    `);
    await dbInstance.execute(sql`
      CREATE TABLE IF NOT EXISTS accessory_checks (
        id SERIAL PRIMARY KEY,
        station_id INTEGER NOT NULL REFERENCES stations(id),
        checked_by INTEGER NOT NULL REFERENCES users(id),
        checked_at TIMESTAMP DEFAULT NOW(),
        total_categories INTEGER NOT NULL DEFAULT 0,
        total_differences INTEGER NOT NULL DEFAULT 0
      )
    `);
    await dbInstance.execute(sql`
      CREATE TABLE IF NOT EXISTS accessory_check_items (
        id SERIAL PRIMARY KEY,
        check_id INTEGER NOT NULL REFERENCES accessory_checks(id),
        category_id INTEGER NOT NULL REFERENCES accessory_categories(id),
        size TEXT,
        target_quantity INTEGER NOT NULL DEFAULT 0,
        actual_quantity INTEGER NOT NULL DEFAULT 0,
        notes TEXT
      )
    `);

    // Rename constraints to match Drizzle-expected naming (idempotent)
    const constraintRenames = [
      { table: "suppliers", from: "suppliers_name_key", to: "suppliers_name_unique" },
      { table: "accessory_categories", from: "accessory_categories_name_key", to: "accessory_categories_name_unique" },
      { table: "school_configs", from: "school_configs_station_id_key", to: "school_configs_station_id_unique" },
      { table: "sales_invoices", from: "sales_invoices_invoice_number_key", to: "sales_invoices_invoice_number_unique" },
    ];
    for (const { table, from, to } of constraintRenames) {
      await dbInstance.execute(sql.raw(`
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = '${table}' AND constraint_name = '${from}'
          ) THEN
            ALTER TABLE ${table} RENAME CONSTRAINT ${from} TO ${to};
          END IF;
        END $$
      `));
    }
  } catch (e) {
    console.error("Equipment size migration error:", e);
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
