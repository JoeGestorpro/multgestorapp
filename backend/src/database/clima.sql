-- ClimaGestor -- Scaffold Inicial
-- Clinicas de estetica, saloes de beleza, spas

-- Registrar modulo no catalogo de modulos
INSERT INTO modules (name, slug, is_active)
VALUES ('ClimaGestor', 'clima', true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- Tabela de profissionais do ClimaGestor
CREATE TABLE IF NOT EXISTS clima_professionals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'professional',
  specialties  TEXT[] DEFAULT '{}',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clima_professionals_company_id ON clima_professionals(company_id);

-- Tabela de procedimentos/servicos do ClimaGestor
CREATE TABLE IF NOT EXISTS clima_services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  category         TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clima_services_company_id ON clima_services(company_id);
