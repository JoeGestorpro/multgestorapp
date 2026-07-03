# 📥 PRÓXIMA MISSÃO — TEST/RLS-ENFORCEMENT-LOCAL-TESTDB (P0)

> Promovida pela auditoria completa de 2026-07-02 (achado **F-02**): os testes de isolamento
> multi-tenant (`tenant-isolation-rls`, `gate0-*`, `outbox-durability`) existem mas estão entre
> os **74 skip** — nunca executaram. São a rede de segurança obrigatória **antes** da missão
> `security/tenant-writes-app-runtime-pool` (P0 central).
> A anterior (`cleanup/fase-c-branches-worktrees`, P2) foi **despriorizada**, não cancelada —
> ver fila em `current-task.md`.

---
status: pending
task_id: test/rls-enforcement-local-testdb
title: Executar suíte de enforcement RLS contra o TEST DB local
type: test/security
priority: P0
camada: seguranca/rls
mode: EXECUTE_WITH_REVIEW
created_by: Claude Code
created_at: 2026-07-02
requires_human_approval: false
human_local_steps: true
---

## 🤖 Model Capability Assessment (executor)

- **Tarefa:** configurar env local + rodar testes. Sem alteração de produto, sem migration nova,
  sem produção. Risco baixo, reversível.
- **Passos humanos-locais obrigatórios:** obter/definir `TEST_DATABASE_URL` e `APP_RUNTIME_URL`
  do banco de TESTE (secrets não ficam no repo; MCP não provisiona env local).
- **Modo recomendado:** EXECUTE_WITH_REVIEW. Se os testes revelarem falha de policy/grant,
  **não corrigir migration por conta própria** → reportar e ESCALATE.

## Contexto

- Migration + código A-001 já aplicados no TEST DB (2026-06-25).
- RLS runtime ativo em prod para **leituras** (PR #20, `aeed31c`). Writes ainda bypassam
  (pool privilegiado em `pool.connect()` — `backend/src/config/database.js:118`).
- Provisionamento do TEST DB local documentado em `docs/` (commit `2c7248f`).

## Objetivo

Fazer os 74 testes skip executarem e passarem localmente contra o banco de TESTE,
transformando-os em gate obrigatório antes da missão de writes.

## Passos

1. Provisionar env local: `TEST_DATABASE_URL` + `APP_RUNTIME_URL` (banco de TESTE, **nunca** prod).
2. `cd backend && npm run test:integration` — confirmar que os suites antes skip agora rodam:
   `tenant-isolation-rls`, `tenant-isolation`, `gate0-runtime-check`, `gate0-pool-paths`,
   `gate0-als-context-leak`, `outbox-durability`.
3. Registrar evidência (contagem pass/fail, tempo) nesta fila e em `.opencodex/audits/`.
4. Se houver falha: descrever policy/grant faltante + arquivos, **sem corrigir** — ESCALATE.

## Escopo proibido

- ❌ Apontar qualquer env para produção.
- ❌ Migration nova, alteração de policy, push, merge, deploy.
- ❌ Commitar `.env` ou secrets.

## Critérios de aceite

- [ ] Suites de enforcement executam (não-skip) contra o TEST DB.
- [ ] 0 fail — ou relatório de falhas com ESCALATE (sem correção autônoma).
- [ ] Evidência registrada na governança.
- [ ] Nenhum secret commitado (`git status` limpo de `.env`).

## Fila pós-missão (auditoria 2026-07-02)

1. 🔵 **`test/rls-enforcement-local-testdb`** (atual)
2. ⏳ `db/reconcile-untracked-feature-migrations` — P0: `mg_anamnese_v1.sql` (+loyalty/packages/prepaid)
   untracked com código já deployado (`anamnesis.service.js`, rota LGPD) → drift ou endpoint quebrado.
3. ⏳ `security/tenant-writes-app-runtime-pool` — **P0 central**: rotear `pool.connect()` (form
   promise com tenant no ALS) para `poolTenant`; kill-switch validado = remover `APP_RUNTIME_URL`.
4. ⏳ `security/db-tls-verify` — P1: `rejectUnauthorized: true` + CA Supabase (`database.js:43`).
5. ⏳ `security/refresh-rotation-server-side-revoke` — P1: rotação de refresh + revogação no
   logout + limpar cookie `mg_refresh_booking`.
6. ⏳ `ops/whatsapp-real-provider-activation` — P1: provider real (hoje **mock em prod**).
7. ⏳ `cleanup/fase-c-branches-worktrees` — P2 (HUMAN_APPROVAL_REQUIRED), card arquivado no
   histórico do git (`git log -- .opencodex/queue/next-task.md`).
