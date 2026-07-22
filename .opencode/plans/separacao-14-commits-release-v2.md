# Plano de Separação dos 14 Commits em Branches de Release (v2)

> **Data:** 2026-07-16
> **Status:** PLANEJAMENTO — NÃO EXECUTAR
> **Versão:** 2.1 (corrigida: worktrees, commit-first, matriz de deploy, mapeamento correto, Etapa 0 sem branch/checkout, ROADMAP excluídos, worktree order canônico, git fetch)
> **Objetivo:** Separar os 14 commits em branches limpas, sem reescrever ou perder o estado atual

---

## CORREÇÕES DA v1

| Problema da v1 | Correção na v2 |
|---|---|
| `git stash push/pop` — proibido pelo `CLAUDE.md` | **Commit dos docs** em branch própria + **`git worktree add`** para cada lote |
| `git checkout -b` — proibido como automático | **`git worktree add`** não troca a branch do main |
| `c286560` descrito como "routes, migration, env" | **Corrigido:** `c286560` registra rotas em `server.js`, env vars, migration runner, events. As rotas em si estão em `da28176` |
| Lote D reordenado sem marcar como tal | **Marcado explicitamente:** ordem `da28176 → c286560 → 3bc90e4` é reordenamento (integração antes de frontend) |
| Subestimou triggers de deploy | **Matriz de deploy:** todos os lotes disparam `deploy.yml`; Lote D é deploy de produção real |
| "Fase 6" confundido com missão de release | **Separado:** Fase 6 = Pagamento/Entitlement; Missão = `release/push-p0-batch` |

### Correções da v2.1

| Problema da v2 | Correção na v2.1 |
|---|---|
| Etapa 0 usava `git checkout -b` (proibido) e branch `docs/ciclo-mapa-mestre` | **Commit direto no main** sem branch, sem checkout |
| ROADMAP-* incluídos no commit (CRLF only, sem conteúdo) | **Excluídos** do stage + `git restore` |
| `.opencode/plans/` adicionados via glob (stage não seletivo) | **Removidos** — ficam untracked (docs internos) |
| `bcf8fae` descrito como 1 arquivo + teste (2) | **Corrigido:** 1 arquivo (`frontend/vite.config.js`) |
| Worktree add com ordem variável | **Ordem canônico:** `git worktree add -b <branch> <path> <commit-ish>` |
| Sem `git fetch` antes das etapas | **Adicionado** `git fetch origin` antes de cada etapa |

---

## 1. ESTADO ATUAL DO GIT

```
HEAD (main local): e7343cb
origin/main:       94aa679
Ahead: 14 commits (13 lineares + 1 merge)
Behind: 0 commits
Working dir: 4 modificados + 6 untracked plans + 4 untracked docs
Stashes: 2 (de outras branches, NÃO usar)
Worktrees existentes: 8 (não mexer)
```

### Grafo dos 14 commits

```
e661259 ← origin/main (94aa679)
    │
b03b808  docs(handoff) ............... Lote A
84ea895  feat(joefelipe-agent) ....... Lote C
ab3fcee  chore(.opencodex sync) ...... Lote A
c835c3c  feat(.opencodex reorg) ...... Lote A
19673be  feat(governança docs) ....... Lote A
bcf8fae  fix(Vite port) .............. Lote B
    │
f15b77c  Merge origin/main ← IGNORAR (já está no origin)
    │
b3095f8  docs(.opencodex pt-br) ...... Lote A
    │
da28176  feat(IA backend) ............ Lote D ⚠️
3bc90e4  feat(IA frontend) ........... Lote D ⚠️
    │
3d875f6  chore(configs) .............. Lote B
c286560  feat(IA integration) ........ Lote D ⚠️
    │
38a1a7b  chore(.gitignore) .......... Lote B
e7343cb  fix(npm audit) .............. Lote B
```

### Análise do merge `f15b77c`

- Pais: `bcf8fae` (local) × `94aa679` (origin/main)
- Conteúdo: 9 arquivos de backup-restore **já em origin/main**
- `git diff bcf8fae f15b77c` = exatamente esses 9 arquivos; como `behind=0`, já estão na base
- **Decisão:** Ignorar completamente no cherry-pick

---

## 2. MAPEAMENTO CORRIGIDO: COMMIT × ARQUIVOS × LOTE

### Lote A — Documentação e Conhecimento (5 commits)

| Commit | Arquivos | Quantidade |
|---|---|---|
| `b03b808` | `handoff/context-pack/` (6 arquivos) | 6 |
| `ab3fcee` | `.opencodex/` (renames, ~40) | ~40 |
| `c835c3c` | `.opencodex/` (reorg por projetos, ~260) | ~260 |
| `19673be` | `Governanca-Documental.md` + docs canônicos (9) | 9 |
| `b3095f8` | `.opencodex/` (renames pt-br, ~226) | ~226 |

**Área:** Exclusivamente `.opencodex/`, `handoff/`, `Governanca-Documental.md`
**Conflito com outros lotes:** Nenhum

### Lote B — Configuração e Manutenção (4 commits)

| Commit | Arquivos | Quantidade |
|---|---|---|
| `bcf8fae` | `frontend/vite.config.js` (1) | 1 |
| `3d875f6` | `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, `package.json`, `.opencode/plans/` (9) | 9 |
| `38a1a7b` | `.gitignore` (1) | 1 |
| `e7343cb` | `backend/package-lock.json` (1) | 1 |

**Área:** Configs raiz, frontend config, lockfile
**Conflito com outros lotes:** `e7343cb` pode conflitar com `3d875f6` em `package-lock.json` (resolução: aceitar do audit fix)

### Lote C — JoeFelipe Agent (1 commit)

| Commit | Arquivos | Quantidade |
|---|---|---|
| `84ea895` | `tools/joefelipe-agent/` (108) | 108 |

**Área:** Exclusivamente `tools/joefelipe-agent/`
**Conflito com outros lotes:** Nenhum
**Pré-requisitos:** Verificar scripts no `package.json` raiz, CI, `.env.example`, dependências

### Lote D — IA Operacional (3 commits, reordenados)

| Commit | Arquivos | Quantidade | Papel |
|---|---|---|---|
| `da28176` | `backend/src/services/llm/` + controller + routes + migration + tests | 22 | **Cria** a feature: services, controller, `barber-ai.routes.js`, migration 031, 4 testes |
| `c286560` | `server.js`, `.env.example`, `run-migrations.js`, `events/consumers.js`, `events/contracts.js` | 5 | **Registra** rotas no `server.js`, env vars, migration runner, eventos |
| `3bc90e4` | `frontend/AiInsightsCard.jsx`, CSS, `BarberOverviewPage.jsx` | 3 | **Consome** a API no frontend |

**Ordem de cherry-pick (obrigatória):**
```
da28176 → c286560 → 3bc90e4
```

**⚠️ REORDENAMENTO:** A ordem cronológica original é `da28176 → 3bc90e4 → c286560`. A ordem proposta (`da28176 → c286560 → 3bc90e4`) coloca a integração antes do frontend — logicamente melhor (o card só consome API que já existe), mas é um reordenamento. **Exige teste após cherry-pick.**

**Conflito entre si:** Nenhum (áreas de código diferentes)
**Conflito com outros lotes:** `c286560` pode conflitar com `e7343cb` em `backend/package-lock.json`

---

## 3. MATRIZ DE DEPLOY

> **Regra do `deploy.yml`:** Qualquer merge em `main` que toque arquivos fora de `.opencodex/**`, `CLAUDE.md`, `AGENTS.md`, `.github/PULL_REQUEST_TEMPLATE.md` dispara `deploy.yml` → Render + Vercel + migrations.

| Lote | Toca só paths ignorados? | Dispara deploy.yml? | Impacto real |
|---|---|---|---|
| **A** (docs) | ❌ `handoff/`, `Governanca-Documental.md` na raiz | **SIM** | Rebuild inócuo; migrations `continue-on-error` rodam mas não mudam nada |
| **B** (config) | ❌ `frontend/`, `backend/`, `package.json` | **SIM** | Rebuild inócuo; `npm audit fix` pode mudar lockfile |
| **C** (agent) | ❌ `tools/**` não é ignorado | **SIM** | Rebuild inócuo (não afeta app) |
| **D** (IA) | ❌ backend + frontend | **SIM** | **DEPLOY DE PRODUÇÃO REAL** — migration 031 + novas rotas + novo componente |

### Consequência

**Nenhum lote é "só docs sem efeito de deploy".** Mesmo o Lote A dispara `deploy.yml`. A diferença está no impacto:
- Lotes A, B, C: rebuild inócuo (não muda a aplicação)
- **Lote D: muda a aplicação em produção** (migration + rotas + frontend)

**Lote D merece o gate mais forte** — equivale a um deploy completo.

---

## 4. ESTRATÉGIA: WORKTREES + COMMIT-FIRST

### Por que não stash
- `CLAUDE.md` proíbe `git stash` como automação
- Empilhar 3ª stash sobre 2 existentes (de outras branches) é frágil
- **Alternativa:** Commit dos docs do working tree em branch própria

### Por que não checkout
- `CLAUDE.md` proíbe troca de branch automática
- **Alternativa:** `git worktree add` — não mexe na working tree principal

### Fluxo

```
1. git fetch origin
2. Commit docs do working tree → direto no main (sem branch, sem checkout)
3. git worktree add -b <branch> <path> origin/main
4. Cherry-pick dos commits do lote
5. Testar
6. Push → PR → Review → Merge (gate humano)
7. git worktree remove
8. Repetir para lotes B, C, D
```

---

## 5. COMANDOS PROPOSTOS (SEM EXECUTAR)

### Etapa 0 — Preservar working tree (commit-first, sem branch)

```bash
# 1. Garantir que origin/main está atualizado
git fetch origin

# 2. Restaurar ROADMAP-* (só mudança CRLF, sem conteúdo real)
git restore .opencodex/projetos/multgestor/roadmap/ROADMAP-MESTRE-MULTGESTOR-2026.md
git restore .opencodex/projetos/multgestor/roadmap/ROADMAP-MULTGESTOR-AUDITORIA-ATUAL.md

# 3. Stage seletivo (arquivo por arquivo, sem glob)
git add .opencodex/projetos/multgestor/indice.md
git add .opencodex/projetos/multgestor/status-atual.md
git add .opencodex/auditorias/multgestor/2026-07-10-auditoria-readonly-mapa-mestre.md
git add .opencodex/projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md
git add .opencodex/projetos/multgestor/roadmap/capacidades.md

# 4. Commit direto no main (sem branch, sem checkout)
git commit -m "docs: estado do ciclo mapa mestre + planos de release"
```

**O que entra:** `indice.md`, `status-atual.md`, auditoria readonly, roadmap docs novos (5 arquivos)
**O que NÃO entra:** ROADMAP-* (CRLF only), `.opencode/plans/` (docs internos), `.obsidian/` (config local)

### Etapa 1 — Lote A (Documentação)

```bash
git fetch origin

# Criar worktree a partir de origin/main (NÃO mexe no main)
git worktree add -b release/lote-a-documentacao ../mg-lote-a origin/main

# Cherry-pick (respeitando ordem cronológica)
cd ../mg-lote-a
git cherry-pick b03b808    # handoff docs
git cherry-pick ab3fcee    # .opencodex sync
git cherry-pick c835c3c    # .opencodex reorg
git cherry-pick 19673be    # governança docs
git cherry-pick b3095f8    # .opencodex pt-br

# Verificar (SEM rodar build — são docs)
# - Checar links do Obsidian
# - Checar que 00-HOME.md está funcional
# - Checar que MAPA-DAS-PASTAS.md reflete estrutura real

# Push (gate humano obrigatório)
git push -u origin release/lote-a-documentacao

# Limpar worktree
cd /c/MultGestor.v2
git worktree remove ../mg-lote-a
```

**Conflitos prováveis:** Nenhum (todos tocam `.opencodex/` ou `handoff/`)

### Etapa 2 — Lote B (Configuração)

```bash
git fetch origin
git worktree add -b release/lote-b-config ../mg-lote-b origin/main

cd ../mg-lote-b
git cherry-pick bcf8fae    # Vite fix
git cherry-pick 3d875f6    # configs
git cherry-pick 38a1a7b    # .gitignore
git cherry-pick e7343cb    # npm audit

# Verificar (OBRIGATÓRIO)
npm ci
npm test                  # backend
cd frontend && npm run build && cd ..

# Push (gate humano)
git push -u origin release/lote-b-config

cd /c/MultGestor.v2
git worktree remove ../mg-lote-b
```

**Conflitos prováveis:** `e7343cb` pode conflitar com `3d875f6` em `package-lock.json` → resolver aceitando o do audit fix

### Etapa 3 — Lote C (JoeFelipe Agent)

```bash
git fetch origin
git worktree add -b release/lote-c-joefelipe-agent ../mg-lote-c origin/main

cd ../mg-lote-c
git cherry-pick 84ea895    # execution core (108 arquivos)

# Verificar
# - package.json raiz não quebra
# - .env.example não expõe credenciais
# - CI não falha por dependências

# Push (gate humano)
git push -u origin release/lote-c-joefelipe-agent

cd /c/MultGestor.v2
git worktree remove ../mg-lote-c
```

**Conflitos prováveis:** Nenhum (108 arquivos todos em `tools/joefelipe-agent/`)

### Etapa 4 — Lote D (IA) — GATE REFORÇADO

```bash
git fetch origin
git worktree add -b release/lote-d-ia-operacional ../mg-lote-d origin/main

cd ../mg-lote-d
# ORDEM REORDENADA (integração antes de frontend)
git cherry-pick da28176    # IA backend (services, routes, migration, tests)
git cherry-pick c286560    # IA integração (server.js, env, events)
git cherry-pick 3bc90e4    # IA frontend (AiInsightsCard)

# Verificar (MÁXIMO — é deploy de produção)
cd backend && npm test && cd ..
cd frontend && npm run build && cd ..
# Verificar: migration idempotente? backward-compatible? registrada?
# Verificar: LLM_PROVIDER=mock funciona?
# Verificar: rotas respondem?

# Push (gate humano REFORÇADO — equivale a deploy de produção)
git push -u origin release/lote-d-ia-operacional

cd /c/MultGestor.v2
git worktree remove ../mg-lote-d
```

**Conflitos prováveis:** `c286560` pode conflitar com `e7343cb` em `backend/package-lock.json`
**⚠️ Este lote É um deploy de produção** — migration 031 + novas rotas + novo componente frontend

### Etapa 5 — Voltar ao estado original

```bash
# A working tree principal continua em main com os docs já commitados
# Nenhum stash para pop
# Nenhum checkout necessário
# git fetch origin feito no início de cada etapa
```

---

## 6. TRATAMENTO DO COMMIT DE MERGE

```
f15b77c — Merge branch 'main' of https://github.com/JoeGestorpro/multgestorapp
```

- Pais: `bcf8fae` (local) × `94aa679` (origin/main)
- Conteúdo: 9 arquivos de backup-restore **já em origin/main**
- `git diff bcf8fae f15b77c` = exatamente esses 9
- Como `behind=0`, já estão na base

**Decisão:** Ignorar. Nenhum cherry-pick necessário.

---

## 7. MATRIZ DE RISCO POR LOTE

| Lote | Commits | Risco | Deploy? | Gate |
|---|---|---|---|---|
| **A** | 5 (docs) | Mínimo | Sim (rebuild inócuo) | PR + review |
| **B** | 4 (config) | Baixo | Sim (rebuild inócuo) | PR + review + CI |
| **C** | 1 (agent) | Baixo | Sim (rebuild inócuo) | PR + review + CI |
| **D** | 3 (IA) | Médio-Alto | **Sim (produção real)** | **PR + review + CI + testes + migration + gate reforçado** |

---

## 8. CRITÉRIOS DE APROVAÇÃO POR PR

### Lote A (Documentação)
- [ ] Todos os links do Obsidian apontam para arquivos existentes
- [ ] Nenhum arquivo perdido na reorganização
- [ ] `00-HOME.md` funcional
- [ ] `MAPA-DAS-PASTAS.md` reflete estrutura real

### Lote B (Configuração)
- [ ] `npm ci` sem erros
- [ ] `npm test` passa (backend)
- [ ] `npm run build` passa (frontend)
- [ ] `.gitignore` não exclui nada importante
- [ ] `package.json` scripts funcionam
- [ ] `npm audit` mostra 0 vulnerabilities high

### Lote C (JoeFelipe Agent)
- [ ] `tools/joefelipe-agent/package.json` válido
- [ ] `.env.example` não expõe credenciais
- [ ] Scripts no `package.json` raiz funcionam
- [ ] CI não falha por dependências faltantes

### Lote D (IA) — GATE REFORÇADO
- [ ] Migration 031: idempotente, backward-compatible, registrada
- [ ] `npm test` passa no backend
- [ ] `npm run build` passa no frontend
- [ ] `/api/barber/ai/insights` responde (com mock)
- [ ] RLS funciona (tenant isolation)
- [ ] `LLM_PROVIDER=mock` funciona sem API keys
- [ ] Rate limiting configurado
- [ ] Rollout: migration → backend → smoke → frontend
- [ ] **Aprovação humana explícita para deploy de produção**

---

## 9. ROLLBACK

### Se um PR for rejeitado
```bash
git worktree remove ../mg-lote-X
git branch -D release/lote-X-...
```

### Se um PR quebrar após merge
```bash
# Reverter o merge na main
git checkout main
git revert -m 1 <merge-commit-sha>
git push origin main
```

### Se a branch original for necessária
A branch `main` local continua intocada (os docs foram commitados direto nela).

---

## 10. O QUE NÃO FAZER

- [ ] NÃO fazer `git push origin main` direto
- [ ] NÃO fazer squash dos 14 commits
- [ ] NÃO fazer rebase interativo
- [ ] NÃO usar `git stash` (proibido pelo CLAUDE.md)
- [ ] NÃO usar `git checkout -b` como automação (proibido pelo CLAUDE.md)
- [ ] NÃO aplicar migration manualmente antes de entender o pipeline
- [ ] NÃO configurar produção nesta etapa
- [ ] NÃO executar nenhum comando — esta é uma fase de planejamento

---

## 11. NOMENCLATURA CORRIGIDA

| Termo | Definição |
|---|---|
| **Fase arquitetural 6** | Pagamento, assinatura e entitlement (Mapa Mestre) |
| **Missão de release** | `release/push-p0-batch` — publicação controlada |
| **Lote A** | Documentação, .opencodex, governança |
| **Lote B** | Configuração, Vite, .gitignore, npm audit |
| **Lote C** | JoeFelipe Agent |
| **Lote D** | IA operacional (deploy de produção real) |
