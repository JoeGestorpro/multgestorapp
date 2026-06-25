-- A-001: RLS para companies e users
-- Aplica Row Level Security nas tabelas companies e users.
-- Só tem efeito para conexões cujo role NÃO possui BYPASSRLS (app_runtime).
-- DATABASE_URL / service_role mantêm BYPASSRLS e ignoram estas policies.

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_self_read ON companies;
CREATE POLICY tenant_self_read ON companies
  FOR SELECT
  USING (id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_self_update ON companies;
CREATE POLICY tenant_self_update ON companies
  FOR UPDATE
  USING (id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- INSERT companies: sem policy ? default DENY (app_runtime não cria empresas)
-- DELETE companies: sem policy ? default DENY (app_runtime não deleta empresas)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_users_select ON users;
CREATE POLICY tenant_users_select ON users
  FOR SELECT
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_users_insert ON users;
CREATE POLICY tenant_users_insert ON users
  FOR INSERT
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_users_update ON users;
CREATE POLICY tenant_users_update ON users
  FOR UPDATE
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- DELETE users: sem policy ? default DENY (app_runtime não pode hard-deletar usuários)
-- Barber app usa soft-delete (is_deleted); remover esta seção é intencional (least-privilege).