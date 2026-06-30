-- Migration 029: Explicit grants for app_runtime on barber tenant tables
-- Context: GRANT ON ALL TABLES (migration 026) cobre todas as tabelas existentes
-- no momento em que foi executada. Esta migration é uma rede de segurança
-- explícita para as tabelas acessadas pelo ScheduleService via poolTenant.
-- Idempotente e seguro executar múltiplas vezes.

-- ============================================
-- barber_working_hours
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON barber_working_hours TO app_runtime;

-- ============================================
-- barber_booking_blocks
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON barber_booking_blocks TO app_runtime;

-- ============================================
-- barber_booking_settings
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON barber_booking_settings TO app_runtime;

-- ============================================
-- Reforço da policy RLS (já existe em rls_tenant_tables.sql)
-- Idempotente: DROP + CREATE
-- ============================================
DROP POLICY IF EXISTS tenant_isolation ON barber_working_hours;
CREATE POLICY tenant_isolation ON barber_working_hours
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_booking_blocks;
CREATE POLICY tenant_isolation ON barber_booking_blocks
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation ON barber_booking_settings;
CREATE POLICY tenant_isolation ON barber_booking_settings
  USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
  WITH CHECK (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);

-- ============================================
-- Schema hardening: constraints ausentes do barber.sql
-- O runtime DDL (ensureWorkingHoursSchema) nunca altera tabela existente,
-- então estas constraints nunca foram aplicadas.
-- Idempotente: seguro executar múltiplas vezes.
-- ============================================

-- Backfill NULLs antes de adicionar NOT NULL
UPDATE barber_working_hours SET opens_at = '09:00' WHERE opens_at IS NULL;
UPDATE barber_working_hours SET closes_at = '18:00' WHERE closes_at IS NULL;
UPDATE barber_working_hours SET is_closed = false WHERE is_closed IS NULL;

-- NOT NULL nas colunas que o runtime DDL exigia
ALTER TABLE barber_working_hours ALTER COLUMN opens_at SET NOT NULL;
ALTER TABLE barber_working_hours ALTER COLUMN closes_at SET NOT NULL;
ALTER TABLE barber_working_hours ALTER COLUMN is_closed SET NOT NULL;

-- CHECK constraint que o runtime DDL exigia (weekday 0-6)
ALTER TABLE barber_working_hours ADD CONSTRAINT chk_barber_working_hours_weekday
  CHECK (weekday BETWEEN 0 AND 6);
