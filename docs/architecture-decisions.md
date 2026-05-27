# Architecture Decisions — MultGestor Core

**Documento oficial de decisões arquiteturais**  
**Versão:** 1.0.0  
**Data:** 2026-05-18  
**Status:** OFICIAL • VINCULANTE  
**Tipo:** Core Foundation

---

## 1. Visão Oficial do Produto

### 1.1 MultGestor como Sistema Operacional Inteligente Multi-Nicho

O MultGestor não é um aplicativo. É um **core compartilhado** que orquestra **módulos verticais especializados por nicho de mercado**.

```
MultGestor Core
├── Multi-Tenant Engine     ← companies, users, modules, plans, subscriptions
├── Event Bus               ← comunicação assíncrona entre domínios
├── Integration Layer       ← adaptadores de canal (WhatsApp, Instagram, Email, SMS)
├── Automation Engine       ← triggers, conditions, actions
├── AI Operational Layer    ← assistente, predições, agentes
│
├── BarberGestor            ← Módulo vertical: barbearias
├── OdontoGestor            ← Módulo vertical: clínicas odontológicas
├── ClimaGestor             ← Módulo vertical: climatização
└── [novos nichos]          ← Expansão contínua
```

### 1.2 Princípios do Core

- **Core compartilhado**: toda lógica comum vive no core, nunca duplicada por nicho
- **Módulos verticais**: cada nicho implementa apenas regras específicas do negócio
- **Isolamento multi-tenant**: dados de clientes de diferentes empresas nunca se misturam
- **Event-Driven**: toda ação relevante emite um evento; sistemas reagem a eventos
- **AI-ready**: a camada de IA é plugável e opera sobre eventos e dados do core, nunca como parte dele
- **API-first**: tudo é acessível via API REST; frontend é apenas um cliente

---

## 2. Stack Oficial

### 2.1 Stack Atual

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| Frontend | React 19 + Vite 8 | ✅ Produção |
| Roteamento | React Router DOM v7 | ✅ Produção |
| Gráficos | Recharts | ✅ Produção |
| Ícones | Lucide React | ✅ Produção |
| Backend | Node.js + Express 5 | ✅ Produção |
| Banco | PostgreSQL 15+ (Supabase) | ✅ Produção |
| Storage | Supabase Storage | ✅ Produção |
| ORM | Nenhum (SQL direto via `pg.Pool`) | ✅ Produção |
| Migrations | Scripts SQL manuais | ✅ Produção |
| Autenticação | JWT (7 dias) | ✅ Produção |
| Email | Resend + SMTP fallback | ✅ Produção |
| Build | Vite (frontend) | ✅ Produção |
| Deploy frontend | Vercel | ✅ Produção |
| Deploy backend | Render | ✅ Produção |
| Versionamento | Git + GitHub | ✅ Produção |

### 2.2 Stack Emergente (Futuro Imediato)

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| TypeScript | Migração gradual, backend primeiro | 📋 Planejado |
| Validação | Zod (schemas centralizados) | 📋 Planejado |
| Repository Pattern | Kysely (query builder type-safe) | 📋 Planejado |
| Event Bus | EventEmitter + persistência (Outbox) | 📋 Planejado |
| Logger | Pino ou Winston | 📋 Planejado |
| Monorepo | Turborepo + npm workspaces | 📋 Planejado |
| Cache | Redis (pós-Repository) | 🔮 Futuro |
| Fila | RabbitMQ ou Bull | 🔮 Futuro |

### 2.3 Stack Integrada

| Ferramenta | Função | Status |
|-----------|--------|--------|
| OpenCode | IDE / orquestração de agentes IA | ✅ Ativo |
| GitHub MCP | Histórico, branches, PRs, versionamento | ✅ Ativo |
| Supabase MCP | Schema, tabelas, RLS, índices | ✅ Ativo |
| N8N | Orquestrador externo de automações (nunca source of truth) | 📋 Planejado |
| Playwright MCP | Testes de UX e fluxos frontend | 📋 Planejado |
| LLMs (IA híbrida) | Assistente operacional, predições, agentes | 🔮 Futuro |

### 2.4 Stack Proibida

| Tecnologia | Motivo |
|-----------|--------|
| Prisma / ORM pesado | Perda de controle sobre SQL, performance imprevisível |
| Next.js (agora) | Complexidade desnecessária para SPA atual |
| Docker / K8s (agora) | Infra atual (Render + Vercel) é suficiente |
| Microservices | Time único, monolito modular resolve |
| Redux / Zustand (agora) | Context API + hooks são suficientes para o estado atual |

---

## 3. Decisões Arquiteturais Oficiais

### 3.1 Monolito Modular, Não Microservices

| Campo | Valor |
|-------|-------|
| **Decisão** | Manter monolito modular com bounded contexts claros. Não migrar para microservices |
| **Motivo** | Time único, projeto em crescimento. Microservices adicionariam complexidade de rede, deploy, observabilidade sem benefício real |
| **Impacto** | Código organizado por domínio (packages), mas deploy único. Cada domínio pode virar serviço independente no futuro se necessário |
| **Risco evitado** | Over-engineering prematuro, complexidade desnecessária de infraestrutura |

### 3.2 Domain-Driven Design Parcial

| Campo | Valor |
|-------|-------|
| **Decisão** | Strategic DDD para delimitar bounded contexts. Tactical DDD onde fizer sentido (aggregates, value objects) |
| **Motivo** | DDD total exigiria mudança radical. DDD parcial já resolve o problema crítico: separar core de nicho |
| **Impacto** | Core compartilhado + módulos verticais como bounded contexts separados |
| **Risco evitado** | Lógica de nicho vazando para o core e vice-versa |

### 3.3 Core/Shared Kernel Antes de Novas Features

| Campo | Valor |
|-------|-------|
| **Decisão** | Nenhuma feature nova será implementada antes do shared kernel estar consolidado |
| **Motivo** | Sem shared kernel, cada nova feature replica padrões de código, erro e validação |
| **Impacto** | Shared kernel inclui: Error classes, BaseRepository, Validation schemas, Event Bus, Logger |
| **Risco evitado** | Dívida técnica exponencial a cada novo módulo |

### 3.4 Repository Pattern Obrigatório

| Campo | Valor |
|-------|-------|
| **Decisão** | Todo acesso a banco deve passar por um Repository. Nenhuma query SQL solta em services |
| **Motivo** | Repository é a única camada que conhece o banco. Services trabalham com domínio, não com SQL |
| **Impacto** | Services param de importar `pool`. Código vira testável. Banco pode ser trocado |
| **Risco evitado** | Impossibilidade de testar, migrar banco ou adicionar cache |

### 3.5 Event Bus Obrigatório Antes de N8N/WhatsApp/IA

| Campo | Valor |
|-------|-------|
| **Decisão** | N8N, WhatsApp e IA operacional só serão integrados após o Event Bus estar operacional |
| **Motivo** | Sem Event Bus, toda integração exige modificar services existentes, criando acoplamento |
| **Impacto** | Event Bus com Outbox pattern (persistência + entrega garantida) |
| **Risco evitado** | Acoplamento direto entre domínios e canais externos |

### 3.6 TypeScript Gradual, Backend Primeiro

| Campo | Valor |
|-------|-------|
| **Decisão** | Migração para TypeScript gradual. Backend primeiro (contratos de API). Frontend sob demanda |
| **Motivo** | TypeScript no backend previne bugs de contrato entre API e banco. Frontend pode migrar depois |
| **Impacto** | Novos módulos em TS. Arquivos legados convertidos quando modificados |
| **Risco evitado** | Parada total do desenvolvimento por migração forçada |

### 3.7 Zod para Validação Centralizada

| Campo | Valor |
|-------|-------|
| **Decisão** | Zod como schema de validação único, compartilhado entre backend e frontend |
| **Motivo** | Validações ad-hoc com regex são frágeis e inconsistentes. Zod gera erros padronizados e tipos |
| **Impacto** | Schemas em `@multgestor/shared`. Frontend valida UX, backend valida segurança |
| **Risco evitado** | Validação inconsistente entre endpoints, dados inválidos chegando ao banco |

### 3.8 company_id Como Chave Multi-Tenant Oficial

| Campo | Valor |
|-------|-------|
| **Decisão** | `company_id` é a chave de isolamento multi-tenant. `owner_id` NUNCA é usado para isolar dados |
| **Motivo** | Uma empresa pode ter múltiplos proprietários. Isolar por `owner_id` vazaria dados |
| **Impacto** | Toda query tenant inclui `WHERE company_id = $1`. Futuramente, Row-Level Security no PostgreSQL |
| **Risco evitado** | Vazamento de dados entre empresas, violação de compliance |

### 3.9 IA Como Camada Plugável, Nunca Como Core

| Campo | Valor |
|-------|-------|
| **Decisão** | IA opera sobre eventos e dados do core, mas nunca é parte do core |
| **Motivo** | IA é volátil (modelos mudam, providers mudam). O core precisa ser estável |
| **Impacto** | IA acessa dados via API, nunca via banco direto. IA reage a eventos, nunca executa comandos diretos |
| **Risco evitado** | Dependência de IA para operação crítica do sistema |

### 3.10 N8N Como Orquestrador Externo, Nunca Source of Truth

| Campo | Valor |
|-------|-------|
| **Decisão** | N8N orquestra workflows externos, mas o MultGestor é sempre a source of truth |
| **Motivo** | N8N não tem garantias de entrega, idempotência ou transação |
| **Impacto** | N8N só age via API pública do MultGestor. N8N nunca altera banco direto |
| **Risco evitado** | Estado inconsistente entre N8N e MultGestor |

### 3.11 WhatsApp Como Canal, Não Como Sistema

| Campo | Valor |
|-------|-------|
| **Decisão** | WhatsApp é um canal de comunicação, não um sistema de regras de negócio |
| **Motivo** | Regras de negócio vivem no core. WhatsApp é apenas mais um canal de entrada/saída |
| **Impacto** | Mensagens do WhatsApp viram eventos. Decisões são tomadas pelo core |
| **Risco evitado** | Lógica de negócio replicada dentro da integração WhatsApp |

### 3.12 Multi-Tenant Automático (Não Manual)

| Campo | Valor |
|-------|-------|
| **Decisão** | Todo middleware de tenant DEVE injetar `company_id` automaticamente em toda query. Nenhum `WHERE company_id = $1` manual |
| **Motivo** | Queries sem `company_id` vazam dados. Automação elimina erro humano |
| **Impacto** | Repository adiciona `company_id` automaticamente. Futuramente, RLS no PostgreSQL |
| **Risco evitado** | Query sem filtro de tenant = data leak |

---

## 4. Regras Proibidas

Estas regras são **vinculantes**. Violação intencional é considerada falha arquitetural crítica.

### 🔴 Regra P1
**Nunca criar novo nicho copiando `barber.service.js`.**  
Todo novo módulo vertical deve ser implementado como bounded context independente, com seu próprio domínio, repositórios e controllers. Cópia de código legado é proibida.

### 🔴 Regra P2
**Nunca adicionar WhatsApp antes do Event Bus.**  
WhatsApp depende de eventos para funcionar corretamente (notificações, respostas automáticas, campanhas). Sem Event Bus, a integração vira código acoplado e frágil.

### 🔴 Regra P3
**Nunca adicionar IA operacional antes de domínios claros.**  
IA precisa de bounded contexts bem definidos para operar. Sem fronteiras claras, a IA toma decisões com contexto errado.

### 🔴 Regra P4
**Nunca colocar lógica crítica no frontend.**  
Frontend é um cliente descartável. Toda regra de negócio, validação de segurança e cálculo financeiro vive no backend.

### 🔴 Regra P5
**Nunca deixar N8N alterar banco direto.**  
N8N só se comunica com o MultGestor via API pública. N8N nunca tem credenciais de banco.

### 🔴 Regra P6
**Nunca deixar IA acessar banco direto.**  
IA acessa dados exclusivamente via API do MultGestor. IA nunca tem connection string ou pool do banco.

### 🔴 Regra P7
**Nunca criar automações sem eventos.**  
Toda automação deve ser gatilhada por um evento do Event Bus. Automações baseadas em polling, cron ou hooks diretos são proibidas.

### 🔴 Regra P8
**Nunca usar `owner_id` para multi-tenant.**  
`company_id` é a única chave de isolamento. `owner_id` é apenas uma referência opcional.

### 🔴 Regra P9
**Nunca expor tokens, secrets ou chaves de API no frontend.**  
Frontend não é confiável. Toda chave de integração (WhatsApp, pagamento, etc.) vive criptografada no banco e é acessada exclusivamente pelo backend.

---

## 5. Roadmap Oficial

### Fase 1: Shared Kernel + Repository
**Duração estimada:** 2 semanas  
**Entrega:** Fundação compartilhada para todos os módulos

- Extrair Error classes, BaseRepository, Validation utils
- Implementar Repository Pattern para uma entidade piloto (ex: `barber_services`)
- Zod schemas para endpoints críticos
- Central error handling middleware
- Logger estruturado (Pino)

**Plano detalhado:** [shared-kernel-implementation.md](./shared-kernel-implementation.md)

### Fase 2: Quebrar `barber.service.js`
**Duração estimada:** 2 semanas  
**Entrega:** Serviços de domínio independentes

- Extrair AnalyticsService, CrmService, StorageService
- Quebrar em ~12 domain services (Services, Products, Suppliers, Collaborators, Appointments, Schedule, Sales, Cash, Commissions, CRM, Branding, Analytics)
- Migrar queries para Repository Pattern
- Dependency Injection container

### Fase 3: Desacoplar `Barber.jsx`
**Duração estimada:** 2 semanas  
**Entrega:** Componentes independentes, hooks customizados

- Extrair estado para hooks customizados (useServices, useSales, useAppointments, etc.)
- Separar views em páginas independentes
- Eliminar duplicação entre `Barber.jsx` e `features/barber/utils/`

### Fase 4: Event Bus
**Duração estimada:** 2 semanas  
**Entrega:** Event Bus com Outbox pattern

- Implementar EventEmitter + persistência em banco
- Eventos: SaleCreated, AppointmentConfirmed, CollaboratorAdded, CompanyPlanChanged
- Migrar webhooks (Kiwify) para eventos
- Migrar envio de email para eventos assíncronos
- Multi-tenant automático (middleware + repository)

### Fase 5: Integration Layer
**Duração estimada:** 2 semanas  
**Entrega:** Abstraction de canais de comunicação

- ChannelAdapter interface (send, receive, status)
- WhatsApp Cloud API como primeiro canal
- Templates de mensagens
- Fila de envio com retry
- Webhook receiver unificado

### Fase 6: Automation Engine
**Duração estimada:** 2 semanas  
**Entrega:** Motor de automação baseado em eventos

- Trigger registry: "quando evento X acontecer"
- Condition engine: "se Y for verdadeiro"
- Action registry: "executar Z"
- Templates de automação por nicho
- Integração com N8N como executor externo

### Fase 7: Omnichannel
**Duração estimada:** 2 semanas  
**Entrega:** Inbox unificada

- Inbox multi-canal (WhatsApp, Instagram, Email)
- CRM conversacional
- Histórico omnichannel por cliente
- Campanhas multicanal

### Fase 8: AI Operational Layer
**Duração estimada:** 4 semanas  
**Entrega:** IA operacional plugável

- Assistente conversacional com contexto do sistema
- Predições de demanda, churn e receita
- Agentes autônomos (scheduler, marketer, analyst)
- AI context layer (ferramentas que a IA pode chamar via API)

### Fase 9: Novos Nichos
**Duração estimada:** 2-4 semanas por nicho  
**Entrega:** Expansão vertical do MultGestor

- OdontoGestor
- ClimaGestor
- Outros nichos sob demanda

---

## 6. Regra Final — Checklist de Implementação

Toda nova implementação deve responder **obrigatoriamente** a estas perguntas antes de ser aprovada:

| # | Pergunta | Critério |
|---|----------|----------|
| 1 | **Pertence ao Core ou ao nicho?** | Se for comum a múltiplos nichos → Core. Se for específico de um nicho → módulo vertical |
| 2 | **Precisa emitir evento?** | Se outra parte do sistema precisa reagir → sim. Se for operação isolada → não |
| 3 | **Precisa de feature guard?** | Se estiver atrelado a plano/assinatura → sim. Se for funcionalidade base → não |
| 4 | **Afeta planos?** | Se mudar limites, features ou preços → sim. Se for refatoração → não |
| 5 | **Afeta automações?** | Se mudar fluxo que automações usam → sim. Se for interna → não |
| 6 | **Afeta IA futura?** | Se criar/alterar dados que IA consome → sim. Se for UI pura → não |
| 7 | **Respeita `company_id`?** | Se acessa dados de tenant → obrigatório. Se for global (plans, modules) → não |
| 8 | **Mantém o MultGestor escalável?** | Se reduz acoplamento, duplicação ou dívida → sim. Se aumenta → reavaliar |

### Resposta Padrão para Novas Implementações

```markdown
## Checklist — [Nome da Feature]

| Pergunta | Resposta | Justificativa |
|----------|----------|---------------|
| Core ou nicho? | core/nicho | ... |
| Emite evento? | sim/não | ... |
| Feature guard? | sim/não | ... |
| Afeta planos? | sim/não | ... |
| Afeta automações? | sim/não | ... |
| Afeta IA? | sim/não | ... |
| company_id? | sim/não | ... |
| Escalável? | sim/não | ... |

**Decisão:** ✅ Aprovada / ❌ Rejeitada / ⏳ Pendente
```

---

## 7. Referências

### Documentos Internos

| Documento | Caminho |
|-----------|---------|
| Memória de decisões técnicas | `.agent/memory/decisions.md` |
| Registro GitHub MCP | `.agent/memory/github-mcp-registry.md` |
| Contexto do projeto | `.agent/memory/project-context.md` |
| Arquitetura atual | `.agent/context/architecture.md` |
| Stack definida | `.agent/context/stack.md` |
| Regras operacionais de IA | `.agent/context/ai-operating-rules.md` |
| Roadmap completo | `.agent/context/roadmap.md` |

### Stack Atual (Arquivos)

| Recurso | Caminho |
|---------|---------|
| Backend package.json | `backend/package.json` |
| Frontend package.json | `frontend/package.json` |
| OpenCode config | `C:\Users\Joefe\.config\opencode\opencode.json` |
| Env backend | `backend/.env` |
| Env frontend dev | `frontend/.env.development` |
| Env frontend prod | `frontend/.env.production` |
| Vercel config | `frontend/vercel.json` |
| Vite config | `frontend/vite.config.js` |

---

## 8. Proteção Arquitetural do Core

### 8.1 Riscos Críticos do Projeto

O MultGestor Core protege sua arquitetura contra os seguintes riscos críticos neste estágio de evolução (transição de SaaS tradicional para capability-driven core + event-driven architecture + AI Operational infrastructure):

| # | Risco | Descrição | Consequência | Mitigação |
|---|-------|-----------|-------------|-----------|
| PR-01 | **Overengineering precoce** | Adicionar complexidade (microservices, Kafka, Kubernetes) antes de ser necessário | Atraso no roadmap, desperdício de recursos, complexidade desnecessária | Pattern Selection (simplicidade primeiro), Faseamento claro no roadmap |
| PR-02 | **IA acelerando implementação errada** | IA/agentes gerarem código rápido na direção errada, sem seguir a topologia do Core | Dívida técnica acelerada, arquitetura inconsistente, retrabalho | Validação obrigatória contra a topologia de dependências (seção 5) |
| PR-03 | **Automações antes do Core maduro** | Implementar N8N, WhatsApp ou IA operacional antes do Event Bus e Shared Kernel | Acoplamento direto entre domínios e canais externos, impossibilidade de evoluir | Bloqueio por dependência topológica: C-04 → C-05/C-06/C-09 |
| PR-04 | **Múltiplos padrões concorrentes** | Diferentes agentes/agendas implementando padrões diferentes (ex: repository vs query direta, REST vs GraphQL) | Inconsistência arquitetural, dificuldade de manutenção | Stack oficial (seção 2.3), Stack proibida (seção 2.4) |
| PR-05 | **Capabilities duplicadas** | Criar capabilities que já existem no Core ou poderiam ser resolvidas por capabilities existentes | Inchaço do Core, contradição entre capacidades, confusão de responsabilidades | Registry central de capabilities + checklist pré-criação |

### 8.2 Validações Obrigatórias Antes de Toda Implementação

Antes de qualquer implementação, o Master Orchestrator DEVE validar obrigatoriamente cada item desta lista. Se QUALQUER resposta for negativa ou incerta, a implementação NÃO pode prosseguir sem documentação, revisão e planejamento adicionais.

| # | Validação | Critério | Onde verificar |
|---|-----------|----------|----------------|
| V-01 | **Essa capability realmente precisa existir agora?** | Não é desejo futuro, não é "vai precisar um dia", não é experimento | Roadmap oficial + Prioridade P0-P4 |
| V-02 | **Já existe algo equivalente no Core?** | Nenhuma capability duplicada; se existir, deve ser reutilizada | Capabilities Map (docs/capabilities-map.md) |
| V-03 | **O Shared Kernel suporta essa implementação?** | Error classes, Zod schemas, Logger, BaseRepository existem? | C-01 Status no Capabilities Map |
| V-04 | **Existe contrato/event contract definido?** | Se envolve comunicação assíncrona, o evento e o schema estão registrados | Event Bus Architecture (docs/event-bus-architecture.md) |
| V-05 | **Existe tenant isolation (`company_id`)?** | Toda operação multi-tenant respeita `WHERE company_id = $1` | C-02 Multi-Tenant Engine |
| V-06 | **Existe rollback plan?** | É possível desfazer esta implementação sem dano colateral | Plano de rollback documentado |
| V-07 | **Existe observabilidade?** | Logs, métricas, tracing para esta capability | Pino logger + Correlation IDs |
| V-08 | **Existe impacto no Event Bus?** | Se produz ou consome eventos, o Event Bus está pronto? | C-04 Status |
| V-09 | **Existe risco de acoplamento?** | Esta implementação pode ser removida sem quebrar outras? | Análise de dependências |
| V-10 | **Existe dependência topológica anterior?** | Todas as capabilities das quais esta depende já estão implementadas? | Matriz de dependências (seção 5) |
| V-11 | **Isso viola capability governance?** | Regras R-CAP-01 a R-CAP-07 são respeitadas? | Capabilities Map seção 7 |
| V-12 | **Isso gera padrão paralelo?** | Segue a Stack Oficial ou introduz tecnologia/abordagem diferente? | Stack Oficial (seção 2.3) |
| V-13 | **Isso está alinhado ao Capability-Driven Core?** | É uma capability reutilizável ou lógica específica de nicho? | Core vs nicho (seção 6) |

### 8.3 Regra Central

> **Se a resposta for incerta, NÃO implementar.**
> **Primeiro documentar, revisar e planejar.**

### 8.4 Execution Gate — Proteção Arquitetural

A Proteção Arquitetural é o **Gate 6** oficial do fluxo de implementação (após os 5 gates do Master Orchestrator):

```
Gate 1 — Contexto Reconstruído
Gate 2 — Risco Classificado
Gate 3 — Pipeline Montado
Gate 4 — Safe To Implement
Gate 5 — Final Validation
═══════════════════════════════
Gate 6 — Proteção Arquitetural  ← NOVO
    ├── [ ] V-01 a V-13 validados
    ├── [ ] Nenhum risco PR-01 a PR-05 identificado
    ├── [ ] Topologia de dependências respeitada
    ├── [ ] Nenhum padrão paralelo introduzido
    └── [ ] Alinhado ao Capability-Driven Core
```

Se **qualquer** validação falhar, o fluxo DEVE parar e retornar para documentação/planejamento.

### 8.5 AI Operational Constraint

**Regra R-ARC-01: Nenhum agente de IA pode implementar fora da ordem topológica do Core.**

A ordem topológica oficial é definida na Matriz de Dependências (seção 5 deste documento):

```
C-01 Shared Kernel          → 1º
C-02 Multi-Tenant Engine    → 2º
C-03 Repository Pattern     → 3º
C-04 Event Bus              → 3º
C-09 N8N Bridge             → 4º (depende de C-04)
C-05 Integration Layer      → 5º (depende de C-04)
C-06 Automation Engine      → 6º (depende de C-04, C-05)
C-08 Omnichannel Layer      → 7º (depende de C-05, C-06)
C-07 AI Operational Layer   → 8º (depende de C-04, C-06)
```

IA/agentes **não podem**:
- ❌ Implementar capability de nível superior antes das suas dependências
- ❌ Pular capabilities no roadmap
- ❌ Implementar versão "simplificada" de capability quebre a ordem topológica
- ❌ Criar capability paralela que duplique responsabilidade de capability existente

### 8.6 Regras Oficiais de Proteção

| # | Regra | Violação | Consequência |
|---|-------|----------|-------------|
| R-ARC-01 | Nenhum agente de IA pode implementar fora da ordem topológica do Core | Implementar C-07 antes de C-04 | Rejeitado no Gate 6 |
| R-ARC-02 | Nenhuma capability pode ser criada sem passar pelo checklist V-01 a V-13 | Capability criada sem validação | Capability marcada como não-conforme |
| R-ARC-03 | Nenhuma automação externa antes do Event Bus | N8N ou WhatsApp sem C-04 | Bloqueado por dependência topológica |
| R-ARC-04 | Nenhum padrão paralelo pode coexistir sem decisão arquitetural oficial | REST + GraphQL concorrentes sem ADR | Revisão arquitetural obrigatória |
| R-ARC-05 | Nenhuma capability duplicada pode existir | C-02 e X-01 com sobreposição | Consolidação obrigatória |

### 8.7 Anti-Fragility Layer

A Proteção Arquitetural funciona como uma **camada antifrágil** que:

- **Absorve** o ímpeto de implementação rápida (típico de IA/agentes)
- **Redireciona** para documentação, revisão e planejamento quando a resposta é incerta
- **Fortalece** o Core ao garantir que cada implementação segue a ordem correta
- **Evolui** com o próprio Core — novas capabilities adicionam novas validações ao checklist

A cada iteração, o sistema de proteção fica mais inteligente:
- Novas capabilities expandem o checklist V-01 a V-13
- Novos riscos são adicionados a PR-01 a PR-05
- Novos padrões proibidos são registrados na Stack Proibida

---

*Este documento é vinculante para todas as implementações no MultGestor Core.*  
*Dúvidas arquiteturais devem ser resolvidas consultando o Master Orchestrator ou o arquiteto principal do projeto.*
