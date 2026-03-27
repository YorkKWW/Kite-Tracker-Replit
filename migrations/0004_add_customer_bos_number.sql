-- Add bos_customer_number column to school_customers for BOS customer identification
ALTER TABLE school_customers ADD COLUMN IF NOT EXISTS bos_customer_number TEXT;
