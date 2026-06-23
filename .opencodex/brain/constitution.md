# ⚖️ CONSTITUTION — Princípios e Regras Invioláveis

> **Status:** OFICIAL • VINCULANTE · não muda por missão.
> **Origem:** consolidado de `.agent/context/memory-snapshot.md` + `docs/architecture-decisions.md` + `.opencodex/rules/*`. **Status: Consolidado/Atualizado (2026-06-07).**

## 1. Visão do produto
MultGestor é um **core compartilhado multi-tenant** que orquestra **módulos verticais por nicho**. Não é um app; é um sistema operacional de negócio. Módulo ativo: **BarberGestor** (barbearias). Verticais previstos: ClimaGestor, OdontoGestor, etc.

## 2. Princípios arquiteturais (vinculantes)
- **Core compartilhado**: lógica comum vive no core (`shared/`), nunca duplicada por nicho.
- **Isolamento multi-tenant por `company_id`** — NUNCA por `owner_id`. Toda query tenant filtra `company_id`.
- **Backend é a única fonte de segurança.** Frontend nunca é confiável para validação crítica.
- **Event-Driven**: ação relevante emite evento; sistemas reagem. Eventos são fatos imutáveis.
- **API-first**: tudo via REST; frontend é cliente.
- **Cirúrgico**: alterar só o necessário; não inventar; não extrapolar escopo.
- **Idioma**: respostas e docs em **PT-BR**.

## 3. Regras críticas de segurança (violação = bug de segurança)
1. `company_id` é a chave de isolamento; toda query tenant filtra por ela.
2. Master Admin não acessa dados de tenant; tenant não acessa dados mestre.
3. GET de integração WhatsApp **nunca** retorna token real (tokens criptografados AES-256-GCM).
4. `.env`/secrets **nunca** vão para o git.
5. `FRONTEND_URL` em produção nunca usa `localhost`.
6. Isolamento multi-tenant tem **defesa em profundidade**: filtro `company_id` na app + RLS no banco (ver ADR sobre runtime-role).

## 4. Governança operacional inviolável (de `.opencodex/`)
- **Uma missão por vez.** Executor lê só `next-task.md`.
- **NUNCA** `git clean`/`git stash`/troca-de-branch automática pelo runner. Branch é criada pelo humano.
- **Stage seletivo** (allowlist 1:1). Sem `git add -A`.
- **Push só com confirmação humana.**
- **EXECUTE_WITH_REVIEW** (pagamentos/LGPD/auth/RLS/eventos/customer-facing): auditoria final do Claude Code obrigatória.
- **EVENT CONTRACTS**: todo producer de evento usa contrato + `validateEventPayload` + factory (ver `.opencodex/rules/event-contracts.md`).
- **CHECK 0 (Context Confidence)** antes de qualquer missão; **Loop de Fechamento** depois (ver `context-confidence-engine.md` + `auditor-flow.md`).

## 5. Ambiente oficial
**Windows + PowerShell.** Comandos operacionais compatíveis com PowerShell por padrão (proibido head/tail/grep/sed/awk Unix salvo Git Bash/WSL confirmado).

## 6. O que NÃO é autoridade
`.agent/` (congelado em 2026-06-04) é **histórico**. Em conflito, o brain prevalece (ver `source-of-truth.md`).

## 7. Proteção de rotas e controle de abuso (ativa e obrigatória)
Regra **vinculante e não-opcional**: toda nova rota/funcionalidade precisa responder, antes de ser dada como pronta:
**(1) pode gerar abuso? (2) gera custo? (3) precisa de rate limit? (4) precisa de limite por tenant ou usuário?**
Rota exposta sem responder as 4 e sem aplicar a proteção correspondente (ou justificar a isenção por escrito) **não está pronta**. Aplica-se a humanos **e** agentes de IA. Regra canônica: `.opencodex/rules/route-protection-abuse-control.md`. Backbone técnico: missão **R-003** (Redis / limiter global / limite por tenant-usuário / quotas / kill-switch — gated).
