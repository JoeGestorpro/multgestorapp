# GATE 4 — CONFLITOS E DESATUALIZAÇÃO

**Data:** 2026-07-20
**Missão:** MISSÃO 0 — GOVERNANÇA DO OPENCODEX
**Dependência:** Gates 0-3 concluídos
**Nenhuma alteração em `.opencodex/` foi executada.**

---

## 1. Resumo

| Tipo de conflito | Qtd | Gravidade |
|------------------|-----|-----------|
| C1 — Navegação | **34+** | 🔴 |
| C2 — Autoridade documental | **3** | 🔴 |
| C3 — Estado do sistema | **4** | 🔴 |
| C4 — Arquitetura | **4** | 🟡 |
| C5 — Nomenclatura | **6** | 🟡 |
| C6 — Temporalidade | **5** | 🟡 |
| **Total** | **56+** | |

---

## 2. C1 — Conflitos de navegação (34+)

### C1.1 Links brain/ quebrados (19 ocorrências)

O diretório `brain/` foi esvaziado na reorganização de 2026-07-07.
Originalmente continha ~20+ arquivos organizados por camada. Hoje só tem
`fila-de-implementacao.md` e `plans/`. Os documentos abaixo ainda referenciam
a estrutura antiga:

| Documento afetado | Links quebrados |
|-------------------|----------------|
| `FLUXOS.md` | 14 links (brain/00-HOME, brain/INDEX, brain/01-CURRENT-STATE, brain/product/*, brain/architecture-decisions, brain/technical/*, brain/agents/README, brain/KNOWLEDGE-GRAPH) |
| `MAPA-DAS-PASTAS.md` | 1 link (brain/01-CURRENT-STATE) |
| `ATLAS.md` | 2 links (brain/constitution, brain/constitution-knowledge-os) |
| `CONVENCOES.md` | 2 links (brain/INDEX, brain/decisions/TEMPLATE-DECISION) |
| `GLOSSARIO.md` | 1 link (brain/KNOWLEDGE-OS) |

### C1.2 Links audits/ quebrados (8 ocorrências)

O diretório chama-se `auditorias/`, não `audits/`:

| Documento afetado | Ocorrências |
|-------------------|-------------|
| `FLUXOS.md` | 6 |
| `MAPA-DAS-PASTAS.md` | 1 |
| `CONVENCOES.md` | 1 |

### C1.3 Links archive/ state/ segundo cerebro/ quebrados (3 ocorrências)

Em `MAPA-DAS-PASTAS.md`: `archive/`, `state/`, `segundo cerebro/`.
Os equivalentes reais são `_inbox/antigos/` e `_inbox/antigos/segundo cerebro/`.
`state/` simplesmente não existe mais.

### C1.4 HOME.md como porta de entrada (conflito de rota)

| Documento | Referencia | Realidade |
|-----------|-----------|-----------|
| `ATLAS.md` (linha 65) | HOME.md como passo 3 da hierarquia | HOME.md é placeholder vazio |
| `FLUXOS.md` (linhas 9, 23, 41, 67, 89, 109, 125, 143) | HOME.md como início de todos os 7 fluxos | 00-HOME.md é a entrada real |
| `00-HOME.md` | Não referencia HOME.md | — |

**Evidência:** HOME.md tem 21 bytes. 00-HOME.md tem 1.434 bytes.
**Gravidade:** 🔴 ALTA — a navegação principal manda o usuário para um
placeholder vazio.

---

## 3. C2 — Conflitos de autoridade documental (3)

### C2.1 Hierarquia ATLAS vs navegação real

`ATLAS.md` define a hierarquia de autoridade como:
```
Constitution → Rules → HOME → ATLAS → MAPA-DAS-PASTAS → GLOSSARIO → FLUXOS → CONVENCOES
```

Mas:
- `brain/constitution.md` **não existe** (topo da hierarquia está quebrado)
- `HOME.md` **não é a porta de entrada** (00-HOME.md exerce esse papel)
- `MAPA-DAS-PASTAS.md`, `GLOSSARIO.md`, `FLUXOS.md` **não são referenciados** por 00-HOME.md
- `ATLAS.md` **não é referenciado** por 00-HOME.md

**Conclusão:** A hierarquia declarada em ATLAS.md não corresponde à navegação
real. Nenhum documento constitucional é alcançável a partir de 00-HOME.md.
**Gravidade:** 🔴 ALTA

### C2.2 Governanca-Documental.md vs documentos que não seguem as regras

`Governanca-Documental.md` define "um documento, uma responsabilidade". Mas:

- `FLUXOS.md` referencia HOME.md em vez de 00-HOME.md (viola a própria
  responsabilidade de navegação correta)
- `projetos/multgestor/plataforma.md` mistura arquitetura com estado atual
- `projetos/multgestor/dna.md` mistura arquitetura com visão de produto

**Gravidade:** 🟡 MÉDIA

### C2.3 Dois documentos definem fontes canônicas

| Documento | O que define |
|-----------|-------------|
| `Governanca-Documental.md` | 8 canônicos (papéis 1-8) |
| `ATLAS.md` | Hierarquia de 8 níveis (Constitution → CONVENCOES) |

Os dois documentos têm sobreposição parcial (HOME/00-HOME como entrada) mas
não são completamente compatíveis. O ATLAS inclui Constitution e Rules que
Governanca-Documental não menciona.

**Gravidade:** 🟡 MÉDIA

---

## 4. C3 — Conflitos de estado do sistema (4)

### C3.1 capabilities-map.md — status desatualizado

**Documento:** `projetos/multgestor/capacidades.md`
**Problema:** O próprio documento se declara não confiável (linha 2: "NÃO É
MAIS A FONTE FACTUAL"). Afirma que `matriz-consolidacao-core.md` é a fonte
factual. Mas a matriz foi gerada em 2026-07-16 e não reflete o Gate 4.

**Gravidade:** 🔴 ALTA

### C3.2 AUDIT_REPORT.md — 5 objeções descartadas (herdado do Gate 4)

**Documento:** `docs/AUDIT_REPORT.md` (fora do .opencodex, no diretório docs/)
**Problema:** Lista 5 objeções que o Gate 4 comprovou como descartadas:
- CORS aberto → server.js:180-204 allowlist
- OutboxWorker não inicializado → server.js:436 started
- JWT em localStorage → authStorage.js Map
- Duas pastas middleware → apenas middlewares/
- Auth duplicada → contexts para escopos diferentes

**Gravidade:** 🔴 ALTA

### C3.3 capabilities-map.md — Repository/EventBus marcados "planned"

**Documento:** `docs/capabilities-map.md` (fora do .opencodex)
**Problema:** Marca Repository Pattern e Event Bus como "planejados".
A implementação existe: 10 repositories, BaseRepository.js, UnitOfWork,
event-bus.js com contracts e factories.

**Gravidade:** 🔴 ALTA

### C3.4 runtime-map.md e PLATFORM_ARCHITECTURE.md

**Documento:** `docs/core/runtime-map.md`
**Problema:** Afirma "no refresh token". Migration v030 implementa refresh tokens.

**Documento:** `docs/PLATFORM_ARCHITECTURE.md`
**Problema:** Risco R9 "no versioned migrations". 37 SQL migrations versionadas
com runner e advisory lock.

**Gravidade:** 🔴 ALTA

---

## 5. C4 — Conflitos de arquitetura (4)

### C4.1 brain/ esvaziado mas referenciado como estrutura atual

O diretório `brain/` foi o centro do Knowledge OS antes da reorganização.
Hoje contém apenas planos ativos. Mas:
- `ATLAS.md` descreve `brain/` como parte das 5 capacidades
- `CONVENCOES.md` manda colocar conteúdo em `brain/`
- `MAPA-DAS-PASTAS.md` descreve `brain/` como o core do conhecimento

**Gravidade:** 🟡 MÉDIA

### C4.2 Mapa Mestre vs Mapa do Core vs Mapa de Pastas

Três documentos concorrentes para "onde encontrar as coisas":
- `01-MAPA-GERAL.md` — organização macro (reorganização)
- `MAPA-DAS-PASTAS.md` — responsabilidades de pastas
- `projetos/multgestor/mapas/MAPA-MULTGESTOR-CORE.md` — mapa técnico do Core

Navegação entre eles não é clara.

**Gravidade:** 🟡 MÉDIA

### C4.3 Dois locais para mapas de nicho

- `areas/produto-roadmap/digital-twin/` — 7 nichos (Digital Twin, camada Produto)
- `projetos/multgestor/mapas/nichos/` — 6 nichos (Mapa arquitetural)

Conteúdo é complementar mas não há referência cruzada.

**Gravidade:** 🟢 BAIXA

### C4.4 Dois locais para segurança

- `areas/seguranca/rotacao-segredos.md` (procedimento operacional)
- `projetos/multgestor/mapas/seguranca/` (4 arquivos de mapa)

**Gravidade:** 🟢 BAIXA

---

## 6. C5 — Conflitos de nomenclatura (6)

| # | Nome esperado | Nome real | Documentos afetados |
|---|--------------|-----------|-------------------|
| 1 | `auditorias/` | `audits/` (referenciado) | ATLAS, FLUXOS, CONVENCOES, MAPA-DAS-PASTAS |
| 2 | `_inbox/antigos/` | `archive/` (referenciado) | ATLAS, MAPA-DAS-PASTAS |
| 3 | `_inbox/antigos/segundo cerebro/` | `segundo cerebro/` (referenciado) | MAPA-DAS-PASTAS |
| 4 | `state/` (não existe) | — | MAPA-DAS-PASTAS |
| 5 | `projetos/multgestor/` | `brain/` (estrutura antiga) | ATLAS, FLUXOS, CONVENCOES |
| 6 | `decisoes/` | `brain/decisions/` (antigo) | CONVENCOES |

---

## 7. C6 — Conflitos de temporalidade (5)

| # | Documento | Problema |
|---|-----------|---------|
| 1 | `projetos/multgestor/knowledge-os.md` | Marcado como legado, mas ainda referenciado por outros docs |
| 2 | `Segundo Cerebro.md` | Criado como canônico (Entrega 4 da Governança) mas conteúdo pode ser placeholder |
| 3 | `projetos/multgestor/memoria.md` | Provavelmente substituído por `projetos/multgestor/confianca-contexto.md` |
| 4 | `queue/backlog.md` (24,6 KB) | Pode conter itens já resolvidos misturados com pendentes |
| 5 | `inbox/revisar/constitution-knowledge-os.md` | Documento importante (Constituição) preso em _inbox/revisar/ desde a reorganização |

---

## 8. Matriz de conflitos

| ID | Tipo | Documentos | Trecho | Gravidade | Decisão humana necessária? |
|----|------|-----------|--------|-----------|---------------------------|
| C1-01 | Navegação | FLUXOS.md (14 links) | brain/* | 🔴 | Sim — atualizar 14 caminhos |
| C1-02 | Navegação | FLUXOS/MAPA/CONVENCOES/ATLAS/GLOSSARIO (8 links) | audits/ → auditorias/ | 🔴 | Sim — corrigir 8 referências |
| C1-03 | Navegação | MAPA-DAS-PASTAS.md | archive/, state/, segundo cerebro/ | 🔴 | Sim — corrigir 3 referências |
| C1-04 | Navegação | ATLAS.md, FLUXOS.md (9 refs) | HOME.md como entrada | 🔴 | Sim — redirecionar para 00-HOME |
| C2-01 | Autoridade | ATLAS.md vs 00-HOME.md | Hierarquia não corresponde | 🔴 | Sim — revisar hierarquia |
| C2-02 | Autoridade | Governanca-Documental.md | Regras não seguidas | 🟡 | Sim — alinhar docs |
| C3-01 | Estado | capacidades.md (fora do .opencodex) | Desatualizado | 🔴 | Sim — atualizar ou arquivar |
| C3-02 ao C3-04 | Estado | AUDIT_REPORT, runtime-map, PLATFORM_ARCHITECTURE | 4 docs desatualizados | 🔴 | Sim — atualizar com Gate 4 |
| C4-01 | Arquitetura | ATLAS/CONVENCOES/MAPA vs brain/ real | brain/ não é mais o centro | 🟡 | Sim — revisar referências |
| C5-01 a C5-06 | Nomenclatura | 4 docs de navegação | audits, archive, state, brain | 🟡 | Sim — padronizar nomes |
| C6-01 a C6-05 | Temporalidade | knowledge-os, Segundo Cerebro, memoria, backlog, _inbox | Conteúdo pode ser obsoleto | 🟡 | Sim — validar cada um |

---

```
GATE_4_STATUS: CONCLUIDO
CONFLITOS_DOCUMENTAIS: MAPEADOS
ALTERACOES_OPENCODEX: NAO_EXECUTADAS
```
