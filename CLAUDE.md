# CLAUDE.md — Instruções fixas para o Claude Code (MultGestor)

> Carregado automaticamente em toda sessão. Regras vinculantes; em conflito, a autoridade é `.opencodex/brain/constitution.md`.

## 🛡️ Proteção de rotas e controle de abuso (OBRIGATÓRIO)

Ao **criar ou alterar qualquer rota/endpoint exposto**, antes de dar como pronto você DEVE responder e tratar:

1. **Pode gerar abuso?**
2. **Gera custo?** (banco/compute/egress ou integração paga: e-mail, WhatsApp, IA, storage)
3. **Precisa de rate limit?**
4. **Precisa de limite por tenant ou usuário?**

- Rota exposta sem responder as 4 perguntas e sem aplicar a proteção correspondente (ou justificar a isenção por escrito) **não está pronta**.
- Use `createRateLimit` (`backend/src/middlewares/rate-limit.middleware.js`). Rotas públicas que escrevem (ex.: `POST /public/:slug/appointments`) são sempre candidatas a rate limit + limite por tenant.
- Regra canônica completa: `.opencodex/rules/route-protection-abuse-control.md`. Backbone técnico: missão **R-003**.

## Governança (resumo)

- Autoridade: `.opencodex/brain/constitution.md` (vinculante) + `.opencodex/rules/`.
- Sem push/merge/deploy/migration sem autorização humana explícita. Stage seletivo (sem `git add -A`). Nunca `git clean`/`git stash`/troca de branch automática.
- Ambiente: **Windows + PowerShell**.
