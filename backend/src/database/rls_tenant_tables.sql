-- Sprint 17 — Row-Level Security (RLS) nas tabelas tenant
-- Idempotente: DROP POLICY IF EXISTS + CREATE POLICY (PostgreSQL não tem CREATE POLICY IF NOT EXISTS)
-- ATENÇÃO: Testar em staging antes de produção.
-- O SET LOCAL app.current_company_id reseta automaticamente ao fim da transação.

-- ============================================
-- Tabelas BarberGestor
-- ============================================

ALTER TABLE barber_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_services;
CREATE POLICY tenant_isolation ON barber_services
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_suppliers;
CREATE POLICY tenant_isolation ON barber_suppliers
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_products;
CREATE POLICY tenant_isolation ON barber_products
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_collaborators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_collaborators;
CREATE POLICY tenant_isolation ON barber_collaborators
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_appointments;
CREATE POLICY tenant_isolation ON barber_appointments
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_sales;
CREATE POLICY tenant_isolation ON barber_sales
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_sale_items;
CREATE POLICY tenant_isolation ON barber_sale_items
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_cash_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_cash_sessions;
CREATE POLICY tenant_isolation ON barber_cash_sessions
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_advances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_advances;
CREATE POLICY tenant_isolation ON barber_advances
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_settlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_settlements;
CREATE POLICY tenant_isolation ON barber_settlements
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_working_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_working_hours;
CREATE POLICY tenant_isolation ON barber_working_hours
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_booking_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_booking_blocks;
CREATE POLICY tenant_isolation ON barber_booking_blocks
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_booking_landing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_booking_landing;
CREATE POLICY tenant_isolation ON barber_booking_landing
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_booking_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_booking_settings;
CREATE POLICY tenant_isolation ON barber_booking_settings
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_client_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_client_notes;
CREATE POLICY tenant_isolation ON barber_client_notes
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_client_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_client_tags;
CREATE POLICY tenant_isolation ON barber_client_tags
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE barber_client_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON barber_client_events;
CREATE POLICY tenant_isolation ON barber_client_events
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- ============================================
-- Tabelas ClimaGestor
-- ============================================

ALTER TABLE clima_professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON clima_professionals;
CREATE POLICY tenant_isolation ON clima_professionals
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE clima_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON clima_services;
CREATE POLICY tenant_isolation ON clima_services
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

ALTER TABLE clima_appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON clima_appointments;
CREATE POLICY tenant_isolation ON clima_appointments
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- ============================================
-- Tabelas Booking / Cliente
-- ============================================

ALTER TABLE booking_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON booking_customers;
CREATE POLICY tenant_isolation ON booking_customers
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- ============================================
-- Tabelas auxiliares tenant
-- ============================================

-- NOTA: settings é tabela GLOBAL (configurações da plataforma master-admin).
-- Não possui company_id e NÃO deve ter RLS tenant. Ver master-admin.sql.

ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON integration_configs;
CREATE POLICY tenant_isolation ON integration_configs
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- trial_email_log é global (master admin pode ver todas)
-- NÃO aplicar RLS