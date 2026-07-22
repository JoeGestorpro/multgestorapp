# Plano de Auditoria — Lote de Commits Pendentes

> **Data:** 2026-07-16
> **Status:** PLANEJAMENTO
> **Escopo:** 14 commits ahead de `origin/main` + 4 arquivos modificados no working directory + 6 untracked

---

## RESUMO EXECUTIVO

| Métrica | Valor |
|---|---|
| Commits ahead de `origin/main` | **14** (sem merge commits extras) |
| Commits behind de `origin/main` | **0** |
| Arquivos modificados (working dir) | **4** |
| Arquivos untracked | **6** |
| Branches locais | **28** (11 potencialmente órfãs) |
| Stashes | **2** |
| Linhas adicionadas (diff total) | **~37.500** |
| Linhas removidas (diff total) | **~1.200** |
| Arquivos tocados (diff total) | **524** |

---

## ANÁLISE POR COMMIT

### 1. `b03b808` — docs(handoff): context pack para claude
- **Tipo:** Documentação
- **Risco:** BAIXO
- **Conteúdo:** Cria `handoff/context-pack/` com 6 arquivos de contexto para Claude Code
- **Observação:** Apenas documentação, sem impacto funcional

### 2. `84ea895` — feat: fase 10-11 joefelipe-agent
- **Tipo:** Feature (ferramenta interna)
- **Risco:** MÉDIO
- **Conteúdo:** 108 arquivos, ~16.900 linhas em `tools/joefelipe-agent/`
  - ExecutionEngine, drivers (Aider, Claude, Codex, OpenCode, OpenRouter)
  - PolicyEngine com 532 linhas de testes
  - HumanApproval, EventStore, MissionStore, SessionStore
  - LlmEngine com providers (Budget, CircuitBreaker, RateLimit, Nvidia, OpenRouter)
  - E2E tests (280 linhas)
- **Observação:** Código TypeScript com boa cobertura de testes. Não afeta backend/frontend do MultGestor.

### 3. `ab3fcee` — chore: sincroniza .opencodex
- **Tipo:** Organização
- **Risco:** BAIXO
- **Conteúdo:** Movimentação de arquivos dentro de `.opencodex/`
- **Observação:** Renomeações de inglês para português, criação de pastas

### 4. `c835c3c` — feat: reorganizar .opencodex por projetos
- **Tipo:** Organização
- **Risco:** BAIXO
- **Conteúdo:** Reorganização massiva do `.opencodex/` (~300 arquivos movidos/criados)
- **Observação:** Estrutura de pastas nova: `projetos/`, `areas/`, `auditorias/`, `chatJoe/`, `decisoes/`, etc.

### 5. `19673be` — feat: governança documental do vault
- **Tipo:** Feature
- **Risco:** BAIXO
- **Conteúdo:** Cria `Governanca-Documental.md` + 8 documentos canônicos
- **Observação:** Governance framework para o vault de conhecimento

### 6. `bcf8fae` — fix(frontend): porta Vite + lint ESLint 9
- **Tipo:** Fix
- **Risco:** BAIXO
- **Conteúdo:** 
  - `vite.config.js`: adiciona `import process` e configuração de porta via env
  - Resolve problema de lint do ESLint 9
- **Observação:** Fix legítimo para ambiente de deploy

### 7. `b3095f8` — docs(opencodex): reorg inglês→português
- **Tipo:** Documentação
- **Risco:** BAIXO
- **Conteúdo:** Renomeação massiva de arquivos em `.opencodex/` de inglês para português
- **Observação:** Cria também `Nichos/` com templates (865 linhas)

### 8. `da28176` — feat(ai): IA operacional
- **Tipo:** Feature (backend)
- **Risco:** MÉDIO-ALTO
- **Conteúdo:** 22 arquivos, ~2.040 linhas
  - `backend/src/services/llm/` — LlmService, drivers, wrappers
  - `backend/src/controllers/barber/ai-insights.js` — controller
  - `backend/src/routes/barber-ai.routes.js` — rotas com rate limiting
  - `backend/src/database/20260708_031_ai_suggestions.sql` — migration
  - 4 arquivos de teste (~493 linhas)
- **Verificação necessária:**
  - ✅ Rate limiting implementado (3 níveis por tenant)
  - ✅ RLS na migration (tenant_isolation)
  - ✅ Secrets redact no LlmService
  - ⚠️ Verificar se migration 031 foi aplicada ao Supabase
  - ⚠️ Verificar se `.env` do Render tem as env vars

### 9. `3bc90e4` — feat(frontend): card de IA no dashboard
- **Tipo:** Feature (frontend)
- **Risco:** MÉDIO
- **Conteúdo:** 3 arquivos, ~216 linhas
  - `AiInsightsCard.jsx` — componente React
  - `BarberOverviewPage.css` — estilos
  - `BarberOverviewPage.jsx` — integração
- **Verificação necessária:**
  - ⚠️ Verificar se há XSS via dangerouslySetInnerHTML (não parece haver)
  - ⚠️ Verificar se tratamento de erro está adequado

### 10. `3d875f6` — chore: configs e docs
- **Tipo:** Configuração
- **Risco:** BAIXO
- **Conteúdo:** Atualiza `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, `package.json`, cria planos
- **Observação:** `.mcp.json` pode conter configurações sensíveis — verificar

### 11. `c286560` — feat(ai): integrar rotas e migration
- **Tipo:** Feature (integração)
- **Risco:** MÉDIO
- **Conteúdo:** 5 arquivos
  - Adiciona `barberAiRoutes` no `server.js`
  - Adiciona env vars no `.env.example`
  - Adiciona consumer de eventos
  - Migration runner
- **Observação:** Integra as rotas de IA ao servidor principal

### 12. `38a1a7b` — chore: .gitignore
- **Tipo:** Configuração
- **Risco:** BAIXO
- **Conteúdo:** Adiciona padrões ao `.gitignore`
- **Observação:** Exclui `.aider*`, `.claude/`, scripts de debug, scratch files

### 13. `e7343cb` — fix(deps): npm audit fix
- **Tipo:** Dependências
- **RISCO:** BAIXO
- **Conteúdo:** `package-lock.json` — 13 de 14 vulnerabilidades corrigidas
- **Observação:** Operação padrão de segurança

### 14. `f15b77c` — Merge branch 'main'
- **Tipo:** Merge
- **Risco:** N/A
- **Observação:** Merge remoto, já integrado

---

## VERIFICAÇÕES NECESSÁRIAS (antes de push)

### CRÍTICO (bloqueia push)

| # | Verificação | Status | Como verificar |
|---|---|---|---|
| 1 | Migration 031 aplicada ao Supabase? | ⚠️ PENDENTE | `supabase migration list` ou query direta |
| 2 | Env vars configuradas no Render? | ⚠️ PENDENTE | Verificar dashboard do Render |
| 3 | `.env` não commitado com segredos? | ✅ OK | `.env.example` não tem valores reais |
| 4 | `console.log` com dados sensíveis? | ✅ OK | Não encontrado no diff |
| 5 | RLS habilitado na tabela nova? | ✅ OK | `ai_suggestions` tem `ENABLE ROW LEVEL SECURITY` |

### IMPORTANTE (deve ser verificado)

| # | Verificação | Status | Observação |
|---|---|---|---|
| 6 | Testes passam? | ⚠️ PENDENTE | Rodar `npm test` no backend |
| 7 | Lint passa? | ⚠️ PENDENTE | Rodar `npm run lint` |
| 8 | Frontend compila? | ⚠️ PENDENTE | Rodar `npm run build` no frontend |
| 9 | AiInsightsCard sem XSS? | ✅ OK | Usa `suggestion.title` direto, não `dangerouslySetInnerHTML` |
| 10 | Rate limiting configurado? | ✅ OK | 3 rotas com rate limit por tenant |

### RECOMENDADO (boa prática)

| # | Verificação | Status | Observação |
|---|---|---|---|
| 11 | `.mcp.json` seguro? | ⚠️ PENDENTE | Verificar se não expõe chaves |
| 12 | Branches órfãs limpas? | ⚠️ PENDENTE | 11 branches potencialmente órfãs |
| 13 | Stashes preservados? | ✅ OK | 2 stashes existentes |
| 14 | `.gitignore` não exclui arquivos importantes? | ✅ OK | Padrões razoáveis |

---

## ANÁLISE DE RISCO POR ÁREA

### Backend (28 arquivos)
- **Risco:** MÉDIO
- **Pontos fortes:**
  - Rate limiting em 3 rotas (read: 30/5min, dismiss: 60/15min, refresh: 5/1h)
  - RLS com tenant_isolation na migration
  - Secrets redact no LlmService
  - Default `LLM_PROVIDER=mock` (nunca chama API externa sem configuração)
  - 4 arquivos de teste (493 linhas)
- **Pontos de atenção:**
  - Migration 031 precisa ser aplicada manualmente ao Supabase
  - Env vars precisam ser configuradas no Render
  - `consumers.js` modificado — verificar se não quebra fluxo existente

### Frontend (4 arquivos)
- **Risco:** BAIXO
- **Pontos fortes:**
  - Componente isolado (`AiInsightsCard.jsx`)
  - Sem `dangerouslySetInnerHTML`
  - Fix de porta Vite legítimo
- **Pontos de atenção:**
  - Verificar se `AiInsightsCard` lida bem com resposta vazia/erro

### JoeFelipe Agent (108 arquivos)
- **Risco:** BAIXO (ferramenta interna)
- **Pontos fortes:**
  - TypeScript com tipagem
  - Boa cobertura de testes (E2E, unit)
  - Arquitetura modular (drivers, execution, events, sessions)
- **Pontos de atenção:**
  - Não afeta MultGestor diretamente
  - Pode ter dependências não instaladas

### Conhecimento (.opencodex + .opencode)
- **Risco:** MÍNIMO
- **Conteúdo:** ~400 arquivos de documentação/organização
- **Observação:** Sem impacto funcional

---

## DECISÕES PENDENTES

### 1. Stash `stash@{0}`: "temp-stash-obsidian"
- **Conteúdo:** Alterações temporárias no Obsidian
- **Recomendação:** Verificar se ainda é relevante ou pode ser descartado

### 2. Stash `stash@{1}`: "safety-stash-before-b1b-gate-poolconnect"
- **Conteúdo:** Safety stash de uma branch antiga
- **Recomendação:** Verificar se a branch `fase1/b1b-gate-poolconnect` ainda existe e se o stash é necessário

### 3. Branches órfãs (11 branches sem remote)
```
backup/joefelipe-mission-builder-before-main-rebase
backup/principal-before-commit3
backup/principal-before-commit6
chore/brain-queue-cleanup
chore/supabase-agent-skills
feat/joefelipe-agent-foundation-clean
feat/joefelipe-agent-v1
feat/joefelipe-mission-builder
feat/joefelipe-mission-builder-clean
fix/xss-register-hardening-clean
test/joefelipe-agent-safety
```
- **Recomendação:** Perguntar ao usuário quais podem ser deletadas

### 4. Arquivos untracked no working directory
```
.opencode/plans/execucao-reorganizacao-wikis.md
.opencode/plans/plano-reorganizacao-wikis.md
.opencodex/auditorias/multgestor/2026-07-10-auditoria-readonly-mapa-mestre.md
.opencodex/projetos/multgestor/roadmap/.obsidian/
.opencodex/projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md
.opencodex/projetos/multgestor/roadmap/capacidades.md
```
- **Recomendação:** Os 2 primeiros são planos (podem ser commitados). Os 4 últimos são conhecimento (devem ser commitados).

---

## ORDEM DE EXECUÇÃO DA AUDITORIA

### Passo 1: Verificações automáticas (5 min)
1. Rodar `npm audit` no backend
2. Rodar `npm test` no backend (se houver script)
3. Rodar `npm run lint` no backend
4. Rodar `npm run build` no frontend
5. Verificar se `node tools/joefelipe-agent/` compila

### Passo 2: Verificação de segurança (10 min)
1. Verificar `.mcp.json` para chaves expostas
2. Verificar `.env.example` não tem valores reais
3. Verificar `consumers.js` não expõe dados
4. Verificar `AiInsightsCard.jsx` não tem XSS
5. Verificar `sensitive.js` redact funciona

### Passo 3: Verificação de integridade (10 min)
1. Verificar migration 031 no Supabase
2. Verificar rotas registradas no `server.js`
3. Verificar imports não quebrados
4. Verificar que `package-lock.json` está consistente

### Passo 4: Verificação de docs (5 min)
1. Verificar `AGENTS.md` e `CLAUDE.md` atualizados
2. Verificar `00-HOME.md` do `.opencodex`
3. Verificar `Governanca-Documental.md`

### Passo 5: Limpeza (5 min)
1. Perguntar sobre stashes
2. Perguntar sobre branches órfãs
3. Decidir sobre arquivos untracked

### Passo 6: Relatório final (5 min)
1. Consolidar achados
2. Gerar lista de pendências pós-push

---

## ESTIMATIVA DE TEMPO

| Fase | Tempo |
|---|---|
| Verificações automáticas | 5 min |
| Verificação de segurança | 10 min |
| Verificação de integridade | 10 min |
| Verificação de docs | 5 min |
| Limpeza | 5 min |
| Relatório final | 5 min |
| **Total** | **~40 min** |

---

## BLOQUEADORES ANTES DO PUSH

| # | Bloqueador | Ação necessária |
|---|---|---|
| 1 | Migration 031 não aplicada | Rodar no Supabase: o SQL está em `backend/src/database/20260708_031_ai_suggestions.sql` |
| 2 | Env vars não configuradas | Adicionar no Render: `LLM_PROVIDER`, `OPENROUTER_API_KEY`, `NVIDIA_API_KEY` (ou manter `mock`) |
| 3 | Gate humano pendente | `release/push-p0-batch` requer "APROVADO PUSH" |

> **Nota:** Se `LLM_PROVIDER=mock` (default), o sistema funciona sem API keys. As env vars só são necessárias se quiser usar LLMs reais.
