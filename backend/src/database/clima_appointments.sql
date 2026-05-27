-- ClimaGestor — Agendamentos (Sprint 12)

-- Adicionar working_hours aos profissionais (col nova, default seguro)
ALTER TABLE clima_professionals
  ADD COLUMN IF NOT EXISTS working_hours JSONB NOT NULL DEFAULT '{
    "weekly_hours": {
      "1": {"start":"09:00","end":"18:00"},
      "2": {"start":"09:00","end":"18:00"},
      "3": {"start":"09:00","end":"18:00"},
      "4": {"start":"09:00","end":"18:00"},
      "5": {"start":"09:00","end":"18:00"}
    },
    "timezone": "America/Sao_Paulo",
    "slot_interval_minutes": 30
  }';

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS clima_appointments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  professional_id UUID        NOT NULL REFERENCES clima_professionals(id) ON DELETE RESTRICT,
  service_id      UUID        NOT NULL REFERENCES clima_services(id) ON DELETE RESTRICT,
  client_name     VARCHAR(200) NOT NULL,
  client_phone    VARCHAR(30),
  client_email    VARCHAR(200),
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  status          VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clima_appts_company
  ON clima_appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_clima_appts_prof_date
  ON clima_appointments(professional_id, start_at);
CREATE INDEX IF NOT EXISTS idx_clima_appts_status
  ON clima_appointments(company_id, status);
