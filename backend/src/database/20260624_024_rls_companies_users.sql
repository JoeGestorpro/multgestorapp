-- Migration 024 — RLS policies para companies e users
-- Padronização: nomes tenant_* (alinhado com SQL canônico)
-- Idempotente: DROP POLICY IF EXISTS + CREATE POLICY
-- Depende de: app.current_company_id (setado via requireCompany middleware)
-- Contexto: app_runtime role (NOBYPASSRLS) verá apenas a própria empresa
-- Master admin acessa via pool principal (postgres, BYPASSRLS)
-- Sem dependência de app.auth_scope — apenas app.current_company_id

-- companies: policies específicas por operação
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_select_own ON companies;
DROP POLICY IF EXISTS tenant_self_read ON companies;
CREATE POLICY tenant_self_read ON companies
  FOR SELECT
  USING (id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS companies_update_own ON companies;
DROP POLICY IF EXISTS tenant_self_update ON companies;
CREATE POLICY tenant_self_update ON companies
  FOR UPDATE
  USING (id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- INSERT companies: sem policy ? default DENY (app_runtime não cria empresas)
-- DELETE companies: sem policy ? default DENY (app_runtime não deleta empresas)

-- users: policies específicas por operação
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own_company ON users;
DROP POLICY IF EXISTS tenant_users_select ON users;
CREATE POLICY tenant_users_select ON users
  FOR SELECT
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS users_insert_own_company ON users;
DROP POLICY IF EXISTS tenant_users_insert ON users;
CREATE POLICY tenant_users_insert ON users
  FOR INSERT
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS users_update_own_company ON users;
DROP POLICY IF EXISTS tenant_users_update ON users;
CREATE POLICY tenant_users_update ON users
  FOR UPDATE
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- DELETE users: sem policy ? default DENY (soft-delete via is_deleted)