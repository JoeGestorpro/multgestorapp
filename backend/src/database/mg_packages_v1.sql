-- Migration 019 — Pacotes de servicos (PRD-009)
-- Reconstruido a partir do schema de PRODUCAO via pg_dump --schema-only (2026-06-30).
-- Contexto: estas tabelas existiam apenas em producao; os arquivos mg_*_v1.sql
-- estavam registrados no runner mas nunca foram commitados (gap de reprodutibilidade).
-- Idempotente: CREATE TABLE/INDEX IF NOT EXISTS, constraints guardadas, DROP+CREATE POLICY.
-- Seguro reaplicar (fresh e prod).

-- ===== Tabelas =====

CREATE TABLE IF NOT EXISTS public.service_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    total_credits integer NOT NULL,
    price numeric(12,2) NOT NULL,
    validity_days integer,
    applicable_service_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT service_packages_name_check CHECK ((length(TRIM(BOTH FROM name)) > 0)),
    CONSTRAINT service_packages_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT service_packages_total_credits_check CHECK ((total_credits > 0)),
    CONSTRAINT service_packages_validity_days_check CHECK ((validity_days > 0))
);


CREATE TABLE IF NOT EXISTS public.customer_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    package_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    credits_remaining integer NOT NULL,
    credits_used integer DEFAULT 0 NOT NULL,
    purchase_amount numeric(12,2) NOT NULL,
    payment_method text,
    gateway_transaction_id text,
    status text DEFAULT 'active'::text NOT NULL,
    purchased_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    exhausted_at timestamp with time zone,
    refunded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customer_packages_credits_remaining_check CHECK ((credits_remaining >= 0)),
    CONSTRAINT customer_packages_credits_used_check CHECK ((credits_used >= 0)),
    CONSTRAINT customer_packages_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'exhausted'::text, 'refunded'::text])))
);


CREATE TABLE IF NOT EXISTS public.package_redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    customer_package_id uuid NOT NULL,
    appointment_id uuid,
    sale_id uuid,
    service_id uuid,
    redeemed_by uuid,
    redeemed_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ===== Primary keys / unique constraints =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='service_packages_pkey' AND conrelid='public.service_packages'::regclass) THEN
    ALTER TABLE ONLY public.service_packages ADD CONSTRAINT service_packages_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='customer_packages_pkey' AND conrelid='public.customer_packages'::regclass) THEN
    ALTER TABLE ONLY public.customer_packages ADD CONSTRAINT customer_packages_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='package_redemptions_pkey' AND conrelid='public.package_redemptions'::regclass) THEN
    ALTER TABLE ONLY public.package_redemptions ADD CONSTRAINT package_redemptions_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- ===== Indices =====

CREATE INDEX IF NOT EXISTS idx_service_packages_company ON public.service_packages USING btree (company_id);

CREATE INDEX IF NOT EXISTS idx_service_packages_company_active ON public.service_packages USING btree (company_id) WHERE ((is_active = true) AND (is_deleted = false));

CREATE INDEX IF NOT EXISTS idx_customer_packages_active ON public.customer_packages USING btree (company_id, customer_id) WHERE (status = 'active'::text);

CREATE INDEX IF NOT EXISTS idx_customer_packages_company ON public.customer_packages USING btree (company_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_packages_status ON public.customer_packages USING btree (company_id, status);

CREATE INDEX IF NOT EXISTS idx_package_redemptions_company ON public.package_redemptions USING btree (company_id);

CREATE INDEX IF NOT EXISTS idx_package_redemptions_customer_package ON public.package_redemptions USING btree (customer_package_id);

-- ===== Foreign keys =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='service_packages_company_id_fkey' AND conrelid='public.service_packages'::regclass) THEN
    ALTER TABLE ONLY public.service_packages ADD CONSTRAINT service_packages_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='customer_packages_company_id_fkey' AND conrelid='public.customer_packages'::regclass) THEN
    ALTER TABLE ONLY public.customer_packages ADD CONSTRAINT customer_packages_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='customer_packages_customer_id_fkey' AND conrelid='public.customer_packages'::regclass) THEN
    ALTER TABLE ONLY public.customer_packages ADD CONSTRAINT customer_packages_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.booking_customers(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='customer_packages_package_id_fkey' AND conrelid='public.customer_packages'::regclass) THEN
    ALTER TABLE ONLY public.customer_packages ADD CONSTRAINT customer_packages_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.service_packages(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='package_redemptions_appointment_id_fkey' AND conrelid='public.package_redemptions'::regclass) THEN
    ALTER TABLE ONLY public.package_redemptions ADD CONSTRAINT package_redemptions_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.barber_appointments(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='package_redemptions_company_id_fkey' AND conrelid='public.package_redemptions'::regclass) THEN
    ALTER TABLE ONLY public.package_redemptions ADD CONSTRAINT package_redemptions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='package_redemptions_customer_package_id_fkey' AND conrelid='public.package_redemptions'::regclass) THEN
    ALTER TABLE ONLY public.package_redemptions ADD CONSTRAINT package_redemptions_customer_package_id_fkey FOREIGN KEY (customer_package_id) REFERENCES public.customer_packages(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='package_redemptions_redeemed_by_fkey' AND conrelid='public.package_redemptions'::regclass) THEN
    ALTER TABLE ONLY public.package_redemptions ADD CONSTRAINT package_redemptions_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='package_redemptions_sale_id_fkey' AND conrelid='public.package_redemptions'::regclass) THEN
    ALTER TABLE ONLY public.package_redemptions ADD CONSTRAINT package_redemptions_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.barber_sales(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='package_redemptions_service_id_fkey' AND conrelid='public.package_redemptions'::regclass) THEN
    ALTER TABLE ONLY public.package_redemptions ADD CONSTRAINT package_redemptions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.barber_services(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===== RLS + policies (tenant_isolation) =====
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.service_packages;

CREATE POLICY tenant_isolation ON public.service_packages USING ((company_id = (current_setting('app.current_company_id'::text, true))::uuid));
ALTER TABLE public.customer_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.customer_packages;

CREATE POLICY tenant_isolation ON public.customer_packages USING ((company_id = (current_setting('app.current_company_id'::text, true))::uuid));
ALTER TABLE public.package_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.package_redemptions;

CREATE POLICY tenant_isolation ON public.package_redemptions USING ((company_id = (current_setting('app.current_company_id'::text, true))::uuid));
