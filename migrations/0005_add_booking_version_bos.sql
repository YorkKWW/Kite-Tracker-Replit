-- Add booking_version_bos column to school_bookings for BOS version tracking
ALTER TABLE school_bookings ADD COLUMN IF NOT EXISTS booking_version_bos TEXT;
