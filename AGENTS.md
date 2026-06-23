# AGENTS.md — Instruções fixas para agentes de IA (MultGestor)

> Para qualquer agente de IA que trabalhe neste repositório (Claude Code e outros). Regras vinculantes. Ver também `CLAUDE.md`.

## 🛡️ Proteção de rotas e controle de abuso (OBRIGATÓRIO)

Ao criar/alterar qualquer rota ou funcionalidade exposta, responder e tratar **antes** de dar como pronto:

1. Pode gerar abuso?
2. Gera custo?
3. Precisa de rate limit?
4. Precisa de limite por tenant ou usuário?

Sem responder as 4 e sem aplicar a proteção correspondente (ou justificar a isenção por escrito), a rota **não está pronta**. Regra canônica: `.opencodex/rules/route-protection-abuse-control.md`. Backbone técnico: missão **R-003**.

## Governança

- Autoridade vinculante: `.opencodex/brain/constitution.md` (§7) + `.opencodex/rules/`.
- Sem push/merge/deploy/migration/cleanup sem autorização humana. Stage seletivo (sem `git add -A`). Ambiente **Windows + PowerShell**.
