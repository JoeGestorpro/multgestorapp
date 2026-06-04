---
description: Auditoria read-only da missão concluída; escreve parecer em latest-audit.md
---

# /audit-task — Auditor OpenCode (read-only)

> ⚠️ Reconstruído 2026-06-04 (original perdido no git clean). Valide contra o schema de comandos do OpenCode.

Auditor **read-only**: NÃO altera código. Apenas verifica e relata.

1. Leia `.opencodex/queue/completed-task.md` e o `git diff`/commit da missão.
2. Verifique item a item os **critérios de aceite** do `next-task.md`.
3. Confirme: ALLOWLIST 1:1 (sem scope drift), testes verdes reais, sem secret exposto, quarentenas intactas.
4. Escreva o parecer em `.opencodex/audits/latest-audit.md` com `status: awaiting-decision` e
   `verdict: APPROVE | APPROVE_WITH_NOTES | REQUEST_CHANGES`.
5. **Não decide** — devolve ao **Claude Code** para a decisão final (obrigatória em EXECUTE_WITH_REVIEW).
