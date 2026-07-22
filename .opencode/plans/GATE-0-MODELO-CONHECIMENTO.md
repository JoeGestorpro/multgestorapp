# GATE 0 — MODELO DE CONHECIMENTO

**Data:** 2026-07-20
**Missão:** MISSÃO 0 — GOVERNANÇA DO OPENCODEX
**Estado:** CONCLUÍDO
**Base:** `docs/sec-booking-rls-001` | `0d392e6`
**Nenhuma alteração em `.opencodex/` foi executada.**

---

## 1. Portas de entrada identificadas

| Prioridade | Documento | Função | Referenciado por |
|-----------|-----------|--------|-----------------|
| 1ª | `00-HOME.md` (41 linhas) | Painel central — porta de entrada principal | Governanca-Documental.md |
| 2ª | `ATLAS.md` (76 linhas) | Visão e filosofia do Knowledge OS | MAPA-DAS-PASTAS.md (linha 3) |
| 3ª | `FLUXOS.md` (144 linhas) | Navegação por situação (7 fluxos) | Nenhum — ORFÃO na raiz |
| 4ª | `Base de Conhecimento.md` (44 linhas) | Conhecimento técnico permanente | 00-HOME.md, Governanca-Documental.md |
| 5ª | `HOME.md` (2 linhas) | Placeholder vazio ("C:\Users\Joefe") | ATLAS.md (como porta de entrada — contraditório) |

**Problema:** `HOME.md` é citado por `ATLAS.md` e `FLUXOS.md` como porta de entrada,
mas na prática quem exerce essa função é `00-HOME.md`. O `HOME.md` é um placeholder
vazio com 2 linhas.

---

## 2. Hierarquia de autoridade documental

Definida pelo `ATLAS.md` (linhas 61-72):

```
1. Constitution (brain/constitution.md — FALTA: link quebrado)
2. Rules (rules/)
3. HOME.md (porta de entrada — contraditório: quem funciona é 00-HOME.md)
4. ATLAS.md (visão e filosofia)
5. MAPA-DAS-PASTAS.md (responsabilidades)
6. GLOSSARIO.md (definições)
7. FLUXOS.md (navegação)
8. CONVENCOES.md (convenções)
```

**Problemas identificados:**
- `brain/constitution.md` não existe (link quebrado)
- `HOME.md` não é a porta de entrada real — `00-HOME.md` exerce esse papel
- `MAPA-DAS-PASTAS.md`, `GLOSSARIO.md`, `FLUXOS.md` e `CONVENCOES.md` não são
  referenciados por `00-HOME.md` — a hierarquia declarada não corresponde à
  navegação real

---

## 3. Documentos canônicos candidatos

`Governanca-Documental.md` já define **8 documentos canônicos** com
responsabilidade única:

| # | Papel canônico | Arquivo real | Pergunta que responde |
|---|---------------|-------------|----------------------|
| 1 | Início | `00-HOME.md` | Onde entro? |
| 2 | Índice Geral | `01-MAPA-GERAL.md` | Onde está cada coisa? |
| 3 | Base de Conhecimento | `Base de Conhecimento.md` | Como funciona? |
| 4 | Segundo Cérebro | `Segundo Cérebro.md` | O que pensei/planejei? |
| 5 | Diário do Projeto | `Diário do Projeto.md` | O que aconteceu? |
| 6 | Decisões | `decisoes/visao-geral.md` | Por que foi feito assim? |
| 7 | Arquitetura | `projetos/multgestor/arquitetura.md` | Como o sistema funciona? |
| 8 | Mapa do Projeto | `MAPA-DAS-PASTAS.md` | Onde cada coisa fica? |

**Observação:** Esta definição já é madura e consistente. Precisa apenas de
validação cruzada com os níveis (Constituição/Arquitetura/Operação/Histórico)
e verificação de que nenhum documento novo viola a regra "um documento, uma
responsabilidade".

---

## 4. Índices e mapas

### Índices de área técnica

| Índice | Assunto | Referenciado por |
|--------|---------|-----------------|
| `Backend - Indice.md` | Backend | 00-HOME.md, Base de Conhecimento.md |
| `Frontend - Indice.md` | Frontend | 00-HOME.md, Base de Conhecimento.md |
| `Banco de Dados - Indice.md` | Banco | 00-HOME.md, Base de Conhecimento.md |
| `Deploy e Producao - Indice.md` | Deploy | 00-HOME.md, Base de Conhecimento.md |
| `Seguranca - Indice.md` | Segurança | 00-HOME.md, Base de Conhecimento.md |
| `Billing e Pagamentos - Indice.md` | Billing | 00-HOME.md, Base de Conhecimento.md |

### Mapas

| Mapa | Localização | Conteúdo |
|------|------------|----------|
| `01-MAPA-GERAL.md` | Raiz | Organização macro (reorganização 2026-07-07) |
| `MAPA-DAS-PASTAS.md` | Raiz | Responsabilidades de pastas |
| `MAPA-MULTGESTOR-CORE.md` | `maps/multgestor-core/` | Mapa do Core (1 arquivo) |
| `MAPA-MULTGESTOR-CORE.md` | `projetos/multgestor/mapas/` | Mapa do Core (2ª cópia) |
| `DEPENDENCIAS-MULTGESTOR.md` | `projetos/multgestor/mapas/` | Dependências |
| `PAINEL-EXECUTIVO-MULTGESTOR.md` | `projetos/multgestor/mapas/` | Painel executivo |

---

## 5. Documentos históricos

### Auditorias (22 arquivos)

| Local | Qtd | Período |
|-------|-----|---------|
| `auditorias/multgestor/` | 19 | 2026-06-15 a 2026-07-20 |
| `auditorias/joefelipe-agent/` | 3 | 2026-06-19 a 2026-07-05 |

### Handoff / context pack (6 arquivos)

| Arquivo | Função |
|---------|--------|
| `handoff/context-pack/PACK-00-LEIA-PRIMEIRO.md` | Briefing de contexto |
| `handoff/context-pack/PACK-01-BRIEFING.md` | Briefing |
| `handoff/context-pack/PACK-02-ESTADO.md` | Estado capturado |
| `handoff/context-pack/PACK-03-ROADMAP.md` | Roadmap |
| `handoff/context-pack/PACK-04-PLATAFORMA.md` | Plataforma |
| `handoff/context-pack/PACK-05-DECISOES.md` | Decisões |

### Incidentes (9 arquivos)

`projetos/multgestor/incidentes/` — INC-001 a INC-005 + SEC-DATABASE-TLS-001

### Material não processado

`_inbox/revisar/` — 8 arquivos (incluindo `constitution-knowledge-os.md`)
`_inbox/antigos/` — 6+ arquivos do "segundo cerebro"

---

## 6. Documentos órfãos

Documentos de navegação na raiz **não referenciados por nenhum outro documento
de navegação raiz** (podem estar referenciados em subdiretórios):

| Documento | Risco |
|-----------|-------|
| `02-COMO-USAR.md` | Alto — guia de uso sem referência de entrada |
| `FLUXOS.md` | Alto — 7 fluxos de navegação, ninguém aponta para ele |
| `GLOSSARIO.md` | Médio — 166 linhas de vocabulário, referenciado apenas por `_inbox/revisar/regras-cerebro-visao-geral.md` |
| `CONVENCOES.md` | Médio — referenciado apenas por `FLUXOS.md` (linha 69) |
| `ATLAS.md` | Médio — referenciado apenas por `MAPA-DAS-PASTAS.md` (linha 3) |
| `HOME.md` | Baixo — placeholder vazio, mas citado em ATLAS.md e FLUXOS.md como porta de entrada |
| `Segundo Cerebro.md` | Médio — referenciado por `00-HOME.md` mas conteúdo pode estar desatualizado |
| `Diario do Projeto.md` | Médio — referenciado por `00-HOME.md` e `Base de Conhecimento.md` |
| `BarberGestor - HOME.md` | Baixo — referenciado por `00-HOME.md` |
| `MultCriativos - HOME.md` | Baixo — referenciado por `00-HOME.md` |

---

## 7. Links quebrados e circulares

### LINKS QUEBRADOS MASSIVOS — Diretório `brain/` esvaziado

O diretório `brain/` foi esvaziado durante a reorganização de 2026-07-07.
Atualmente contém apenas: `fila-de-implementacao.md` e `plans/`.

**Todos os links abaixo apontam para arquivos que não existem mais:**

#### Em ATLAS.md (5 links quebrados)

| Linha | Link | Destino real |
|-------|------|-------------|
| 34 | `[[brain/constitution.md]]` | ❌ Não existe |
| 42 | `[[brain/]]` (como diretório) | ✅ Existe (mas vazio) |
| 43 | `[[audits/]]` | ❌ Diretório não existe (era `auditorias/`) |
| 44 | `[[agents/]]` | ✅ Existe (mas link é para diretório, não arquivo) |
| 46 | `[[archive/]]` | ❌ Diretório não existe |
| 63 | `[[brain/constitution-knowledge-os.md]]` | ❌ Na verdade está em `_inbox/revisar/constitution-knowledge-os.md` |

#### Em MAPA-DAS-PASTAS.md (6 links quebrados)

| Link | Problema |
|------|---------|
| `[[brain/]]` | ✅ Diretório existe |
| `[[audits/]]` | ❌ Deveria ser `auditorias/` |
| `[[archive/]]` | ❌ Deveria ser `_inbox/antigos/` |
| `[[state/]]` | ❌ Não existe |
| `[[segundo cerebro/]]` | ❌ Deveria ser `_inbox/antigos/segundo cerebro/` |
| `[[brain/01-CURRENT-STATE.md]]` | ❌ Não existe |

#### Em FLUXOS.md (21 links quebrados)

Todos os 19 links para `brain/*` estão quebrados, exceto `brain/fila-de-implementacao.md`
que ainda existe. Exemplos:

- `[[brain/00-HOME.md]]` ❌
- `[[brain/INDEX.md]]` ❌
- `[[brain/01-CURRENT-STATE.md]]` ❌
- `[[brain/product/README.md]]` ❌
- `[[brain/architecture-decisions.md]]` ❌
- `[[brain/technical/README.md]]` ❌
- `[[brain/agents/README.md]]` ❌
- `[[brain/KNOWLEDGE-GRAPH.md]]` ❌
- `[[audits/]]` ❌ (6 ocorrências em FLUXOS.md)

#### Em CONVENCOES.md (links quebrados)

- `[[brain/INDEX.md]]` ❌
- `[[brain/decisions/TEMPLATE-DECISION.md]]` ❌ (ADRs agora em `decisoes/`)
- `[[audits/]]` ❌

#### Em GLOSSARIO.md

- `[[brain/KNOWLEDGE-OS.md]]` ❌

### Total bruto de links quebrados

| Documento | Links quebrados |
|-----------|----------------|
| FLUXOS.md | **21** (19 brain/* + 2 audits/) |
| MAPA-DAS-PASTAS.md | **6** (audits, archive, state, segundo cerebro, brain/01-CURRENT-STATE) |
| CONVENCOES.md | **3** (brain/INDEX, brain/decisions/TEMPLATE-DECISION, audits/) |
| ATLAS.md | **3** (audits, archive, brain/constitution-knowledge-os) |
| GLOSSARIO.md | **1** (brain/KNOWLEDGE-OS) |
| **Total** | **~34 links quebrados** |

### NAVEGAÇÃO CIRCULAR

Identificada uma circularidade entre `ATLAS.md` e `MAPA-DAS-PASTAS.md`:

- `ATLAS.md` define a hierarquia e aponta para `MAPA-DAS-PASTAS.md` como passo 5
- `MAPA-DAS-PASTAS.md` aponta de volta para `ATLAS.md` como "consulte ATLAS.md"
- Isto não é necessariamente um problema — pode ser navegação bidirecional intencional

---

## 8. Conflitos encontrados

### Conflito 1: HOME.md vs 00-HOME.md

- `HOME.md` (2 linhas, placeholder vazio) é citado como "porta de entrada" por
  `ATLAS.md` (linha 65) e `FLUXOS.md` (linhas 9, 23, 41, 67, 89, 109, 125, 143)
- `00-HOME.md` (41 linhas) é a porta de entrada **real** com links para projetos,
  áreas técnicas, índices e operação
- **Decisão necessária:** `HOME.md` deve redirecionar para `00-HOME.md` ou ser
  eliminado.

### Conflito 2: brain/ links desatualizados

- `ATLAS.md`, `FLUXOS.md`, `CONVENCOES.md`, `GLOSSARIO.md` e `MAPA-DAS-PASTAS.md`
  ainda referenciam a estrutura antiga do `brain/`
- A reorganização de 2026-07-07 moveu o conteúdo para `projetos/`, `areas/`, etc.
- **Decisão necessária:** Todos esses links precisam ser atualizados para os novos
  caminhos.

### Conflito 3: Nomenclatura de diretórios

- `auditorias/` (real) vs `audits/` (referenciado em 4 documentos)
- `_inbox/antigos/` (real) vs `archive/` (referenciado em ATLAS.md e MAPA-DAS-PASTAS.md)
- `_inbox/antigos/segundo cerebro/` (real) vs `segundo cerebro/` (referenciado em MAPA-DAS-PASTAS.md)
- `projetos/joefelipe-agent/` (real) vs `agents/` (diretório existe mas é diferente)

### Conflito 4: Documents arquiteturais desatualizados (herdado do Gate 4)

| Documento | Problema |
|-----------|---------|
| `AUDIT_REPORT.md` (em `docs/`) | 5 objeções descartadas pelo Gate 4 |
| `capabilities-map.md` | Repository/EventBus marcados "planned" (já implementados) |
| `runtime-map.md` | "no refresh token" (já implementado) |
| `PLATFORM_ARCHITECTURE.md` | "no versioned migrations" (já implementado) |

### Conflito 5: Governanca-Documental.md vs nomenclatura real

- `Governanca-Documental.md` define 8 canônicos — mas 3 deles (`Segundo Cérebro`,
  `Diário do Projeto`, `Base de Conhecimento`) podem conter conteúdo parcial ou
  desatualizado desde a criação
- O documento estabelece regras que os próprios documentos de navegação não seguem
  (ex: `FLUXOS.md` aponta para `HOME.md` em vez de `00-HOME.md`)

---

## 9. Arquivos gerados neste Gate

Todos em `.opencode/plans/`:

| Arquivo | Conteúdo | Bytes |
|---------|----------|-------|
| `GATE-0-MODELO-CONHECIMENTO.md` | Relatório completo do Gate 0 | — |

---

## 10. Resumo dos problemas encontrados

| Categoria | Qtd | Severidade |
|-----------|-----|-----------|
| Links quebrados `brain/*` | 19+ | CRÍTICA — navegação principal do FLUXOS.md está inutilizável |
| Links quebrados `audits/` | 8+ | ALTA — 6 só no FLUXOS.md |
| Links quebrados `archive/`, `state/`, `segundo cerebro/` | 3 | MÉDIA |
| Porta de entrada duplicada (HOME.md vs 00-HOME.md) | 1 | ALTA — contradiz a hierarquia de autoridade |
| Documentos órfãos de navegação | 4 | MÉDIA — 02-COMO-USAR, GLOSSARIO, FLUXOS, ATLAS não referenciados na raiz |
| Documentos arquiteturais desatualizados | 4 | ALTA — herança do Gate 4 |
| Navegação circular (ATLAS ↔ MAPA-DAS-PASTAS) | 1 | BAIXA — pode ser intencional |

---

## 11. Recomendações para o Gate 1

1. **Inventariar detalhadamente** os 19+ links `brain/*` quebrados e mapear
   o destino correto de cada um (provavelmente `projetos/multgestor/` ou `areas/`)
2. **Verificar** se `02-COMO-USAR.md`, `FLUXOS.md`, `GLOSSARIO.md` e `ATLAS.md`
   são referenciados a partir de subdiretórios
3. **Categorizar** quais documentos de `_inbox/revisar/` precisam ser promovidos
4. **Contar** exatamente quantos arquivos `visao-geral.md` existem (dezenas)
5. **Verificar** se `constitution-knowledge-os.md` (em `_inbox/revisar/`) deve
   ser promovido ou se o `ATLAS.md` precisa ter o link corrigido
6. **Validar** se os índices técnicos (Backend, Frontend, Banco, etc.) refletem
   a estrutura atual do código

---

```
GATE_0_STATUS: CONCLUIDO
ALTERACOES_OPENCODEX: NAO_EXECUTADAS
PROXIMO_GATE: G1_AGUARDANDO_AUTORIZACAO
```
