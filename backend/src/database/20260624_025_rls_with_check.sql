-- Migration 025 — WITH CHECK explícito nas 22 policies tenant
-- Idempotente: DROP POLICY IF EXISTS + CREATE POLICY
-- Objetivo: explicitar WITH CHECK que o PostgreSQL deriva de USING quando omisso
-- Melhora legibilidade e segurança (defensivo contra mudanças futuras)
-- Sem dependência de app.auth_scope — apenas app.current_company_id
-- Tabelas A-006 (mg_prepaid_v1, mg_packages_v1, mg_loyalty_v1, mg_anamnese_v1): fora de escopo

-- ============================================
-- BarberGestor
-- ============================================

DROP POLICY IF EXISTS tenant_isolation ON barber_services;
CREATE POLICY tenant_isolation ON barber_services
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_suppliers;
CREATE POLICY tenant_isolation ON barber_suppliers
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_products;
CREATE POLICY tenant_isolation ON barber_products
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_collaborators;
CREATE POLICY tenant_isolation ON barber_collaborators
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_appointments;
CREATE POLICY tenant_isolation ON barber_appointments
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_sales;
CREATE POLICY tenant_isolation ON barber_sales
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_sale_items;
CREATE POLICY tenant_isolation ON barber_sale_items
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_cash_sessions;
CREATE POLICY tenant_isolation ON barber_cash_sessions
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_advances;
CREATE POLICY tenant_isolation ON barber_advances
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_settlements;
CREATE POLICY tenant_isolation ON barber_settlements
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_working_hours;
CREATE POLICY tenant_isolation ON barber_working_hours
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- ============================================
-- Booking
-- ============================================

DROP POLICY IF EXISTS tenant_isolation ON barber_booking_blocks;
CREATE POLICY tenant_isolation ON barber_booking_blocks
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_booking_landing;
CREATE POLICY tenant_isolation ON barber_booking_landing
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_booking_settings;
CREATE POLICY tenant_isolation ON barber_booking_settings
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_client_notes;
CREATE POLICY tenant_isolation ON barber_client_notes
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_client_tags;
CREATE POLICY tenant_isolation ON barber_client_tags
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_client_events;
CREATE POLICY tenant_isolation ON barber_client_events
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- ============================================
-- ClimaGestor
-- ============================================

DROP POLICY IF EXISTS tenant_isolation ON clima_professionals;
CREATE POLICY tenant_isolation ON clima_professionals
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON clima_services;
CREATE POLICY tenant_isolation ON clima_services
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON clima_appointments;
CREATE POLICY tenant_isolation ON clima_appointments
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- ============================================
-- Booking / Cliente
-- ============================================

DROP POLICY IF EXISTS tenant_isolation ON booking_customers;
CREATE POLICY tenant_isolation ON booking_customers
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- ============================================
-- Configurações tenant
-- ============================================

DROP POLICY IF EXISTS tenant_isolation ON integration_configs;
CREATE POLICY tenant_isolation ON integration_configs
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);