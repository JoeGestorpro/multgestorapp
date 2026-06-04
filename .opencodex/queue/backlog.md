# ⛔ BACKLOG — Missões enfileiradas com dependência (não executar)

> Missões prontas, porém **bloqueadas** por dependência. O **OpenCode Executor NÃO executa nada
> daqui** — ele só lê `next-task.md`. Uma missão só sai do backlog quando o **Claude Code** a
> **promove** para `next-task.md`, após a dependência ser satisfeita (auditoria aprovada).

> **Regra de promoção:** uma missão só vai para `next-task.md` quando sua `unblock_condition` estiver
> satisfeita (auditoria APPROVE/APPROVE_WITH_NOTES do antecessor + aprovação final do Claude Code).

> ✅ **Fase 1 — Blindagem de Produção: COMPLETA** (B3 `1348df3` · B4 `e532285` · B2 `e137217` · B1 `0a85929`).

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
| **Reconciliação funcional → main** | `gov-reconcile-functional-to-main` | ▶️ em `next-task.md` (pending) | — (SAFE_TO_RECONCILE; R1 resolvido) |
| B1b-gate `pool.connect` tenant ctx | `fase1-b1b-gate-poolconnect-tenant-context` | ⛔ blocked | **`gov-reconcile-functional-to-main`** (precisa do código B1 em main/branch) |
| B1b RLS FORCE em produção | `fase1-b1b-rls-prod-activation` | ⛔ blocked (gated) | `fase1-b1b-gate-poolconnect-tenant-context` |

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

## [BLOCKED] B1b — RLS FORCE em Produção (go-live gated)

---
status: blocked
task_id: fase1-b1b-rls-prod-activation
title: Fase 1 / B1b — Ativação de FORCE ROW LEVEL SECURITY em produção (rollout por tabela)
created_by: Claude Code
created_at: 2026-06-04
depends_on: fase1-b1b-gate-poolconnect-tenant-context
unblock_condition: >-
  Missão `fase1-b1b-gate-poolconnect-tenant-context` auditada APPROVE (cobertura transparente do GUC nas
  conexões `pool.connect()` — UoW + ~11 services) + binding validado em STAGING sob carga (sem esgotamento
  de pool) + teste de isolamento verde no CI + decisão consciente de go-live do Claude Code.
---

### Resumo
- Rollout faseado de `activate_rls.sql` (FORCE) **por tabela**, com canário e rollback (`ALTER TABLE ... NO FORCE`).
- Pré-requisito absoluto: gate `pool.connect` + binding ALS provados em staging. **Alto risco**.
- Modo: **EXECUTE_WITH_REVIEW** + janela de manutenção / monitoramento ativo (métricas do B3).

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
