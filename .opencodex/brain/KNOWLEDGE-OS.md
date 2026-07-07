# 💡 Knowledge OS — Sistema Operacional de Conhecimento

> **Status:** OFICIAL • VIVO
> **Camada:** 7 — Memória
> **Knowledge OS Version:** 3.0.0
> **Atualizado:** 2026-07-04
> **Propósito:** Responder rapidamente às perguntas certas sobre o MultGestor — sem precisar navegar por dezenas de documentos.
> **Relacionamentos:** [[constitution-knowledge-os]] · [[KNOWLEDGE-GRAPH]] · [[00-HOME]] · [[INDEX]]

---

## Perguntas de Contexto

### 1. "O que estamos fazendo?"

**Resposta rápida:**
- **Missão atual:** ⏸️ `idle` — Sprint P0 autônomo concluído (17 commits locais em `main`)
- **Próxima missão:** 🔴 `release/push-p0-batch` (HUMAN_APPROVAL_REQUIRED)
- **Última missão:** `core/p0-sync` — Core×Nicho audit + Due Diligence + Platform Spec (2026-07-03)

**Fontes:**
- [[01-CURRENT-STATE#Missão Atual]]
- [[../queue/current-task]]
- [[../queue/next-task]]

### 2. "O que falta?"

**Resposta rápida:**
- **Enterprise Maturity Index:** 🟡 57/100 (era 44,5 em 26/06)
- **Core Completion Index:** 🟡 52/100
- **Produção:** ~10/14 critérios — CSP ✅, app_runtime ✅, refresh rotation ✅ (tudo local, sem push)
- **Venda:** 6/13 critérios — gap P0: webhook não seta `plan_type` (D-016)
- **Knowledge Health:** 74/100 🟡 — Skills 🔴, PRDs 🔴, Deploy 🔴
- **Gates:** Produção 🔴 · Segurança 🔴 · Vendável 🔴

**Fontes:**
- [[production-readiness]]
- [[commercial-readiness]]
- [[knowledge-health]]
- [[living-os/gates/]]

### 3. "Por que decidimos isso?"

**Resposta rápida:**
- **ADRs:** 9 decisões arquiteturais vinculantes (ADR-01 a ADR-09)
- **Decisões executivas:** D-014, D-015, D-016 (JoeFelipe premium), D-017 (Core×Nicho) decididas. D-001 a D-005 pendentes.
- **Decision Graph:** [[decisions/DECISION-GRAPH]] — grafo completo com contexto, alternativas, consequências

**Fontes:**
- [[decisions/DECISION-GRAPH]]
- [[architecture-decisions]]
- [[decisions/README]]

### 4. "Qual PR mudou isso?"

**Resposta rápida:**
- Consulte [[03-TIMELINE]] — cada evento lista PRs relacionados
- Ou [[implementation-log]] — registro detalhado por implementação

### 5. "Qual deploy publicou isso?"

**Resposta rápida:**
- Consulte [[03-TIMELINE]] — cada evento lista o deploy
- Ou [[01-CURRENT-STATE#Últimos Deploys]]

### 6. "Qual auditoria validou isso?"

**Resposta rápida:**
- [[audits/README]] — índice de todas as auditorias realizadas
- Última: Due Diligence Enterprise (2026-07-03) — Maturity 57/100

### 7. "Qual módulo depende disso?"

**Resposta rápida:**
- Consulte [[technical/DEPENDENCY-MAP]] — mapa completo de dependências
- Ou [[digital-twin/README]] — gêmeo digital de cada módulo
- Ou [[impact-graph/README]] — matriz de impacto

### 8. "Qual risco existe?"

**Resposta rápida:**
- **P0:** Release gate (main divergiu de origin/main, 3 conflitos), circuito de receita (webhook não seta `plan_type`)
- **P1:** RLS companies/users sem policy (R-002), Redis ausente em prod (R-003), migration fail silencioso (R-004)
- **Knowledge Health:** Skills 5/15 🔴, PRDs 8/15 🔴, Deploy 7/15 🔴

**Fontes:**
- [[living-os/riscos/riscos-ativos]]
- [[knowledge-health]]
- [[01-CURRENT-STATE#Riscos Ativos]]

### 9. "Quem é responsável?"

**Resposta rápida:**
- **Agentes:** [[agents/README]] — 10 agentes documentados com responsabilidades
- **Agent × Skill Matrix:** [[agents/agent-skill-matrix]] — mapeamento completo
- **Gates:** Decisão humana pendente

**Fontes:**
- [[agents/README]]
- [[agents/agent-skill-matrix]]

### 10. "O que vem depois?"

**Resposta rápida:**
- **Imediato:** 🔴 `release/push-p0-batch` (merge origin/main + push 29 commits + deploy)
- **Infra:** Redis em prod (D-002), RLS companies/users policies
- **Product:** Circuito de receita (P0 — webhook plan_type), WhatsApp real (Meta), LGPD
- **Estratégico:** Fundação Segura (~10/14) → Piloto Pago → Multi-nicho (Core 52/100 → 75+)

**Fontes:**
- [[../queue/next-task]]
- [[../queue/backlog]]
- [[ops/executive-intelligence]]
- [[product/roadmap]]

## Perguntas do Knowledge OS 3.0

### 11. "Qual o impacto de alterar X?"

**Resposta rápida:**
- Consulte [[impact-graph/README]] — Impact Graph com análises de impacto
- Consulte [[simulation-center/README]] — simulações de cenários

### 12. "Qual o DNA desta funcionalidade?"

**Resposta rápida:**
- Consulte [[feature-genome/README]] — Feature Genome com DNA completo
- Exemplos: [[feature-genome/GENOME-agendamento]], [[feature-genome/GENOME-gestao-caixa]]

### 13. "Qual o estado do conhecimento?"

**Resposta rápida:**
- **Health Score Global:** 74/100 🟡
- **Areas críticas:** Skills 🔴 (5/15), PRDs 🔴 (8/15), Deploy 🔴 (7/15)
- **Areas saudáveis:** Agentes 🟢 (15/15), Auditorias 🟢 (13/15), Arquitetura 🟢 (14/15), Backend 🟢 (13/15)

**Fontes:**
- [[knowledge-health]]
- [[knowledge-dna]]
- [[knowledge-memory]]

### 14. "Qual agente usar para esta tarefa?"

**Resposta rápida:**
- Consulte [[agents/agent-skill-matrix]] — matriz completa agente × skill × especialidade
- Para produto: Product Manager
- Para arquitetura: Platform Architect
- Para banco: Database Architect
- Para frontend: Frontend Specialist
- Para testes: QA
- Para segurança: Security

### 15. "O que acontece se removermos X?"

**Resposta rápida:**
- Consulte [[simulation-center/README]] — simulações documentadas
- [[simulation-center/SIMULATION-remove-tabela-x]] — impacto de remover `appointments`
- [[simulation-center/SIMULATION-migra-banco]] — impacto de migrar banco
- [[simulation-center/SIMULATION-adiciona-recorrencia]] — impacto de adicionar recorrência

---

## Query Rápida

| Pergunta | Resposta em 1 linha | Fonte |
|---|---|---|---|
| O que estamos fazendo? | ⏸️ idle — sprint P0 concluído | [[../queue/current-task]] |
| O que falta? | Maturity 57/100, Core 52/100, ~10/14 prod | [[knowledge-health]] |
| Por que decidimos isso? | ADR-XX, D-XXX ou consultar DECISION-GRAPH | [[decisions/DECISION-GRAPH]] |
| Qual PR mudou isso? | PR #[número] em [[03-TIMELINE]] | [[03-TIMELINE]] |
| Qual deploy publicou isso? | Deploy em [[03-TIMELINE]] | [[03-TIMELINE]] |
| Qual auditoria validou isso? | Due Diligence 2026-07-03 (última) | [[audits/README]] |
| Qual módulo depende disso? | [[technical/DEPENDENCY-MAP]] | [[technical/DEPENDENCY-MAP]] |
| Qual risco existe? | P0 release + billing · P1 RLS, Redis, migration | [[knowledge-health]] |
| Quem é responsável? | Ver [[agents/agent-skill-matrix]] | [[agents/agent-skill-matrix]] |
| O que vem depois? | `release/push-p0-batch` (HUMAN_REQUIRED) | [[../queue/next-task]] |
| Impacto de alterar X? | Ver [[impact-graph/README]] | [[impact-graph/README]] |
| DNA da funcionalidade? | Ver [[feature-genome/README]] | [[feature-genome/README]] |
| Estado do conhecimento? | Health 74/100 🟡 | [[knowledge-health]] |
| Qual agente usar? | Ver [[agents/agent-skill-matrix]] | [[agents/agent-skill-matrix]] |
| O que acontece se...? | Ver [[simulation-center/README]] | [[simulation-center/README]] |

---

## Arquitetura do Knowledge OS 3.0

```
┌──────────────────────────────────────────────────────────────────┐
│                     INTERFACE (Obsidian)                          │
│  Graph View · Backlinks · Wikilinks · Navegação                  │
├──────────────────────────────────────────────────────────────────┤
│                     QUERY LAYER (15 Perguntas)                    │
│  Contexto · Impacto · DNA · Agentes · Simulação                  │
├──────────────────────────────────────────────────────────────────┤
│                     KNOWLEDGE GRAPH (400+ arestas)                │
│  [[KNOWLEDGE-GRAPH]] — Relacionamentos explícitos               │
├──────────────────────────────────────────────────────────────────┤
│                     7 CAMADAS LÓGICAS                             │
│  Layer 1: Conhecimento (PRDs, Digital Twin, Impact, Simulation)  │
│  Layer 2: Contexto (Estado, Roadmap, Riscos, Backlog)            │
│  Layer 3: Inteligência (Agentes, Skills, Prompts, Pipeline)      │
│  Layer 4: Produto (Product Brain, Nichos, Pricing)               │
│  Layer 5: Engenharia (Tech Brain, CI/CD, Deploy, Observab.)      │
│  Layer 6: Operações (Playbooks, Auditorias, Incidentes)          │
│  Layer 7: Memória (Timeline, Decisões, DNA, Health)              │
├──────────────────────────────────────────────────────────────────┤
│                     CONSTITUTION + GOVERNANÇA                     │
│  [[constitution-knowledge-os]] · [[constitution]] · [[rules]]     │
│  [[context-confidence-engine]] · [[ops/mission-closing-protocol]] │
└──────────────────────────────────────────────────────────────────┘
```

## Como manter o Knowledge OS vivo

1. **Toda missão concluída** → executar [[ops/mission-closing-protocol]] V3
2. **Toda resposta nova** → pode virar um atalho neste documento
3. **Toda pergunta frequente** → deve ter resposta no Knowledge OS
4. **Revisar as 15 perguntas** a cada mês
5. **Knowledge Health** deve ser recalculado a cada missão que altera o brain

## Referências

- [[constitution-knowledge-os]] — Constituição do Knowledge OS
- [[00-HOME]] — Homepage (porta de entrada)
- [[INDEX]] — Índice geral (7 camadas)
- [[KNOWLEDGE-GRAPH]] — Grafo de relacionamentos
- [[knowledge-health]] — Scorecards de saúde
- [[knowledge-dna]] — DNA do conhecimento
- [[knowledge-memory]] — Memória do conhecimento
- [[ops/digital-ops-center]] — Operations Center
- [[ops/executive-intelligence]] — Executive Intelligence
- [[ops/mission-closing-protocol]] — Protocolo de encerramento V3
