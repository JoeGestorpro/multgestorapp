ALTER TABLE barber_appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_barber_appointments_reminder
  ON barber_appointments (starts_at)
  WHERE reminder_sent_at IS NULL;
