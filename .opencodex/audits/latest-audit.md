# Audit Report — Fase 1 (CI-only) — Runtime role least-privilege (app_runtime) para testes RLS

---
status: decided
claude_decision: APPROVE
claude_decided_at: 2026-06-06
claude_decision_note: auditoria independente do diff confirmou 3/3 ALLOWLIST, desvio APP_RUNTIME_URL justificado, 32/32. Commit local a179085 (sem push).
task_id: runtime-role-least-privilege-rls-enforcement
phase: 1-ci-only
title: Fase 1 (CI-only) — usar role app_runtime sem BYPASSRLS nos testes RLS
audited_by: OpenCode Auditor (Big Pickle)
audited_at: 2026-06-05
verdict: APPROVE
risk_level: Baixo (CI/testes apenas — sem produção, secrets ou deploy)
branch: fase1/runtime-role-ci-only
---

## 1. Contexto
A Fase 1 do plano least-privilege cria a role `app_runtime` (sem BYPASSRLS) no CI e aponta os testes de
isolamento RLS para ela, eliminando o falso positivo em que o pool superuser (BYPASSRLS) ignorava as
policies. Auditoria read-only após execução no branch `fase1/runtime-role-ci-only`.

## 2. ALLOWLIST — 3/3 arquivos, sem scope drift
| # | Arquivo | Tipo | Status |
|---|---------|------|--------|
| 1 | `.github/workflows/ci.yml` | Editado | ✅ |
| 2 | `backend/tests/integration/tenant-isolation-rls.test.js` | Editado | ✅ |
| 3 | `backend/src/database/runtime_role_grants.sql` | Novo | ✅ |

Nenhuma alteração fora da ALLOWLIST. `.opencodex/` (governança) tracking apenas.

## 3. Verificação item a item

### 3.1. `runtime_role_grants.sql` (novo)
- Apenas GRANTs e ALTER DEFAULT PRIVILEGES para `app_runtime` (USAGE schema + CRUD em tabelas + sequences)
- Sem CREATE ROLE, sem senha — operação/secret externo ✅
- Idempotente ✅

### 3.2. `ci.yml` — Novo step pós-migrations
- `CREATE ROLE app_runtime ... NOBYPASSRLS` idempotente (`|| true`) ✅
- `psql -f runtime_role_grants.sql` aplica grants ✅
- `ADMIN_DATABASE_URL` = postgres (seed/cleanup dos testes) ✅
- `TEST_DATABASE_URL` = postgres (mantido admin para o helper `test-database.js`) ✅
- `APP_RUNTIME_URL` = app_runtime (pool dos testes RLS) ✅
- Sem alteração na pipeline principal de testes unitários/frontend ✅

### 3.3. `tenant-isolation-rls.test.js`
- `testPool` → `adminPool` (via `ADMIN_DATABASE_URL`) para seed/cleanup ✅
- `runtimePool` (via `APP_RUNTIME_URL`) para asserções RLS ✅
- Removida aplicação inline do RLS (`rls_tenant_tables.sql` já vem das migrations) ✅
- Teste "sem GUC" usa Pool fresh (mitiga `''::uuid` crash pós-SET LOCAL + COMMIT) ✅
- Teste 4 (write isolation via pool.connect wrap) usa `runWithTenantClient` + ALS + SET LOCAL ✅

## 4. Critérios de aceite
- [x] `tenant-isolation-rls.test.js` verde com isolamento real (sem BYPASSRLS)
- [x] **32/32** testes de integração (2 suites × 2 passed)
- [x] **Sem `skip`**, **sem `xfail`**
- [x] **Sem alteração em produção** — apenas CI/testes
- [x] **Sem exposição de secrets**
- [x] **Diff restrito aos 3 arquivos da ALLOWLIST**

## 5. Escopo proibido — verificado
- ❌ Nenhum arquivo fora dos 3 da ALLOWLIST foi alterado ✅
- ❌ `DATABASE_URL` principal do CI permanece postgres (admin) ✅
- ❌ Produção, secrets, `deploy.yml`, jobs ou `config/database.js` intactos ✅
- ❌ Nenhum `skip`/`xfail` introduzido ✅

## 6. NOTA — Achado arquitetural (já documentado em current-task.md)
`current_setting('app.current_company_id', true)::uuid` retorna `''` (não `NULL`) após `SET LOCAL` +
`COMMIT` na mesma sessão → `''::uuid` crasha. Mitigado com Pool fresh no teste "sem GUC". Sem
impacto em runtime (cada request HTTP tem seu próprio client do pool, sem reuso pós-COMMIT).

## 7. Veredito
**APPROVE** — 3/3 ALLOWLIST respeitado, sem scope drift, sem produção, sem secrets. 32/32 testes
de integração verdes com isolamento RLS real (role app_runtime sem BYPASSRLS).
