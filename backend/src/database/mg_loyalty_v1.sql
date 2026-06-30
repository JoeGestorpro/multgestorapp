-- Migration 020 — Fidelidade (PRD-010)
-- Reconstruido a partir do schema de PRODUCAO via pg_dump --schema-only (2026-06-30).
-- Contexto: estas tabelas existiam apenas em producao; os arquivos mg_*_v1.sql
-- estavam registrados no runner mas nunca foram commitados (gap de reprodutibilidade).
-- Idempotente: CREATE TABLE/INDEX IF NOT EXISTS, constraints guardadas, DROP+CREATE POLICY.
-- Seguro reaplicar (fresh e prod).

-- ===== Tabelas =====

CREATE TABLE IF NOT EXISTS public.loyalty_programs (
    company_id uuid NOT NULL,
    type text DEFAULT 'points'::text NOT NULL,
    points_per_currency numeric(10,4) DEFAULT 1 NOT NULL,
    min_redeem_points integer DEFAULT 10 NOT NULL,
    points_per_real numeric(10,4) DEFAULT 1 NOT NULL,
    points_expire_days integer,
    is_active boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loyalty_programs_min_redeem_points_check CHECK ((min_redeem_points > 0)),
    CONSTRAINT loyalty_programs_points_expire_days_check CHECK ((points_expire_days > 0)),
    CONSTRAINT loyalty_programs_type_check CHECK ((type = ANY (ARRAY['points'::text, 'stamps'::text, 'hybrid'::text])))
);


CREATE TABLE IF NOT EXISTS public.customer_loyalty (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    points_balance integer DEFAULT 0 NOT NULL,
    lifetime_points integer DEFAULT 0 NOT NULL,
    lifetime_redeemed integer DEFAULT 0 NOT NULL,
    points_expire_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customer_loyalty_lifetime_points_check CHECK ((lifetime_points >= 0)),
    CONSTRAINT customer_loyalty_lifetime_redeemed_check CHECK ((lifetime_redeemed >= 0)),
    CONSTRAINT customer_loyalty_points_balance_check CHECK ((points_balance >= 0))
);


CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    loyalty_id uuid NOT NULL,
    type text NOT NULL,
    points integer NOT NULL,
    balance_before integer NOT NULL,
    balance_after integer NOT NULL,
    reference_type text,
    reference_id uuid,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loyalty_transactions_points_check CHECK ((points > 0)),
    CONSTRAINT loyalty_transactions_reference_type_check CHECK ((reference_type = ANY (ARRAY['sale'::text, 'appointment'::text, 'manual'::text, 'expiration'::text]))),
    CONSTRAINT loyalty_transactions_type_check CHECK ((type = ANY (ARRAY['earn'::text, 'redeem'::text, 'expire'::text, 'adjust'::text])))
);

-- ===== Primary keys / unique constraints =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='loyalty_programs_pkey' AND conrelid='public.loyalty_programs'::regclass) THEN
    ALTER TABLE ONLY public.loyalty_programs ADD CONSTRAINT loyalty_programs_pkey PRIMARY KEY (company_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='customer_loyalty_pkey' AND conrelid='public.customer_loyalty'::regclass) THEN
    ALTER TABLE ONLY public.customer_loyalty ADD CONSTRAINT customer_loyalty_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='customer_loyalty_company_id_customer_id_key' AND conrelid='public.customer_loyalty'::regclass) THEN
    ALTER TABLE ONLY public.customer_loyalty ADD CONSTRAINT customer_loyalty_company_id_customer_id_key UNIQUE (company_id, customer_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='loyalty_transactions_pkey' AND conrelid='public.loyalty_transactions'::regclass) THEN
    ALTER TABLE ONLY public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- ===== Indices =====

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_company ON public.customer_loyalty USING btree (company_id);

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer ON public.customer_loyalty USING btree (company_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_company ON public.loyalty_transactions USING btree (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON public.loyalty_transactions USING btree (company_id, customer_id);

-- ===== Foreign keys =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='loyalty_programs_company_id_fkey' AND conrelid='public.loyalty_programs'::regclass) THEN
    ALTER TABLE ONLY public.loyalty_programs ADD CONSTRAINT loyalty_programs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='customer_loyalty_company_id_fkey' AND conrelid='public.customer_loyalty'::regclass) THEN
    ALTER TABLE ONLY public.customer_loyalty ADD CONSTRAINT customer_loyalty_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='customer_loyalty_customer_id_fkey' AND conrelid='public.customer_loyalty'::regclass) THEN
    ALTER TABLE ONLY public.customer_loyalty ADD CONSTRAINT customer_loyalty_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.booking_customers(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='loyalty_transactions_company_id_fkey' AND conrelid='public.loyalty_transactions'::regclass) THEN
    ALTER TABLE ONLY public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='loyalty_transactions_created_by_fkey' AND conrelid='public.loyalty_transactions'::regclass) THEN
    ALTER TABLE ONLY public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='loyalty_transactions_customer_id_fkey' AND conrelid='public.loyalty_transactions'::regclass) THEN
    ALTER TABLE ONLY public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.booking_customers(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='loyalty_transactions_loyalty_id_fkey' AND conrelid='public.loyalty_transactions'::regclass) THEN
    ALTER TABLE ONLY public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_loyalty_id_fkey FOREIGN KEY (loyalty_id) REFERENCES public.customer_loyalty(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ===== RLS + policies (tenant_isolation) =====
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.loyalty_programs;

CREATE POLICY tenant_isolation ON public.loyalty_programs USING ((company_id = (current_setting('app.current_company_id'::text, true))::uuid));
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.customer_loyalty;

CREATE POLICY tenant_isolation ON public.customer_loyalty USING ((company_id = (current_setting('app.current_company_id'::text, true))::uuid));
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.loyalty_transactions;

CREATE POLICY tenant_isolation ON public.loyalty_transactions USING ((company_id = (current_setting('app.current_company_id'::text, true))::uuid));
