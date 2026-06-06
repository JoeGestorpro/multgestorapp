-- runtime_role_grants.sql
-- GRANTs idempotentes para a role app_runtime (sem BYPASSRLS).
-- A role DEVE ser criada externamente (CREATE ROLE + senha = ops/secret).
-- Este arquivo contém APENAS GRANTs e ALTER DEFAULT PRIVILEGES.

GRANT USAGE ON SCHEMA public TO app_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
