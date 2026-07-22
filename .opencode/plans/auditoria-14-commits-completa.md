# Auditoria dos 14 Commits Pendentes

> **Data:** 2026-07-16
> **Escopo:** Todos os commits entre `origin/main` e `HEAD`
> **Ordem cronológica (antigo → novo):** b03b808 → e7343cb

---

## MAPA COMPLETO DOS 14 COMMITS

| # | Commit | Área | Tipo | Arquivos | Linhas | Risco | Pode publicar sozinho? |
|---|---|---|---|---|---|---|---|
| 1 | `b03b808` | Documentação | Docs | 6 | +250 | Mínimo | Sim |
| 2 | `84ea895` | JoeFelipe Agent | Feature | 108 | +16.892 | Baixo | Sim |
| 3 | `ab3fcee` | Conhecimento (.opencodex) | Organização | ~40 | +0 (renames) | Mínimo | Sim |
| 4 | `c835c3c` | Conhecimento (.opencodex) | Organização | ~260 | +8.500 | Mínimo | Sim |
| 5 | `19673be` | Governança | Docs | 9 | +1.382 | Mínimo | Sim |
| 6 | `bcf8fae` | Frontend | Fix | 2 | +3 | Baixo | Sim |
| 7 | `f15b77c` | Infraestrutura | Merge | 9 | +1.438 | Baixo | Sim (já está no origin) |
| 8 | `b3095f8` | Conhecimento (.opencodex) | Docs/Org | ~226 | +3.200 | Mínimo | Sim |
| 9 | `da28176` | IA (Backend) | Feature | 22 | +2.039 | Médio-Alto | **NÃO** |
| 10 | `3bc90e4` | IA (Frontend) | Feature | 3 | +216 | Médio | **NÃO** |
| 11 | `3d875f6` | Configuração | Chore | 9 | +1.382 | Mínimo | Sim |
| 12 | `c286560` | IA (Integração) | Feature | 5 | +41 | Médio | **NÃO** |
| 13 | `38a1a7b` | Infraestrutura | Chore | 1 | +30 | Mínimo | Sim |
| 14 | `e7343cb` | Dependências | Fix | 1 | +1 | Baixo | Sim |

---

## ANÁLISE POR ÁREA

### 1. DOCUMENTAÇÃO / GOVERNANÇA (4 commits)

| Commit | Descrição | Dependências |
|---|---|---|
| `b03b808` | Cria `handoff/context-pack/` — 6 arquivos de contexto para Claude Code | Nenhuma |
| `19673be` | Cria `Governanca-Documental.md` + 8 documentos canônicos do vault | Nenhuma |
| `3d875f6` | Atualiza `AGENTS.md`, `CLAUDE.md`, `package.json`, cria planos de execução | Nenhuma |
| `38a1a7b` | Atualiza `.gitignore` — exclui scratch, debug, configs locais | Nenhuma |

**Resumo:** 4 commits de configuração e governance. Zero impacto funcional.
**Risco acumulado:** MÍNIMO

### 2. CONHECIMENTO (.opencodex) (3 commits)

| Commit | Descrição | Dependências |
|---|---|---|
| `ab3fcee` | Sincroniza edições preexistentes + fase 1 da reorganização | Nenhuma |
| `c835c3c` | Reorganiza `.opencodex/` por projetos e áreas (~260 arquivos) | `ab3fcee` (parcial) |
| `b3095f8` | Renomeia arquivos de inglês para português + cria `Nichos/` (~226 arquivos) | `c835c3c` |

**Resumo:** 3 commits de reorganização do vault de conhecimento. Zero impacto funcional.
**Risco acumulado:** MÍNIMO
**Dependência interna:** `ab3fcee` → `c835c3c` → `b3095f8` (encadeados, mas todos seguros)

### 3. INFRAESTRUTURA (2 commits)

| Commit | Descrição | Dependências |
|---|---|---|
| `f15b77c` | Merge do origin — backup-restore-check, scripts de backup | Nenhuma |
| `38a1a7b` | `.gitignore` — exclusão de scratch/debug | Nenhuma |

**Resumo:** Merge remoto + gitignore. Zero impacto funcional.
**Risco acumulado:** BAIXO

### 4. DEPENDÊNCIAS (1 commit)

| Commit | Descrição | Dependências |
|---|---|---|
| `e7343cb` | `npm audit fix` — 13 de 14 vulnerabilidades corrigidas | Nenhuma |

**Resumo:** Correção de segurança padrão.
**Risco acumulado:** BAIXO

### 5. JOEFELIPE AGENT (1 commit)

| Commit | Descrição | Dependências |
|---|---|---|
| `84ea895` | Execution core + LLM cost safety (108 arquivos TypeScript) | Nenhuma ao MultGestor |

**Resumo:** Ferramenta interna isolada em `tools/joefelipe-agent/`. Não afeta backend/frontend.
**Risco acumulado:** BAIXO (isolado)

### 6. IA OPERACIONAL (3 commits — CADEIA DEPENDENTE)

| Commit | Descrição | Dependências |
|---|---|---|
| `da28176` | Backend: LlmService, providers, wrappers, controller, rotas, migration, testes | Nenhuma (é a base) |
| `c286560` | Integração: registra rotas no `server.js`, env vars, evento, migration runner | **Depende de `da28176`** |
| `3bc90e4` | Frontend: AiInsightsCard.jsx, estilos, integração no dashboard | **Depende de `c286560`** |

**Resumo:** Feature completa de IA operacional em 3 commits encadeados.
**Risco acumulado:** MÉDIO-ALTO
**CADEIA:** `da28176` → `c286560` → `3bc90e4`

---

## DEPENDÊNCIAS ENTRE COMMITS

```
INDEPENDENTES (podem subir em qualquer ordem):
│
├── b03b808  (handoff docs)
├── 84ea895  (joefelipe-agent)
├── 19673be  (governança docs)
├── bcf8fae  (Vite fix)
├── f15b77c  (merge origin)
├── 3d875f6  (configs)
├── 38a1a7b  (.gitignore)
├── e7343cb  (npm audit)
│
├── ab3fcee  ──→ c835c3c ──→ b3095f8  (cadeia .opencodex, mas seguros)
│
└── da28176  ──→ c286560 ──→ 3bc90e4  (cadeia IA, RISCO)
```

---

## CLASSIFICAÇÃO FINAL

### PODEM SUBIR IMEDIATAMENTE (9 commits)

| Commit | Área | Justificativa |
|---|---|---|
| `b03b808` | Documentação | Apenas docs, sem impacto |
| `84ea895` | JoeFelipe Agent | Ferramenta interna isolada |
| `ab3fcee` | Conhecimento | Renames no .opencodex |
| `c835c3c` | Conhecimento | Reorg do .opencodex |
| `19673be` | Governança | Docs de governança |
| `bcf8fae` | Frontend | Fix mínimo (porta Vite) |
| `f15b77c` | Infraestrutura | Merge do origin |
| `b3095f8` | Conhecimento | Renames inglês→português |
| `3d875f6` | Configuração | Atualiza configs e planos |
| `38a1a7b` | Infraestrutura | .gitignore |
| `e7343cb` | Dependências | npm audit fix |

**Total: 11 commits** (note:some can be squashed into 3-4 commits lógicos)

### PRECISAM ESPERAR (0 commits diretos)

Nenhum commit é "inválido" — todos são legítimos. Mas a cadeia de IA precisa de preparo antes de publicar.

### PRECISAM DE AUDITORIA ADICIONAL (3 commits — cadeia IA)

| Commit | O que verificar | Urgência |
|---|---|---|
| `da28176` | Migration 031 aplicada? Testes passam? LLM mock funciona? | **ALTA** |
| `c286560` | Rotas registradas? Env vars no Render? Evento consumido? | **ALTA** |
| `3bc90e4` | Card renderiza? Lida com erro? XSS? | **MÉDIA** |

**Condição para publicar:** Migration 031 aplicada + env vars configuradas (ou `LLM_PROVIDER=mock`)

### PERTENCEM À FASE 6 (0 commits)

Nenhum dos 14 commits pertence à Fase 6 (release/push-p0-batch). Todos são de fases anteriores ou paralelas.

---

## RECOMENDAÇÃO DE PUBLICAÇÃO

### Opção A: Tudo de uma vez (14 commits)
- **Prós:** Simples, tudo sobe junto
- **Contras:** Se a cadeia de IA quebrar, precisa revert
- **Recomendação:** NÃO recomendado

### Opção B: Publicar em 3 lotes (RECOMENDADO)

#### Lote 1 — Seguro (pode subir AGORA)
**Commits:** b03b808, 84ea895, ab3fcee, c835c3c, 19673be, bcf8fae, f15b77c, b3095f8, 3d875f6, 38a1a7b, e7343cb
**Total:** 11 commits
**Risco:** MÍNIMO
**Ação:** Push direto

#### Lote 2 — IA Backend (precisa de preparo)
**Commits:** da28176, c286560
**Total:** 2 commits
**Risco:** MÉDIO
**Pré-requisitos:**
1. Aplicar migration 031 no Supabase
2. Configurar env vars no Render (ou confirmar `LLM_PROVIDER=mock`)
3. Rodar testes (`npm test` no backend)
4. Verificar que rotas respondem

#### Lote 3 — IA Frontend (depende do Lote 2)
**Commits:** 3bc90e4
**Total:** 1 commit
**Risco:** MÉDIO
**Pré-requisitos:**
1. Lote 2 publicado e funcionando
2. Frontend compila (`npm run build`)
3. Card renderiza com resposta da API

### Opção C: Separar docs de código
- **Lote 1a:** Documentação/governança (b03b808, 19673be, 3d875f6, 38a1a7b)
- **Lote 1b:** Conhecimento (.opencodex) (ab3fcee, c835c3c, b3095f8)
- **Lote 1c:** Infraestrutura (bcf8fae, f15b77c, 84ea895, e7343cb)
- **Lote 2:** IA (da28176, c286560, 3bc90e4)

**Recomendação:** Opção B (3 lotes) é o equilíbrio ideal entre segurança e simplicidade.

---

## CHECKLIST PRÉ-PUSH (Lote 1)

| # | Verificação | Status |
|---|---|---|
| 1 | Todos os arquivos do .opencodex são docs? | ✅ |
| 2 | .gitignore não exclui nada importante? | ✅ |
| 3 | package.json não quebra nada? | ✅ |
| 4 | vite.config.js compila? | ✅ |
| 5 | npm audit fix não remove dependência necessária? | ✅ |
| 6 | .mcp.json não expõe segredos? | ⚠️ Verificar |
| 7 | handoff/context-pack não expõe dados sensíveis? | ✅ |

## CHECKLIST PRÉ-PUSH (Lote 2 — IA)

| # | Verificação | Status |
|---|---|---|
| 1 | Migration 031 aplicada ao Supabase | ⚠️ PENDENTE |
| 2 | Env vars configuradas no Render | ⚠️ PENDENTE |
| 3 | `npm test` passa no backend | ⚠️ PENDENTE |
| 4 | Rotas `/api/barber/ai/*` respondem | ⚠️ PENDENTE |
| 5 | Tabela `ai_suggestions` existe no Supabase | ⚠️ PENDENTE |
| 6 | RLS funciona (tenant isolation) | ⚠️ PENDENTE |

## CHECKLIST PRÉ-PUSH (Lote 3 — Frontend IA)

| # | Verificação | Status |
|---|---|---|
| 1 | Lote 2 publicado e funcionando | ⚠️ PENDENTE |
| 2 | `npm run build` passa no frontend | ⚠️ PENDENTE |
| 3 | AiInsightsCard renderiza | ⚠️ PENDENTE |
| 4 | Lida com API erro/vazia | ⚠️ PENDENTE |
| 5 | Sem XSS | ✅ |

---

## SQUASH SUGERIDO

Se quiser reduzir o número de commits no histórico:

| Lote | Commits originais | Sugestão de squash |
|---|---|---|
| Docs | b03b808, 19673be | `docs: context pack + governança documental do vault` |
| Conhecimento | ab3fcee, c835c3c, b3095f8 | `chore: reorganizar .opencodex por projetos e idioma` |
| Config | 3d875f6, 38a1a7b | `chore: configs, gitignore e planos de execução` |
| Infra | bcf8fae, f15b77c | `fix: Vite port + merge backup-restore` |
| IA | da28176, c286560, 3bc90e4 | `feat: IA operacional — backend + integração + frontend` |
| Agent | 84ea895 | Manter (grande e isolado) |
| Deps | e7343cb | Manter (fix de segurança) |

**Resultado:** 7 commits em vez de 14
