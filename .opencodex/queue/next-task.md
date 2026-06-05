# 📥 NEXT TASK — Fila de Execução OpenCode

> Escrito pelo **Claude Code**. Lido e executado pelo **OpenCode Executor** via `/next-task`.
> Fluxo oficial: `docs/runbooks/prompt-orchestration-flow.md`.
> **Ambiente oficial: Windows + PowerShell.**

---
status: idle
task_id: null
title: Sem missão ativa na fila
updated_by: Claude Code
updated_at: 2026-06-05
---

## Estado da fila: VAZIA (idle)

Nenhuma missão ativa para o executor. **Não há nada a executar.**

### Última missão concluída
- `gov-reconcile-functional-to-main` — **CONCLUÍDA**.
  - Merge `fase2/wa-reminder` → `5b20d19 merge(reconcile)`; `main` avançado por FF; já em `origin/main`.
  - Registro de fechamento: `.opencodex/queue/completed-task.md` (`main_ff_commit: 5b20d19`).
  - Suíte: 635 testes verdes.

### Próxima candidata (NÃO promover sem ação humana)
- `runtime-role-least-privilege-rls-enforcement` — **BLOCKED / GATED**.
  - Exige **aprovação humana + revisão de segurança** antes de virar missão.
  - Modo previsto: **PLAN_ONLY / ESCALATE** (planejar, não executar).
  - Fonte: `.opencodex/queue/backlog.md` · plano: `docs/runbooks/runtime-role-least-privilege-plan.md`.

> ⚠️ O Executor **não** deve promover nem iniciar nenhuma missão a partir deste arquivo enquanto o status
> for `idle`. A promoção da próxima missão é decisão exclusiva do **Claude Code** + humano.
