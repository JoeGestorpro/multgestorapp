CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

UPDATE users
SET email_verified = true
WHERE email_verified IS NULL;

UPDATE users
SET status = CASE
  WHEN COALESCE(is_active, true) = true THEN 'active'
  ELSE 'pending_verification'
END
WHERE status IS NULL OR trim(status) = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_users_status_allowed'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT chk_users_status_allowed
      CHECK (status IN ('pending_verification', 'active', 'inactive', 'blocked'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE email_verification_tokens
  ALTER COLUMN user_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS booking_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT NOT NULL DEFAULT 'agendamento_online',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_customers_company_email_unique
  ON booking_customers(company_id, email);

CREATE INDEX IF NOT EXISTS idx_booking_customers_company_id ON booking_customers(company_id);
CREATE INDEX IF NOT EXISTS idx_booking_customers_status ON booking_customers(company_id, status);

ALTER TABLE email_verification_tokens
  ADD COLUMN IF NOT EXISTS booking_customer_id UUID REFERENCES booking_customers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_booking_customer_id
  ON email_verification_tokens(booking_customer_id);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_company_id ON email_verification_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

ALTER TABLE barber_appointments ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE barber_appointments ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES booking_customers(id) ON DELETE SET NULL;
ALTER TABLE barber_appointments ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE barber_appointments ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE barber_appointments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'admin_manual';
ALTER TABLE barber_appointments ADD COLUMN IF NOT EXISTS canceled_reason TEXT;
ALTER TABLE barber_appointments ALTER COLUMN appointment_date DROP NOT NULL;
ALTER TABLE barber_appointments ALTER COLUMN appointment_time DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'barber_appointments'
      AND column_name = 'owner_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE barber_appointments
      ALTER COLUMN owner_id DROP NOT NULL;
  END IF;
END $$;

UPDATE barber_appointments
SET starts_at = (
      appointment_date::text || 'T' || appointment_time::text || ':00-04:00'
    )::timestamptz
WHERE starts_at IS NULL
  AND appointment_date IS NOT NULL
  AND appointment_time IS NOT NULL;

UPDATE barber_appointments
SET ends_at = starts_at + (COALESCE(barber_services.estimated_time_minutes, 30) || ' minutes')::interval
FROM barber_services
WHERE barber_services.id = barber_appointments.service_id
  AND barber_services.company_id = barber_appointments.company_id
  AND barber_appointments.starts_at IS NOT NULL
  AND barber_appointments.ends_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_barber_appointments_client_user_id ON barber_appointments(client_user_id);
CREATE INDEX IF NOT EXISTS idx_barber_appointments_customer_id ON barber_appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_barber_appointments_starts_at ON barber_appointments(starts_at);
CREATE INDEX IF NOT EXISTS idx_barber_appointments_collaborator_period ON barber_appointments(company_id, collaborator_id, starts_at, ends_at);
DROP INDEX IF EXISTS idx_barber_appointments_date;
DROP INDEX IF EXISTS idx_barber_appointments_comp_coll_start;

CREATE TABLE IF NOT EXISTS barber_booking_settings (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'America/Cuiaba',
  slot_interval_minutes INTEGER NOT NULL DEFAULT 30,
  minimum_notice_minutes INTEGER NOT NULL DEFAULT 60,
  online_min_advance_enabled BOOLEAN NOT NULL DEFAULT true,
  online_min_advance_value INTEGER NOT NULL DEFAULT 1,
  cancellation_limit_hours INTEGER NOT NULL DEFAULT 6,
  allow_customer_select_collaborator BOOLEAN NOT NULL DEFAULT true,
  allow_any_collaborator BOOLEAN NOT NULL DEFAULT true,
  confirmation_message TEXT,
  weekly_hours JSONB NOT NULL DEFAULT '{"0": null, "1": {"start": "08:00", "end": "19:00"}, "2": {"start": "08:00", "end": "19:00"}, "3": {"start": "08:00", "end": "19:00"}, "4": {"start": "08:00", "end": "19:00"}, "5": {"start": "08:00", "end": "19:00"}, "6": {"start": "08:00", "end": "17:00"}}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE barber_booking_settings ADD COLUMN IF NOT EXISTS allow_customer_select_collaborator BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE barber_booking_settings ADD COLUMN IF NOT EXISTS allow_any_collaborator BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE barber_booking_settings ADD COLUMN IF NOT EXISTS confirmation_message TEXT;
ALTER TABLE barber_booking_settings ADD COLUMN IF NOT EXISTS online_min_advance_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE barber_booking_settings ADD COLUMN IF NOT EXISTS online_min_advance_value INTEGER NOT NULL DEFAULT 0;

UPDATE barber_booking_settings
SET
  online_min_advance_enabled = CASE
    WHEN COALESCE(minimum_notice_minutes, 0) > 0 THEN true
    ELSE COALESCE(online_min_advance_enabled, false)
  END,
  online_min_advance_value = CASE
    WHEN COALESCE(minimum_notice_minutes, 0) > 0 THEN GREATEST(1, CEIL(minimum_notice_minutes / 60.0)::INTEGER)
    ELSE COALESCE(online_min_advance_value, 0)
  END
WHERE online_min_advance_enabled IS NULL
   OR online_min_advance_value IS NULL
   OR (COALESCE(minimum_notice_minutes, 0) > 0 AND online_min_advance_value = 0);

CREATE TABLE IF NOT EXISTS barber_booking_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES barber_collaborators(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE barber_booking_blocks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_barber_booking_blocks_company_id ON barber_booking_blocks(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_booking_blocks_collaborator_id ON barber_booking_blocks(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_barber_booking_blocks_period ON barber_booking_blocks(company_id, starts_at, ends_at);

INSERT INTO barber_booking_settings (company_id)
SELECT id
FROM companies
ON CONFLICT (company_id) DO NOTHING;

CREATE OR REPLACE VIEW appointments AS
SELECT
  barber_appointments.id,
  barber_appointments.company_id,
  barber_appointments.client_user_id,
  barber_appointments.collaborator_id,
  barber_appointments.service_id,
  barber_appointments.starts_at,
  barber_appointments.ends_at,
  barber_appointments.status,
  barber_appointments.notes,
  barber_appointments.created_at,
  barber_appointments.updated_at,
  barber_appointments.customer_id
FROM barber_appointments;
