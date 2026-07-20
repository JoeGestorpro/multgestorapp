# Plano de Separação dos 14 Commits em Branches de Release (v2.2)

> **Data:** 2026-07-16
> **Status:** PLANEJAMENTO — NÃO EXECUTAR
> **Versão:** 2.2 (docs do ciclo publicados via Lote A; sem commit na main local; Etapa 6 de reconciliação)
> **Objetivo:** Separar os 14 commits em branches limpas, publicar os docs do ciclo sem deixá-los órfãos e reconciliar a main local ao final — sem reescrever nem perder estado.

---

## HISTÓRICO DE CORREÇÕES

### v1 → v2

| Problema da v1 | Correção na v2 |
|---|---|
| `git stash push/pop` — proibido pelo `CLAUDE.md` | Commit-first + `git worktree add` por lote |
| `git checkout -b` — proibido como automático | `git worktree add` não troca a branch do main |
| `c286560` descrito como "routes, migration, env" | `c286560` registra rotas em `server.js`, env, migration runner, events; rotas em si estão em `da28176` |
| Lote D reordenado sem marcar | Marcado: `da28176 → c286560 → 3bc90e4` é reordenamento |
| Subestimou triggers de deploy | Matriz de deploy: todos os lotes disparam `deploy.yml` |
| "Fase 6" confundido com missão de release | Separado: Fase 6 = Pagamento/Entitlement; Missão = `release/push-p0-batch` |

### v2 → v2.1

| Problema da v2 | Correção na v2.1 |
|---|---|
| Etapa 0 usava `git checkout` (proibido) | Commit direto no main sem branch/checkout |
| ROADMAP-* no commit (CRLF only) | Excluídos + `git restore` |
| `.opencode/plans/` via glob | Removidos do stage |
| `bcf8fae` como "2 + teste" | 1 arquivo (`frontend/vite.config.js`) |
| Worktree add com ordem variável | Ordem canônica `-b <branch> <path> <commit-ish>` |
| Sem `git fetch` | Adicionado antes de cada etapa |

### v2.1 → v2.2 (esta versão)

| Problema da v2.1 | Correção na v2.2 |
|---|---|
| Commit de docs **direto na main local** ficava **órfão** (nenhum PR o carregava) → perdido na reconciliação final | **Docs entram no worktree do Lote A** e são publicados no **PR do Lote A** |
| Commit na main local **aumentava a divergência** main/origin | **Nada é commitado na main local**; a main permanece só com os 14 originais até a reconciliação |
| Faltava passo de reconciliação da main local após todos os PRs | **Nova Etapa 6** — reconciliar main local com `origin/main` |

---

## 1. ESTADO ATUAL DO GIT

```
HEAD (main local): e7343cb
origin/main:       94aa679
Ahead: 14 commits (13 lineares + 1 merge)
Behind: 0 commits
Working dir: 4 modificados + untracked (docs do ciclo + planos internos)
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
- `git diff bcf8fae f15b77c` = exatamente esses 9; como `behind=0`, já estão na base
- **Decisão:** Ignorar completamente no cherry-pick

---

## 2. DOCUMENTOS DO CICLO (a publicar via Lote A)

Alterações não commitadas no working tree que pertencem a **este ciclo** (Mapa Mestre + auditoria READ_ONLY) e devem ser **publicadas junto do Lote A** (mesma área `.opencodex/`):

| Arquivo | Estado | Vai para Lote A? |
|---|---|---|
| `.opencodex/projetos/multgestor/indice.md` | modificado | ✅ Sim |
| `.opencodex/projetos/multgestor/status-atual.md` | modificado | ✅ Sim |
| `.opencodex/projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md` | novo | ✅ Sim |
| `.opencodex/projetos/multgestor/roadmap/capacidades.md` | novo | ✅ Sim |
| `.opencodex/auditorias/multgestor/2026-07-10-auditoria-readonly-mapa-mestre.md` | novo | ✅ Sim |
| `.opencodex/.../roadmap/ROADMAP-MESTRE-MULTGESTOR-2026.md` | modificado (**só CRLF**) | ❌ Não — `git restore` |
| `.opencodex/.../roadmap/ROADMAP-MULTGESTOR-AUDITORIA-ATUAL.md` | modificado (**só CRLF**) | ❌ Não — `git restore` |
| `.opencode/plans/*` | planos internos (untracked) | ❌ Não — ficam untracked |
| `roadmap/.obsidian/` | config local do Obsidian | ❌ Não |

> **Por que via Lote A e não na main local:** commitar na main local deixaria o commit **órfão** (nenhum PR o levaria ao origin) e **aumentaria a divergência**. Entrando pelo worktree do Lote A, os docs são **publicados no PR do Lote A** e **sobrevivem** à reconciliação final.

---

## 3. MAPEAMENTO: COMMIT × ARQUIVOS × LOTE

### Lote A — Documentação e Conhecimento (5 commits + docs do ciclo)

| Commit | Arquivos | Quantidade |
|---|---|---|
| `b03b808` | `handoff/context-pack/` | 6 |
| `ab3fcee` | `.opencodex/` (renames) | ~40 |
| `c835c3c` | `.opencodex/` (reorg por projetos) | ~260 |
| `19673be` | `Governanca-Documental.md` + docs canônicos | 9 |
| `b3095f8` | `.opencodex/` (renames pt-br) | ~226 |
| **+ docs do ciclo** | 5 arquivos da seção 2 | 5 |

**Área:** `.opencodex/`, `handoff/`, `Governanca-Documental.md` · **Conflito com outros lotes:** Nenhum

### Lote B — Configuração e Manutenção (4 commits)

| Commit | Arquivos | Quantidade |
|---|---|---|
| `bcf8fae` | `frontend/vite.config.js` | 1 |
| `3d875f6` | `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, `package.json`, `.opencode/plans/` | 9 |
| `38a1a7b` | `.gitignore` | 1 |
| `e7343cb` | `backend/package-lock.json` | 1 |

**Conflito:** `e7343cb` × `3d875f6` em `package-lock.json` → resolver aceitando o do audit fix

### Lote C — JoeFelipe Agent (1 commit)

| Commit | Arquivos | Quantidade |
|---|---|---|
| `84ea895` | `tools/joefelipe-agent/` | 108 |

**Conflito:** Nenhum · **Pré-req:** scripts no `package.json` raiz, CI, `.env.example`, dependências

### Lote D — IA Operacional (3 commits, reordenados)

| Commit | Arquivos | Qtd | Papel |
|---|---|---|---|
| `da28176` | `backend/src/services/llm/` + controller + `barber-ai.routes.js` + migration 031 + tests | 22 | **Cria** a feature |
| `c286560` | `server.js`, `.env.example`, `run-migrations.js`, `events/consumers.js`, `events/contracts.js` | 5 | **Registra** rotas/env/eventos |
| `3bc90e4` | `AiInsightsCard.jsx`, CSS, `BarberOverviewPage.jsx` | 3 | **Consome** a API no frontend |

**Ordem obrigatória:** `da28176 → c286560 → 3bc90e4`
**⚠️ REORDENAMENTO:** ordem cronológica original é `da28176 → 3bc90e4 → c286560`. A proposta põe integração antes do frontend (o card só consome API existente) — **exige teste após cherry-pick**.
**Conflito com outros lotes:** `c286560` × `e7343cb` em `backend/package-lock.json`

---

## 4. MATRIZ DE DEPLOY

> **Regra do `deploy.yml`:** `deploy.yml` tem `paths-ignore` só para `.opencodex/**`, `CLAUDE.md`, `AGENTS.md`, `.github/PULL_REQUEST_TEMPLATE.md`. Qualquer merge em `main` fora disso dispara Render + Vercel + migrations. `ci.yml` roda em **todo** push (`branches: ['**']`), sem `paths-ignore`.

| Lote | Toca só paths ignorados? | Dispara deploy.yml? | Impacto real |
|---|---|---|---|
| **A** (docs) | ❌ `handoff/`, `Governanca-Documental.md` (raiz) | **SIM** | Rebuild inócuo; migrations `continue-on-error` rodam mas não mudam nada |
| **B** (config) | ❌ `frontend/`, `backend/`, `package.json` | **SIM** | Rebuild inócuo |
| **C** (agent) | ❌ `tools/**` | **SIM** | Rebuild inócuo (não afeta app) |
| **D** (IA) | ❌ backend + frontend | **SIM** | **DEPLOY DE PRODUÇÃO REAL** — migration 031 + rotas + componente |

**Nenhum lote é "só docs sem deploy".** Diferença = impacto. **Lote D muda a aplicação em produção → gate mais forte.**

---

## 5. ESTRATÉGIA: WORKTREES + PUBLICAR DOCS VIA LOTE A

```
1. git fetch origin
2. Etapa 0: só restaurar os ROADMAP-* (CRLF); NÃO commitar nada na main
3. Etapa 1 (Lote A): worktree de origin/main → cherry-pick 5 commits →
   COPIAR os docs do ciclo para dentro do worktree → commit dos docs → push → PR
4. Etapas 2–4 (Lotes B, C, D): worktree → cherry-pick → testar → push → PR
5. Etapa 6: após todos os PRs mergeados → reconciliar main local com origin/main
```

- **Sem `git stash`** (proibido) · **Sem `git checkout` na main** (proibido) · **Sem commit na main local**
- Cada `push` é **gate humano individual**

---

## 6. COMANDOS PROPOSTOS (SEM EXECUTAR)

### Etapa 0 — Higienizar working tree (sem commit na main)

```bash
git fetch origin

# Descartar só o ruído de CRLF (sem conteúdo real)
git restore .opencodex/projetos/multgestor/roadmap/ROADMAP-MESTRE-MULTGESTOR-2026.md
git restore .opencodex/projetos/multgestor/roadmap/ROADMAP-MULTGESTOR-AUDITORIA-ATUAL.md

# NÃO commitar nada na main. Os docs do ciclo permanecem no working tree
# e serão copiados para o worktree do Lote A na Etapa 1.
git status --short   # conferência visual
```

### Etapa 1 — Lote A (Documentação) + docs do ciclo

```bash
git fetch origin
git worktree add -b release/lote-a-documentacao ../mg-lote-a origin/main

cd ../mg-lote-a
# 5 commits do Lote A (ordem cronológica)
git cherry-pick b03b808    # handoff docs
git cherry-pick ab3fcee    # .opencodex sync
git cherry-pick c835c3c    # .opencodex reorg
git cherry-pick 19673be    # governança docs
git cherry-pick b3095f8    # .opencodex pt-br

# Trazer os docs do ciclo (copiar do working tree principal para este worktree).
# Copiar SOMENTE os 5 arquivos da seção 2 (paths idênticos pós-reorg):
cp /c/MultGestor.v2/.opencodex/projetos/multgestor/indice.md \
   .opencodex/projetos/multgestor/indice.md
cp /c/MultGestor.v2/.opencodex/projetos/multgestor/status-atual.md \
   .opencodex/projetos/multgestor/status-atual.md
cp /c/MultGestor.v2/.opencodex/projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md \
   .opencodex/projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md
cp /c/MultGestor.v2/.opencodex/projetos/multgestor/roadmap/capacidades.md \
   .opencodex/projetos/multgestor/roadmap/capacidades.md
cp /c/MultGestor.v2/.opencodex/auditorias/multgestor/2026-07-10-auditoria-readonly-mapa-mestre.md \
   .opencodex/auditorias/multgestor/2026-07-10-auditoria-readonly-mapa-mestre.md

# Stage seletivo (arquivo por arquivo) + commit dos docs do ciclo
git add .opencodex/projetos/multgestor/indice.md
git add .opencodex/projetos/multgestor/status-atual.md
git add .opencodex/projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md
git add .opencodex/projetos/multgestor/roadmap/capacidades.md
git add .opencodex/auditorias/multgestor/2026-07-10-auditoria-readonly-mapa-mestre.md
git commit -m "docs: mapa mestre de conclusao + auditoria readonly + estado do ciclo"

# Verificar (SEM build — são docs)
git log --oneline origin/main..HEAD    # deve mostrar 6 commits (5 + docs)
# - Checar links do Obsidian / 00-HOME / MAPA-DAS-PASTAS

# Push (gate humano obrigatório)
git push -u origin release/lote-a-documentacao

cd /c/MultGestor.v2
git worktree remove ../mg-lote-a
```

> **Pré-condição da cópia:** os diretórios-alvo existem no worktree **após** os cherry-picks dos commits de reorg (`c835c3c`, `b3095f8`). Fazer a cópia **depois** dos cherry-picks. Conferir com `git status` que só os 5 arquivos entraram.

### Etapa 2 — Lote B (Configuração)

```bash
git fetch origin
git worktree add -b release/lote-b-config ../mg-lote-b origin/main

cd ../mg-lote-b
git cherry-pick bcf8fae    # Vite fix
git cherry-pick 3d875f6    # configs
git cherry-pick 38a1a7b    # .gitignore
git cherry-pick e7343cb    # npm audit

npm ci
npm test                    # backend
cd frontend && npm run build && cd ..

git push -u origin release/lote-b-config

cd /c/MultGestor.v2
git worktree remove ../mg-lote-b
```

**Conflito:** `e7343cb` × `3d875f6` em `package-lock.json` → aceitar o do audit fix

### Etapa 3 — Lote C (JoeFelipe Agent)

```bash
git fetch origin
git worktree add -b release/lote-c-joefelipe-agent ../mg-lote-c origin/main

cd ../mg-lote-c
git cherry-pick 84ea895     # execution core (108 arquivos)

# Verificar: package.json raiz não quebra; .env.example sem credenciais; CI ok

git push -u origin release/lote-c-joefelipe-agent

cd /c/MultGestor.v2
git worktree remove ../mg-lote-c
```

**Conflito:** Nenhum (108 arquivos em `tools/joefelipe-agent/`)

### Etapa 4 — Lote D (IA) — GATE REFORÇADO

```bash
git fetch origin
git worktree add -b release/lote-d-ia-operacional ../mg-lote-d origin/main

cd ../mg-lote-d
git cherry-pick da28176     # IA backend (services, routes, migration, tests)
git cherry-pick c286560     # IA integração (server.js, env, events)
git cherry-pick 3bc90e4     # IA frontend (AiInsightsCard)

cd backend && npm test && cd ..
cd frontend && npm run build && cd ..
# Migration 031: idempotente? backward-compatible? registrada?
# LLM_PROVIDER=mock funciona sem API key? Rotas respondem? RLS ok?

git push -u origin release/lote-d-ia-operacional

cd /c/MultGestor.v2
git worktree remove ../mg-lote-d
```

**Conflito:** `c286560` × `e7343cb` em `backend/package-lock.json`
**⚠️ É deploy de produção** — migration 031 + rotas + componente frontend

### Etapa 5 — Merge dos PRs (ordem)

```
Lote A → review → merge
Lote B → review → CI → merge
Lote C → review → CI → merge
Lote D → review → CI → testes → migration → gate reforçado → merge
```

### Etapa 6 — Reconciliar a main local com origin/main (NOVA)

```bash
# Só APÓS todos os 4 PRs mergeados no origin/main.
git fetch origin

# Conferir que o conteúdo dos 14 commits (com SHAs novos via cherry-pick) e os
# docs do ciclo já estão em origin/main:
git log --oneline origin/main | head -30

# A main local ainda tem os 14 commits ORIGINAIS (SHAs antigos) — agora redundantes.
# Reconciliar alinhando a main local ao origin/main (verdade publicada):
git checkout main            # já estamos nela; explícito por segurança
git status --short           # revisar; não deve haver trabalho não salvo relevante

# DECISÃO HUMANA (destrutivo — requer autorização explícita):
#   git reset --hard origin/main
#
# Efeito: main local == origin/main. Os 14 SHAs antigos são descartados
# (o conteúdo equivalente já está publicado). Os docs do ciclo permanecem
# (foram publicados via Lote A). Divergência main/origin RESOLVIDA.
#
# Untracked que não foram para nenhum lote (.opencode/plans/*, .obsidian/)
# NÃO são afetados por reset --hard (permanecem no disco).
```

> **Atenção:** `git reset --hard` é destrutivo. Só executar com autorização humana explícita e após confirmar (via `git log`/diff) que **todo** o conteúdo dos 14 commits e dos docs do ciclo está em `origin/main`. Guardar o ponto de partida antes: a tag/branch de segurança da Etapa de rollback.

---

## 7. TRATAMENTO DO COMMIT DE MERGE

```
f15b77c — Merge branch 'main' of https://github.com/JoeGestorpro/multgestorapp
```
Pais `bcf8fae` × `94aa679`; conteúdo = 9 arquivos de backup-restore **já em origin/main**; `behind=0`. **Decisão:** ignorar; nenhum cherry-pick.

---

## 8. MATRIZ DE RISCO POR LOTE

| Lote | Commits | Risco | Deploy? | Gate |
|---|---|---|---|---|
| **A** | 5 docs + docs do ciclo | Mínimo | Sim (rebuild inócuo) | PR + review |
| **B** | 4 config | Baixo | Sim (rebuild inócuo) | PR + review + CI |
| **C** | 1 agent | Baixo | Sim (rebuild inócuo) | PR + review + CI |
| **D** | 3 IA | Médio-Alto | **Sim (produção real)** | PR + review + CI + testes + migration + gate reforçado |
| **Etapa 6** | reconciliação | Médio (`reset --hard`) | Não | **Autorização humana explícita** |

---

## 9. CRITÉRIOS DE APROVAÇÃO POR PR

### Lote A
- [ ] Links do Obsidian apontam para arquivos existentes
- [ ] Nenhum arquivo perdido na reorganização
- [ ] `00-HOME.md` funcional · `MAPA-DAS-PASTAS.md` reflete a estrutura real
- [ ] Os **5 docs do ciclo** entraram (e só eles, além dos 5 commits)

### Lote B
- [ ] `npm ci` sem erros · `npm test` (backend) · `npm run build` (frontend)
- [ ] `.gitignore` não exclui nada importante · scripts do `package.json` funcionam
- [ ] `npm audit` = 0 high

### Lote C
- [ ] `tools/joefelipe-agent/package.json` válido · `.env.example` sem credenciais
- [ ] Scripts do `package.json` raiz funcionam · CI não falha por dependências

### Lote D — GATE REFORÇADO
- [ ] Migration 031: idempotente, backward-compatible, registrada
- [ ] `npm test` (backend) · `npm run build` (frontend)
- [ ] `/api/barber/ai/insights` responde (mock) · RLS (tenant isolation) ok
- [ ] `LLM_PROVIDER=mock` funciona sem API keys · rate limiting configurado
- [ ] Rollout: migration → backend → smoke → frontend
- [ ] **Aprovação humana explícita para deploy de produção**

### Etapa 6
- [ ] Todo o conteúdo dos 14 commits está em `origin/main`
- [ ] Os docs do ciclo estão em `origin/main` (via Lote A)
- [ ] Ponto de segurança guardado antes do `reset --hard`
- [ ] Autorização humana explícita

---

## 10. ROLLBACK

### Antes de começar (recomendado)
```bash
# Marcador do estado atual da main local (não publica nada)
git tag backup/pre-release-14-commits e7343cb
```

### Se um PR for rejeitado
```bash
git worktree remove ../mg-lote-X
git branch -D release/lote-X-...
```

### Se um PR quebrar após merge
```bash
git fetch origin
git revert -m 1 <merge-commit-sha>   # na branch de origin via novo PR/commit autorizado
```

### Se precisar do estado original da main
```bash
git reset --hard backup/pre-release-14-commits   # volta aos 14 commits originais
```

---

## 11. O QUE NÃO FAZER

- [ ] NÃO `git push origin main` direto
- [ ] NÃO squash dos 14 commits
- [ ] NÃO rebase interativo
- [ ] NÃO `git stash` (proibido pelo CLAUDE.md)
- [ ] NÃO `git checkout -b` como automação (proibido pelo CLAUDE.md)
- [ ] NÃO commitar os docs do ciclo na main local (vão pelo Lote A)
- [ ] NÃO `git reset --hard` na Etapa 6 sem autorização humana e sem confirmar publicação
- [ ] NÃO aplicar migration manualmente antes de entender o pipeline
- [ ] NÃO configurar produção nesta etapa
- [ ] NÃO executar nenhum comando — esta é uma fase de planejamento

---

## 12. NOMENCLATURA

| Termo | Definição |
|---|---|
| **Fase arquitetural 6** | Pagamento, assinatura e entitlement (Mapa Mestre) |
| **Missão de release** | `release/push-p0-batch` — publicação controlada |
| **Lote A** | Documentação, `.opencodex`, governança **+ docs do ciclo** |
| **Lote B** | Configuração, Vite, `.gitignore`, npm audit |
| **Lote C** | JoeFelipe Agent |
| **Lote D** | IA operacional (deploy de produção real) |
| **Etapa 6** | Reconciliação da main local com `origin/main` |
