# ✅ CURRENT TASK — Concluída

---
status: completed
task_id: runtime-role-least-privilege-rls-enforcement
phase: 1-ci-only
title: Fase 1 (CI-only) — usar role app_runtime sem BYPASSRLS nos testes RLS
started_at: 2026-06-05
completed_at: 2026-06-05
branch: fase1/runtime-role-ci-only
---

## Resultado
**Test Suites: 2 passed · Tests: 32 passed · 0 falhas**

## O que foi feito

### 1. `backend/src/database/runtime_role_grants.sql` (novo)
GRANTs idempotentes para `app_runtime`. Sem CREATE ROLE/senha (ops/secret).

### 2. `.github/workflows/ci.yml`
- Novo step "Create least-privilege runtime role (app_runtime)" após migrations
- `ADMIN_DATABASE_URL` = postgres (seed/cleanup)
- `TEST_DATABASE_URL` = postgres (mantida admin — `test-database.js` helper usa esta)
- `APP_RUNTIME_URL` = app_runtime (nova — para testes RLS)

### 3. `backend/tests/integration/tenant-isolation-rls.test.js`
- `testPool` → `adminPool` (ADMIN_DATABASE_URL) para seed/cleanup
- `runtimePool` (APP_RUNTIME_URL) para asserções RLS
- Removida aplicação inline do RLS (`rls_tenant_tables.sql` já vem das migrations)
- Teste "sem GUC" usa Pool fresh (evita `''::uuid` crash pós-SET LOCAL)

## Achado
RLS policy `current_setting('app.current_company_id', true)::uuid` retorna `''` (não NULL)
após `SET LOCAL` + `COMMIT` no mesmo session. `''::uuid` crasha. Mitigado com Pool fresh.

## Escopo
- 3 arquivos da ALLOWLIST (ci.yml, test.js, runtime_role_grants.sql)
- `.opencodex/` (governança) — tracking apenas
- Sem tocar produção, secrets, DATABASE_URL principal
