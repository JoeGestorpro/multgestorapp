# GATE 1 — INVENTÁRIO DO OPENCODEX

**Data:** 2026-07-20
**Missão:** MISSÃO 0 — GOVERNANÇA DO OPENCODEX
**Dependência:** Gate 0 concluído
**Nenhuma alteração em `.opencodex/` foi executada.**

---

## 1. Estatísticas gerais

| Métrica | Valor |
|---------|-------|
| Total de arquivos | **417** |
| Total de diretórios | **112** |
| Arquivos `.md` | **400** (95,9%) |
| Arquivos `.json` | **16** (3,8%) |
| Arquivos `.canvas` | **1** (0,2%) |
| README.md | **14** |

### Distribuição por profundidade

| Nível | Diretórios | Exemplos |
|-------|-----------|----------|
| Raiz (.opencodex/) | — | 00-HOME.md, ATLAS.md, etc. |
| Nível 1 | 19 | agents/, areas/, auditorias/, brain/, etc. |
| Nível 2 | 32 | areas/operacao/, projetos/multgestor/, etc. |
| Nível 3 | 41 | areas/operacao/ops/playbooks/, etc. |
| Nível 4 | 15 | chatJoe/projetos/ideias/auditorias/, etc. |
| Nível 5 | 5 | projetos/multgestor/roadmap/roadmap/ |

---

## 2. Inventário por diretório

### Raiz (26 arquivos)

| Arquivo | Bytes | Tipo | Status |
|---------|-------|------|--------|
| `00-HOME.md` | 1.434 | Navegação | ✅ Porta de entrada real |
| `01-MAPA-GERAL.md` | 1.920 | Navegação | ✅ Mapa da reorganização |
| `02-COMO-USAR.md` | 1.020 | Navegação | 🟡 Órfão (não referenciado) |
| `ATLAS.md` | 3.474 | Constituição | 🟡 Órfão (não referenciado na raiz) |
| `Backend - Indice.md` | — | Índice | ✅ Referenciado |
| `Banco de Dados - Indice.md` | — | Índice | ✅ Referenciado |
| `BarberGestor - HOME.md` | — | Nicho | ✅ Referenciado |
| `Base de Conhecimento.md` | 1.654 | Canônico | ✅ Referenciado |
| `Billing e Pagamentos - Indice.md` | — | Índice | ✅ Referenciado |
| `chatJoe.md` | **0** | Placeholder | 🔴 **VAZIO** |
| `CONVENCOES.md` | 3.290 | Constituição | 🟡 Órfão |
| `Deploy e Producao - Indice.md` | — | Índice | ✅ Referenciado |
| `Diario do Projeto.md` | — | Canônico | 🟡 Órfão |
| `FLUXOS.md` | 3.362 | Constituição | 🔴 **ÓRFÃO + 21 links quebrados** |
| `Frontend - Indice.md` | — | Índice | ✅ Referenciado |
| `GLOSSARIO.md` | 4.116 | Constituição | 🟡 Órfão |
| `Governanca-Documental.md` | 2.828 | Constituição | ✅ Referenciado |
| `HOME.md` | **21** | Placeholder | 🔴 **Placeholder vazio + conflito** |
| `MAPA-DAS-PASTAS.md` | 2.655 | Navegação | 🟡 Órfão |
| `MultCriativos - HOME.md` | — | Nicho | ✅ Referenciado |
| `Segundo Cerebro.md` | — | Canônico | 🟡 Órfão |
| `Seguranca - Indice.md` | — | Índice | ✅ Referenciado |
| `Sem titulo.canvas` | — | Rascunho | 🟡 Solto na raiz |
| `Sem titulo.md` | **0** | Rascunho | 🔴 **VAZIO** |

### agents/ (2 arquivos)

| Arquivo | Bytes | Status |
|---------|-------|--------|
| `joefelipe-agent.md` | **0** | 🔴 **VAZIO** (versão real em projetos/joefelipe-agent/) |
| `joefelipe-personal-operating-agent.md` | **0** | 🔴 **VAZIO** |

### areas/ (55 arquivos em 13 subdiretórios)

| Subpasta | Arquivos | Tamanho total |
|----------|----------|--------------|
| `governanca/` | 1 | ~3 KB |
| `operacao/` | 17 | ~120 KB |
| `operacao/instrucoes-humanas/` | 3 | ~25 KB |
| `operacao/ops/` | 7 | ~20 KB |
| `operacao/runbooks/` | 5 | ~75 KB |
| `produto-roadmap/` | 31 | ~60 KB |
| `produto-roadmap/digital-twin/` | 7 | ~15 KB |
| `produto-roadmap/feature-genome/` | 4 | ~8 KB |
| `produto-roadmap/impact-graph/` | 5 | ~10 KB |
| `produto-roadmap/prds/` | 2 | ~4 KB |
| `produto-roadmap/simulation-center/` | 5 | ~10 KB |
| `seguranca/` | 1 | ~4 KB |

### auditorias/ (22 arquivos em 2 subdiretórios)

| Subpasta | Arquivos | Período | Tamanho total |
|----------|----------|---------|--------------|
| `joefelipe-agent/` | 3 | 2026-06-19 a 2026-07-05 | ~55 KB |
| `multgestor/` | 19 | 2026-06-15 a 2026-07-20 | ~300 KB |

### brain/ (5 arquivos em 2 subdiretórios)

| Caminho | Bytes | Status |
|---------|-------|--------|
| `fila-de-implementacao.md` | ~3 KB | ✅ Único arquivo real |
| `plans/OPS-MIGRATIONS-03-plano.md` | ~16 KB | Plano |
| `plans/OPS-MIGRATIONS-03D-plano.md` | ~24 KB | Plano |
| `plans/PLANO-IA-OPERACIONAL-NICHOS.md` | ~10 KB | Plano |
| `plans/push-p0-batch-plano.md` | — | Plano |

**Nota:** `brain/` deveria conter ~20+ arquivos segundo os docs de navegação.
Foi esvaziado na reorganização. Apenas planos ativos permanecem.

### chatJoe/ (30+ arquivos em 15 subdiretórios)

Maior estrutura de projeto, abrangendo:

| Subpasta | Função |
|----------|--------|
| `raiz` | README, comandos, fluxo, inbox, roteador, ideias pendentes |
| `agentes/` | Registry |
| `compactacoes/` | Modelo de compactação |
| `executor/` | Checklists pré/pós execução |
| `memoria/` | Decisões, preferências, regras |
| `missoes/` | 8 modelos de missão |
| `skillgate/` | Matriz de agentes e skills |
| `skills/` | Registry de skills |
| `projetos/ideias/` + 3 | Projeto ativo com contexto, decisões, roadmap |
| `projetos/instrutor-gerador-de-nichos/` + 3 | Projeto ativo |
| `projetos/organizacao-obsidian/` + 3 | Projeto ativo |
| `projetos/_template/` + 3 | Template de projeto |

### decisoes/ (6 arquivos)

| Arquivo | Conteúdo |
|---------|----------|
| `visao-geral.md` | Hub de ADRs |
| `MODELO-DECISAO.md` | Template |
| `DECISION-GRAPH.md` | Grafo |
| `decisoes-arquiteturais.md` | Decisões |
| `D-015-*` a `D-017-*` | ADRs específicas |

### handoff/ (6 arquivos)

`context-pack/` — PACK-00 a PACK-05. ~30 KB total.

### maps/ (1 arquivo)

| Caminho | Bytes | Status |
|---------|-------|--------|
| `multgestor-core/MAPA-MULTGESTOR-CORE.md` | **0** | 🔴 **VAZIO** (cópia em projetos/multgestor/mapas/ tem 2.170 bytes) |

### Nichos/ (6 arquivos)

Template e instrutor de nichos. ~25 KB total.

### projetos/ (138+ arquivos em 20+ subdiretórios)

| Projeto | Arquivos | Tamanho |
|---------|----------|---------|
| `joefelipe-agent/` | 5 | ~45 KB |
| `multgestor/` | **133** | **~1.2 MB** |

**projetos/multgestor/ é o maior diretório do OpenCodex:**
- 36 arquivos na raiz (arquitetura, banco, backend, etc.)
- 13 agentes
- 2 histórico
- 9 incidentes
- 16 living-os (decisões, gates, riscos, scorecards)
- 55 mapas (capabilities, core, decisions, flows, infra, nichos, segurança)
- 7 nichos
- 5 roadmap

### prompts/ (18 arquivos em 12 subpastas)

| Subpasta | Qtd | Função |
|----------|-----|--------|
| Raiz | 2 | Visão geral, product |
| arquitetura/ a qa/ (10) | 10 | Prompts por área |
| executor/ | 5 | Prompts de execução/governança |

### queue/ (6+ arquivos)

Fila operacional ativa: backlog, current-task, next-task, completed-tasks.

### rules/ (3 arquivos)

| Arquivo | Conteúdo |
|---------|----------|
| `auditor-flow.md` | Fluxo de auditoria |
| `event-contracts.md` | Contratos de eventos |
| `route-protection-abuse-control.md` | Proteção de rotas |

### _inbox/ (14+ arquivos)

| Subpasta | Qtd | Status |
|----------|-----|--------|
| `revisar/` | 8 | 🟡 Conteúdo não processado |
| `antigos/` | 6 | 🔴 Histórico congelado |
| `antigos/segundo cerebro/` | 4+ | 🔴 Obsidian config |

---

## 3. Placeholders e arquivos vazios

| Arquivo | Bytes | Problema |
|---------|-------|----------|
| `HOME.md` | 21 | Conteúdo: "C:\Users\Joefe". Citado como porta de entrada |
| `chatJoe.md` | 0 | **Vazio** — solto na raiz |
| `Sem titulo.md` | 0 | **Vazio** — rascunho esquecido |
| `agents/joefelipe-agent.md` | 0 | **Vazio** — versão real em projetos/ |
| `agents/joefelipe-personal-operating-agent.md` | 0 | **Vazio** |
| `living-os/riscos/riscos-ativos.md` | 0 | **Vazio** |
| `maps/multgestor-core/MAPA-MULTGESTOR-CORE.md` | 0 | **Vazio** — duplicata |
| `projetos/multgestor/roadmap/capacidades.md` | 0 | **Vazio** |
| `projetos/multgestor/roadmap/roadmap/ROADMAP-MESTRE-MULTGESTOR-2026.md` | 0 | **Vazio** — duplicata |
| `prompts/product.md` | 0 | **Vazio** |

**Total: 10 arquivos vazios ou placeholder (2,5% do total de .md).**

---

## 4. Nomes repetidos

### Arquivos com mesmo nome em locais diferentes (23 grupos)

| Nome | Ocorrências | Locais | Risco |
|------|-------------|--------|-------|
| `visao-geral.md` | **37** | ~37 pastas | 🟡 Padrão consistente mas polui navegação |
| `README.md` | **14** | chatJoe/ e subpastas | 🟡 11 são placeholders de template |
| `roadmap.md` | **6** | áreas/, chatJoe/ | 🟡 Conteúdos diferentes |
| `agentes.md`, `contexto.md`, `decisoes.md`, `objetivo.md`, `riscos.md`, `skills.md` | 4 cada | chatJoe/projetos/*/ | 🟡 Template replicado |
| `app.json`, `appearance.json`, `core-plugins.json`, `graph.json`, `workspace.json` | 3 cada | .obsidian/ (3 vaults) | ✅ Esperado (config) |
| `MAPA-MULTGESTOR-CORE.md` | 2 | maps/ (vazio) + projetos/mapas/ (2KB) | 🔴 **Duplicata com uma vazia** |
| `ROADMAP-MESTRE-MULTGESTOR-2026.md` | 2 | roadmap/ (44KB) + roadmap/roadmap/ (vazio) | 🔴 **Duplicata com uma vazia** |
| `capacidades.md` | 2 | raiz (10KB) + roadmap/ (vazio) | 🔴 **Duplicata com uma vazia** |
| `barbergestor.md`, `autogestor.md`, `climagestor.md`, `petgestor.md` | 2 cada | digital-twin/ + mapas/nichos/ | 🟡 Conteúdo diferente |
| `rotacao-segredos.md` | 2 | areas/seguranca/ + mapas/seguranca/ | 🟡 Conteúdo diferente |
| `arquitetura.md`, `inicio.md` | 2 | joefelipe-agent/ + multgestor/ | ✅ Esperado (projetos diferentes) |
| `backend.md`, `ci-cd.md`, `frontend.md`, `seguranca.md` | 2-3 | raiz + mapas/core ou infra | 🟡 Sobreposição |
| `joefelipe-agent.md` | 2 | agents/ (vazio) + projetos/agentes/ (1KB) | 🔴 **Duplicata com uma vazia** |
| `FLUXOS.md` | 2 | raiz (3KB) + produto-roadmap/ (2KB) | 🟡 Nomes iguais, conteúdos diferentes |
| `riscos-ativos.md` | 2 | living-os/ (vazio) + projetos/living-os/ (6KB) | 🔴 **Duplicata com uma vazia** |

---

## 5. Arquivos grandes (>10KB)

| Tamanho | Arquivo | Assunto |
|---------|---------|---------|
| 72,5 KB | `projetos/multgestor/matriz-consolidacao-core.md` | Core |
| 43,3 KB | `projetos/multgestor/roadmap/ROADMAP-MESTRE-MULTGESTOR-2026.md` | Roadmap |
| 41,5 KB | `projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md` | Roadmap |
| 31,4 KB | `auditorias/multgestor/auditoria-completa-2026-06-18.md` | Auditoria |
| 28 KB | `auditorias/joefelipe-agent/AUDITORIA-AGENTE-*.md` | Auditoria |
| 27,5 KB | `auditorias/multgestor/2026-07-03-core-vs-nicho-auditoria.md` | Auditoria |
| 24,6 KB | `queue/backlog.md` | Fila |
| 24,5 KB | `auditorias/multgestor/2026-07-03-diligencia-devida.md` | Auditoria |
| 24 KB | `auditorias/multgestor/2026-07-10-lote-a-wikilink-debt.md` | Auditoria |
| 24 KB | `brain/plans/OPS-MIGRATIONS-03D-plano.md` | Plano |

**Total de arquivos >10KB: 39 (9,8% dos .md).**
**Maior concentração: auditorias/ (10 arquivos) e projetos/multgestor/ (12 arquivos).**

---

## 6. Comparação docs de navegação x estrutura real

### ATLAS.md declara, mas não existe:

| Declarado | Realidade |
|-----------|----------|
| `brain/constitution.md` | ❌ **Não existe** |
| `brain/constitution-knowledge-os.md` | ❌ Está em `_inbox/revisar/` |
| `audits/` | ❌ Deveria ser `auditorias/` |
| `archive/` | ❌ Deveria ser `_inbox/antigos/` |
| `state/` | ❌ **Não existe** |

### FLUXOS.md declara, mas não existe:

| Declarado | Realidade |
|-----------|----------|
| `HOME.md` (como porta de entrada) | ⚠️ Existe mas é placeholder vazio |
| `brain/00-HOME.md` | ❌ |
| `brain/INDEX.md` | ❌ |
| `brain/01-CURRENT-STATE.md` | ❌ |
| `brain/product/README.md` | ❌ |
| `brain/agents/README.md` | ❌ |
| `brain/technical/README.md` | ❌ |
| `brain/KNOWLEDGE-GRAPH.md` | ❌ |
| `audits/` (6x) | ❌ |

### CONVENCOES.md declara, mas não existe:

| Declarado | Realidade |
|-----------|----------|
| `brain/INDEX.md` | ❌ |
| `brain/decisions/TEMPLATE-DECISION.md` | ❌ (ADRs estão em `decisoes/`) |
| `audits/` | ❌ |

### MAPA-DAS-PASTAS.md declara, mas não existe:

| Declarado | Realidade |
|-----------|----------|
| `audits/` | ❌ |
| `archive/` | ❌ |
| `state/` | ❌ |
| `segundo cerebro/` | ❌ (está em `_inbox/antigos/segundo cerebro/`) |
| `brain/01-CURRENT-STATE.md` | ❌ |

---

## 7. Diretórios que perderam função

| Diretório | Status | Motivo |
|-----------|--------|--------|
| `brain/` | 🟡 Parcial | Foi esvaziado na reorganização. Só tem planos ativos. Docs de navegação ainda apontam para cá |
| `maps/multgestor-core/` | 🔴 Obsoleto | Contém 1 arquivo vazio. Conteúdo real está em `projetos/multgestor/mapas/` |
| `living-os/riscos/` | 🔴 Obsoleto | Arquivo vazio. Versão real em `projetos/multgestor/living-os/riscos/` |
| `ops/` | 🟡 Parcial | Apenas 1 arquivo (`playbooks.md`). Conteúdo operacional real está em `areas/operacao/` |
| `_inbox/antigos/` | 🔴 Congelado | Material histórico do "segundo cerebro" do Obsidian. Mantido como referência |

---

## 8. Resumo estatístico consolidado

| Categoria | Quantidade |
|-----------|-----------|
| Total de arquivos | 417 |
| Total de diretórios | 112 |
| Arquivos .md | 400 |
| Arquivos vazios (0 bytes) | 5 |
| Placeholders (<50 bytes) | 5 |
| Arquivos grandes (>10KB) | 39 (9,8%) |
| README.md | 14 |
| Nomes repetidos (grupos) | 23 |
| `visao-geral.md` | 37 ocorrências |
| Diretórios obsoletos | 4 |
| Links quebrados nos docs de navegação | ~34 (Gate 0) |
| Docs de navegação órfãos | 7 |
| Arquitetura documental definida | ✅ Sim (8 canônicos + 4 níveis) |

---

## 9. Recomendações para o Gate 2

1. **Classificar os 400 .md nos 4 níveis** (Constituição/Arquitetura/Operação/Histórico)
2. **Agrupar por assunto** usando os 12 temas definidos
3. **Atenção especial** aos 10 arquivos vazios — decidir se excluir ou preencher
4. **Resolver as 23 duplicações de nome** — especialmente MAPA-MULTGESTOR-CORE, ROADMAP-MESTRE, capacidades.md
5. **Validar se os 37 `visao-geral.md`** são um padrão desejado ou ruído

---

```
GATE_1_STATUS: CONCLUIDO
ALTERACOES_OPENCODEX: NAO_EXECUTADAS
PROXIMO_GATE: G2_AGUARDANDO_AUTORIZACAO
```
