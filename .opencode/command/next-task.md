---
description: Executar a próxima missão da fila (.opencodex/queue/next-task.md) após PREFLIGHT obrigatório
---

# /next-task — Executor OpenCode

> ⚠️ Reconstruído 2026-06-04 (original perdido no git clean). Valide contra o schema de comandos do OpenCode.

1. **PREFLIGHT OBRIGATÓRIO** — rode o protocolo `.opencodex/templates/preflight-check.md` na íntegra
   (5 checagens). Se QUALQUER falhar → **ABORTE** e imprima `problema · risco · ação segura`. Não execute nada.
   Nunca `git stash`/`checkout`/`clean`/criar-branch automaticamente.
2. Se o preflight passar: leia `.opencodex/queue/next-task.md` por completo.
3. Espelhe para `.opencodex/queue/current-task.md` com `status: running` e crie a branch indicada no card.
4. Implemente seguindo a ALLOWLIST e os Hard Stop Rules. **Staging seletivo** (allowlist 1:1; sem `git add -A`).
5. Ao terminar, rode `/complete-task`.
