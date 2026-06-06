# ⛔ BACKLOG — Missões enfileiradas com dependência (não executar)

> Missões prontas, porém **bloqueadas** por dependência. O **OpenCode Executor NÃO executa nada
> daqui** — ele só lê `next-task.md`. Uma missão só sai do backlog quando o **Claude Code** a
> **promove** para `next-task.md`, após a dependência ser satisfeita (auditoria aprovada).

> **Regra de promoção:** uma missão só vai para `next-task.md` quando sua `unblock_condition` estiver
> satisfeita (auditoria APPROVE/APPROVE_WITH_NOTES do antecessor + aprovação final do Claude Code).

> ✅ **Fase 1 — Blindagem de Produção: COMPLETA** (B3 `1348df3` · B4 `e532285` · B2 `e137217` · B1 `0a85929`).

> 🚀 **#0c RELEASE SAFETY GATE v1** — `task_id: release-safety-gate-v1`
> **Status:** 📋 PENDING (depois da reconciliação)
> **Criado:** 2026-06-05
> **Modo:** EXECUTE_WITH_REVIEW
> **Comando:** `npm run pre-release`
> **Descrição:** Validação local pré-push rápida para uso diário. Inclui:
>   - Verificação de git status/branch
>   - Validação de YAML workflows
>   - Escaneamento de segredos
>   - Backend unit tests (--runInBand para evitar OOM)
>   - Frontend lint + build
>   - Bloqueio se DATABASE_URL apontar para Supabase/produção
>   - Relatório final APROVADO/BLOQUEADO
> **Arquivo:** `backend/scripts/pre-release.js`
> **Depende de:** `gov-reconcile-functional-to-main` (main em dia)
>
> > 🚀 **#0c-v2 RELEASE SAFETY GATE v2 (banco descartável)** — `task_id: release-safety-gate-v2`
> > **Status:** 📋 IDÉIA REGISTRADA (não implementar agora)
> > **Criado:** 2026-06-05
> > **Modo:** EXECUTE_WITH_REVIEW
> > **Comando:** `npm run pre-release:full`
> > **Descrição:** Validação completa com banco descartável + migrations + testes de integração.
> >   Usar em mudanças de banco, migrations, RLS, Event Bus persistente, ou integrações críticas.
> >   Sobe Postgres temporário → roda migrations → roda testes de integração → destrói.
> > **Motivo do adiamento:** Podman indisponível no Windows local. A v1 cobre o uso diário.
> >   A v2 fica registrada aqui para não perder a capacidade que revelou a divergência local vs CI.
> > **Ativar quando:** Podman/Docker estiver disponível OU houver alternativa cross-platform (testcontainers, pg-temp).

> ⚠️ **#0 OPS (NÃO é missão de código) — VERIFICAR/TESTAR RESTORE DE BACKUP.**
> Auditoria 2026-06-04: nenhum script/workflow de backup/restore no repo; presume-se Supabase gerenciado,
> **não testado**. Prioridade acima de qualquer missão de código: confirmar backup automático E executar um
> **restore de teste**. Risco de perda de dados catastrófica.

> 🛡️ **#0b GOVERNANÇA — `.opencodex/` agora RASTREADA no git.** Incidente 2026-06-04: `git clean` apagou a
> `.opencodex/` untracked. Correção: passou a ser commitada. **O runner do OpenCode NUNCA deve rodar
> `git clean -fd/-x`** enquanto houver governança untracked. (Pre-check obrigatório do `/next-task` pendente.)

---

## 🗺️ FASE 1 — Blindagem de Produção (status)

| Missão | task_id | Status | depends_on (APPROVE) |
|---|---|---|---|
| B3 Observability | `fase1-b3-observability` | ✅ APPROVE (`1348df3`) | — |
| B4 Redis Rate Limiting | `fase1-b4-redis-rate-limit` | ✅ APPROVE (`e532285`) | `fase1-b3-observability` ✅ |
| B2 Outbox Idempotency/Handler | `fase1-b2-outbox-handler-idempotency` | ✅ APPROVE (`e137217`) | `fase1-b4-redis-rate-limit` ✅ |
| B1 RLS (FUNDAÇÃO) | `fase1-b1-rls-transacao-request` | ✅ APPROVE (`0a85929`) | `fase1-b2-outbox-handler-idempotency` ✅ |
| B1b-gate `pool.connect` tenant ctx | `fase1-b1b-gate-poolconnect-tenant-context` | ✅ APPROVE (`c2f54ec` + fix B4 `3b923a8`) | `fase1-b1-rls...` ✅ |
| **Reconciliação funcional → main** | `gov-reconcile-functional-to-main` | ✅ **CONCLUÍDA** (merge `5b20d19` + FF `main`, 2026-06-05; já em `origin/main`; 635 testes verde) | — |
| ~~B1b RLS FORCE em produção~~ ❌ **SUPERSEDED** (premissa inválida — FORCE não afeta role BYPASSRLS) | ~~`fase1-b1b-rls-prod-activation`~~ | ❌ cancelada | — |
| **Runtime role least-privilege — Fase 1 (CI-only)** | `runtime-role-least-privilege-rls-enforcement` / `1-ci-only` | ✅ APPROVE (`a179085`, 2026-06-06; push pendente) | `fase1-b1b-gate-poolconnect-tenant-context` ✅ |
| Runtime role least-privilege — Fase 2 (staging) / Fase 3 (prod) | mesmo `task_id` | ⛔ PLAN_ONLY/ESCALATE — aprovação humana + revisão de segurança + staging | Fase 1 ✅ |

> 🔧 **Correção B4 (2026-06-04, `3b923a8`):** ao consolidar o funcional, a suíte expôs que o B4 estava
> quebrado — `cache-manager.js` sem `incr`/`_fbClear`/`_fbIncr` (commitou consumidor, não produtor; métodos
> no stash `fa6a57a`). Recuperado do stash → suíte **619/619 verde**. Gate auditado APPROVE em seguida.

> 🔁 **Por que a reconciliação entrou na frente:** o trabalho funcional (B1/B2/B3/B4/lembrete) vive só em
> feature branches; o tip `fase2/wa-reminder` o contém todo. O gate `pool.connect` depende do **código do B1**,
> ausente de `main`/branch atual. A auditoria (2026-06-04) deu **SAFE_TO_RECONCILE** (overlap vazio, conflito nulo)
> e **R1 resolvido** (`4071952` enforce company_id já coberto → `fase-1/estabilizacao` superseded, fica de fora).

## 🗺️ FASE 2 — Receita (WhatsApp / Pagamento)

| Missão | task_id | Status | Depende |
|---|---|---|---|
| WhatsApp — Lembrete agendado | `fase2-wa-reminder` | ✅ APPROVE (`545282d`) | — |
| WhatsApp — Durabilidade (Outbox) | `fase2-wa-outbox-durability` | 💡 ideia | rotear appointment.* pelo Outbox (B2) |
| WhatsApp — Multi-janela (24h+2h) + config por tenant | `fase2-wa-reminder-windows` | 💡 ideia | `fase2-wa-reminder` |
| Pagamento in-app (Pix/sinal → Wallet) | `fase2-payment-inapp` | 💡 ideia (greenfield) | AbacatePay + Wallet; webhook público |

---

## [CANCELLED / SUPERSEDED] B1b — RLS FORCE em Produção

---
status: superseded
task_id: fase1-b1b-rls-prod-activation
superseded_by: runtime-role-least-privilege-rls-enforcement
cancelled_at: 2026-06-05
---

> ❌ **CANCELADA.** Premissa inválida. A auditoria via Supabase MCP (2026-06-05) provou que o runtime de
> produção conecta como role `postgres` (`rolbypassrls=true`). **BYPASSRLS ignora todas as policies
> incondicionalmente — inclusive `FORCE ROW LEVEL SECURITY`.** Ativar FORCE não produziria isolamento
> algum. Substituída pela missão `runtime-role-least-privilege-rls-enforcement`.
> Diagnóstico completo: `docs/SECURITY-TENANT-ISOLATION.md`.

---

## [BLOCKED] Runtime role least-privilege — RLS enforcement real (gated)

---
status: blocked
task_id: runtime-role-least-privilege-rls-enforcement
title: RLS enforcement real via role de runtime least-privilege (sem BYPASSRLS)
created_by: Claude Code
created_at: 2026-06-05
supersedes: fase1-b1b-rls-prod-activation
depends_on: fase1-b1b-gate-poolconnect-tenant-context
requires_human_approval: true
requires_security_review: true
unblock_condition: >-
  APROVAÇÃO HUMANA EXPLÍCITA + REVISÃO DE SEGURANÇA. Alto blast radius (troca do role de runtime do app em
  produção e no CI). Antes de promover: (1) decisão arquitetural humana sobre usar `authenticated` vs. criar
  `app_runtime`; (2) plano de GRANTs revisado; (3) tratamento definido para jobs cross-tenant
  (appointment-reminder-job + OutboxWorker) e master-admin sob role não-bypass; (4) validação do pooler
  (session vs. transaction) com o novo role em STAGING.
mission_source: docs/runbooks/runtime-role-least-privilege-plan.md
diagnosis_source: docs/SECURITY-TENANT-ISOLATION.md
---

### Resumo
- **Problema:** RLS está ENABLE porém **inerte** em produção — o runtime (`postgres`) tem BYPASSRLS, então as
  policies nunca aplicam. O isolamento real hoje vem 100% dos filtros `company_id` na aplicação.
- **Correção:** introduzir role de runtime **sem BYPASSRLS** (usar `authenticated` ou criar `app_runtime`) com
  GRANTs adequados; backend passa a conectar com ele (trocar user no `DATABASE_URL`/secret em prod e CI);
  manter `postgres` só para migrations/admin. Com runtime não-bypass e não-owner, **ENABLE já basta** (FORCE
  só seria necessário se o runtime fosse o owner).
- **Impactos a tratar (ver `docs/SECURITY-TENANT-ISOLATION.md` §4.1):** job cross-tenant
  `appointment-reminder-job.js` (quebra silenciosa sob não-bypass → setar GUC por empresa ou role admin
  controlado); OutboxWorker/demais jobs; `service_role` (bypass — usar só onde intencional); master-admin
  (`/api/master/*`); pooler.
- **Restrições invioláveis:** sem deploy, sem troca de role/secret e sem testes contra produção até aprovação.
- **Faseamento:** Fase 1 (CI-only, risco de produção nulo) → Fase 2 (staging) → Fase 3 (produção).

### Fase 1 (CI-only) — MISSÃO EXECUTÁVEL pronta (gated)
- **task_id/phase:** `runtime-role-least-privilege-rls-enforcement` / `1-ci-only`
- **Modo:** **EXECUTE_WITH_REVIEW** · **Status:** ✅ **CONCLUÍDA** (`commit a179085`, branch `fase1/runtime-role-ci-only`, 2026-06-06). 32/32 integração; auditoria OpenCode + Claude Code **APPROVE**. **Push pendente** (confirmação humana). Fases 2 (staging) e 3 (produção) seguem **PLAN_ONLY/ESCALATE**.
- **Objetivo:** eliminar BYPASSRLS dos testes usando `app_runtime`; `tenant-isolation-rls.test.js` verde.
- **Escopo autorizado (3 arquivos):** `.github/workflows/ci.yml`,
  `backend/tests/integration/tenant-isolation-rls.test.js`, `backend/src/database/runtime_role_grants.sql`.
- **Critério de sucesso:** 32/32 integração · sem skip · sem xfail · sem produção · sem secrets.
- **Card executável:** `docs/runbooks/runtime-role-fase1-ci-mission.md` (diffs exatos no plano §1-§3).

#### Como promover a Fase 1 (somente Claude Code, após aprovação humana)
1. Revisão final do plano + aprovação humana registrada.
2. Copiar `docs/runbooks/runtime-role-fase1-ci-mission.md` para `.opencodex/queue/next-task.md` (`status: pending`).
3. Marcar esta entrada como `promoted`.
4. Pós-execução: `/audit-task` → Claude Code; push só com confirmação humana.

> Fases 2 e 3 (staging/produção) permanecem **PLAN_ONLY/ESCALATE** — só discutir após a Fase 1 validar 32/32.

---

## [BLOCKED] Fase C — Integração de Negócio + Testes de Integração Reais

---
status: blocked
task_id: fase-c-integracao-e-testes
title: Fase C — Integração de Negócio + Testes de Integração Reais
created_by: Claude Code
created_at: 2026-06-03
depends_on: fase1-b2-outbox-handler-idempotency
unblock_condition: >-
  `fase1-b2-outbox-handler-idempotency` APPROVE [✅ `e137217`] + aprovação final do Claude Code.
  MOTIVO: a Fase C liga `sale.created` a múltiplos handlers (loyalty + package); sem idempotência por
  handler (B2), um retry credita em DOBRO. NÃO depende obrigatoriamente do B1/RLS.
  GATE (achado da auditoria B2): decidir `break` vs `continue` no `_process` do OutboxWorker
  (um handler que falha permanentemente bloqueia os seguintes). Resolver antes de promover.
  NOTA: wiring `sale.created` em QUARENTENA LÓGICA (comentado em `backend/src/server.js`).
mission_source: docs/runbooks/fase-c-integracao-e-testes.md
status_note: B2 já satisfez a dependência — Fase C está desbloqueada porém EM ESPERA (não promover sem decisão).
---

### Como promover (somente Claude Code)
1. Resolver o GATE `break` vs `continue` no OutboxWorker.
2. Copiar o conteúdo de `docs/runbooks/fase-c-integracao-e-testes.md` para `next-task.md` com o
   `MODEL CAPABILITY ASSESSMENT` no topo; tirar o wiring `sale.created` da quarentena como parte da missão.
3. Marcar esta entrada como `promoted`.

---

## [BLOCKED] Queue Auto-Branch — Helper humano determinístico (ergonomia do preflight)

---
status: blocked
task_id: queue-auto-branch-human-helper
title: Helper humano (npm run task:branch) que prepara a branch exigida antes do /next-task — runner agente segue proibido de trocar branch
created_by: Claude Code
created_at: 2026-06-05
shell: powershell
mode: EXECUTE_WITH_REVIEW
requires_human_approval: true
requires_security_review: false
depends_on: null
unblock_condition: >-
  APROVAÇÃO FINAL DO CLAUDE CODE + fila livre (one-mission-per-time). Hoje `next-task.md` tem a missão
  `runtime-role-least-privilege-rls-enforcement` Fase 1 (CI-only) `pending`; esta missão só pode ir para
  `next-task.md` quando a fila estiver idle (RLS Fase 1 auditada/decidida OU explicitamente despriorizada
  pelo humano). Sem dependência técnica de código com a RLS — a serialização é apenas de fila.
mission_source: (este card é a fonte; plano detalhado nesta entrada)
human_decision: APROVADO registrar como missão formal (decisão humana 2026-06-05). NÃO implementar agora.
---

### Contexto (causa-raiz da melhoria)
O preflight (CHECK 2) bloqueia corretamente quando a branch atual ≠ branch exigida, mas a correção é manual
(`git checkout -b <branch>`). A regra **inviolável** "o runner agente NUNCA cria/troca branch" (repetida em
`preflight-check.md`, `auto-queue-runner.md` Regra #2, `auditor-flow.md`; origem: incidente `git clean`
2026-06-04) **não pode** ser enfraquecida. Reconciliação aprovada: a automação vive num **helper
determinístico invocado pelo HUMANO** — a invocação humana É a autorização. O runner agente permanece proibido.

### MODEL CAPABILITY ASSESSMENT
- **Executor recomendado:** Big Pickle, **EXECUTE_WITH_REVIEW** (toca governança/fluxo de fila → auditoria final do Claude obrigatória).
- **Nível de risco:** **Baixo** (tooling local + docs). **Produção: nulo.** Sem runtime, sem secrets, sem deploy.
- **Escalonamento:** qualquer tentativa de colocar auto-branch no preflight do AGENTE, ou de adicionar
  push/merge/commit/clean/stash ao helper → **PARAR e reportar** (ESCALATE). Isso reverteria a decisão arquitetural.

### Objetivo
Criar `npm run task:branch` — helper Node determinístico, invocado pelo humano, que prepara a branch exigida
pela missão **antes** do `/next-task`, com gates de segurança, **sem** dar ao runner/agente permissão para
trocar branch.

### ALLOWLIST (escopo autorizado)
- `backend/scripts/queue-branch.js` (novo)
- `backend/package.json` (adicionar script `task:branch` — 1 linha)
- `backend/tests/unit/queue-branch.test.js` (novo — recomendado)
- `.opencodex/templates/preflight-check.md` (nota do pré-passo human-invoked + canonizar `required_branch:` no CHECK 2)
- `.opencode/rules/auto-queue-runner.md` (carve-out: helper humano ≠ runner; runner segue proibido)
- `.opencodex/queue/next-task.md` (padronizar campo `required_branch:`; manter `created_branch` como alias)

> Qualquer arquivo fora desta lista = violação de escopo = PARAR e reportar.

### Comportamento do helper (determinístico)
1. Ler `.opencodex/queue/next-task.md` → extrair `required_branch` (**fail-closed** se ausente/ambíguo; nunca adivinhar do task_id).
2. Comparar com a branch atual (`git branch --show-current`). Se iguais → "nada a fazer", sai 0.
3. Se diferentes, rodar os GATES antes de qualquer mutação:
   - **G1** working tree com mudança de CÓDIGO (excluindo `.opencodex/` e `docs/private/`, igual CHECK 1/5) → **BLOQUEIA**.
   - **G2** `current-task.md` `running`/`claimed` → **BLOQUEIA**.
   - **G3** detached HEAD / sem branch → **BLOQUEIA**.
   - **G4** branch exigida **existe e diverge** (suja ou não descende da base esperada `main`) → **BLOQUEIA** (não sobrescreve).
   - **G5** HEAD atual ≠ base esperada para ramificar → avisar/bloquear.
4. Só após todos os gates: `git checkout -b <required>` (nova) ou `git checkout <required>` (existente-limpa-convergente).
5. **Nunca** `push`/`merge`/`commit`/`deploy`/`clean`/`stash`. Helper termina deixando o ambiente pronto e
   instruindo rodar `/next-task` (o preflight do agente roda por cima = defesa em profundidade).

### Restrições invioláveis
- ❌ NÃO colocar auto-branch no preflight do AGENTE (runner segue proibido — regra literal preservada nas 3 fontes).
- ❌ NÃO criar comando `/…` (isso re-introduziria o agente trocando branch). É npm script humano.
- ❌ NÃO push, merge, deploy, commit, `git clean`, `git stash`.
- ❌ NÃO tocar produção, secrets, `deploy.yml`, `config/database.js`, runtime.

### Critérios de aceite
- [ ] `npm run task:branch` lê `required_branch`; fail-closed se ausente.
- [ ] Branch atual == exigida → sai 0 sem alterar nada.
- [ ] Mudança de código no tree (fora de `.opencodex/`/`docs/private/`) → BLOQUEIA com `problema · risco · ação segura`.
- [ ] `current-task.md` `running`/`claimed` → BLOQUEIA.
- [ ] Exigida inexistente + tree limpo → cria a partir de `main` e troca.
- [ ] Exigida existente e convergente → troca; divergente → BLOQUEIA (não sobrescreve).
- [ ] Helper nunca executa push/merge/commit/deploy/clean/stash (coberto por teste).
- [ ] Regra "runner agente nunca cria branch" permanece literal em `preflight-check.md`, `auto-queue-runner.md`, `auditor-flow.md`.
- [ ] Compatível com Windows + PowerShell (Node `execSync`, cross-platform).
- [ ] Suíte de testes verde após a mudança.

### Como promover (somente Claude Code, após decisão humana + fila livre)
1. Confirmar fila idle (RLS Fase 1 fechada ou despriorizada).
2. Copiar este card para `.opencodex/queue/next-task.md` (`status: pending`) com o `MODEL CAPABILITY ASSESSMENT` no topo.
3. Definir `required_branch` da própria missão (sugestão: `chore/queue-auto-branch-helper`) e marcar esta entrada como `promoted`.
4. Pós-execução: `/complete-task` → `/audit-task` → decisão final do Claude. Push só com confirmação humana.

---

## [BLOCKED] OPS (NÃO é missão de código) — Reconciliar linhas `sale.created` já `failed` na outbox

---
status: blocked
task_id: ops/reconcile-failed-sale-created-outbox
title: Data-fix — reconciliar histórico de outbox_messages sale.created marcadas failed (efeito colateral do F6)
type: ops-data-fix
created_by: Claude Code
created_at: 2026-06-06
depends_on: eventbus-unhandled-handler-noop
unblock_condition: >-
  `eventbus-unhandled-handler-noop` **APPROVE** (auditoria OpenCode + decisão final Claude Code).
  NÃO executar antes — a missão F6 corrige o COMPORTAMENTO FUTURO (sem handler → processed/no-op);
  este item corrige apenas o HISTÓRICO já marcado `failed` por "No handler". Itens separados de propósito.
human_decision: APROVADO registrar como ops separado (2026-06-06). NÃO executar agora. NÃO misturar com F6.
status_note: >-
  ✅ DEPENDÊNCIA SATISFEITA em 2026-06-06 — F6 (`eventbus-unhandled-handler-noop`) APPROVE (commit 6c3c81a).
  Item agora LIBERADO para execução por humano/ops (data-fix), respeitando dry-run + backup. Não é missão do executor.
---

### Por que é ops, não missão de código
Não há mudança de código aqui — é um **data-fix pontual** num banco real (efêmero no CI não tem histórico;
o alvo é produção/staging). Por isso entra como **ops** e exige a mesma disciplina de mudança de dados
(janela, backup verificado, dry-run com `SELECT` antes do `UPDATE`).

### Escopo
- Reconciliar mensagens que foram marcadas `failed` **apenas** por falta de handler (não falhas reais):
  ```sql
  -- DRY-RUN primeiro (conferir contagem e amostra):
  SELECT count(*) FROM outbox_messages
   WHERE type = 'sale.created' AND status = 'failed' AND last_error LIKE 'No handler%';

  -- Aplicação (após F6 APPROVE + janela + backup):
  UPDATE outbox_messages
     SET status = 'processed', processed_at = NOW()
   WHERE type = 'sale.created' AND status = 'failed' AND last_error LIKE 'No handler%';
  ```
- **Filtro estrito por `last_error LIKE 'No handler%'`** para NÃO tocar falhas legítimas de outros motivos.

### Restrições
- ❌ NÃO executar antes do `eventbus-unhandled-handler-noop` estar APPROVE.
- ❌ NÃO misturar com a missão F6 (código) — propósitos distintos (futuro vs histórico).
- ❌ NÃO `UPDATE` sem o `SELECT` de dry-run e sem backup verificado.
- ❌ Sem deploy, sem push, sem merge — é operação de dados, executada por humano/ops.

### Critérios de aceite (quando executar)
- [ ] Dry-run mostra apenas linhas `sale.created` + `failed` + `No handler%`.
- [ ] Backup verificado antes do `UPDATE`.
- [ ] Pós-fix: `0` linhas `sale.created`/`failed`/`No handler%` remanescentes.
- [ ] Nenhuma falha legítima de outro `type`/motivo foi alterada.
