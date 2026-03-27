DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_source') THEN
    CREATE TYPE product_source AS ENUM ('walkin', 'bos');
  END IF;
END $$;

ALTER TABLE school_products ADD COLUMN IF NOT EXISTS source product_source NOT NULL DEFAULT 'walkin';
