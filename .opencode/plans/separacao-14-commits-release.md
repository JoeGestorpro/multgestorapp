# Plano de Separação dos 14 Commits em Branches de Release

> **Data:** 2026-07-16
> **Status:** PLANEJAMENTO — NÃO EXECUTAR
> **Objetivo:** Separar os 14 commits em branches limpas, sem reescrever ou perder o estado atual

---

## 1. ESTADO ATUAL DO GIT

```
HEAD (main local): e7343cb
origin/main:       94aa679
Ahead: 14 commits
Behind: 0 commits
Working dir: 4 arquivos modificados + 6 untracked
Stashes: 2
```

### Grafo dos 14 commits (antigo → novo)

```
e661259 ← origin/main (94aa679)
    │
b03b808  docs(handoff) ............... SEGURO
84ea895  feat(joefelipe-agent) ....... SEGURO
ab3fcee  chore(.opencodex sync) ...... SEGURO
c835c3c  feat(.opencodex reorg) ...... SEGURO
19673be  feat(governança docs) ....... SEGURO
bcf8fae  fix(Vite port) .............. SEGURO
    │
f15b77c  Merge origin/main ← JÁ ESTÁ NO ORIGIN (pode ignorar)
    │
b3095f8  docs(.opencodex pt-br) ...... SEGURO
    │
da28176  feat(IA backend) ............ IA ⚠️
3bc90e4  feat(IA frontend) ........... IA ⚠️
    │
3d875f6  chore(configs) .............. SEGURO
c286560  feat(IA integration) ........ IA ⚠️
    │
38a1a7b  chore(.gitignore) .......... SEGURO
e7343cb  fix(npm audit) .............. SEGURO
```

### Análise do merge `f15b77c`

```
Pais 1 (local):  bcf8fae
Pais 2 (remote): 94aa679 (origin/main)
```

Conteúdo que "trouxe" do remote (9 arquivos):
- `.gitignore`, `backend/package.json`, `backend/scripts/backup-restore-check.js`
- `backend/tests/unit/backup-restore-check.test.js`, `docs/runbooks/backup-restore-check.md`
- `ops/backup/*.ps1` (4 scripts)

**Conclusão:** Esses 9 arquivos já existem em `origin/main`. O merge apenas reconciliou histórias. **O commit `f15b77c` pode ser ignorado** — não adiciona conteúdo novo.

---

## 2. MAPEAMENTO: COMMIT × ARQUIVOS × ÁREA

| # | Commit | Arquivos tocados | Área de código | Conflita com IA? |
|---|---|---|---|---|
| 1 | `b03b808` | `handoff/context-pack/` (6) | Docs | Não |
| 2 | `84ea895` | `tools/joefelipe-agent/` (108) | Agente | Não |
| 3 | `ab3fcee` | `.opencodex/` (~40 renames) | Conhecimento | Não |
| 4 | `c835c3c` | `.opencodex/` (~260) | Conhecimento | Não |
| 5 | `19673be` | `Governanca-Documental.md` + docs (9) | Governança | Não |
| 6 | `bcf8fae` | `frontend/vite.config.js` (2) | Frontend | **Verificar** |
| 7 | `f15b77c` | Merge (9 do remote) | — | **Ignorar** |
| 8 | `b3095f8` | `.opencodex/` (~226 renames) | Conhecimento | Não |
| 9 | `da28176` | `backend/src/services/llm/` + tests (22) | IA Backend | É IA |
| 10 | `3bc90e4` | `frontend/AiInsightsCard.jsx` (3) | IA Frontend | É IA |
| 11 | `3d875f6` | `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, `package.json`, plans (9) | Config | Não |
| 12 | `c286560` | `backend/src/server.js`, routes, env (5) | IA Integração | É IA |
| 13 | `38a1a7b` | `.gitignore` (1) | Config | Não |
| 14 | `e7343cb` | `backend/package-lock.json` (1) | Deps | Não |

### Verificação de conflito: `bcf8fae` vs IA

`bcf8fae` toca `frontend/vite.config.js`.
`3bc90e4` (IA frontend) toca `frontend/src/features/barber/dashboard/`.

**Mesmo diretório (`frontend/`), mas arquivos diferentes.** Sem conflito de cherry-pick.

---

## 3. CLASSIFICAÇÃO CORRIGIDA

### Terminologia

| Termo | Definição |
|---|---|
| **Fase arquitetural 6** | Pagamento, assinatura e entitlement (Mapa Mestre) |
| **Missão de release** | `release/push-p0-batch` — publicação controlada |
| **Commits seguros** | 11 commits sem dependência de IA, sem código de produto |
| **Commits de IA** | 3 commits da cadeia de IA operacional |

### Lote A — Documentação, Conhecimento e Governança (5 commits)

| Commit | Descrição | Risco |
|---|---|---|
| `b03b808` | Context pack para Claude | Mínimo |
| `ab3fcee` | Sync .opencodex | Mínimo |
| `c835c3c` | Reorg .opencodex por projetos | Mínimo |
| `19673be` | Governança documental | Mínimo |
| `b3095f8` | Reorg .opencodex inglês→português | Mínimo |

**Critério de aprovação:** Verificar que links internos do Obsidian não quebraram.

### Lote B — Configuração e Manutenção (4 commits)

| Commit | Descrição | Risco | Pré-requisito |
|---|---|---|---|
| `bcf8fae` | Vite port + ESLint 9 | Baixo | `npm run build` no frontend |
| `3d875f6` | Configs, docs, planos | Baixo | Verificar `package.json` não quebra scripts |
| `38a1a7b` | .gitignore | Mínimo | Verificar nada importante excluído |
| `e7343cb` | npm audit fix | Baixo | `npm ci` + testes + build |

**Critério de aprovação:** `npm ci && npm test && npm run build` passam.

### Lote C — JoeFelipe Agent (1 commit)

| Commit | Descrição | Risco | Pré-requisito |
|---|---|---|---|
| `84ea895` | Execution core + LLM (108 arquivos) | Baixo | Verificar: scripts no `package.json` raiz, CI, dependências, `.env.example` |

**Critério de aprovação:**
- `package.json` raiz não quebra com a pasta `tools/joefelipe-agent/`
- `.env.example` não expõe credenciais
- Não há `console.log` com dados sensíveis
- CI não falha por falta de dependências

### Lote D — IA Operacional (3 commits, encadeados)

| Commit | Descrição | Risco | Pré-requisito |
|---|---|---|---|
| `da28176` | IA backend (services, controller, routes, migration, tests) | Médio-Alto | Migration 031 aplicável, testes passam |
| `c286560` | IA integração (server.js, env, eventos) | Médio | Depende de `da28176` |
| `3bc90e4` | IA frontend (AiInsightsCard) | Médio | Depende de `c286560` |

**Ordem de cherry-pick (obrigatória):**
```
da28176 → c286560 → 3bc90e4
```

**Critério de aprovação:**
1. Migration 031: idempotente? backward-compatible? registrada no banco?
2. Env vars: `LLM_PROVIDER=mock` funciona sem API keys?
3. Backend: `npm test` passa
4. Frontend: `npm run build` passa
5. Rotas: `/api/barber/ai/insights` responde
6. RLS: tenant isolation funciona
7. Rollout: migration → backend → smoke → frontend

---

## 4. ESTRATÉGIA ESCOLHIDA

**Cherry-pick em branch limpa, com PRs separados por lote.**

### Por que não push direto
- Commits de IA estão intercalados com commits seguros
- `git push origin main` publicaria todos os 14
- Não há como isolar publicações com push direto

### Por que não rebase interativo
- Alterações não commitadas no working tree
- Merge commit `f15b77c` complica o rebase
- Risco de reescrever histórico referenciado em docs

### Por que não squash
- Mistura commits com dependências diferentes
- Apaga separação útil entre backend/integration/frontend da IA
- Dificulta comparar com auditorias anteriores

---

## 5. COMANDOS PROPOSTOS

### Etapa 1 — Congelar estado

```bash
# Registrar estado atual
git status --short
git branch --show-current
git rev-list --count origin/main..HEAD
git log --oneline --decorate origin/main..HEAD > /tmp/audit-14-commits.log

# Criar branch de segurança (backup local, não publica)
git branch backup/pre-release-14-commits

# Proteger alterações não commitadas
git stash push -m "wip-pre-release-separation"
```

### Etapa 2 — Branch de documentação (Lote A)

```bash
# Criar branch a partir de origin/main
git checkout -b release/lote-a-documentacao origin/main

# Cherry-pick dos commits seguros (respeitando ordem cronológica)
git cherry-pick b03b808    # handoff docs
git cherry-pick ab3fcee    # .opencodex sync
git cherry-pick c835c3c    # .opencodex reorg
git cherry-pick 19673be    # governança docs
git cherry-pick b3095f8    # .opencodex pt-br

# Verificar
git log --oneline origin/main..HEAD
# Deve mostrar 5 commits

# Push e PR
git push -u origin release/lote-a-documentacao
# Abrir PR: release/lote-a-documentacao → main
```

**Conflitos prováveis:** Nenhum (todos tocam `.opencodex/`, sem overlap com其他 lotes)

### Etapa 3 — Branch de configuração (Lote B)

```bash
git checkout -b release/lote-b-config origin/main

git cherry-pick bcf8fae    # Vite fix
git cherry-pick 3d875f6    # configs
git cherry-pick 38a1a7b    # .gitignore
git cherry-pick e7343cb    # npm audit

# Verificar
npm ci
npm test
npm run build

# Push e PR
git push -u origin release/lote-b-config
# Abrir PR: release/lote-b-config → main
```

**Conflitos prováveis:** Baixos. `e7343cb` (npm audit) pode conflitar com `3d875f6` (package.json) — resolver mantendo ambos.

### Etapa 4 — Branch do JoeFelipe Agent (Lote C)

```bash
git checkout -b release/lote-c-joefelipe-agent origin/main

git cherry-pick 84ea895    # execution core

# Verificar
node -e "require('./tools/joefelipe-agent/package.json')" 2>/dev/null && echo "OK"
# Verificar .env.example, scripts, CI

# Push e PR
git push -u origin release/lote-c-joefelipe-agent
# Abrir PR: release/lote-c-joefelipe-agent → main
```

**Conflitos prováveis:** Nenhum (108 arquivos todos em `tools/joefelipe-agent/`)

### Etapa 5 — Branch da IA (Lote D)

```bash
git checkout -b release/lote-d-ia-operacional origin/main

# ORDEM OBRIGATÓRIA: backend → integração → frontend
git cherry-pick da28176    # IA backend
git cherry-pick c286560    # IA integração
git cherry-pick 3bc90e4    # IA frontend

# Verificar
cd backend && npm test
cd ../frontend && npm run build

# Push e PR
git push -u origin release/lote-d-ia-operacional
# Abrir PR: release/lote-d-ia-operacional → main
```

**Conflitos prováveis:** Nenhum entre si. `c286560` pode conflitar com `e7343cb` em `backend/package-lock.json` — resolver aceitando o do audit fix.

### Etapa 6 — Voltar à branch original

```bash
# Voltar à branch principal
git checkout main

# Restaurar alterações não commitadas
git stash pop

# Verificar estado
git status
```

---

## 6. TRATAMENTO DO COMMIT DE MERGE

```
f15b77c — Merge branch 'main' of https://github.com/JoeGestorpro/multgestorapp
```

**Análise:**
- Pais: `bcf8fae` (local) × `94aa679` (origin/main)
- Conteúdo do remote: 9 arquivos de backup-restore
- Esses 9 arquivos já existem em `origin/main`

**Decisão:** Ignorar completamente. O merge apenas reconciliou histórias. Nenhum cherry-pick necessário.

---

## 7. TRATAMENTO DAS ALTERAÇÕES NÃO COMMITADAS

```
M  .opencodex/projetos/multgestor/indice.md
M  .opencodex/projetos/multgestor/status-atual.md
M  .opencodex/projetos/multgestor/roadmap/ROADMAP-MESTRE-MULTGESTOR-2026.md
M  .opencodex/projetos/multgestor/roadmap/ROADMAP-MULTGESTOR-AUDITORIA-ATUAL.md
?? .opencode/plans/execucao-reorganizacao-wikis.md
?? .opencode/plans/plano-reorganizacao-wikis.md
?? .opencodex/auditorias/multgestor/2026-07-10-auditoria-readonly-mapa-mestre.md
?? .opencodex/projetos/multgestor/roadmap/.obsidian/
?? .opencodex/projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md
?? .opencodex/projetos/multgestor/roadmap/capacidades.md
```

**Ação:** `git stash push -m "wip-pre-release-separation"` antes de qualquer troca de branch. Restaurar com `git stash pop` ao voltar à branch original.

**Decisão futura:** Essas alterações devem ser commitadas separadamente (não misturar com os 14 commits).

---

## 8. RISCOS E MITIGAÇÕES

| Risco | Mitigação |
|---|---|
| Conflito de cherry-pick entre lotes | Verificar overlap de arquivos antes de cada cherry-pick |
| `e7343cb` conflita com `3d875f6` em `package-lock.json` | Resolver aceitando o lockfile do audit fix |
| `c286560` conflita com `e7343cb` em `backend/package-lock.json` | Mesma resolução |
| Branch de IA precisa de migration antes de testar | Não testar rota sem migration; testar lógica isoladamente |
| CI pode falhar no Lote C (joefelipe-agent) | Verificar se CI builda `tools/` |
| PR pode ficar grande demais (Lote A: ~530 arquivos) | Dividir Lote A em 2 PRs se necessário |

---

## 9. ROLLBACK

### Se um PR for rejeitado
```bash
git checkout main
git branch -D release/lote-X-...
```

### Se um PR quebrar após merge
```bash
# Reverter o merge
git revert -m 1 <merge-commit-sha>
git push origin main
```

### Se a branch original for necessária
```bash
git checkout main
# A branch backup/pre-release-14-commits mantém o estado anterior
```

---

## 10. CRITÉRIOS DE APROVAÇÃO POR PR

### Lote A (Documentação)
- [ ] Todos os links do Obsidian apontam para arquivos existentes
- [ ] Nenhum arquivo foi perdido na reorganização
- [ ] `00-HOME.md` está funcional
- [ ] `MAPA-DAS-PASTAS.md` reflete a estrutura real

### Lote B (Configuração)
- [ ] `npm ci` não erros
- [ ] `npm test` passa (backend)
- [ ] `npm run build` passa (frontend)
- [ ] `.gitignore` não exclui arquivos necessários
- [ ] `package.json` scripts funcionam
- [ ] `npm audit` mostra 0 vulnerabilities high

### Lote C (JoeFelipe Agent)
- [ ] `tools/joefelipe-agent/package.json` é válido
- [ ] `.env.example` não expõe credenciais
- [ ] Scripts no `package.json` raiz funcionam
- [ ] CI não falha por dependências faltantes

### Lote D (IA)
- [ ] Migration 031: idempotente, backward-compatible, registrada
- [ ] `npm test` passa no backend
- [ ] `npm run build` passa no frontend
- [ ] `/api/barber/ai/insights` responde (com mock)
- [ ] RLS funciona (tenant isolation)
- [ ] `LLM_PROVIDER=mock` funciona sem API keys
- [ ] Rate limiting configurado
- [ ] Rollout: migration → backend → smoke → frontend

---

## 11. ORDEM DE PUBLICAÇÃO

```
1. Lote A (Documentação)  → PR → Review → Merge
   ↓
2. Lote B (Configuração)  → PR → Review → CI → Merge
   ↓
3. Lote C (Agent)         → PR → Review → CI → Merge
   ↓
4. Lote D (IA)            → PR → Review → CI → Testes → Merge
   ↓
5. Atualizar estado       → commit na main
   ↓
6. Preparar Fase 6 (Pagamento/Entitlement) — NÃO esta missão de release
```

> **Nota:** "Fase 6" = Pagamento, assinatura e entitlement (Mapa Mestre).
> A missão de publicação é `release/push-p0-batch` — conceito diferente.

---

## 12. O QUE NÃO FAZER

- [ ] NÃO fazer `git push origin main` direto
- [ ] NÃO fazer squash dos 14 commits
- [ ] NÃO fazer rebase interativo
- [ ] NÃO aplicar migration manualmente antes de entender o pipeline
- [ ] Não configurar produção nesta etapa
- [ ] NÃO executar push, commit, rebase, cherry-pick ou deploy — esta é uma fase de planejamento
