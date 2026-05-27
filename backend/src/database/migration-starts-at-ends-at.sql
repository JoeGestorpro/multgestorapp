-- ============================================================
-- Migration: starts_at / ends_at — Verificação e Backfill
-- Objetivo: Garantir que todas as colunas e dados estejam
--           consistentes antes de remover appointment_date/time.
-- Reversível: SIM — não remove colunas ou dados existentes.
-- ============================================================

-- 1. Adiciona colunas se ainda não existirem (defensivo)
ALTER TABLE barber_appointments ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE barber_appointments ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

-- 2. Torna appointment_date/appointment_time nullable se ainda não forem
ALTER TABLE barber_appointments ALTER COLUMN appointment_date DROP NOT NULL;
ALTER TABLE barber_appointments ALTER COLUMN appointment_time DROP NOT NULL;

-- 3. Backfill: preenche starts_at onde está NULL mas temos appointment_date + appointment_time
UPDATE barber_appointments
SET starts_at = (
      appointment_date::text || 'T' || appointment_time::text || ':00-04:00'
    )::timestamptz
WHERE starts_at IS NULL
  AND appointment_date IS NOT NULL
  AND appointment_time IS NOT NULL;

-- 4. Backfill: preenche ends_at onde está NULL mas starts_at foi preenchido
UPDATE barber_appointments
SET ends_at = starts_at + (COALESCE(barber_services.estimated_time_minutes, 30) || ' minutes')::interval
FROM barber_services
WHERE barber_services.id = barber_appointments.service_id
  AND barber_services.company_id = barber_appointments.company_id
  AND barber_appointments.starts_at IS NOT NULL
  AND barber_appointments.ends_at IS NULL;

-- 5. Índices para performance (IF NOT EXISTS seguro)
CREATE INDEX IF NOT EXISTS idx_barber_appointments_starts_at ON barber_appointments(starts_at);
CREATE INDEX IF NOT EXISTS idx_barber_appointments_collaborator_period
  ON barber_appointments(company_id, collaborator_id, starts_at, ends_at);

-- 6. Remove índices antigos que dependiam de appointment_date (seguro)
DROP INDEX IF EXISTS idx_barber_appointments_date;
DROP INDEX IF EXISTS idx_barber_appointments_comp_coll_start;
