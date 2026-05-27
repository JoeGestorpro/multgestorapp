ALTER TABLE barber_working_hours ADD COLUMN IF NOT EXISTS pauses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE barber_booking_blocks ADD COLUMN IF NOT EXISTS block_type TEXT DEFAULT 'block';
