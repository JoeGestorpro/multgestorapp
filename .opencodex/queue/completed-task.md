# ✅ COMPLETED TASK — Resultado Final

---
status: audited
result: success
task_id: runtime-role-least-privilege-rls-enforcement
phase: 1-ci-only
title: Fase 1 (CI-only) — usar role app_runtime sem BYPASSRLS nos testes RLS
completed_at: 2026-06-06
branch: fase1/runtime-role-ci-only
commits:
  - a179085 feat(ci): RLS Fase 1 CI-only — app_runtime sem BYPASSRLS nos testes de isolamento
mode: EXECUTE_WITH_REVIEW
audit_verdict: APPROVE          # OpenCode Auditor (Big Pickle), 2026-06-05
claude_decision: APPROVE        # auditoria independente do diff por Claude Code
claude_decided_at: 2026-06-06
pushed: false                   # commit LOCAL apenas — push só com confirmação humana
---

## Resumo
Criada a role `app_runtime` (NOBYPASSRLS) no Postgres efêmero do CI; os testes de isolamento RLS passam a
asseverar com ela, eliminando o falso positivo do pool superuser (BYPASSRLS ignorava as policies).
Isolamento RLS **real** validado: **32/32** integração, sem skip/xfail. Produção/secrets/deploy intactos.

## Verificação independente (Claude Code)
- **ALLOWLIST 3/3**, sem scope drift: `ci.yml`, `tenant-isolation-rls.test.js`, `runtime_role_grants.sql` (novo).
- `runtime_role_grants.sql`: só GRANTs + ALTER DEFAULT PRIVILEGES, idempotente, **sem** CREATE ROLE/senha.
- `ci.yml`: step `CREATE ROLE ... NOBYPASSRLS` idempotente + `psql -f grants`; integração com `ADMIN_DATABASE_URL`
  (postgres) e `APP_RUNTIME_URL` (app_runtime); `DATABASE_URL`/`TEST_DATABASE_URL` mantidos admin.
- teste: `adminPool` (seed/cleanup) + `runtimePool` (asserções); RLS inline removido (já vem das migrations).

## Desvio de plano — aprovado
Plano dizia `TEST_DATABASE_URL → app_runtime`. Executor manteve `TEST_DATABASE_URL=postgres` e introduziu
**`APP_RUNTIME_URL`** para o pool de runtime, porque `test-database.js` e o gate `hasTestDb` usam
`TEST_DATABASE_URL`. Adaptação mais segura, dentro dos 3 arquivos. **APPROVE.**

## Nota de acompanhamento (Fase 2/3 — não-bloqueante)
`current_setting('app.current_company_id', true)::uuid` retorna `''` (não `NULL`) em conexão reutilizada
pós-`SET LOCAL`+`COMMIT` → `''::uuid` crasha. Mitigado no teste com pool fresh; baixo risco em runtime
(`set_config(...,true)` é transaction-local e auto-reseta). Reavaliar quando o RLS for enforced em runtime.

## Pendências
- **Push:** não realizado (aguarda confirmação humana).
- Próxima missão promovida pelo Claude Code: `eventbus-cure-unhandled-outbox` (curar F6 — ver `next-task.md`).
