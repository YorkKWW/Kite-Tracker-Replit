import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import pg from "pg";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function preMigrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    // Ensure enums exist
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE kite_level AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Pro');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE guest_type AS ENUM ('KiteWorldWide', 'Walk-in');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    // Fix kite_level column: drop default, convert type if still text
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'school_customers' AND column_name = 'kite_level'
            AND data_type = 'text'
        ) THEN
          ALTER TABLE school_customers ALTER COLUMN kite_level DROP DEFAULT;
          ALTER TABLE school_customers
            ALTER COLUMN kite_level TYPE kite_level
            USING kite_level::text::kite_level;
        END IF;
      END $$
    `);

    // Fix guest_type column: drop default, convert type if still text
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'school_customers' AND column_name = 'guest_type'
            AND data_type = 'text'
        ) THEN
          ALTER TABLE school_customers ALTER COLUMN guest_type DROP DEFAULT;
          ALTER TABLE school_customers
            ALTER COLUMN guest_type TYPE guest_type
            USING guest_type::text::guest_type;
          ALTER TABLE school_customers
            ALTER COLUMN guest_type SET DEFAULT 'Walk-in'::guest_type;
        END IF;
      END $$
    `);

    // Rename constraints from _key to _unique (Drizzle expects _unique)
    const renames = [
      { table: "suppliers", from: "suppliers_name_key", to: "suppliers_name_unique" },
      { table: "accessory_categories", from: "accessory_categories_name_key", to: "accessory_categories_name_unique" },
      { table: "school_configs", from: "school_configs_station_id_key", to: "school_configs_station_id_unique" },
      { table: "sales_invoices", from: "sales_invoices_invoice_number_key", to: "sales_invoices_invoice_number_unique" },
    ];
    for (const { table, from, to } of renames) {
      await client.query(`
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = '${table}' AND constraint_name = '${from}'
          ) THEN
            ALTER TABLE ${table} RENAME CONSTRAINT ${from} TO ${to};
          END IF;
        END $$
      `);
    }

    console.log("Pre-migration: DB schema pre-flight completed.");
  } finally {
    await client.end();
  }
}

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("Running pre-migration DB fixes...");
  await preMigrate();

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
