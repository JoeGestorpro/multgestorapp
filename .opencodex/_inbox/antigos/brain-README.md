# 🧠 Knowledge OS 3.0 — MultGestor

> **Status:** OFICIAL • VIVO • VINCULANTE
> **Criado:** 2026-06-07 · **Evoluído:** 2026-06-24 (V2 → V3)
> **Base operacional:** `.opencodex/`
> **Knowledge OS V3:** [[constitution-knowledge-os]]

---

## O que é

O **Knowledge OS** (Sistema Operacional de Conhecimento) é o **gêmeo digital do MultGestor**. Não é apenas documentação — é um sistema vivo que representa digitalmente todo o conhecimento do projeto, organizado em **7 camadas lógicas**.

> O Obsidian é a Interface Oficial. O `.opencodex/brain` é a Fonte Oficial da Verdade.
> Toda IA deve conseguir compreender o projeto apenas lendo o Second Brain.

## As 7 Camadas

| Camada | Nome | O que contém | Acesso |
|---|---|---|---|
| 1 | **Conhecimento** | PRDs, Digital Twin, Feature Genome, Impact Graph, Simulation Center | [[INDEX#📘-camada-1--conhecimento]] |
| 2 | **Contexto** | Estado atual, roadmap, riscos, backlog | [[INDEX#📊-camada-2--contexto]] |
| 3 | **Inteligência** | Agentes, skills, prompts, mission builder, planner | [[INDEX#🤖-camada-3--inteligência]] |
| 4 | **Produto** | Product Brain, nichos, pricing, clientes | [[INDEX#🧩-camada-4--produto]] |
| 5 | **Engenharia** | Technical Brain, CI/CD, deploy, observabilidade | [[INDEX#⚙️-camada-5--engenharia]] |
| 6 | **Operações** | Playbooks, auditorias, incidentes, rotinas | [[INDEX#🔧-camada-6--operações]] |
| 7 | **Memória** | Timeline, decisões, DNA, health scores | [[INDEX#🧠-camada-7--memória]] |

## Navegação Rápida

| Destino | Link | Camada |
|---|---|---|
| **Homepage** | [[00-HOME]] | 🏠 |
| **Estado Atual** | [[status-dinamico]] | 2 |
| **Dashboard Executivo** | [[painel-executivo]] | 2 |
| **Timeline** | [[linha-do-tempo]] | 7 |
| **Índice Geral** | [[INDEX]] | 🏠 |
| **Constituição Knowledge OS** | [[constitution-knowledge-os]] | ⚖️ |
| **Digital Twin** | `product/digital-twin/README` | 1 |
| **Feature Genome** | `product/feature-genome/README` | 1 |
| **Impact Graph** | `product/impact-graph/README` | 1 |
| **Simulation Center** | `product/simulation-center/README` | 1 |
| **AI Brain (Agentes)** | [[agents/README]] | 3 |
| **Agent × Skill Matrix** | `agents/agent-skill-matrix.md` | 3 |
| **Digital Operations Center** | `ops/digital-ops-center.md` | 6 |
| **Executive Intelligence** | `ops/executive-intelligence.md` | 6 |
| **Knowledge DNA** | `knowledge-dna.md` | 7 |
| **Knowledge Health** | `knowledge-health.md` | 7 |
| **Knowledge Memory** | `knowledge-memory.md` | 7 |
| **Knowledge Graph** | [[grafo-conhecimento]] | 7 |
| **Knowledge OS (QA)** | [[knowledge-os]] | 7 |
| **Decision Graph** | `decisions/DECISION-GRAPH.md` | 7 |

## Diretórios

| Diretório | Camada | Conteúdo |
|---|---|---|
| `product/` | 1+4 | Product Brain, Digital Twin, Feature Genome, Impact Graph, Simulation Center |
| `technical/` | 5 | Technical Brain — arquitetura, infra, segurança |
| `decisions/` | 7 | Decision Center — banco permanente de decisões |
| `incidents/` | 6 | Incident Library — biblioteca de incidentes |
| `lessons/` | 7 | Lessons Library — lições organizadas |
| `nichos/` | 4 | Nichos do MultGestor |
| `agents/` | 3 | Documentação dos agentes + AI Brain |
| `prompts/` | 3 | Prompt Library |
| `ops/` | 6 | Operational Memory — playbooks, rotinas, checklists |
| `living-os/` | — | Living OS executivo |
| `maps/` | — | Mapas vivos do Core |
| `strategy/` | — | Estratégia e mercado |
| `rules/` | 6 | Índice de regras vinculantes |
| `runbooks/` | 1 | Runbooks operacionais |
| `audits/` | 6 | Auditorias estratégicas |

## Fluxo obrigatório

```
Nova missão
  → CHECK 0 (Context Confidence): ler source-of-truth + project-state + capabilities + regras → gerar score
  → score ≥ 80 planeja · ≥ 95 executa · 70–79 só investiga · < 70 PARA e pergunta
  → execução
  → AUDITORIA
  → LOOP DE FECHAMENTO ([[ops/mission-closing-protocol|Mission Closing Protocol V3]]):
      Knowledge OS → Knowledge Graph → Memória → Estado → Roadmap → Backlog → Decisões → Lições → Próxima Missão
  → APPROVE / REQUEST_CHANGES
```

## Documentos Chave

| Documento | Papel |
|---|---|
| [[source-of-truth]] | Hierarquia de autoridade |
| [[constituicao]] | Princípios e regras invioláveis (produto/engenharia) |
| [[constitution-knowledge-os]] | Princípios e regras do Knowledge OS |
| [[status-atual]] | Estado atual real — atualizado a cada APPROVE |
| [[capacidades]] | Capabilities do Core e seu status |
| [[architecture-decisions]] | ADRs vinculantes |
| [[implementacao-log]] | Registro cronológico do que foi implementado |
| [[lessons-learned]] | Incidentes e aprendizados |
| [[confianca-contexto]] | Como toda missão mede se tem contexto suficiente |
| [[saude]] | Scorecards de saúde do conhecimento |

## Princípio

**`.opencodex/brain` é autoridade. `.agent/` é biblioteca histórica.** Nada obsoleto vira autoridade; nada valioso é perdido; nada duplicado é copiado sem decisão.

## Relacionamentos

- [[constitution-knowledge-os]] — Constituição do Knowledge OS
- [[00-HOME]] — Homepage moderna
- [[INDEX]] — Índice geral completo por camadas
- [[grafo-conhecimento]] — Mapa de relacionamentos
- [[knowledge-os]] — Perguntas e respostas rápidas
- [[ops/mission-closing-protocol]] — Protocolo de encerramento V3
- [[product/README]] — Product Brain
- [[technical/README]] — Technical Brain
- [[decisions/README]] — Decision Center
- [[incidents/README]] — Incident Library
- [[agents/README]] — Agentes e AI Brain
- [[prompts/README]] — Prompt Library
- [[ops/README]] — Operational Memory
