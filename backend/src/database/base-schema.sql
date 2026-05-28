CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Base Schema — tabelas essenciais para dependências de FK
-- Objetivo: garantir que bancos frescos possam rodar migrations
-- sem erro de tabela inexistente.
-- Idempotente: CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  niche_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  activated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (company_id, module_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Catálogo base de módulos/verticais
-- Idempotente: ON CONFLICT DO NOTHING
-- ============================================================

INSERT INTO modules (name, slug, description, is_active)
VALUES ('BarberGestor', 'barber', 'Gestao completa para barbearias', true)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
