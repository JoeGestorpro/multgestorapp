# ⚙️ CURRENT TASK — Em Execução

> Escrito pelo **OpenCode** ao iniciar (`/next-task`). Espelha a missão retirada da fila.
> Fluxo oficial: `docs/runbooks/prompt-orchestration-flow.md`.

---
status: idle             # idle | running
task_id: gov-reconcile-functional-to-main
title: Governança — Reconciliar trabalho funcional (fase2/wa-reminder) com a governança em main (merge conflito-zero)
started_by: OpenCode
started_at: 2026-06-05
branch: fase1/b1b-gate-poolconnect
---

## Progresso
- [x] fase2-wa-reminder concluída (commit 545282d) e fechada por Claude Code (APPROVE). Fila livre.
- [x] Hotfix `9aaf3e8`: tenantContext read-only violado por requireCompany — 1 linha removida. Auditado aprovado 2026-06-05.
- [x] gov-reconcile-functional-to-main: merge `fase2/wa-reminder` → `fase1/b1b-gate-poolconnect` + FF `main` (5b20d19). **MISSÃO CONCLUÍDA**.

## Notas de execução
- Descoberto ao executar testes de integração tenant-isolation: TODAS as rotas barber retornavam 500.
- Causa raiz: `requireCompany.js` linha 22 `req.tenantContext = tenant` com `req.tenantContext` já definido
  como getter sem setter pelo middleware `tenantContext`. TypeError → 500.
- Correção: remoção da linha redundante (getter já extrai de `req.user` dinamicamente).
- Resultado: 635 testes verdes, 0 falhas, 42 suites, working tree limpo.
