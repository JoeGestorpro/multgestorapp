# PLANO (PLAN_ONLY / SECURITY_REVIEW) — Runtime role least-privilege para RLS enforcement real

> **NÃO É FILA DE EXECUÇÃO.** Este arquivo é o `mission_source` da missão
> `runtime-role-least-privilege-rls-enforcement` (backlog, status `blocked/gated`).
> Só pode ser promovido para `.opencodex/queue/next-task.md` **após aprovação humana explícita +
> revisão de segurança**, e mesmo assim em fases (a Fase 1 é CI-only, risco de produção nulo).
> Diagnóstico que originou esta missão: `docs/SECURITY-TENANT-ISOLATION.md`.

---
status: blocked
task_id: runtime-role-least-privilege-rls-enforcement
title: RLS enforcement real via role de runtime least-privilege (sem BYPASSRLS)
created_by: Claude Code
created_at: 2026-06-05
updated_at: 2026-06-05
shell: powershell
mode: PLAN_ONLY
escalation: ESCALATE
requires_human_approval: true
requires_security_review: true
supersedes: fase1-b1b-rls-prod-activation
diagnosis_source: docs/SECURITY-TENANT-ISOLATION.md
---

## MODEL CAPABILITY ASSESSMENT
- **Executor recomendado:** Big Pickle — **apenas para PLANEJAR**. Nenhuma execução de mudança.
- **Nível de risco:** **ALTO (blast radius máximo)** na troca de role em produção — por isso PLAN_ONLY.
  A **Fase 1 (CI-only)** é separável e tem **risco de produção nulo**.
- **Modo de execução:** **PLAN_ONLY**. Qualquer passo que altere role/secret/DDL/deploy → **ESCALATE**.
- **Regra de escalonamento:** tocar role/secret/`DATABASE_URL`/DDL/deploy é **proibido** sem aprovação
  humana + revisão de segurança registradas na governança.

## Contexto (causa-raiz confirmada)
- A auditoria via Supabase MCP (read-only, 2026-06-05) provou: o runtime conecta como `postgres`
  (`rolbypassrls = true`). RLS está `ENABLE` porém **inerte** — BYPASSRLS ignora policies, inclusive FORCE.
- **Evidência reprodutível no CI:** o run de `main` falha em `tests/integration/tenant-isolation-rls.test.js`
  com **3 failed / 29 passed / 32 total**. O caso "sem GUC → 0 linhas" recebe **2 linhas de empresas
  distintas** — leak cross-tenant literal, porque o `Pool` do teste conecta como `postgres` (superuser).
  A migration `20260526_017_rls_tenant_tables.sql` **aplica o RLS** no CI; falta só o **role correto**.
- A infra ALS (`config/database.js`, `requireCompany.js`, wrap de `pool.connect`) já está pronta e correta;
  passa a ser **efetiva** assim que o runtime deixar de ter BYPASSRLS.

## Faseamento
- **Fase 0 (concluída):** este plano + revisão de segurança.
- **Fase 1 — SÓ CI (risco de produção ZERO):** criar `app_runtime` no Postgres efêmero do CI, conceder
  GRANTs, apontar a conexão dos testes para ele, refatorar o fixture do teste. **Conserta o CI vermelho**
  e valida o modelo sem tocar produção. **Recomendada como primeiro passo executável.**
- **Fase 2 — Staging:** criar role no staging, trocar runtime do staging, smoke + load; **antes**, tratar
  jobs cross-tenant.
- **Fase 3 — Produção:** criar role, trocar `DATABASE_URL` de runtime no Render para `app_runtime`, manter
  migrations em URL admin, monitorar (métricas B3), rollback pronto.

---

## 1. Plano técnico seguro

**Princípio:** separar *quem faz DDL* de *quem faz runtime*.
- **DDL/migrations** → role admin (`postgres`/owner). DDL não sofre RLS.
- **Runtime do app + asserções de isolamento dos testes** → role dedicado **`app_runtime`**:
  `NOSUPERUSER`, `NOBYPASSRLS`, **não-owner** das tabelas.

Como `app_runtime` é não-bypass **e** não-owner, o `ENABLE ROW LEVEL SECURITY` já existente **basta** —
`FORCE` é desnecessário (FORCE só importaria se o runtime fosse o owner). Aplicação literal da regra §3.13
de `docs/architecture-decisions.md`.

---

## 2. Arquivos que precisariam mudar

| Arquivo | Mudança | Fase |
|---|---|---|
| `.github/workflows/ci.yml` | Novo step pós-migration "Create runtime role" (cria `app_runtime` + GRANTs via URL `postgres`); no step `Run integration tests`, trocar `DATABASE_URL` **e** `TEST_DATABASE_URL` para a URL do `app_runtime` | 1 |
| `backend/tests/integration/tenant-isolation-rls.test.js` | Separar conexões: `adminPool` (postgres) para seed/cleanup; `runtimePool` (app_runtime via `TEST_DATABASE_URL`) para as asserções. **Remover** o `testPool.query(rlsSql)` interno (RLS já vem da migration; `ALTER TABLE` falharia sob não-owner) | 1 |
| `backend/src/database/runtime_role_grants.sql` (novo) | GRANTs idempotentes do `app_runtime` (sem `CREATE ROLE`/senha — isso é ops/secret) | 1-3 |
| `backend/src/database/rls_tenant_tables.sql` | (Opcional, recomendado) policies explícitas `FOR ALL ... USING (...) WITH CHECK (...)` para deixar a semântica de INSERT inequívoca | 1 |
| `.github/workflows/deploy.yml` | Step `Run database migrations` passa a usar `secrets.MIGRATION_DATABASE_URL` (admin), desacoplando do runtime | 3 |
| `backend/src/jobs/appointment-reminder-job.js` + OutboxWorker | Ajustar varredura cross-tenant (GUC por empresa ou role admin auditado) — **pré-requisito da Fase 2/3** | 2 |

> ⚠️ **Achado de segurança no próprio teste:** hoje o teste **aplica o RLS** via `testPool` (`ALTER TABLE`,
> linhas ~223-226). Sob `app_runtime` (não-owner) isso **falha** ("must be owner of table"). E as
> `INSERT`/`DELETE` de seed sem GUC seriam **bloqueadas pela policy** (FOR ALL aplica USING como WITH CHECK
> no INSERT). Por isso o fixture **precisa** rodar setup/teardown como admin — não é cosmético.

---

## 3. Comandos SQL (criar/validar role sem BYPASSRLS)

**Criar role (admin) — senha vem de secret/ops, NUNCA commitada:**
```sql
CREATE ROLE app_runtime LOGIN PASSWORD :'app_runtime_pw'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT;

GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
```

**Validar atributos do role (o ponto que causou o CI vermelho):**
```sql
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'app_runtime';
-- esperado: app_runtime | f | f   <- NOBYPASSRLS torna a policy efetiva

SELECT tablename, tableowner FROM pg_tables WHERE tablename = 'barber_services';
-- esperado owner = postgres (app_runtime NAO e owner -> ENABLE basta, sem FORCE)

SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class WHERE relname = 'barber_services';
-- esperado: t | f
```

**Validar isolamento real (conectado como `app_runtime`):**
```sql
BEGIN;
SELECT set_config('app.current_company_id', '<companyA-uuid>', true);
SELECT count(*) FROM barber_services;   -- so linhas da company A
COMMIT;

BEGIN;
SELECT count(*) FROM barber_services;   -- SEM GUC -> deve ser 0 (hoje retorna 2: o bug)
COMMIT;
```

---

## 4. Impacto em CI / GitHub Secrets

- **CI (`ci.yml`): nenhum GitHub Secret novo.** O Postgres do CI é container descartável; as credenciais de
  `app_runtime` podem ser literais no workflow (como `postgres:postgres` já é). Só adiciona um step de
  criação de role + muda o env do step de teste. Resultado esperado: **`Test Suites: 2 passed`,
  `Tests: 32 passed`**.
- **Deploy (`deploy.yml`):** o step de migrations usa `secrets.DATABASE_URL`. Para manter migrations como
  admin e runtime como least-privilege, introduzir **`secrets.MIGRATION_DATABASE_URL`** (admin) no step de
  migrations. **Mudança de secret é Fase 3** (não nesta fase).
- **Runtime no Render:** a env `DATABASE_URL` do serviço (painel do Render, **não** este workflow) passaria
  a usar `app_runtime` na Fase 3.

---

## 5. Risco de produção

| Fase | Risco | Detalhe |
|---|---|---|
| **1 (CI)** | **Nulo p/ produção** | Só container efêmero. Recomendada primeiro. |
| **3 (troca de role em prod)** | **ALTO** | GRANT incompleto → `permission denied` em tabela/sequence. Jobs cross-tenant não ajustados → reminder job vê 0 linhas e **para de enviar lembretes silenciosamente**. Migrations precisam continuar admin senão DDL quebra. Pooler: `set_config(..., true)`/`SET LOCAL` é *transaction-scoped* → OK em transaction pooling, **mas validar** no pooler do Supabase/Render. |

---

## 6. Plano de rollback

- **CI:** `git revert` do commit que muda `ci.yml` + teste → volta ao estado atual (vermelho, porém
  conhecido). Reversível em 1 commit.
- **Produção:** a mudança é **troca de credencial/role**, não de schema. Rollback = reverter a env
  `DATABASE_URL` do Render para o role admin → **RLS volta a ser inerte em segundos** e o app segue
  funcionando pelos filtros `company_id` (estado de hoje). GRANTs são aditivos e inofensivos; o role
  `app_runtime` pode ficar criado. **Nenhuma migration a desfazer.**

---

## 7. Checklist de validação

**Local:**
- [ ] Subir Postgres local; rodar migrations como admin.
- [ ] Criar `app_runtime` + GRANTs; rodar os 3 SQLs de validação (§3) → `rolbypassrls = f`.
- [ ] Manual: com GUC → filtra; sem GUC → 0 linhas.
- [ ] `TEST_DATABASE_URL=<app_runtime>` + `npm run test:integration` → **32/32**.

**CI:**
- [ ] `ci.yml` cria role + GRANTs **após** migrations.
- [ ] Step de integração usa URL do `app_runtime` (em `DATABASE_URL` e `TEST_DATABASE_URL`).
- [ ] Run verde: `Tests: 32 passed`, `Test Suites: 2 passed`.
- [ ] **Nenhum** `skip`/`xfail` usado (RLS realmente aplicada — prioridade least-privilege real).
- [ ] Gate "Run CI before deploy" verde no `Deploy`.

---

## RESTRIÇÕES INVIOLÁVEIS
- ❌ NÃO fazer deploy.
- ❌ NÃO criar/alterar role, GRANT ou DDL fora de janela aprovada.
- ❌ NÃO trocar `DATABASE_URL`/secret (prod ou CI) sem aprovação.
- ❌ NÃO apontar testes para o Supabase de produção (`.env` é produção; há `guardAgainstProduction`).
- ❌ NÃO usar `skip`/`xfail` como solução — a prioridade é least-privilege real.
- ✅ Próximo passo executável de menor risco: **Fase 1 (CI-only)**, ainda assim sob aprovação.

## Critério de conclusão da missão (PLAN_ONLY)
- Plano completo entregue (7 blocos acima). ✅
- Nenhuma alteração de código/infra/DB/secret além deste documento.
- Escalonamento explícito: "pronto para revisão de segurança + aprovação humana (começar pela Fase 1)".
