-- Migration 018 — Prepaid / Carteira (PRD-008)
-- Reconstruido a partir do schema de PRODUCAO via pg_dump --schema-only (2026-06-30).
-- Contexto: estas tabelas existiam apenas em producao; os arquivos mg_*_v1.sql
-- estavam registrados no runner mas nunca foram commitados (gap de reprodutibilidade).
-- Idempotente: CREATE TABLE/INDEX IF NOT EXISTS, constraints guardadas, DROP+CREATE POLICY.
-- Seguro reaplicar (fresh e prod).

-- ===== Tabelas =====

CREATE TABLE IF NOT EXISTS public.company_wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    currency text DEFAULT 'BRL'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT company_wallets_balance_check CHECK ((balance >= (0)::numeric))
);


CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    wallet_id uuid NOT NULL,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    balance_before numeric(12,2) NOT NULL,
    balance_after numeric(12,2) NOT NULL,
    reference_type text NOT NULL,
    reference_id uuid,
    gateway text,
    gateway_transaction_id text,
    description text,
    status text DEFAULT 'completed'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wallet_transactions_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT wallet_transactions_reference_type_check CHECK ((reference_type = ANY (ARRAY['topup'::text, 'appointment'::text, 'package'::text, 'refund'::text, 'expiration'::text, 'manual'::text]))),
    CONSTRAINT wallet_transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'reversed'::text]))),
    CONSTRAINT wallet_transactions_type_check CHECK ((type = ANY (ARRAY['credit'::text, 'debit'::text, 'refund'::text, 'expired'::text])))
);


CREATE TABLE IF NOT EXISTS public.topup_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    customer_id uuid,
    amount numeric(12,2) NOT NULL,
    purpose text DEFAULT 'deposit'::text NOT NULL,
    reference_type text,
    reference_id uuid,
    gateway text DEFAULT 'abacatepay'::text NOT NULL,
    gateway_checkout_id text,
    gateway_checkout_url text,
    status text DEFAULT 'pending'::text NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:30:00'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    failed_at timestamp with time zone,
    failure_reason text,
    CONSTRAINT topup_requests_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT topup_requests_purpose_check CHECK ((purpose = ANY (ARRAY['deposit'::text, 'package'::text, 'general'::text]))),
    CONSTRAINT topup_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'expired'::text])))
);


CREATE TABLE IF NOT EXISTS public.deposit_configs (
    company_id uuid NOT NULL,
    deposit_enabled boolean DEFAULT false NOT NULL,
    deposit_type text DEFAULT 'percentage'::text NOT NULL,
    deposit_value numeric(12,2) DEFAULT 0 NOT NULL,
    cancel_fee_enabled boolean DEFAULT false NOT NULL,
    cancel_fee_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    cancel_fee_window_hours integer DEFAULT 6 NOT NULL,
    auto_confirm_deposit boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT deposit_configs_cancel_fee_percentage_check CHECK (((cancel_fee_percentage >= (0)::numeric) AND (cancel_fee_percentage <= (100)::numeric))),
    CONSTRAINT deposit_configs_deposit_type_check CHECK ((deposit_type = ANY (ARRAY['percentage'::text, 'fixed'::text]))),
    CONSTRAINT deposit_configs_deposit_value_check CHECK ((deposit_value >= (0)::numeric))
);

-- ===== Primary keys / unique constraints =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='company_wallets_pkey' AND conrelid='public.company_wallets'::regclass) THEN
    ALTER TABLE ONLY public.company_wallets ADD CONSTRAINT company_wallets_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='wallet_transactions_pkey' AND conrelid='public.wallet_transactions'::regclass) THEN
    ALTER TABLE ONLY public.wallet_transactions ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='topup_requests_pkey' AND conrelid='public.topup_requests'::regclass) THEN
    ALTER TABLE ONLY public.topup_requests ADD CONSTRAINT topup_requests_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='deposit_configs_pkey' AND conrelid='public.deposit_configs'::regclass) THEN
    ALTER TABLE ONLY public.deposit_configs ADD CONSTRAINT deposit_configs_pkey PRIMARY KEY (company_id);
  END IF;
END $$;

-- ===== Indices =====

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_wallets_company ON public.company_wallets USING btree (company_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_company ON public.wallet_transactions USING btree (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON public.wallet_transactions USING btree (reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON public.wallet_transactions USING btree (wallet_id);

CREATE INDEX IF NOT EXISTS idx_topup_requests_checkout ON public.topup_requests USING btree (gateway_checkout_id) WHERE (gateway_checkout_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_topup_requests_company ON public.topup_requests USING btree (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_topup_requests_status ON public.topup_requests USING btree (status, expires_at);

-- ===== Foreign keys =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='company_wallets_company_id_fkey' AND conrelid='public.company_wallets'::regclass) THEN
    ALTER TABLE ONLY public.company_wallets ADD CONSTRAINT company_wallets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='wallet_transactions_company_id_fkey' AND conrelid='public.wallet_transactions'::regclass) THEN
    ALTER TABLE ONLY public.wallet_transactions ADD CONSTRAINT wallet_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='wallet_transactions_wallet_id_fkey' AND conrelid='public.wallet_transactions'::regclass) THEN
    ALTER TABLE ONLY public.wallet_transactions ADD CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.company_wallets(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='topup_requests_company_id_fkey' AND conrelid='public.topup_requests'::regclass) THEN
    ALTER TABLE ONLY public.topup_requests ADD CONSTRAINT topup_requests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='topup_requests_customer_id_fkey' AND conrelid='public.topup_requests'::regclass) THEN
    ALTER TABLE ONLY public.topup_requests ADD CONSTRAINT topup_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.booking_customers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='deposit_configs_company_id_fkey' AND conrelid='public.deposit_configs'::regclass) THEN
    ALTER TABLE ONLY public.deposit_configs ADD CONSTRAINT deposit_configs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ===== RLS + policies (tenant_isolation) =====
ALTER TABLE public.company_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.company_wallets;

CREATE POLICY tenant_isolation ON public.company_wallets USING ((company_id = (current_setting('app.current_company_id'::text, true))::uuid));
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.wallet_transactions;

CREATE POLICY tenant_isolation ON public.wallet_transactions USING ((company_id = (current_setting('app.current_company_id'::text, true))::uuid));
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.topup_requests;

CREATE POLICY tenant_isolation ON public.topup_requests USING ((company_id = (current_setting('app.current_company_id'::text, true))::uuid));
ALTER TABLE public.deposit_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.deposit_configs;

CREATE POLICY tenant_isolation ON public.deposit_configs USING ((company_id = (current_setting('app.current_company_id'::text, true))::uuid));
