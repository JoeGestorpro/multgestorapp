# .agent/INDEX.md — MultGestor AI Kernel Index

**Versão:** 1.0  
**Atualizado em:** 2026-05-27  
**Projeto:** MultGestor.v2  
**Branch:** `principal` (6 commits à frente de `origin/main`)

---

## PROTOCOLO OBRIGATÓRIO — LER ISTO ANTES DE QUALQUER TAREFA

### 1. Ponto de entrada sempre
- **`.agent/Joe-orchestrators/agents/master-orchestrator.md`**
  - Define arquitetura de 4 camadas, protocolos de comunicação, e regras de risco.

### 2. Context Engineer obrigatório
- **`.agent/Joe-orchestrators/agents/context-manager.md`**
  - Responsável por carregar contexto mínimo necessário, evitando leitura completa do ecossistema.

### 3. Fontes de verdade (ler nesta ordem)
1. `.agent/context/memory-snapshot.md` — Estado atual do projeto em uma página
2. `.agent/context/ai-operating-rules.md` — Regras operacionais para agents
3. `.agent/memory/current-state.md` — Snapshot da sessão atual
4. `.agent/memory/project-context.md` — Contexto geral do projeto

---

## MAPA DE AGENTES POR TIPO DE TAREFA

| Tipo de Tarefa | Agente | Workflow | Skill |
|----------------|--------|----------|-------|
| Arquitetura / Design de sistema | `platform-architect.md` | `create-capability.md` | — |
| Multi-tenant / RLS / Segurança | `multi-tenant-security-agent.md` | `audit-tenant-isolation.md` | — |
| Eventos / Outbox / Integrações | `event-driven-agent.md` | — | — |
| Billing / Planos / Assinaturas | `saas-billing-agent.md` | — | — |
| Observabilidade / Logs / Sentry | `observability-agent.md` | — | — |
| Banco de dados / Migrations | `database-architect.md` | `generate-migration.md` | — |
| Deploy / Produção / DevOps | `devops-engineer.md` | `prepare-release.md` + `run-migrations.md` | — |
| Frontend / UI / UX | `frontend-specialist.md` | — | `frontend-barbergestor-ui` |
| Backend / API / Segurança | `backend-specialist.md` | — | `backend-seguro-multgestor` |
| Debug / Troubleshooting | `debugger.md` | `debug.md` | — |
| Testes / QA | `test-engineer.md` | `smoke-test.md` | — |
| Nova capability / Feature | `platform-architect.md` + `context-manager.md` | `create-capability.md` | — |
| Tarefa ampla / Multi-agente | `orchestrator.md` | — | — |
| Marketing / Landing pages | `marketing-specialist.md` | — | — |

---

## MAPA DE WORKFLOWS

| Workflow | Trigger | Quando Usar | Risco |
|----------|---------|-------------|-------|
| `create-capability.md` | `/create-capability <nome>` | Nova feature ou módulo | MEDIUM |
| `generate-migration.md` | `/generate-migration <desc>` | Novo schema ou alteração DDL | HIGH |
| `prepare-release.md` | `/prepare-release <versão>` | Preparar deploy de produção | HIGH |
| `audit-tenant-isolation.md` | `/audit-tenant-isolation` | Revisar segurança multi-tenant | CRITICAL |
| `run-migrations.md` | `/run-migrations [--env]` | Executar migrations no Supabase | CRITICAL |
| `smoke-test.md` | `/smoke-test [--env]` | Validar produção após deploy | LOW |
| `debug.md` | `/debug <problema>` | Investigar bug ou falha | LOW |

---

## POLÍTICA DE ECONOMIA DE TOKENS

### FAZER
- **Ler este INDEX.md primeiro** — ele roteia para os arquivos corretos.
- Carregar **APENAS** o agente da camada afetada.
- Para **LOW_RISK**: pipeline de 3 steps (`context-manager` → create → test).
- Para **FAST_MODE**: não ler docs além do necessário.

### NÃO FAZER
- **Nunca** ler toda `.agent/` de uma vez.
- **Nunca** carregar `.agent/marketing/` para tarefas de engenharia.
- **Nunca** re-ler Master Orchestrator inteiro se já estiver em contexto da sessão.

### ARQUIVOS QUE NÃO LER SALVO NECESSIDADE ESPECÍFICA
- `.agent/marketing/` — Apenas tarefas de marketing
- `.agent/runtime/` — Gerado automaticamente (gitignored)
- `.agent/agents/game-developer.md`, `mobile-developer.md` — Fora do escopo atual
- `.agent/skills/rust-pro/`, `geo-fundamentals/`, `i18n-localization/` — Não aplicáveis ao projeto

---

## SKILLS AUSENTES CONHECIDAS

As seguintes skills são referenciadas pelo Master Orchestrator mas podem não existir:

| Skill | Arquivo | Status |
|-------|---------|--------|
| `backend-seguro-multgestor` | `.agent/skills/backend-seguro-multgestor/SKILL.md` | **Criado em 2026-05-27** |
| `frontend-barbergestor-ui` | `.agent/skills/frontend-barbergestor-ui/SKILL.md` | **Criado em 2026-05-27** |

Se forem necessárias para o pipeline em execução, criar usando os padrões definidos no Master Orchestrator.

---

## ESTADO DO PROJETO

| Item | Status |
|------|--------|
| **Branch local** | `principal` |
| **Commits locais** | 6 à frente de `origin/main` |
| **Commits realizados** | e39ef88 (auth), f089222 (shared kernel), 82d22c4 (barber split), 463f357 (SQL migrations), 221dd81 (frontend), 504aa65 (devops/docs) |
| **Produção ativa** | Sim — Render + Vercel + Supabase |
| **Migrations aplicadas** | Não — aguardando execução manual |
| **GitHub Secrets** | Parcial — verificar `RENDER_DEPLOY_HOOK_URL`, `VERCEL_TOKEN` |
| **Health Check** | `/api/health` configurado |
| **RLS** | Configurado em `rls_tenant_tables.sql` — testar em staging |

---

## ÍNDICE RÁPIDO DE ARQUIVOS POR CAMADA

### Camada 1 — Contexto (OBRIGATÓRIO)
- `context/ai-operating-rules.md`
- `context/architecture.md`
- `context/backend-rules.md`
- `context/critical-fixes.md`
- `context/database-rules.md`
- `context/deployment-rules.md`
- `context/frontend-rules.md`
- `context/memory-snapshot.md`
- `context/platform-capabilities.md`
- `context/project-overview.md`
- `context/roadmap.md`
- `context/stack.md`

### Camada 2 — Agentes Especialistas
- `agents/event-driven-agent.md`
- `agents/multi-tenant-security-agent.md`
- `agents/observability-agent.md`
- `agents/platform-architect.md`
- `agents/saas-billing-agent.md`

### Camada 3 — Joe Orchestrators
- `Joe-orchestrators/agents/context-manager.md`
- `Joe-orchestrators/agents/master-orchestrator.md`

### Camada 4 — Memória & Sistema
- `memory/current-state.md`
- `memory/decisions.md`
- `memory/implementation-log.md`
- `memory/next-actions.md`
- `memory/project-context.md`
- `system/ai-audit-system.md`
- `system/auto-memory-updater.md`
- `system/automatic-task-decomposition.md`
- `system/feature-state-engine.md`

### Camada 5 — Workflows
- `workflows/audit-tenant-isolation.md`
- `workflows/create-capability.md`
- `workflows/generate-migration.md`
- `workflows/prepare-release.md`
- `workflows/run-migrations.md`
- `workflows/smoke-test.md`

---

*Gerado automaticamente. Última atualização: 2026-05-27.*
