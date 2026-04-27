CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT,
  module_key TEXT,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gateway TEXT,
  external_product_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS gateway TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS external_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS external_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS module_key TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS canceled_reason TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  gateway TEXT,
  event_id TEXT,
  event_type TEXT NOT NULL,
  event_status TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_gateway_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  raw_body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  gateway TEXT,
  external_invoice_id TEXT,
  external_charge_id TEXT,
  module_key TEXT,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  due_at TIMESTAMP,
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_gateway_events_gateway_event_id
  ON payment_gateway_events(gateway, event_id);

CREATE INDEX IF NOT EXISTS idx_plans_module_id ON plans(module_id);
CREATE INDEX IF NOT EXISTS idx_plans_module_key ON plans(module_key);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway ON subscriptions(gateway);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_company_id ON subscription_events(company_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_events_event_id ON payment_gateway_events(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_events_gateway ON payment_gateway_events(gateway);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_events_created_at ON payment_gateway_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_paid_at ON invoices(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_gateway ON invoices(gateway);
