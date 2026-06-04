---
description: Finalizar a missão atual, preenchendo completed-task.md com evidência real
---

# /complete-task — Executor OpenCode

> ⚠️ Reconstruído 2026-06-04 (original perdido no git clean). Valide contra o schema de comandos do OpenCode.

1. Garanta que os testes obrigatórios do `next-task.md` rodaram e estão **verdes** (cole a saída real).
2. Confirme `git diff --cached --name-only` **1:1 com a ALLOWLIST** (sem scope drift).
3. Preencha `.opencodex/queue/completed-task.md`:
   - `status: awaiting-audit`, `result`, `task_id`, `title`, `branch`, `commits` (hashes),
   - resumo, evidência real de `npm test`, lista de arquivos tocados.
4. Marque `current-task.md` como `idle` apenas após a auditoria/decisão.
5. Se o modo do card for **EXECUTE_WITH_REVIEW** → rode `/audit-task` e devolva ao Claude Code para decisão final.
