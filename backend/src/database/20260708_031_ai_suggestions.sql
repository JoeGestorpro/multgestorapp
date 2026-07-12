-- 20260708_031 — Tabela ai_suggestions (IA Operacional, Fase 1)
-- Armazena sugestões geradas pela camada de IA operacional (previsão de
-- demanda, alertas de churn, sugestões de serviço). Cada sugestão é
-- multi-tenant (company_id) e tem cache de 24h via expires_at.
-- Idempotente: CREATE TABLE/INDEX IF NOT EXISTS + DROP/CREATE POLICY.

CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  data JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  source VARCHAR(50) NOT NULL DEFAULT 'llm',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ai_suggestions_type') THEN
    ALTER TABLE public.ai_suggestions
      ADD CONSTRAINT chk_ai_suggestions_type
      CHECK (type IN ('demand_prediction', 'churn_alert', 'service_suggestion'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ai_suggestions_status') THEN
    ALTER TABLE public.ai_suggestions
      ADD CONSTRAINT chk_ai_suggestions_status
      CHECK (status IN ('active', 'dismissed', 'applied'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ai_suggestions_source') THEN
    ALTER TABLE public.ai_suggestions
      ADD CONSTRAINT chk_ai_suggestions_source
      CHECK (source IN ('llm', 'rule-based'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_company ON public.ai_suggestions(company_id, type, status);

-- ============================================
-- Grants explícitos para app_runtime (rede de segurança — mesmo racional da
-- migration 029: o GRANT ON ALL TABLES de migrations anteriores só cobre
-- tabelas que já existiam no momento em que rodou).
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_suggestions TO app_runtime;

-- ============================================
-- RLS — tenant_isolation (mesmo padrão de rls_tenant_tables.sql)
-- ============================================
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.ai_suggestions;
CREATE POLICY tenant_isolation ON public.ai_suggestions
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);
