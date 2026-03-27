-- Add bos_code column to school_products for BOS product identification
ALTER TABLE school_products ADD COLUMN IF NOT EXISTS bos_code TEXT;
