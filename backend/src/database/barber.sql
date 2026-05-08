CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_launch_sales BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_view_own_dashboard BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_view_own_reports BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS public_booking_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_public_booking_slug_unique
  ON companies(public_booking_slug)
  WHERE public_booking_slug IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM users
    WHERE company_id IS NULL
    LIMIT 1
  ) THEN
    ALTER TABLE users
      ALTER COLUMN company_id SET NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS barber_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  commission_type TEXT DEFAULT 'percentage',
  commission_value NUMERIC(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE barber_services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE barber_services ADD COLUMN IF NOT EXISTS service_type TEXT NOT NULL DEFAULT 'service';
ALTER TABLE barber_services ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER;
ALTER TABLE barber_services ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'scissors';
ALTER TABLE barber_services ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE barber_services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

UPDATE barber_services
SET icon = 'scissors'
WHERE icon IS NULL OR trim(icon) = '';

ALTER TABLE barber_services
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE barber_services
  ALTER COLUMN name SET NOT NULL;

ALTER TABLE barber_services
  ALTER COLUMN price SET DEFAULT 0;

ALTER TABLE barber_services
  ALTER COLUMN commission_type SET DEFAULT 'percentage';

ALTER TABLE barber_services
  ALTER COLUMN commission_value SET DEFAULT 0;

ALTER TABLE barber_services
  ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE barber_services
  ALTER COLUMN is_deleted SET DEFAULT false;

ALTER TABLE barber_services
  ALTER COLUMN updated_at SET DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_services_price_non_negative'
  ) THEN
    ALTER TABLE barber_services
      ADD CONSTRAINT chk_barber_services_price_non_negative CHECK (price >= 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS barber_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  email TEXT,
  document TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barber_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES barber_suppliers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  brand TEXT,
  internal_code TEXT,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock_current NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock_minimum NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit TEXT,
  commission_type TEXT NOT NULL DEFAULT 'fixed',
  commission_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE barber_products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE barber_products ADD COLUMN IF NOT EXISTS internal_code TEXT;
ALTER TABLE barber_products ADD COLUMN IF NOT EXISTS stock_current NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE barber_products ADD COLUMN IF NOT EXISTS stock_minimum NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE barber_products ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE barber_suppliers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE barber_products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE barber_suppliers
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE barber_products
  ALTER COLUMN company_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_suppliers_name_not_blank'
  ) THEN
    ALTER TABLE barber_suppliers
      ADD CONSTRAINT chk_barber_suppliers_name_not_blank CHECK (length(trim(name)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_products_stock_current_non_negative'
  ) THEN
    ALTER TABLE barber_products
      ADD CONSTRAINT chk_barber_products_stock_current_non_negative CHECK (stock_current >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_products_stock_minimum_non_negative'
  ) THEN
    ALTER TABLE barber_products
      ADD CONSTRAINT chk_barber_products_stock_minimum_non_negative CHECK (stock_minimum >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_products_name_not_blank'
  ) THEN
    ALTER TABLE barber_products
      ADD CONSTRAINT chk_barber_products_name_not_blank CHECK (length(trim(name)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_products_cost_non_negative'
  ) THEN
    ALTER TABLE barber_products
      ADD CONSTRAINT chk_barber_products_cost_non_negative CHECK (cost_price >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_products_sale_non_negative'
  ) THEN
    ALTER TABLE barber_products
      ADD CONSTRAINT chk_barber_products_sale_non_negative CHECK (sale_price >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_products_commission_non_negative'
  ) THEN
    ALTER TABLE barber_products
      ADD CONSTRAINT chk_barber_products_commission_non_negative CHECK (commission_value >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_products_commission_type'
  ) THEN
    ALTER TABLE barber_products
      ADD CONSTRAINT chk_barber_products_commission_type CHECK (commission_type IN ('percentage', 'fixed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_services_commission_non_negative'
  ) THEN
    ALTER TABLE barber_services
      ADD CONSTRAINT chk_barber_services_commission_non_negative CHECK (commission_value >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_services_name_not_blank'
  ) THEN
    ALTER TABLE barber_services
      ADD CONSTRAINT chk_barber_services_name_not_blank CHECK (length(trim(name)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_services_service_type'
  ) THEN
    ALTER TABLE barber_services
      ADD CONSTRAINT chk_barber_services_service_type CHECK (service_type IN ('service', 'product', 'combo'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_services_commission_type'
  ) THEN
    ALTER TABLE barber_services
      ADD CONSTRAINT chk_barber_services_commission_type CHECK (commission_type IN ('percentage', 'fixed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_services_estimated_time_non_negative'
  ) THEN
    ALTER TABLE barber_services
      ADD CONSTRAINT chk_barber_services_estimated_time_non_negative
      CHECK (estimated_time_minutes IS NULL OR estimated_time_minutes >= 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS barber_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  commission_type TEXT DEFAULT 'percentage',
  commission_rate NUMERIC(12, 2) DEFAULT 0,
  can_make_barter BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE barber_collaborators ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percentage';
ALTER TABLE barber_collaborators ADD COLUMN IF NOT EXISTS can_make_barter BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE barber_collaborators ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE barber_collaborators ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE barber_collaborators ADD COLUMN IF NOT EXISTS available_for_booking BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE barber_collaborators ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE barber_collaborators ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'barber_collaborators'
      AND column_name = 'owner_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE barber_collaborators
      ALTER COLUMN owner_id DROP NOT NULL;
  END IF;
END $$;

UPDATE barber_collaborators
SET company_id = users.company_id
FROM users
WHERE barber_collaborators.user_id = users.id
  AND barber_collaborators.company_id IS NULL
  AND users.company_id IS NOT NULL;

ALTER TABLE barber_collaborators
  ALTER COLUMN commission_type SET DEFAULT 'percentage';

ALTER TABLE barber_collaborators
  ALTER COLUMN is_deleted SET DEFAULT false;

ALTER TABLE barber_collaborators
  ALTER COLUMN updated_at SET DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_collaborators_commission_type'
  ) THEN
    ALTER TABLE barber_collaborators
      ADD CONSTRAINT chk_barber_collaborators_commission_type
      CHECK (commission_type IN ('percentage', 'fixed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_collaborators_commission_non_negative'
  ) THEN
    ALTER TABLE barber_collaborators
      ADD CONSTRAINT chk_barber_collaborators_commission_non_negative
      CHECK (commission_rate >= 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS barber_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES barber_collaborators(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_received NUMERIC(12, 2) DEFAULT 0,
  change_amount NUMERIC(12, 2) DEFAULT 0,
  sale_date_local DATE,
  client_name TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS amount_received NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS sale_date_local DATE;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS discount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE barber_sales ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS canceled_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS canceled_reason TEXT;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS appointment_id UUID;
ALTER TABLE barber_sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

UPDATE barber_sales
SET customer_name = COALESCE(customer_name, client_name),
    subtotal = CASE WHEN subtotal = 0 THEN total_amount ELSE subtotal END,
    status = COALESCE(NULLIF(status, ''), 'active'),
    updated_at = COALESCE(updated_at, created_at, NOW())
WHERE customer_name IS NULL
   OR subtotal = 0
   OR status IS NULL
   OR status = ''
   OR updated_at IS NULL;

ALTER TABLE barber_sales
  ALTER COLUMN status SET NOT NULL;

UPDATE barber_sales
SET sale_date_local = created_at::date
WHERE sale_date_local IS NULL;

CREATE TABLE IF NOT EXISTS barber_cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cash_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  opened_at TIMESTAMP,
  closed_at TIMESTAMP,
  opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gross_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  pix_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cash_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  credit_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  debit_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  trade_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  change_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_sales INTEGER NOT NULL DEFAULT 0,
  total_services NUMERIC(12, 2) NOT NULL DEFAULT 0,
  opened_by UUID REFERENCES users(id) ON DELETE SET NULL,
  closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_barber_cash_sessions_company_date UNIQUE (company_id, cash_date)
);

CREATE TABLE IF NOT EXISTS barber_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES barber_sales(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES barber_collaborators(id) ON DELETE SET NULL,
  service_id UUID,
  product_id UUID,
  description TEXT NOT NULL,
  item_name_snapshot TEXT,
  commission_type_snapshot TEXT,
  commission_rate_snapshot NUMERIC(12, 2) DEFAULT 0,
  payment_method TEXT,
  commission_effect TEXT NOT NULL DEFAULT 'credit',
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shop_net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE barber_cash_sessions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE barber_sale_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE barber_sale_items ADD COLUMN IF NOT EXISTS collaborator_id UUID REFERENCES barber_collaborators(id) ON DELETE SET NULL;
ALTER TABLE barber_sale_items ADD COLUMN IF NOT EXISTS service_id UUID;
ALTER TABLE barber_sale_items ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE barber_sale_items ADD COLUMN IF NOT EXISTS item_name_snapshot TEXT;
ALTER TABLE barber_sale_items ADD COLUMN IF NOT EXISTS commission_type_snapshot TEXT;
ALTER TABLE barber_sale_items ADD COLUMN IF NOT EXISTS commission_rate_snapshot NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE barber_sale_items ADD COLUMN IF NOT EXISTS commission_type TEXT;
ALTER TABLE barber_sale_items ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE barber_sale_items ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE barber_sale_items ADD COLUMN IF NOT EXISTS commission_effect TEXT NOT NULL DEFAULT 'credit';
ALTER TABLE barber_sale_items ADD COLUMN IF NOT EXISTS shop_net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

UPDATE barber_sale_items
SET payment_method = barber_sales.payment_method,
    commission_effect = CASE WHEN barber_sales.payment_method = 'permuta' THEN 'debit' ELSE 'credit' END
FROM barber_sales
WHERE barber_sale_items.sale_id = barber_sales.id
  AND barber_sale_items.company_id = barber_sales.company_id
  AND (barber_sale_items.payment_method IS NULL OR barber_sale_items.commission_effect IS NULL);

UPDATE barber_sale_items
SET company_id = barber_sales.company_id
FROM barber_sales
WHERE barber_sale_items.sale_id = barber_sales.id
  AND barber_sale_items.company_id IS NULL;

ALTER TABLE barber_cash_sessions
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE barber_sale_items
  ALTER COLUMN company_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_sale_items_commission_effect'
  ) THEN
    ALTER TABLE barber_sale_items
      ADD CONSTRAINT chk_barber_sale_items_commission_effect
      CHECK (commission_effect IN ('credit', 'debit'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_cash_sessions_company_date_unique
  ON barber_cash_sessions(company_id, cash_date);

CREATE TABLE IF NOT EXISTS barber_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES barber_collaborators(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barber_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES barber_collaborators(id) ON DELETE CASCADE,
  total_sales NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_commission NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_advances NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  period_start TIMESTAMP,
  period_end TIMESTAMP NOT NULL,
  closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barber_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES barber_services(id) ON DELETE RESTRICT,
  collaborator_id UUID NOT NULL REFERENCES barber_collaborators(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_appointments_status'
  ) THEN
    ALTER TABLE barber_appointments
      ADD CONSTRAINT chk_barber_appointments_status
      CHECK (status IN ('scheduled', 'confirmed', 'completed', 'canceled', 'no_show'));
  END IF;
END $$;

ALTER TABLE barber_sales
  DROP CONSTRAINT IF EXISTS chk_barber_sales_status;

ALTER TABLE barber_sales
  ADD CONSTRAINT chk_barber_sales_status
  CHECK (status IN ('active', 'completed', 'paid', 'finalized', 'canceled'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_sales_discount_non_negative'
  ) THEN
    ALTER TABLE barber_sales
      ADD CONSTRAINT chk_barber_sales_discount_non_negative CHECK (discount >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_sales_commission_non_negative'
  ) THEN
    ALTER TABLE barber_sales
      ADD CONSTRAINT chk_barber_sales_commission_non_negative CHECK (commission_amount >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_appointments_customer_name_not_blank'
  ) THEN
    ALTER TABLE barber_appointments
      ADD CONSTRAINT chk_barber_appointments_customer_name_not_blank
      CHECK (length(trim(customer_name)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_appointments_customer_phone_not_blank'
  ) THEN
    ALTER TABLE barber_appointments
      ADD CONSTRAINT chk_barber_appointments_customer_phone_not_blank
      CHECK (length(trim(customer_phone)) > 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS barber_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE barber_advances ADD COLUMN IF NOT EXISTS liquidated_at TIMESTAMP;
ALTER TABLE barber_advances ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES barber_settlements(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_sales_payment_method'
  ) THEN
    ALTER TABLE barber_sales
      ADD CONSTRAINT chk_barber_sales_payment_method
      CHECK (payment_method IN ('dinheiro', 'pix', 'credito', 'debito', 'permuta'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_sales_amount_received_non_negative'
  ) THEN
    ALTER TABLE barber_sales
      ADD CONSTRAINT chk_barber_sales_amount_received_non_negative CHECK (amount_received >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_sales_total_non_negative'
  ) THEN
    ALTER TABLE barber_sales
      ADD CONSTRAINT chk_barber_sales_total_non_negative CHECK (total_amount >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_sales_change_non_negative'
  ) THEN
    ALTER TABLE barber_sales
      ADD CONSTRAINT chk_barber_sales_change_non_negative CHECK (change_amount >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_cash_sessions_status'
  ) THEN
    ALTER TABLE barber_cash_sessions
      ADD CONSTRAINT chk_barber_cash_sessions_status
      CHECK (status IN ('open', 'pre_closed', 'closed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_barber_cash_sessions_values_non_negative'
  ) THEN
    ALTER TABLE barber_cash_sessions
      ADD CONSTRAINT chk_barber_cash_sessions_values_non_negative
      CHECK (
        opening_balance >= 0
        AND gross_total >= 0
        AND net_total >= 0
        AND pix_total >= 0
        AND cash_total >= 0
        AND credit_total >= 0
        AND debit_total >= 0
        AND trade_total >= 0
        AND discount_total >= 0
        AND change_total >= 0
        AND total_sales >= 0
        AND total_services >= 0
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_barber_services_company_id ON barber_services(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_services_company_name ON barber_services(company_id, name) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_barber_services_company_status ON barber_services(company_id, is_active) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_barber_suppliers_company_id ON barber_suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_suppliers_company_name ON barber_suppliers(company_id, name) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_barber_products_supplier_id ON barber_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_barber_products_company_id ON barber_products(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_products_company_name ON barber_products(company_id, name) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_barber_products_company_status ON barber_products(company_id, is_active) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_barber_products_company_category ON barber_products(company_id, category) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_barber_products_company_internal_code ON barber_products(company_id, internal_code) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_barber_collaborators_company_id ON barber_collaborators(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_collaborators_user_id ON barber_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_barber_collaborators_available_for_booking ON barber_collaborators(company_id, available_for_booking, is_active);
CREATE INDEX IF NOT EXISTS idx_barber_appointments_company_id ON barber_appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_appointments_date ON barber_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_barber_appointments_status ON barber_appointments(status);
CREATE INDEX IF NOT EXISTS idx_barber_sales_company_id ON barber_sales(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_sales_company_date ON barber_sales(company_id, sale_date_local);
CREATE INDEX IF NOT EXISTS idx_barber_sales_company_status_date ON barber_sales(company_id, status, sale_date_local DESC);
CREATE INDEX IF NOT EXISTS idx_barber_sales_company_status_created ON barber_sales(company_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_barber_sales_company_collaborator_date ON barber_sales(company_id, collaborator_id, sale_date_local DESC);
CREATE INDEX IF NOT EXISTS idx_barber_sale_items_sale_id ON barber_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_barber_sale_items_company_id ON barber_sale_items(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_sale_items_product_id ON barber_sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_barber_sale_items_service_id ON barber_sale_items(service_id);
CREATE INDEX IF NOT EXISTS idx_barber_advances_company_id ON barber_advances(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_advances_collaborator_id ON barber_advances(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_barber_advances_status ON barber_advances(status);
CREATE INDEX IF NOT EXISTS idx_barber_settlements_company_id ON barber_settlements(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_settlements_collaborator_id ON barber_settlements(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_barber_audit_logs_company_id ON barber_audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_audit_logs_entity ON barber_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_barber_cash_sessions_company_date ON barber_cash_sessions(company_id, cash_date DESC);
CREATE INDEX IF NOT EXISTS idx_barber_cash_sessions_company_status ON barber_cash_sessions(company_id, status, cash_date DESC);

CREATE TABLE IF NOT EXISTS barber_working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES barber_collaborators(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL, -- 0-6 (Dom-Sab)
  opens_at TIME,
  closes_at TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uq_barber_working_hours_comp_coll_day UNIQUE (company_id, collaborator_id, weekday)
);

CREATE INDEX IF NOT EXISTS idx_barber_working_hours_company_id ON barber_working_hours(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_working_hours_company ON barber_working_hours(company_id);
CREATE INDEX IF NOT EXISTS idx_barber_working_hours_company_weekday ON barber_working_hours(company_id, weekday);
CREATE INDEX IF NOT EXISTS idx_barber_working_hours_collaborator_id ON barber_working_hours(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_barber_working_hours_collaborator ON barber_working_hours(collaborator_id);

ALTER TABLE barber_appointments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'admin_manual';
ALTER TABLE barber_appointments ADD COLUMN IF NOT EXISTS canceled_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_barber_appointments_comp_coll_start ON barber_appointments(company_id, collaborator_id, appointment_date, appointment_time);
