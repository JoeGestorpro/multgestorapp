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
| **Runtime role least-privilege (RLS enforcement real)** | `runtime-role-least-privilege-rls-enforcement` | ⛔ blocked/gated — **aprovação humana + revisão de segurança** | `fase1-b1b-gate-poolconnect-tenant-context` ✅ + staging |

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
- **Modo:** **PLAN_ONLY / ESCALATE** nesta fase (planejar, não executar).

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
