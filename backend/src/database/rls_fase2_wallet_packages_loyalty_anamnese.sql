-- RLS Fase 2 — Wallet / Pacotes / Fidelidade / Anamnese
-- RECUPERADO do stash wa-reminder (2026-06-04). NÃO registrado em
-- run-migrations.js de propósito: as tabelas-alvo são criadas nas
-- migrations 018–021, e este arquivo só pode ser registrado DEPOIS
-- delas (nunca como parte da 017/rls_tenant_tables.sql — quebra
-- bancos recém-criados).
-- DÉBITO CONHECIDO: políticas no padrão antigo (sem NULLIF e sem
-- WITH CHECK). Harmonizar com rls_tenant_tables.sql antes de
-- registrar como migration (requer autorização humana).

-- ============================================
-- Fase 2 — Wallet / Pré-pagamento (PRD-008)
-- ============================================

ALTER TABLE company_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON company_wallets;
CREATE POLICY tenant_isolation ON company_wallets
  USING (company_id = current_setting('app.current_company_id', true)::uuid);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON wallet_transactions;
CREATE POLICY tenant_isolation ON wallet_transactions
  USING (company_id = current_setting('app.current_company_id', true)::uuid);

ALTER TABLE deposit_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON deposit_configs;
CREATE POLICY tenant_isolation ON deposit_configs
  USING (company_id = current_setting('app.current_company_id', true)::uuid);

ALTER TABLE topup_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON topup_requests;
CREATE POLICY tenant_isolation ON topup_requests
  USING (company_id = current_setting('app.current_company_id', true)::uuid);

-- ============================================
-- Fase 2 — Pacotes (PRD-009)
-- ============================================

ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON service_packages;
CREATE POLICY tenant_isolation ON service_packages
  USING (company_id = current_setting('app.current_company_id', true)::uuid);

ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON customer_packages;
CREATE POLICY tenant_isolation ON customer_packages
  USING (company_id = current_setting('app.current_company_id', true)::uuid);

ALTER TABLE package_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON package_redemptions;
CREATE POLICY tenant_isolation ON package_redemptions
  USING (company_id = current_setting('app.current_company_id', true)::uuid);

-- ============================================
-- Fase 2 — Fidelidade (PRD-010)
-- ============================================

ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON loyalty_programs;
CREATE POLICY tenant_isolation ON loyalty_programs
  USING (company_id = current_setting('app.current_company_id', true)::uuid);

ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON customer_loyalty;
CREATE POLICY tenant_isolation ON customer_loyalty
  USING (company_id = current_setting('app.current_company_id', true)::uuid);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON loyalty_transactions;
CREATE POLICY tenant_isolation ON loyalty_transactions
  USING (company_id = current_setting('app.current_company_id', true)::uuid);

-- ============================================
-- Fase 2 — Anamnese (PRD-011)
-- ============================================

ALTER TABLE anamnesis_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON anamnesis_templates;
CREATE POLICY tenant_isolation ON anamnesis_templates
  USING (company_id = current_setting('app.current_company_id', true)::uuid);

ALTER TABLE anamnesis_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON anamnesis_responses;
CREATE POLICY tenant_isolation ON anamnesis_responses
  USING (company_id = current_setting('app.current_company_id', true)::uuid);
