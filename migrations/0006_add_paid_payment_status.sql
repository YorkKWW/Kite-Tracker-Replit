-- Add 'paid' value to booking_payment_status enum
ALTER TYPE booking_payment_status ADD VALUE IF NOT EXISTS 'paid';
