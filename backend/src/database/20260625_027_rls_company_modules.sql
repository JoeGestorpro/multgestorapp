-- Migration 027: RLS policies for company_modules and modules
-- Contexto: app_runtime role (NOBYPASSRLS) verá apenas os módulos da própria empresa
-- Master admin acessa via pool principal (postgres, BYPASSRLS)

-- company_modules: tenant isolation (possui company_id)
-- Já possui RLS habilitado (relrowsecurity = true), adicionamos a policy faltante
DROP POLICY IF EXISTS tenant_isolation ON company_modules;
CREATE POLICY tenant_isolation ON company_modules
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- modules: tabela catálogo (NÃO possui company_id)
-- app_runtime precisa ler todos os módulos para joins com company_modules
-- Já possui RLS habilitado (relrowsecurity = true), adicionamos policy de leitura irrestrita
DROP POLICY IF EXISTS tenant_read_modules ON modules;
CREATE POLICY tenant_read_modules ON modules
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE em modules: sem policy → default DENY (app_runtime não gerencia catálogo)
