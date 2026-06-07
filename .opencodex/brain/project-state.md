# 📌 PROJECT STATE — Estado Atual Real

> **Atualizado:** 2026-06-07 · **state_version:** 3
> **REGRA:** este arquivo é atualizado a cada missão APPROVE (Loop de Fechamento). Se estiver desatualizado, o CHECK 0 deve bloquear/reduzir o Context Confidence.
> **Origem:** substitui `.opencodex/state/project-state.md` (V2, congelado 06-04) e `.agent/memory/current-state.md`.

```yaml
project: MultGestor v2
state_version: 3
phase: "event-bus-hardening + brain-v3"

git:
  origin_main: "fea9708"          # RLS Fase 1 + F6 + F2 inc.1 (PUSHED)
  local_main: "fea9708"
  active_branch: "chore/second-brain-v3"   # esta missão (brain V3)
  inc2_branch: "fix/appointment-outbox-durability-inc2"  # HEAD bc8e6f8 (NÃO em main)

# Em origin/main (auditado APPROVE + pushed):
in_main:
  - "RLS Fase 1 CI-only — role app_runtime sem BYPASSRLS (a179085)"
  - "F6 — OutboxWorker: evento sem handler vira no-op/processed (6c3c81a)"
  - "F2 inc.1 — appointment.created durável via outbox (823107c)"

# Local, NÃO em main (aguardando gate de integração + push):
local_not_in_main:
  - "F2 inc.2 — mutation paths (update/cancel/complete/reschedule) duráveis (0d654f3)"
  - "EVENT CONTRACTS — regra + AppointmentEvents factory (50a64dd, bc8e6f8)"
  - "Brain V3 — este diretório (.opencodex/brain) [em andamento]"

queue:
  next_task: "eventbus-mutation-integration-tests"   # gate de push do inc.2
  next_task_status: "pending"
  last_decision: "F2 inc.2 = APPROVE_WITH_NOTES (Claude Code, 06-07)"

gates_abertos:
  - id: "GATE-INTEG"
    desc: "Push do inc.2 para main bloqueado até npm run test:integration verde em Postgres/CI (mutation paths)."
    backlog: "ops-test-outbox-mutation-integration"

open_risks:
  - "Brain V3 e inc.2 vivem em branches locais; reconciliar para main é decisão humana (sem push automático)."
  - "Integração dos mutation paths skipa local (sem Postgres); validável só no CI."
  - ".agent/ ainda fisicamente presente (rebaixado a histórico, não apagado) — risco de consulta indevida até o archive-index ser conhecido."

ultimas_missoes:
  - "RLS Fase 1 CI-only — APPROVE"
  - "F6 outbox no-op — APPROVE"
  - "F2 inc.1 appointment.created durável — APPROVE"
  - "F2 inc.2 mutation paths — APPROVE_WITH_NOTES (gate integração)"
  - "EVENT CONTRACTS factory + gate — entregue (EXECUTE_WITH_REVIEW)"
  - "Brain V3 — em andamento (esta missão)"

next_recommended_action: >-
  Concluir a missão de integração (eventbus-mutation-integration-tests) no CI;
  então reconciliar inc.2 + EVENT CONTRACTS + Brain V3 para main (decisão humana de push).
```

## Módulos
- **BarberGestor** — completo (agenda, vendas, caixa, comissões, colaboradores, relatórios, agendamento online).
- **ClimaGestor** — scaffold (segundo vertical, valida arquitetura multi-nicho).

## Stack (resumo — detalhe em `architecture-decisions.md`)
React 19 + Vite · Node 18 + Express 5 (CommonJS) · PostgreSQL (Supabase, SQL direto via `pg.Pool`) · Redis 7 (fallback in-memory) · JWT · Resend · Deploy Vercel (front) + Render (back).
