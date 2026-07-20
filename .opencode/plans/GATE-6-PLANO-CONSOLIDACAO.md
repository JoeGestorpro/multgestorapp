# GATE 6 — PLANO DE CONSOLIDAÇÃO

**Data:** 2026-07-20
**Missão:** MISSÃO 0 — GOVERNANÇA DO OPENCODEX
**Dependência:** Gates 0-5 concluídos
**Nenhuma alteração em `.opencodex/` foi executada.**

---

## 0. Origem dos dados

Este plano consolida os achados dos Gates 0 a 5:

| Gate | Achados usados |
|------|----------------|
| G0 | 34 links quebrados, grafo documental, portas de entrada |
| G1 | 10 placeholders, 23 grupos de duplicatas, 417 arquivos |
| G2 | 4 níveis, 16 assuntos, 400 documentos classificados |
| G3 | 14 grupos de duplicidade analisados (6 cópias vazias) |
| G4 | 56+ conflitos (navegação, autoridade, estado, nomenclatura) |
| G5 | 38 fontes canônicas propostas (16 confirmadas, 16 condicionais) |

---

## 1. Estratégia

A consolidação será feita em **5 ondas**, cada uma com um objetivo específico.
Cada onda é independente e reversível. Nenhuma ação será executada sem
autorização separada.

```
Onda 1 — Navegação segura (links, índices, referências)
Onda 2 — Autoridade documental (Constituição, canônicos, hierarquia)
Onda 3 — Duplicidades e placeholders (cópias vazias, redirecionamentos)
Onda 4 — Arquitetura do MultGestor (preparação para Missão 1)
Onda 5 — Validação final (links, órfãos, git, fechamento)
```

---

## 2. ONDA 1 — Navegação segura

**Risco:** Baixo. Apenas corrige links e referências. Nenhum conteúdo é alterado.

### 2.1 Corrigir 34+ links quebrados

| Ação | Arquivos a modificar | Links a corrigir | Risco |
|------|---------------------|------------------|-------|
| A1.1 | `FLUXOS.md` | 14 links brain/* → novos caminhos (projetos/multgestor/ ou areas/) | 🔴 14 links — o maior volume |
| A1.2 | `FLUXOS.md` | 6 links audits/ → auditorias/ | 🟢 |
| A1.3 | `MAPA-DAS-PASTAS.md` | audits/ → auditorias/, archive/ → _inbox/antigos/, state/ → (remover), segundo cerebro/ → _inbox/antigos/segundo cerebro/ | 🟢 |
| A1.4 | `CONVENCOES.md` | audits/ → auditorias/, brain/INDEX → (remover ou apontar para indice.md), brain/decisions/TEMPLATE-DECISION → decisoes/MODELO-DECISAO | 🟢 |
| A1.5 | `ATLAS.md` | audits/ → auditorias/, archive/ → _inbox/antigos/, brain/constitution → rules/ (ou novo local), brain/constitution-knowledge-os → rules/ | 🟡 |
| A1.6 | `GLOSSARIO.md` | brain/KNOWLEDGE-OS → projetos/multgestor/knowledge-os | 🟢 |

### 2.2 Corrigir HOME.md como porta de entrada

| Ação | Descrição | Risco |
|------|-----------|-------|
| A1.7 | `ATLAS.md` (linha 65): HOME.md → 00-HOME.md | 🟢 |
| A1.8 | `FLUXOS.md` (linhas 9, 23, 41, 67, 89, 109, 125, 143): HOME.md → 00-HOME.md (8 ocorrências) | 🟢 |

### 2.3 Adicionar referências ausentes

| Ação | Descrição | Risco |
|------|-----------|-------|
| A1.9 | `00-HOME.md` adicionar links para: ATLAS.md, MAPA-DAS-PASTAS.md, GLOSSARIO.md, FLUXOS.md, CONVENCOES.md | 🟢 |
| A1.10 | `00-HOME.md` adicionar link para: 02-COMO-USAR.md | 🟢 |
| A1.11 | `Base de Conhecimento.md` adicionar link para: 02-COMO-USAR.md (se relevante) | 🟢 |

---

## 3. ONDA 2 — Autoridade documental

**Risco:** Médio. Afeta documentos constitucionais que orientam todo o OpenCodex.

### 3.1 Alinhar hierarquia ATLAS com navegação real

| Ação | Descrição | Risco |
|------|-----------|-------|
| A2.1 | `ATLAS.md`: atualizar hierarquia de autoridade para refletir 00-HOME.md como entrada real | 🟡 |
| A2.2 | `ATLAS.md`: remover ou corrigir referências a brain/constitution.md | 🟡 |
| A2.3 | `ATLAS.md`: verificar se as 5 capacidades ainda correspondem à estrutura atual | 🟡 |

### 3.2 Promover constitution-knowledge-os.md

| Ação | Descrição | Risco |
|------|-----------|-------|
| A2.4 | Mover `_inbox/revisar/constitution-knowledge-os.md` para `rules/constitution-knowledge-os.md` | 🔴 Exclusão/movimentação |
| A2.5 | ATLAS.md: atualizar link para `rules/constitution-knowledge-os.md` | 🟢 |

### 3.3 Resolver duplicidade Governanca-Documental vs ATLAS

| Ação | Descrição | Risco |
|------|-----------|-------|
| A2.6 | Alinhar os dois documentos para que um referencie o outro sem contradição | 🟡 |

---

## 4. ONDA 3 — Duplicidades e placeholders

**Risco:** Alto. Envolve decisões sobre exclusão, movimentação e redirecionamento.

### 4.1 Cópias vazias — redirecionar ou excluir

| Ação | Arquivo vazio | Destino | Risco |
|------|--------------|---------|-------|
| A3.1 | `maps/multgestor-core/MAPA-MULTGESTOR-CORE.md` | Redirecionar para `projetos/multgestor/mapas/MAPA-MULTGESTOR-CORE.md` | 🔴 |
| A3.2 | `living-os/riscos/riscos-ativos.md` | Redirecionar para `projetos/multgestor/living-os/riscos/riscos-ativos.md` | 🔴 |
| A3.3 | `agents/joefelipe-agent.md` | Redirecionar para `projetos/joefelipe-agent/agentes/joefelipe-agent.md` | 🔴 |
| A3.4 | `agents/joefelipe-personal-operating-agent.md` | Verificar se o conteúdo real existe em outra pasta; se não, excluir | 🔴 |
| A3.5 | `projetos/multgestor/roadmap/roadmap/ROADMAP-MESTRE-*` | Excluir subdiretório roadmap/roadmap/ | 🔴 |
| A3.6 | `projetos/multgestor/roadmap/capacidades.md` (0 bytes) | Excluir (conteúdo real em projetos/multgestor/capacidades.md) | 🔴 |
| A3.7 | `prompts/product.md` (0 bytes) | Verificar se deve ser populado ou excluído | 🔴 |
| A3.8 | `chatJoe.md` (0 bytes) | Verificar se deve ser populado ou excluído | 🔴 |
| A3.9 | `Sem titulo.md` (0 bytes) | Excluir (rascunho esquecido) | 🔴 |
| A3.10 | `Sem titulo.canvas` | Excluir (rascunho esquecido) | 🔴 |

### 4.2 HOME.md — redirecionar

| Ação | Descrição | Risco |
|------|-----------|-------|
| A3.11 | `HOME.md`: substituir conteúdo por "# HOME.md\n\n> Esta página foi substituída por [[00-HOME.md]].\n\n[[00-HOME.md]]" ou similar | 🟢 |

### 4.3 Renomear FLUXOS.md duplicado

| Ação | Descrição | Risco |
|------|-----------|-------|
| A3.12 | `areas/produto-roadmap/fluxos.md` → `areas/produto-roadmap/fluxos-produto.md` (para evitar conflito com raiz/FLUXOS.md) | 🟡 |

### 4.4 Decidir sobre 37 visao-geral.md

| Ação | Descrição | Risco |
|------|-----------|-------|
| A3.13 | Decisão: manter padrão visao-geral.md como porta de entrada de cada pasta OU migrar para nomes específicos (ex: `areas/operacao/visao-geral.md` → `areas/operacao/README.md`) | ❓ Exige decisão humana |

---

## 5. ONDA 4 — Arquitetura do MultGestor (preparação Missão 1)

**Risco:** Médio. Prepara o OpenCodex para a Missão 1 — Arquitetura Canônica.

### 5.1 Documentos arquiteturais desatualizados

| Ação | Documento | Ação necessária | Risco |
|------|-----------|----------------|-------|
| A4.1 | `docs/AUDIT_REPORT.md` | Atualizar removendo 5 objeções descartadas | 🟡 |
| A4.2 | `docs/capabilities-map.md` | Marcar Repository/EventBus como implementados | 🟡 |
| A4.3 | `docs/core/runtime-map.md` | Adicionar refresh token | 🟡 |
| A4.4 | `docs/PLATFORM_ARCHITECTURE.md` | Remover risco R9 sobre migrations | 🟡 |

### 5.2 Capacidades desatualizadas

| Ação | Descrição | Risco |
|------|-----------|-------|
| A4.5 | `projetos/multgestor/capacidades.md`: alinhar com a matriz do Gate 4 (40 capacidades, 21 LOCALMENTE, etc.) | 🟡 |
| A4.6 | `projetos/multgestor/matriz-consolidacao-core.md` (72,5 KB): documento grande — considerar dividir ou arquivar após Missão 1 | 🟡 |

### 5.3 Separar docs de arquitetura de docs de operação

| Ação | Descrição | Risco |
|------|-----------|-------|
| A4.7 | Verificar se `projetos/multgestor/living-os/` está bem dividido entre A e O | 🟢 |
| A4.8 | Verificar se `projetos/multgestor/plataforma.md` não mistura estado atual com arquitetura | 🟡 |

---

## 6. ONDA 5 — Validação final

**Risco:** Baixo. Verificação pós-ondas.

### 6.1 Links

| Ação | Descrição |
|------|-----------|
| A5.1 | Verificar que todos os links brain/* foram corrigidos |
| A5.2 | Verificar que audits/ foi substituído por auditorias/ |
| A5.3 | Verificar que HOME.md não é mais referenciado como porta de entrada |

### 6.2 Órfãos

| Ação | Descrição |
|------|-----------|
| A5.4 | Verificar se 02-COMO-USAR.md passou a ser referenciado |
| A5.5 | Verificar se ATLAS.md, FLUXOS.md, GLOSSARIO.md, MAPA-DAS-PASTAS.md passaram a ser referenciados a partir de 00-HOME.md |

### 6.3 Git

| Ação | Descrição |
|------|-----------|
| A5.6 | git status — verificar se apenas arquivos esperados foram alterados |
| A5.7 | git diff — verificar se não há alterações inesperadas |

### 6.4 Documentação canônica

| Ação | Descrição |
|------|-----------|
| A5.8 | Confirmar que cada assunto tem 1 fonte canônica |
| A5.9 | Confirmar que documentos auxiliares apontam para a fonte canônica |

---

## 7. Decisões humanas necessárias

### Baixo risco

| # | Decisão | Origem |
|---|---------|--------|
| D01 | Manter padrão `visao-geral.md` ou migrar para nomes específicos? | Gate 3 |
| D02 | `chatJoe.md` (0 bytes) — preencher ou excluir? | Gate 1 |
| D03 | `prompts/product.md` (0 bytes) — preencher ou excluir? | Gate 1 |

### Médio risco

| # | Decisão | Origem |
|---|---------|--------|
| D04 | `areas/produto-roadmap/fluxos.md` — renomear para evitar conflito com FLUXOS.md? | Gate 3 |
| D05 | Nichos em digital-twin/ vs mapas/nichos/ — ambos necessários ou um pode referenciar o outro? | Gate 3 |
| D06 | `projetos/multgestor/capacidades.md` — atualizar com dados do Gate 4 ou arquivar como conceitual? | Gate 4 |
| D07 | Alinhar Governanca-Documental.md com ATLAS.md sobre hierarquia de autoridade | Gate 4 |

### Alto risco

| # | Decisão | Origem |
|---|---------|--------|
| D08 | Promover `_inbox/revisar/constitution-knowledge-os.md` para `rules/`? | Gate 5 |
| D09 | Excluir `roadmap/roadmap/` e `maps/multgestor-core/`? | Gate 3 |
| D10 | Excluir 5 arquivos vazios (chatJoe.md, Sem titulo.md, .canvas, agents/*.md)? | Gate 1 |
| D11 | Atualizar 4 documentos arquiteturais (AUDIT_REPORT, capabilities-map, runtime-map, PLATFORM_ARCHITECTURE)? | Gate 4 |

### Irreversíveis

| # | Decisão | Origem |
|---|---------|--------|
| D12 | Exclusão de `roadmap/roadmap/` (pasta com arquivos) | Gate 3 |
| D13 | Alteração de links nos documentos constitucionais (ATLAS, FLUXOS, CONVENCOES) | Gate 4 |

---

## 8. Ordem de execução sugerida

```
Onda 1 (navegação)
├── A1.1 a A1.6 — corrigir 34+ links quebrados
├── A1.7 a A1.8 — HOME.md → 00-HOME.md
└── A1.9 a A1.11 — adicionar referências ausentes

Onda 2 (autoridade)
├── A2.1 a A2.3 — alinhar ATLAS
├── A2.4 a A2.5 — promover constitution
└── A2.6 — alinhar Governanca-Documental

Onda 3 (duplicidades)
├── A3.1 a A3.10 — tratar 10 placeholders
├── A3.11 — redirecionar HOME.md
├── A3.12 — renomear fluxos.md
└── A3.13 — decisão visao-geral.md

Onda 4 (arquitetura)
├── A4.1 a A4.4 — atualizar 4 docs desatualizados
├── A4.5 a A4.6 — capacidades e matriz
└── A4.7 a A4.8 — separar A de O

Onda 5 (validação)
├── A5.1 a A5.3 — verificar links
├── A5.4 a A5.5 — verificar órfãos
├── A5.6 a A5.7 — verificar git
└── A5.8 a A5.9 — verificar canônicos
```

**Total de ações: ~40**
**Total de decisões humanas: 13**

---

## 9. Riscos do plano

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Quebrar links ao corrigir outros links | Média | Alto | Fazer uma onda por vez, validar antes da próxima |
| Esquecer de atualizar referência cruzada | Média | Médio | Usar grep após cada alteração |
| Excluir arquivo que ainda é referenciado | Baixa | Alto | Verificar referências antes de excluir |
| Decisão D13 (alterar docs constitucionais) | Alta | Médio | Manter backups dos originais |
| Conflito entre mudanças (git merge) | Baixa | Médio | Executar em branch separada |

---

## 10. Resumo do plano

| Onda | Ações | Risco | Autorização necessária |
|------|-------|-------|----------------------|
| 1 — Navegação segura | ~14 | Baixo | Sim — modifica .opencodex/ |
| 2 — Autoridade documental | ~6 | Médio | Sim |
| 3 — Duplicidades e placeholders | ~12 | Alto | Sim — inclui exclusões |
| 4 — Arquitetura MultGestor | ~8 | Médio | Sim — prepara Missão 1 |
| 5 — Validação final | ~9 | Baixo | Sim |
| **Total** | **~49** | | |

---

```
GATE_6_STATUS: CONCLUIDO
PLANO_DE_CONSOLIDACAO: PRONTO
ALTERACOES_OPENCODEX: NAO_EXECUTADAS
```
