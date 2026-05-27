-- ============================================
-- CRM Tables — BarberGestor
-- Notas internas, tags e eventos do cliente
-- ============================================

CREATE TABLE IF NOT EXISTS barber_client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES booking_customers(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barber_client_notes_company_client
  ON barber_client_notes(company_id, client_id);
CREATE INDEX IF NOT EXISTS idx_barber_client_notes_client_created
  ON barber_client_notes(client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS barber_client_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES booking_customers(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barber_client_tags_company_client
  ON barber_client_tags(company_id, client_id);
CREATE INDEX IF NOT EXISTS idx_barber_client_tags_company_tag
  ON barber_client_tags(company_id, tag);

CREATE TABLE IF NOT EXISTS barber_client_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES booking_customers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barber_client_events_company_client
  ON barber_client_events(company_id, client_id);
CREATE INDEX IF NOT EXISTS idx_barber_client_events_client_created
  ON barber_client_events(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_barber_client_events_type
  ON barber_client_events(company_id, event_type);

-- Ensure booking_customers has all needed columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_customers' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE booking_customers ADD COLUMN birth_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_customers' AND column_name = 'notes'
  ) THEN
    ALTER TABLE booking_customers ADD COLUMN notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_customers' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE booking_customers ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_customers' AND column_name = 'crm_score'
  ) THEN
    ALTER TABLE booking_customers ADD COLUMN crm_score INTEGER DEFAULT 0;
  END IF;
END $$;
