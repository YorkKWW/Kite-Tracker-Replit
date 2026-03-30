DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_category') THEN
    CREATE TYPE document_category AS ENUM ('agb', 'stundenzettel', 'other');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS school_customer_documents (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES school_customers(id) ON DELETE CASCADE,
  category document_category NOT NULL,
  object_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);
