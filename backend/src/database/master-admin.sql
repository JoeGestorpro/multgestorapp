CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS document TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS niche TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

UPDATE companies SET niche = niche_type WHERE niche IS NULL AND niche_type IS NOT NULL;
UPDATE companies SET is_deleted = false WHERE is_deleted IS NULL;
UPDATE companies SET updated_at = created_at WHERE updated_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_email_not_deleted
  ON companies (LOWER(email))
  WHERE email IS NOT NULL AND is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_companies_status_not_deleted ON companies(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_companies_name_not_deleted ON companies(name) WHERE is_deleted = false;

ALTER TABLE modules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
UPDATE modules SET updated_at = created_at WHERE updated_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_modules_slug_unique ON modules(slug);

ALTER TABLE company_modules ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP;
ALTER TABLE company_modules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE company_modules ADD COLUMN IF NOT EXISTS activated_by UUID REFERENCES users(id) ON DELETE SET NULL;
UPDATE company_modules SET updated_at = created_at WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_company_modules_module_id ON company_modules(module_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_modules_active_unique
  ON company_modules(company_id, module_id)
  WHERE status = 'active';

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_due_date DATE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
UPDATE subscriptions SET plan_name = 'Plano' WHERE plan_name IS NULL;
UPDATE subscriptions SET updated_at = created_at WHERE updated_at IS NULL;

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO settings (key, value)
VALUES
  ('platform_name', 'MultGestor'),
  ('sender_email', ''),
  ('main_domain', ''),
  ('token_expiration_hours', '24'),
  ('maintenance_mode', 'false'),
  ('support_whatsapp', ''),
  ('support_email', '')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

ALTER TABLE first_access_tokens ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE first_access_tokens ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE first_access_tokens ADD COLUMN IF NOT EXISTS profile TEXT;
ALTER TABLE first_access_tokens ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT false;
ALTER TABLE first_access_tokens ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

UPDATE first_access_tokens
SET used = true
WHERE used_at IS NOT NULL;
