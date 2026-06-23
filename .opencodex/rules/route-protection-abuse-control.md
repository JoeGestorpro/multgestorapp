# 🛡️ REGRA CANÔNICA — Proteção de Rotas e Controle de Abuso

> **Status:** OFICIAL • VINCULANTE • **ATIVA E OBRIGATÓRIA** — não é opcional, não é missão consumível.
> **Aplica-se a:** humanos **e** agentes de IA (Claude Code e outros) ao criar/alterar qualquer rota ou funcionalidade exposta.
> **Backbone técnico:** missão **R-003** (Redis em produção, rate limit global, limite por tenant/usuário, quotas por plano, kill-switch — classificada `DANGEROUS/LOCKED`, gated). Esta regra é o **processo**; o R-003 é o **meio técnico**.

## A pergunta obrigatória (CHECK de Abuso/Custo)

Toda nova funcionalidade/rota precisa responder, **antes de ser dada como pronta**:

1. **Pode gerar abuso?** A rota pode ser chamada em volume, automatizada ou por terceiros não confiáveis?
2. **Gera custo?** Cada request consome banco/compute/egress, ou dispara integração paga (e-mail, WhatsApp, IA, storage)?
3. **Precisa de rate limit?** Limite por IP e/ou global — `createRateLimit` em `backend/src/middlewares/rate-limit.middleware.js`.
4. **Precisa de limite por tenant ou usuário?** Chave por `company_id`/`user.id`; quota por plano quando aplicável.

## Regra de "pronto" (Definition of Done)

- Uma rota **exposta** (pública ou autenticada de negócio) **não é considerada pronta** sem responder as 4 perguntas e **aplicar a proteção correspondente** — ou **justificar a isenção por escrito** no PR/card.
- Rotas públicas não autenticadas que **escrevem** (ex.: `POST /public/:slug/appointments`) são **sempre** candidatas a rate limit + limite por tenant.
- Integrações pagas exigem avaliação de **quota** (custo por mensagem/uso).

## Onde isso é verificado

- **Card de missão (`.opencodex/queue/next-task.md`)**: seção "Avaliação de Abuso/Custo" nos Critérios de Aceite.
- **Preflight (`.opencodex/templates/preflight-check.md`)**: CHECK 6 — Abuso/Custo, para missões de nova rota/feature.
- **PR (`.github/PULL_REQUEST_TEMPLATE.md`)**: checklist obrigatório.
- **Auditoria (`.opencodex/rules/auditor-flow.md`)**: gate no Loop de Fechamento — rota nova sem avaliação → `REQUEST_CHANGES`.

## Estado atual (gap que motiva a regra)

Hoje há rate limit **só** em auth/booking (per-IP, fail-open, sem Redis em produção — risco R-003). Rotas de negócio e o `POST /public/:slug/appointments` estão **sem teto**. Até o R-003 entregar limiter global/tenant/quota, esta regra exige avaliação consciente e aplicação manual do `createRateLimit` existente nas rotas novas.

## Referências

- Princípio vinculante: `.opencodex/brain/constitution.md` (§7).
- Decisão: `.opencodex/brain/architecture-decisions.md` (ADR-09).
- Instrução fixa para agentes: `CLAUDE.md` + `AGENTS.md` (raiz).
- Backbone técnico: missão **R-003** (backlog).
