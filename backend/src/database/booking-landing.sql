CREATE TABLE IF NOT EXISTS barber_booking_landing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,

  display_name TEXT,
  slogan TEXT,
  about_text TEXT,
  whatsapp TEXT,
  instagram TEXT,
  address_display TEXT,
  hours_display TEXT,

  booking_primary_color TEXT,
  booking_secondary_color TEXT,
  booking_accent_color TEXT,
  button_text TEXT NOT NULL DEFAULT 'Agendar Horário',
  button_text_color TEXT,

  banner_url TEXT,
  extra_info TEXT,

  differentials JSONB NOT NULL DEFAULT '[]'::jsonb,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,

  show_hero BOOLEAN NOT NULL DEFAULT true,
  show_info BOOLEAN NOT NULL DEFAULT true,
  show_about BOOLEAN NOT NULL DEFAULT true,
  show_differentials BOOLEAN NOT NULL DEFAULT true,
  show_team BOOLEAN NOT NULL DEFAULT true,
  show_gallery BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barber_booking_landing_company_id
  ON barber_booking_landing(company_id);

ALTER TABLE barber_booking_landing ADD COLUMN IF NOT EXISTS banner_url TEXT;

INSERT INTO barber_booking_landing (company_id)
SELECT id FROM companies
ON CONFLICT (company_id) DO NOTHING;
