# 📌 PROJECT STATE — Estado Atual Real

> **Atualizado:** 2026-06-07 · **state_version:** 3
> **REGRA:** este arquivo é atualizado a cada missão APPROVE (Loop de Fechamento). Se estiver desatualizado, o CHECK 0 deve bloquear/reduzir o Context Confidence.
> **Origem:** substitui `.opencodex/state/project-state.md` (V2, congelado 06-04) e `.agent/memory/current-state.md`.

```yaml
project: MultGestor v2
state_version: 3
phase: "event-bus-hardening + brain-v3"

git:
  origin_main: "FF p/ tip da branch chore/second-brain-v3 (base 2ba5a2e, CI run 27097235191 VERDE)"
  active_branch: "chore/second-brain-v3"
  reconciliation: "FF autorizado (humano 2026-06-07); push de main em execução; CI em main p/ validação final"

# Reconciliado para main via FF (CI run 27097235191 APPROVE):
in_main:
  - "RLS Fase 1 CI-only (a179085) · F6 outbox no-op (6c3c81a) · F2 inc.1 (823107c)"
  - "F2 inc.2 — mutation paths duráveis (0d654f3) + dual-emit"
  - "EVENT CONTRACTS — regra + AppointmentEvents factory + gate (50a64dd, bc8e6f8)"
  - "Brain V3 — .opencodex/brain (source-of-truth, CHECK 0, Loop de Fechamento) (67ee6ac)"
  - "GATE-INTEG — 8 testes de integração mutation paths (eb5b10b)"
  - "fix EventBus ReferenceError (f65cf74) + fix update só-notas (2ba5a2e)"

queue:
  next_task: "idle (reconciliação)"
  next_task_status: "reconciling-to-main"
  last_decision: "Auditoria final consolidada = APPROVE (Claude Code, 06-07); FF confirmado pelo humano"

gates_abertos:
  - id: "GATE-INTEG"
    desc: >-
      1º CI (run 27096576679) FALHOU e pegou 2 bugs: (1) CRÍTICO event-bus.js:31 event_name solto
      (ReferenceError em todo publish real); (2) conflito de horário nos testes. Ambos corrigidos
      (fix-eventbus-publish-refzbug); unit 648/648 local. Re-push da branch para novo CI. Push do inc.2
      para main segue bloqueado até a integração ficar VERDE no CI.
    backlog: "ops-test-outbox-mutation-integration"
    status: "fixes-applied-pending-ci-run3 (eventbus + conflito + update-só-notas)"

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
