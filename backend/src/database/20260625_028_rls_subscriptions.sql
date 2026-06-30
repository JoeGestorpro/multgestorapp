-- Migration 028: RLS policy for subscriptions
-- Contexto: app_runtime role (NOBYPASSRLS) verá apenas assinaturas da própria empresa
-- Master admin acessa via pool principal (postgres, BYPASSRLS)

-- subscriptions: tenant isolation (possui company_id)
-- Já possui RLS habilitado (relrowsecurity = true), adicionamos a policy faltante
DROP POLICY IF EXISTS tenant_isolation ON subscriptions;
CREATE POLICY tenant_isolation ON subscriptions
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- INSERT/UPDATE/DELETE: sem policy → default DENY (app_runtime não gerencia assinaturas)
