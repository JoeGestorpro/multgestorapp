# MISSÃO EXECUTÁVEL — Fase 1 (CI-only): eliminar BYPASSRLS dos testes de integração

> **GATED.** Este card está **pronto para execução**, porém **NÃO** deve ser copiado para
> `.opencodex/queue/next-task.md` sem **aprovação humana explícita + revisão final do plano**.
> Enquanto não promovido, o OpenCode Executor **não** o executa (executor só lê `next-task.md`).
> Diffs exatos: `docs/runbooks/runtime-role-least-privilege-plan.md` (§1, §2, §3).
> Diagnóstico: `docs/SECURITY-TENANT-ISOLATION.md`.

---
status: blocked
task_id: runtime-role-least-privilege-rls-enforcement
phase: 1-ci-only
title: Fase 1 (CI-only) — usar role app_runtime sem BYPASSRLS nos testes RLS
created_by: Claude Code
created_at: 2026-06-05
shell: powershell
mode: EXECUTE_WITH_REVIEW
requires_human_approval: true
mission_source: docs/runbooks/runtime-role-least-privilege-plan.md
diagnosis_source: docs/SECURITY-TENANT-ISOLATION.md
---

## MODEL CAPABILITY ASSESSMENT
- **Executor recomendado:** Big Pickle, **com revisão obrigatória** (EXECUTE_WITH_REVIEW).
- **Nível de risco:** **Baixo** — só CI/teste. **Produção: nulo** (não toca prod, secrets nem deploy).
- **Escalonamento:** qualquer desvio do escopo de 3 arquivos → **PARAR e reportar**.
- **Justificativa:** os 3 testes RLS falham porque a conexão de teste é superuser/BYPASSRLS. A Fase 1
  aponta a conexão de asserção para `app_runtime` (não-bypass), mantendo `DATABASE_URL` principal em admin
  → o resto da suíte de integração fica intacto.

## Objetivo
Eliminar BYPASSRLS dos testes de integração usando `app_runtime`, fazendo `tenant-isolation-rls.test.js`
ficar verde com isolamento **real** (sem skip/xfail), atingindo **32/32** na suíte de integração.

## Escopo autorizado (APENAS estes 3 arquivos)
- `.github/workflows/ci.yml`
- `backend/tests/integration/tenant-isolation-rls.test.js`
- `backend/src/database/runtime_role_grants.sql` (novo)

## Passos (aplicar os diffs do plano)
1. **Criar** `backend/src/database/runtime_role_grants.sql` com os GRANTs idempotentes (plano §2).
   - Apenas GRANTs/ALTER DEFAULT PRIVILEGES. **Sem** `CREATE ROLE`/senha no arquivo.
2. **Editar** `.github/workflows/ci.yml` (plano §1.A):
   - Novo step após `Run migrations`: "Create least-privilege runtime role (app_runtime)" (CREATE ROLE
     idempotente inline + `psql -f src/database/runtime_role_grants.sql`).
   - No step `Run integration tests`: `TEST_DATABASE_URL` → `app_runtime`; **adicionar** `ADMIN_DATABASE_URL`
     (= postgres); **manter** `DATABASE_URL` como `postgres`.
3. **Editar** `backend/tests/integration/tenant-isolation-rls.test.js` (plano §3):
   - `testPool` → `adminPool` (seed/cleanup, via `ADMIN_DATABASE_URL`) + `runtimePool` (asserções, via
     `TEST_DATABASE_URL`).
   - **Remover** a aplicação interna do RLS (`testPool.query(rlsSql)`) — RLS já vem das migrations; `ALTER
     TABLE` falharia sob não-owner.
   - Testes 1-3 e a verificação do teste 4 → `runtimePool`; cleanup do teste 4 → `adminPool`.

## Validação obrigatória (antes de qualquer push)
- Subir Postgres local (admin), rodar migrations, criar `app_runtime` + grants.
- Rodar:
  ```powershell
  $env:ADMIN_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/multgestor_test"
  $env:TEST_DATABASE_URL  = "postgresql://app_runtime:app_runtime@localhost:5432/multgestor_test"
  Set-Location backend
  npm run test:integration
  Set-Location ..
  ```
- **Esperado:** `Test Suites: 2 passed`, `Tests: 32 passed`.

## Critério de sucesso
- [ ] `tenant-isolation-rls.test.js` verde.
- [ ] **32/32** testes de integração.
- [ ] **sem** `skip`, **sem** `xfail`.
- [ ] **sem** alteração em produção.
- [ ] **sem** alteração de secrets.
- [ ] Diff restrito aos 3 arquivos do escopo.

## ❌ Escopo proibido
- ❌ Tocar qualquer arquivo fora dos 3 do escopo.
- ❌ Mudar `DATABASE_URL` principal do CI (fica admin nesta fase).
- ❌ Tocar produção, secrets, `deploy.yml`, jobs ou `config/database.js`.
- ❌ Resolver via `skip`/`xfail`.
- ❌ `git push` sem confirmação humana.

## 🛑 Hard stops
1. Se qualquer teste fora dos 3 RLS regredir → **PARAR e reportar** (esperado: nenhum, pois app pool fica admin).
2. Se a suíte não chegar a 32/32 → **PARAR**, não dar push.
3. Se o diff escapar dos 3 arquivos → **PARAR**.

## Como promover (somente Claude Code, após aprovação humana)
1. Revisão final do plano + aprovação humana registrada.
2. Copiar este card para `.opencodex/queue/next-task.md` (status `pending`).
3. Marcar esta entrada como `promoted` no backlog.
4. Pós-execução: `/audit-task` → devolver ao Claude Code; push só com confirmação humana.
