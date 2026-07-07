# 🕸️ Knowledge Graph — Knowledge OS 3.0

> **Status:** OFICIAL • VIVO
> **Camada:** 7 — Memória
> **Atualizado:** 2026-07-04
> **Propósito:** Mapa explícito de relacionamentos entre todas as áreas do Knowledge OS para construir um Graph View extremamente rico no Obsidian.

---

## Nós Centrais

Cada área abaixo é um **nó central** que se conecta a múltiplos outros nós.

```
                        ┌──────────────────┐
                        │    00-HOME       │
                        │   (Homepage)     │
                        └────────┬─────────┘
                ┌────────────────┼────────────────┐
                ▼                ▼                ▼
      ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
      │ 01-CURRENT-STATE │ │     INDEX    │ │ 02-EXECUTIVE-    │
      │                  │ │  (7 camadas) │ │ DASHBOARD        │
      └────────┬─────────┘ └──────────────┘ └────────┬─────────┘
               │                                      │
               ▼                                      ▼
      ┌──────────────────┐                   ┌──────────────────┐
      │    project-state │                   │  ops/digital-    │
      │    (canônico)    │                   │  ops-center      │
      └──────────────────┘                   └──────────────────┘

                        ┌──────────────────────────────────────┐
                        │      constitution-knowledge-os       │
                        │    (Constituição do Knowledge OS)    │
                        └──────┬───────┬───────┬──────────────┘
                               │       │       │
              ┌────────────────┘       │       └────────────────┐
              ▼                        ▼                        ▼
     ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
     │  knowledge-dna   │   │ knowledge-health │   │knowledge-memory  │
     │  Identidade      │   │  Scorecards      │   │  Memória         │
     └──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## Mapa de Relacionamentos

### Constitution Knowledge OS → Todas as Camadas
```
constitution-knowledge-os
  ├──→ 7 camadas (INDEX)
  ├──→ knowledge-health (Art. 4 — qualidade)
  ├──→ knowledge-dna (Art. 5 — padronização)
  ├──→ knowledge-memory (Art. 8 — memória)
  ├──→ decisions/ (Art. 6 — criação de documentos)
  ├──→ ops/mission-closing-protocol (Art. 2.4)
  ├──→ KNOWNLEDGE-GRAPH (Art. 8 — relacionamentos)
  └──→ agents/README (Art. 2.2 — quem mantém)
```

### Digital Twin → Feature Genome → Impact Graph → Simulation Center
```
Layer 1 — Conhecimento
  digital-twin/ (visão macro do módulo)
    ├──→ barbergestor → feature-genome/GENOME-agendamento
    ├──→ barbergestor → impact-graph/IMPACT-remover-tabela
    ├──→ barbergestor → simulation-center/SIMULATION-remove-tabela-x
    │
    ├──→ product/README (Product Brain)
    ├──→ technical/README (Technical Brain)
    └──→ nichos/README (Nichos)
  
  feature-genome/ (DNA de funcionalidades)
    ├──→ GENOME-agendamento → impact-graph/IMPACT-adicionar-recorrencia
    ├──→ GENOME-agendamento → simulation-center/SIMULATION-adiciona-recorrencia
    │
    ├──→ digital-twin/barbergestor
    ├──→ product/prds/TEMPLATE-PRD
    └──→ product/funcionalidades
  
  impact-graph/ (matriz de impacto)
    ├──→ IMPACT-remover-tabela → simulation-center/SIMULATION-remove-tabela-x
    ├──→ IMPACT-migrar-banco → simulation-center/SIMULATION-migra-banco
    ├──→ IMPACT-adicionar-recorrencia → simulation-center/SIMULATION-adiciona-recorrencia
    │
    └──→ technical/DEPENDENCY-MAP
  
  simulation-center/ (cenários)
    ├──→ SIMULATION-remove-tabela-x → digital-twin/barbergestor
    ├──→ SIMULATION-migra-banco → technical/banco
    └──→ SIMULATION-adiciona-recorrencia → feature-genome/GENOME-agendamento
```

### AI Brain → Agent × Skill Matrix → Providers → Builder → Planner
```
Layer 3 — Inteligência
  agents/README (AI Brain)
    ├──→ agent-skill-matrix (agentes × skills)
    ├──→ mission-builder (construção de missões)
    ├──→ planner (geração de planos)
    ├──→ providers (MCP, modelos, plugins)
    │     ├──→ technical/ (MCP servers)
    │     └──→ op code.json (config)
    │
    ├──→ product-manager → product/
    ├──→ platform-architect → technical/ + architecture-decisions
    ├──→ database-architect → technical/banco + technical/rls
    ├──→ frontend-specialist → technical/frontend
    ├──→ qa → incidents/ + lessons/
    ├──→ security → technical/seguranca + constitution
    ├──→ joefelipe-agent → todas as áreas
    │
    └──→ prompts/ (biblioteca de prompts)
          ├──→ product/ → product/ agents
          ├──→ frontend/ → frontend-specialist
          ├──→ backend/ → technical/backend
          └──→ ... (todas as categorias)
```

### Knowledge DNA → Knowledge Health → Knowledge Memory → Decision Graph
```
Layer 7 — Memória
  knowledge-dna (identidade do projeto)
    ├──→ constitution (princípios)
    ├──→ constitution-knowledge-os (padronização)
    ├──→ technical/frontend (naming)
    ├──→ technical/backend (naming)
    └──→ technical/banco (naming)
  
  knowledge-health (scorecards)
    ├──→ constitution-knowledge-os Art. 4 (critérios)
    ├──→ todas as áreas (health scores)
    └──→ 02-EXECUTIVE-DASHBOARD
  
  knowledge-memory (memória)
    ├──→ lessons-learned (lições)
    ├──→ incidents/ (incidentes)
    ├──→ 03-TIMELINE (timeline)
    └──→ decisions/ (decisões)
  
  decisions/DECISION-GRAPH
    ├──→ ADR-01 a ADR-10
    ├──→ D-014, D-015, D-016 (CSP + app_runtime), D-017 (Core×Nicho)
    ├──→ D-001 a D-005 (pendentes)
    ├──→ architecture-decisions
    └──→ strategy/strategic-decision-log
```

### Digital Operations Center → Executive Intelligence
```
Layer 6 — Operações
  ops/digital-ops-center
    ├──→ 01-CURRENT-STATE (estado)
    ├──→ 02-EXECUTIVE-DASHBOARD (dashboard)
    ├──→ knowledge-health (scores)
    ├──→ living-os/03-producao (produção)
    ├──→ incidents/ (incidentes)
    ├──→ audits/ (auditorias)
    └──→ ../queue/ (missões)
  
  ops/executive-intelligence
    ├──→ ops/digital-ops-center
    ├──→ 01-CURRENT-STATE
    ├──→ 00-HOME
    ├──→ knowledge-health
    └──→ ../queue/next-task
```

### Product Brain ← → Technical Brain
```
Product Brain (product/)
  ├──→ Digital Twin (digital-twin/)
  ├──→ Feature Genome (feature-genome/)
  ├──→ Impact Graph (impact-graph/)
  ├──→ Simulation Center (simulation-center/)
  ├──→ PRD Library (product/prds/)
  └──→ Technical Brain (technical/)
```

### Decisões → Todas as Áreas
```
Decision Center (decisions/)
  ├──→ DECISION-GRAPH (grafo de decisões)
  ├──→ architecture-decisions (ADRs)
  ├──→ strategy/strategic-decision-log
  ├──→ living-os/decisoes/decisoes-executivas
  ├──→ product/ 
  ├──→ technical/
  └──→ ops/

Core × Nicho
  ├──→ D-017 → ADR-10 (Core×Nicho)
  ├──→ maps/multgestor-core/
  │     ├──→ core/backend (backend do core)
  │     ├──→ core/frontend (frontend do core)
  │     ├──→ core/banco-de-dados (banco do core)
  │     └──→ nichos/
  ├──→ commercial-readiness (Due Diligence)
  ├──→ production-readiness (critérios)
  ├──→ capabilities-map (core completion)
  └──→ MULTGESTOR-PLATFORM-SPECIFICATION
```

### Auditorias → Due Diligence → Core × Nicho
```
Audits (audits/)
  ├──→ latest-audit (aponta Due Diligence 2026-07-03)
  ├──→ commercial-readiness (due diligence)
  │     ├──→ Core Completion Index (52/100)
  │     ├──→ production-readiness (9/14)
  │     ├──→ capabilities-map
  │     └──→ architecture-decisions ADR-10
  └──→ production-readiness → 02-EXECUTIVE-DASHBOARD
```

### Incidentes ← → Lessons ← → Timeline
```
Incident Library (incidents/)
  ├──→ lessons/ + lessons-learned
  └──→ 03-TIMELINE
        └──→ implementation-log
```

### Nichos → Core → Product → Technical
```
Nichos (nichos/)
  ├──→ digital-twin/ (gêmeo digital)
  ├──→ product/ (Product Brain)
  ├──→ technical/ (Technical Brain)
  └──→ maps/multgestor-core/nichos/
```

### Execution Flow (Knowledge OS 3.0)
```
Mission Builder (agents/mission-builder)
  → Planner (agents/planner)
    → CHECK 0 (context-confidence-engine)
      → Agent Selection (agent-skill-matrix)
        → Execution (agent + skills + providers)
          → Audit (rules/auditor-flow + qa)
            → Mission Closing Protocol V3
              → Knowledge OS update
              → Knowledge Graph update
              → Memory update
              → Timeline update
              → Decisions update
              → Next mission
```

---

## Estatísticas do Knowledge Graph

| Tipo | Quantidade |
|---|---|
| Nós (áreas/documentos) | 100+ |
| Sub-nós (subdiretórios) | 50+ |
| Relacionamentos (arestas) | 400+ via wikilinks |
| Níveis de profundidade | 6 (Home → Camada → Área → Subárea → Documento → Detalhe) |

## Como manter

1. **Todo documento novo** deve ter `Relacionamentos:` listando seus links
2. **Todo índice** deve listar seus subdocumentos
3. **Wikilinks** são obrigatórios em todos os documentos
4. **Backlinks** do Obsidian completam o grafo automaticamente
5. **Este documento** deve ser revisado quando uma nova área for criada

## Referências

- [[00-HOME]] — Homepage
- [[INDEX]] — Índice geral (7 camadas)
- [[constitution-knowledge-os]] — Constituição do Knowledge OS
- [[dna]] — DNA do conhecimento
- [[saude]] — Saúde do conhecimento
- [[memoria]] — Memória do conhecimento
- [[ops/digital-ops-center]] — Operations Center
- [[ops/executive-intelligence]] — Executive Intelligence
- [[maps/multgestor-core/MAPA-MULTGESTOR-CORE]] — Mapa vivo do Core
