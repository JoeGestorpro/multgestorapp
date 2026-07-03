-- Migration 021 — Anamnese (PRD-011)
-- Reconstruido a partir do schema de PRODUCAO via pg_dump --schema-only (2026-06-30).
-- Contexto: estas tabelas existiam apenas em producao; os arquivos mg_*_v1.sql
-- estavam registrados no runner mas nunca foram commitados (gap de reprodutibilidade).
-- Idempotente: CREATE TABLE/INDEX IF NOT EXISTS, constraints guardadas, DROP+CREATE POLICY.
-- Seguro reaplicar (fresh e prod).

-- ===== Tabelas =====

CREATE TABLE IF NOT EXISTS public.anamnesis_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    questions jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT anamnesis_templates_name_check CHECK ((length(TRIM(BOTH FROM name)) > 0))
);


CREATE TABLE IF NOT EXISTS public.anamnesis_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    template_id uuid,
    responses jsonb DEFAULT '{}'::jsonb NOT NULL,
    consent_granted boolean DEFAULT false NOT NULL,
    consent_granted_at timestamp with time zone,
    consent_ip text,
    lgpd_export_requested_at timestamp with time zone,
    lgpd_exported_at timestamp with time zone,
    lgpd_delete_requested_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ===== Primary keys / unique constraints =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='anamnesis_templates_pkey' AND conrelid='public.anamnesis_templates'::regclass) THEN
    ALTER TABLE ONLY public.anamnesis_templates ADD CONSTRAINT anamnesis_templates_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='anamnesis_responses_pkey' AND conrelid='public.anamnesis_responses'::regclass) THEN
    ALTER TABLE ONLY public.anamnesis_responses ADD CONSTRAINT anamnesis_responses_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- ===== Indices =====

CREATE INDEX IF NOT EXISTS idx_anamnesis_templates_company ON public.anamnesis_templates USING btree (company_id);

CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_company ON public.anamnesis_responses USING btree (company_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_anamnesis_responses_customer ON public.anamnesis_responses USING btree (company_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_anamnesis_responses_template ON public.anamnesis_responses USING btree (template_id) WHERE (template_id IS NOT NULL);

-- ===== Foreign keys =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='anamnesis_templates_company_id_fkey' AND conrelid='public.anamnesis_templates'::regclass) THEN
    ALTER TABLE ONLY public.anamnesis_templates ADD CONSTRAINT anamnesis_templates_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='anamnesis_responses_company_id_fkey' AND conrelid='public.anamnesis_responses'::regclass) THEN
    ALTER TABLE ONLY public.anamnesis_responses ADD CONSTRAINT anamnesis_responses_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='anamnesis_responses_customer_id_fkey' AND conrelid='public.anamnesis_responses'::regclass) THEN
    ALTER TABLE ONLY public.anamnesis_responses ADD CONSTRAINT anamnesis_responses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.booking_customers(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='anamnesis_responses_template_id_fkey' AND conrelid='public.anamnesis_responses'::regclass) THEN
    ALTER TABLE ONLY public.anamnesis_responses ADD CONSTRAINT anamnesis_responses_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.anamnesis_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===== RLS + policies (tenant_isolation) =====
ALTER TABLE public.anamnesis_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.anamnesis_templates;

CREATE POLICY tenant_isolation ON public.anamnesis_templates USING ((company_id = (current_setting('app.current_company_id'::text, true))::uuid));
ALTER TABLE public.anamnesis_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.anamnesis_responses;

CREATE POLICY tenant_isolation ON public.anamnesis_responses USING ((company_id = (current_setting('app.current_company_id'::text, true))::uuid));
