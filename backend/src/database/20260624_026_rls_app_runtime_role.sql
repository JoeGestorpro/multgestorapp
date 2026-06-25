-- Migration 026 — Criação idempotente da role app_runtime (NOBYPASSRLS)
-- Grants mínimos para operações tenant com RLS ativo
-- A role DEVE ter NOBYPASSRLS para que as RLS policies tenham efeito
-- A senha aqui é placeholder (dev/CI) — em produção a senha real é definida manualmente
-- Se a role já existe (produção), o bloco DO ignora

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime
      LOGIN PASSWORD 'app_runtime'
      NOSUPERUSER NOCREATEDB NOCREATEROLE
      NOBYPASSRLS INHERIT;
  END IF;
END
$$;

-- Grants idempotentes (repetir é seguro)
GRANT USAGE ON SCHEMA public TO app_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
