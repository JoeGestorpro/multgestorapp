# GATE 5 — FONTES CANÔNICAS

**Data:** 2026-07-20
**Missão:** MISSÃO 0 — GOVERNANÇA DO OPENCODEX
**Dependência:** Gates 0-4 concluídos
**Nenhuma alteração em `.opencodex/` foi executada.**

---

## 1. Metodologia

Para cada assunto, propõe-se uma única fonte canônica com base em:
1. Autoridade declarada (Governanca-Documental.md, ATLAS.md)
2. Abrangência e completude
3. Posição na navegação
4. Ausência de conflitos
5. Classificação do Gate 2

**Estados:**
- ✅ **CANONICO_CONFIRMADO** — já atua como fonte única, sem conflitos
- ⚠️ **CANONICO_CONDICIONAL** — é a melhor candidata, mas precisa de correção
- 🔴 **SEM_CANONICO_CLARO** — não há documento que cubra o assunto adequadamente
- ❓ **EXIGE_DECISAO_HUMANA** — há mais de um candidato viável

---

## 2. Matriz de fontes canônicas

### Constituição (Nível 1)

| # | Assunto | Canônico proposto | Estado | Papel | Auxiliares | Conflitos |
|---|---------|-------------------|--------|-------|------------|-----------|
| 1 | Entrada principal | `00-HOME.md` | ⚠️ Condicional | Porta de entrada | `HOME.md` (redirecionar) | C1-04: HOME.md citado como entrada |
| 2 | Visão e filosofia | `ATLAS.md` | ⚠️ Condicional | Pirâmide, capacidades, hierarquia | — | C2-01: hierarquia não corresponde |
| 3 | Governança documental | `Governanca-Documental.md` | ✅ Confirmado | 8 canônicos, regras | `CONVENCOES.md` | C2-02: regras não seguidas |
| 4 | Convenções | `CONVENCOES.md` | ⚠️ Condicional | Onde colocar, como nomear | — | C1-02: audits/ quebrado |
| 5 | Glossário | `GLOSSARIO.md` | ⚠️ Condicional | Vocabulário | — | C1-01: brain/KNOWLEDGE-OS quebrado |
| 6 | Fluxos de navegação | `FLUXOS.md` | 🔴 Sem canônico claro | 7 fluxos | — | C1-01: 14 links brain/ quebrados; C1-02: 6 audits/ quebrados |
| 7 | Mapa geral (organização) | `01-MAPA-GERAL.md` | ⚠️ Condicional | Macroestrutura | `02-COMO-USAR.md` | Poucos links quebrados |
| 8 | Mapa de pastas | `MAPA-DAS-PASTAS.md` | ⚠️ Condicional | Responsabilidades | — | C1-03: 3 links quebrados; C1-02: audits/ |
| 9 | Base de Conhecimento | `Base de Conhecimento.md` | ✅ Confirmado | Como funciona | — | Nenhum |
| 10 | Constitution (regras invioláveis) | 🔴 **SEM CANÔNICO CLARO** | ❓ Exige decisão | Princípios | `rules/` (3 arquivos) | brain/constitution.md não existe; `_inbox/revisar/constitution-knowledge-os.md` preso |

### Arquitetura (Nível 2)

| # | Assunto | Canônico proposto | Estado | Papel | Auxiliares | Conflitos |
|---|---------|-------------------|--------|-------|------------|-----------|
| 11 | MultGestor — visão geral | `projetos/multgestor/inicio.md` | ⚠️ Condicional | Porta de entrada do projeto | `projetos/multgestor/indice.md` | — |
| 12 | MultGestor — arquitetura | `projetos/multgestor/arquitetura.md` | ⚠️ Condicional | Como o sistema funciona | `projetos/multgestor/mapas/core/` | — |
| 13 | MultGestor — Core | `projetos/multgestor/mapas/MAPA-MULTGESTOR-CORE.md` | ⚠️ Condicional | Mapa técnico do Core | `maps/multgestor-core/` (vazio — redirecionar) | Gate 3-2: duplicata vazia |
| 14 | MultGestor — capacidades | `projetos/multgestor/capacidades.md` | ⚠️ Condicional | Capabilities Map | `projetos/multgestor/roadmap/capacidades.md` (vazio) | Gate 3-4: duplicata vazia; C3-01: desatualizado |
| 15 | MultGestor — mapas | `projetos/multgestor/mapas/` (diretório) | ✅ Confirmado | 55 mapas | — | C4-02: concorrência com 01-MAPA-GERAL |
| 16 | Backend | `Backend - Indice.md` | ✅ Confirmado | Índice | `projetos/multgestor/backend.md` + `mapas/core/backend.md` | Gate 3-10: 3 camadas válidas |
| 17 | Frontend | `Frontend - Indice.md` | ✅ Confirmado | Índice | `projetos/multgestor/frontend.md` + `mapas/core/frontend.md` | Gate 3-10 |
| 18 | Banco de dados | `Banco de Dados - Indice.md` | ✅ Confirmado | Índice | `projetos/multgestor/banco.md` | — |
| 19 | Segurança (arquitetura) | `Seguranca - Indice.md` | ✅ Confirmado | Índice | `projetos/multgestor/mapas/seguranca/` | Gate 3-9 |
| 20 | Deploy e infra | `Deploy e Producao - Indice.md` | ✅ Confirmado | Índice | `projetos/multgestor/mapas/infra/` | — |
| 21 | Billing | `Billing e Pagamentos - Indice.md` | ✅ Confirmado | Índice | — | — |
| 22 | Decisões (ADRs) | `decisoes/visao-geral.md` | ✅ Confirmado | Hub de ADRs | `decisoes/` (6 arquivos) | C5-06: brain/decisions/ antigo |
| 23 | Nichos — template | `Nichos/INDEX.md` | ⚠️ Condicional | Como criar nicho | `Nichos/` (6 arquivos) | — |
| 24 | Nichos — Digital Twin | `areas/produto-roadmap/digital-twin/visao-geral.md` | ⚠️ Condicional | Gêmeo digital de cada nicho | `projetos/multgestor/mapas/nichos/` | Gate 3-8: complementar |
| 25 | Produto e roadmap | `areas/produto-roadmap/visao-geral.md` | ✅ Confirmado | Visão de produto | `areas/produto-roadmap/` (31 docs) | — |
| 26 | BarberGestor | `BarberGestor - HOME.md` | ❓ Exige decisão | Home do nicho | `areas/produto-roadmap/digital-twin/barbergestor.md` | — |

### Operação (Nível 3)

| # | Assunto | Canônico proposto | Estado | Papel | Auxiliares | Conflitos |
|---|---------|-------------------|--------|-------|------------|-----------|
| 27 | Runbooks operacionais | `areas/operacao/runbooks/visao-geral.md` | ✅ Confirmado | Procedimentos | 5 runbooks | — |
| 28 | ChatJoe | `chatJoe/README.md` | ⚠️ Condicional | Planejamento | `chatJoe/` (30+ docs) | — |
| 29 | Prompts | `prompts/visao-geral.md` | ✅ Confirmado | Comandos IA | 12 subpastas de prompts | — |
| 30 | Fila operacional | `queue/current-task.md` | ✅ Confirmado | Missão atual | `queue/` (6 docs) | C6-04: backlog pode ter itens obsoletos |
| 31 | Segurança (operacional) | `areas/seguranca/rotacao-segredos.md` | ✅ Confirmado | Procedimento | `projetos/multgestor/mapas/seguranca/rls-seguranca.md` | Gate 3-9 |
| 32 | Estado atual do projeto | `projetos/multgestor/status-atual.md` | ⚠️ Condicional | Onde estamos | `projetos/multgestor/status-dinamico.md` | — |
| 33 | Execução de produção | `projetos/multgestor/execucao-producao.md` | ⚠️ Condicional | Playbook | — | — |
| 34 | Living OS | `projetos/multgestor/living-os/visao-geral.md` | ⚠️ Condicional | Máquina de decisão | 18 docs no living-os | — |
| 35 | Planos ativos | `brain/plans/` (diretório) | ✅ Confirmado | Planos de ação | — | — |

### Histórico (Nível 4)

| # | Assunto | Canônico proposto | Estado | Papel | Auxiliares | Conflitos |
|---|---------|-------------------|--------|-------|------------|-----------|
| 36 | Auditorias MultGestor | `auditorias/multgestor/visao-geral.md` | ✅ Confirmado | Índice de auditorias | 19 auditorias | C5-01: audits/ |
| 37 | Incidentes | `projetos/multgestor/incidentes/visao-geral.md` | ✅ Confirmado | Registro | 9 incidentes | — |
| 38 | Handoff | `handoff/context-pack/PACK-00-LEIA-PRIMEIRO.md` | ⚠️ Condicional | Passagem de contexto | 6 packs | — |
| 39 | Diário do Projeto | `Diario do Projeto.md` | ❓ Exige decisão | O que aconteceu | — | Pode estar desatualizado |
| 40 | Segundo Cérebro | `Segundo Cerebro.md` | ❓ Exige decisão | Ideias e planejamento | `_inbox/antigos/` | Pode ser histórico puro |
| 41 | Inbox a revisar | `_inbox/revisar/README.md` | ✅ Confirmado | Material não processado | 8 arquivos | C6-05: constitution-knowledge-os preso aqui |

---

## 3. Assuntos sem canônico claro

| Assunto | Problema | Sugestão |
|---------|----------|----------|
| **Constitution** (regras invioláveis) | `brain/constitution.md` não existe; `_inbox/revisar/constitution-knowledge-os.md` contém o conteúdo mas está preso na inbox | Promover `_inbox/revisar/constitution-knowledge-os.md` para `rules/constitution-knowledge-os.md` ou similar |
| **MultGestor — nichos visão geral** | `projetos/multgestor/nichos/visao-geral.md` existe mas nichos também têm docs em digital-twin/ e mapas/nichos/ | Definir hierarquia: visao-geral → digital-twin → mapas |
| **Fluxos de navegação** | `FLUXOS.md` tem 21 links quebrados — não pode ser canônico no estado atual | Corrigir links primeiro |

---

## 4. Documentos que devem ser promovidos

| Documento atual | Destino proposto | Motivo |
|----------------|-----------------|--------|
| `_inbox/revisar/constitution-knowledge-os.md` | `rules/constitution-knowledge-os.md` | Documento de constitution não pode ficar em _inbox |
| `_inbox/revisar/licoes-aprendidas.md` | `projetos/multgestor/historico/` | Lições aprendidas são registro histórico |
| `_inbox/revisar/regras-cerebro-visao-geral.md` | `areas/governanca/` ou `rules/` | Regras do conhecimento pertencem à governança |

---

## 5. Documentos que devem virar redirecionamento

| Documento | Redirecionar para | Motivo |
|-----------|-------------------|--------|
| `HOME.md` | `00-HOME.md` | Placeholder vazio, conflito de navegação |
| `maps/multgestor-core/MAPA-MULTGESTOR-CORE.md` | `projetos/multgestor/mapas/MAPA-MULTGESTOR-CORE.md` | Cópia vazia |
| `living-os/riscos/riscos-ativos.md` | `projetos/multgestor/living-os/riscos/riscos-ativos.md` | Cópia vazia |
| `agents/joefelipe-agent.md` | `projetos/joefelipe-agent/agentes/joefelipe-agent.md` | Cópia vazia |
| `projetos/multgestor/roadmap/roadmap/ROADMAP-MESTRE-*.md` | `projetos/multgestor/roadmap/ROADMAP-MESTRE-*.md` | Cópia vazia |
| `projetos/multgestor/roadmap/capacidades.md` (vazio) | `projetos/multgestor/capacidades.md` | Cópia vazia |

---

## 6. Resumo

| Estado | Qtd |
|--------|-----|
| ✅ CANONICO_CONFIRMADO | 16 |
| ⚠️ CANONICO_CONDICIONAL | 16 |
| 🔴 SEM_CANONICO_CLARO | 2 |
| ❓ EXIGE_DECISAO_HUMANA | 4 |
| **Total de assuntos mapeados** | **38** |

---

```
GATE_5_STATUS: CONCLUIDO
FONTES_CANONICAS: PROPOSTAS
ALTERACOES_OPENCODEX: NAO_EXECUTADAS
```
