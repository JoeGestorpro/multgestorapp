# Capabilities Map — MultGestor Core

**Mapa oficial de capabilities do MultGestor Core**  
**Versão:** 1.0.0  
**Data:** 2026-05-18  
**Status:** OFICIAL • VIVO  
**Tipo:** Core Foundation — Arquitetura  

---

## Propósito deste documento

Mapear **todas as capabilities** do MultGestor Core, suas responsabilidades, donos, dependências e ciclo de vida.

Este mapa permite:
- entender o que cada parte do sistema faz
- saber quem depende do quê
- planejar a ordem de implementação
- evitar duplicação de capabilities
- identificar gaps na arquitetura
- onboardar novos desenvolvedores e agentes

---

## 1. O que é uma Capability

**Capability** é um bloco de infraestrutura ou domínio compartilhado que pode ser utilizado por **qualquer módulo vertical** (BarberGestor, OdontoGestor, ClimaGestor, etc.).

### Tipos de Capability

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **Core** | Infraestrutura fundamental do sistema | Multi-Tenant Engine, Event Bus |
| **Domínio** | Lógica de negócio compartilhável | Billing, Plans, Modules |
| **Integração** | Conexão com sistemas externos | Integration Layer, N8N Bridge |
| **Operacional** | Automação e processos | Automation Engine, Scheduler |
| **IA** | Inteligência artificial | AI Assistant, Predictions |
| **Apresentação** | Interface com usuário | Frontend Shell, Design System |
| **MCP** | Protocolo de contexto para agentes | GitHub MCP, Supabase MCP |

### Critérios para ser uma Capability

Algo é uma capability se:
- pode ser usado por **mais de um módulo**
- tem **interface/contrato** bem definido
- tem **dono** claro
- pode evoluir **independentemente**
- pode ser **testado** isoladamente

---

## 2. Mapa de Capabilities

### 2.1 Core Capabilities (Camada 0 — Fundação)

Estas capabilities são a **base do sistema**. Sem elas, nada funciona.

```
                  ┌──────────────────────────────┐
                  │      Shared Kernel           │
                  │  (Error, Validation, Logger) │
                  └──────────┬───────────────────┘
                             │
                  ┌──────────▼───────────────────┐
                  │    Multi-Tenant Engine        │
                  │  (Companies, Users, Modules)  │
                  └──────────┬───────────────────┘
                             │
                  ┌──────────▼───────────────────┐
                  │     Repository Pattern       │
                  │  (Data Access, Query Layer)  │
                  └──────────┬───────────────────┘
                             │
                  ┌──────────▼───────────────────┐
                  │         Event Bus             │
                  │  (Async Communication)        │
                  └──────────────────────────────┘
```

#### C-01: Shared Kernel

| Campo | Valor |
|-------|-------|
| **ID** | `C-01` |
| **Nome** | Shared Kernel |
| **Tipo** | Core |
| **Status** | 📋 Planejado |
| **Dono** | Core Team |
| **Prioridade** | P0 — Crítico |
| **Depende de** | Nada (fundação) |
| **Dependem dele** | Todas as demais capabilities |

**Entregas:**
- Error classes (AppError, ValidationError, NotFoundError, AuthError)
- BaseRepository (CRUD genérico com `company_id`)
- Zod schemas (validação centralizada)
- Central error handling middleware
- Logger estruturado (Pino)
- Utility functions (normalizeEmail, columnExists, etc.)

**Plano de implementação:** [shared-kernel-implementation.md](./shared-kernel-implementation.md)

---

#### C-02: Multi-Tenant Engine

| Campo | Valor |
|-------|-------|
| **ID** | `C-02` |
| **Nome** | Multi-Tenant Engine |
| **Tipo** | Core |
| **Status** | ✅ Parcial (manual, sem RLS) |
| **Dono** | Core Team |
| **Prioridade** | P0 — Crítico |
| **Depende de** | C-01 (Shared Kernel) |
| **Dependem dele** | Todos os módulos verticais |

**Responsabilidades:**
- Companies (CRUD, status, soft delete)
- Users (autenticação, roles, permissões)
- Modules (catálogo de módulos disponíveis)
- Company-Modules (ativação/desativação)
- Plans (definições de planos e preços)
- Subscriptions (assinaturas por empresa)
- Billing (faturamento, invoices, eventos de gateway)
- Isolamento multi-tenant via `company_id`

**Atualmente implementado:** Tabelas existem, queries manuais com `WHERE company_id = $1`.  
**Futuro:** Row-Level Security no PostgreSQL, middleware automático.

---

#### C-03: Repository Pattern

| Campo | Valor |
|-------|-------|
| **ID** | `C-03` |
| **Nome** | Repository Pattern |
| **Tipo** | Core |
| **Status** | 📋 Planejado |
| **Dono** | Core Team |
| **Prioridade** | P0 — Crítico |
| **Depende de** | C-01 (Shared Kernel), C-02 (Multi-Tenant) |
| **Dependem dele** | Todos os domain services |

**Responsabilidades:**
- Abstrair todo acesso a banco de dados
- Garantir `company_id` em toda query tenant
- Permitir troca de banco sem impacto em services
- Habilitar cache (Redis) futuramente
- Habilitar testes unitários (mock de repository)

**Ferramenta proposta:** Kysely (query builder type-safe)

---

#### C-04: Event Bus

| Campo | Valor |
|-------|-------|
| **ID** | `C-04` |
| **Nome** | Event Bus |
| **Tipo** | Core |
| **Status** | 📋 Planejado |
| **Dono** | Core Team |
| **Prioridade** | P0 — Crítico |
| **Depende de** | C-01 (Shared Kernel), C-02 (Multi-Tenant) |
| **Dependem dele** | C-05 (Integration), C-06 (Automation), C-07 (AI), C-08 (Omnichannel) |

**Responsabilidades:**
- Publicação e consumo de eventos assíncronos
- Outbox pattern (persistência + entrega garantida)
- Dead letter queue para eventos com falha
- Retry com backoff exponencial

**Eventos planejados:**

| Evento | Trigger | Consumidores |
|--------|---------|--------------|
| `SaleCreated` | Nova venda | Email, WhatsApp, CRM, Analytics |
| `AppointmentConfirmed` | Agendamento confirmado | Email, WhatsApp, Scheduler |
| `AppointmentCanceled` | Cancelamento | Email, WhatsApp, CRM |
| `CollaboratorAdded` | Novo colaborador | Email, Onboarding |
| `CompanyPlanChanged` | Mudança de plano | Billing, Feature Guards |
| `CompanyCreated` | Nova empresa | Onboarding, Email |
| `PaymentReceived` | Pagamento confirmado | Billing, Invoice, Email |
| `LowStockDetected` | Estoque baixo | Notification, Email |

---

### 2.2 Integration Capabilities (Camada 1 — Canais)

```
                  ┌──────────────────────────────┐
                  │         Event Bus             │
                  │        (C-04)                 │
                  └──────┬───────────┬───────────┘
                         │           │
              ┌──────────▼──┐  ┌─────▼──────────┐
              │ Integration │  │  N8N Bridge    │
              │ Layer (C05) │  │   (C-09)       │
              └──────┬──────┘  └─────┬──────────┘
                     │               │
        ┌────────────┼────────────┐  │
        ▼            ▼            ▼  │
  ┌──────────┐ ┌──────────┐ ┌──────┐ │
  │ WhatsApp │ │Instagram │ │Email │ │
  │ Cloud API│ │  Direct  │ │ (Já  │ │
  │          │ │          │ │existe│ │
  └──────────┘ └──────────┘ └──────┘ │
                                      │
        ┌─────────────────────────────┘
        ▼
  ┌──────────┐
  │   N8N    │
  │ Workflows│
  └──────────┘
```

#### C-05: Integration Layer

| Campo | Valor |
|-------|-------|
| **ID** | `C-05` |
| **Nome** | Integration Layer |
| **Tipo** | Integração |
| **Status** | 📋 Planejado |
| **Dono** | Core Team |
| **Prioridade** | P1 — Essencial |
| **Depende de** | C-04 (Event Bus) |
| **Dependem dele** | C-08 (Omnichannel) |

**Responsabilidades:**
- ChannelAdapter interface (send, receive, status, webhook)
- Gerenciamento de tokens criptografados por empresa
- Templates de mensagens por canal
- Fila de envio com retry
- Webhook receiver unificado

**Canais planejados:**

| Canal | Status | Prioridade |
|-------|--------|-----------|
| WhatsApp Cloud API | 📋 Planejado | Alta |
| Email (Resend) | ✅ Existe (fora do Integration Layer) | Precisa migrar |
| Instagram Direct | 🔮 Futuro | Média |
| SMS | 🔮 Futuro | Baixa |
| Push Notification | 🔮 Futuro | Baixa |

---

#### C-09: N8N Bridge

| Campo | Valor |
|-------|-------|
| **ID** | `C-09` |
| **Nome** | N8N Bridge |
| **Tipo** | Integração |
| **Status** | 📋 Planejado |
| **Dono** | Core Team |
| **Prioridade** | P1 — Essencial |
| **Depende de** | C-04 (Event Bus) |
| **Dependem dele** | Workflows de automação |

**Responsabilidades:**
- Expor webhooks para N8N se conectar
- Receber ações do N8N via API (validadas)
- N8N **nunca** acessa banco direto
- N8N **nunca** é source of truth

---

### 2.3 Operational Capabilities (Camada 2 — Processos)

```
                  ┌──────────────────────────────┐
                  │         Event Bus             │
                  │        (C-04)                 │
                  └──────────┬───────────────────┘
                             │
                  ┌──────────▼───────────────────┐
                  │     Automation Engine         │
                  │   (Triggers, Conditions,      │
                  │    Actions, Workflows)        │
                  │         (C-06)                │
                  └──────────┬───────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌────────────┐ ┌────────────┐ ┌────────────┐
      │  Campaign  │ │ Scheduler  │ │  Workflow  │
      │  Manager   │ │            │ │ Templates  │
      └────────────┘ └────────────┘ └────────────┘
```

#### C-06: Automation Engine

| Campo | Valor |
|-------|-------|
| **ID** | `C-06` |
| **Nome** | Automation Engine |
| **Tipo** | Operacional |
| **Status** | 📋 Planejado |
| **Dono** | Core Team |
| **Prioridade** | P1 — Essencial |
| **Depende de** | C-04 (Event Bus), C-05 (Integration Layer) |
| **Dependem dele** | C-07 (AI), C-08 (Omnichannel) |

**Responsabilidades:**
- Trigger registry: "quando evento X acontecer"
- Condition engine: "se Y for verdadeiro"
- Action registry: "executar Z"
- Workflow definitions
- Campaign scheduling
- Template library por nicho

**Triggers planejados:**

| Trigger | Evento | Ação possível |
|---------|--------|---------------|
| Novo agendamento | `AppointmentConfirmed` | Enviar WhatsApp, Email confirmação |
| Cancelamento | `AppointmentCanceled` | Liberar horário, notificar |
| Aniversariante | `Cron: diário` | Enviar promoção |
| Estoque baixo | `LowStockDetected` | Notificar admin, email fornecedor |
| Cliente inativo | `Cron: semanal` | Campanha de reengajamento |
| Venda alta | `SaleCreated` (valor > X) | Notificar, comemorar |

---

### 2.4 AI Capabilities (Camada 3 — Inteligência)

```
                  ┌──────────────────────────────┐
                  │         Event Bus             │
                  │        (C-04)                 │
                  └──────────┬───────────────────┘
                             │
                  ┌──────────▼───────────────────┐
                  │     AI Operational Layer      │
                  │   (Assistant, Predictions,    │
                  │    Agents, Context)           │
                  │         (C-07)                │
                  └──────────┬───────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌────────────┐ ┌────────────┐ ┌────────────┐
      │ Assistant  │ │ Predictions│ │  Agents    │
      │ (Chat/     │ │ (Demand,   │ │ (Scheduler,│
      │  Comandos) │ │  Churn,    │ │  Marketer, │
      │            │ │  Revenue)  │ │  Analyst)  │
      └────────────┘ └────────────┘ └────────────┘
```

#### C-07: AI Operational Layer

| Campo | Valor |
|-------|-------|
| **ID** | `C-07` |
| **Nome** | AI Operational Layer |
| **Tipo** | IA |
| **Status** | 🔮 Futuro |
| **Dono** | Core Team + AI Team |
| **Prioridade** | P2 — Estratégico |
| **Depende de** | C-04 (Event Bus), C-06 (Automation), C-03 (Repository), C-02 (Multi-Tenant) |
| **Dependem dele** | Nada (camada mais externa) |

**Responsabilidades:**
- Assistente conversacional com contexto do sistema
- Predições de demanda, churn e receita
- Agentes autônomos (scheduler, marketer, analyst)
- AI context layer (ferramentas que a IA pode chamar)

**Sub-capabilities:**

| Sub-ID | Nome | Função |
|--------|------|--------|
| C-07.1 | AI Assistant | Chat contextual, comandos em linguagem natural |
| C-07.2 | Demand Predictions | Previsão de agendamentos, horários de pico |
| C-07.3 | Churn Predictions | Score de risco de cancelamento |
| C-07.4 | Revenue Predictions | Projeção de faturamento |
| C-07.5 | AI Scheduler Agent | Agendamento automático inteligente |
| C-07.6 | AI Marketer Agent | Campanhas automáticas segmentadas |
| C-07.7 | AI Analyst Agent | Geração automática de relatórios |

**Regras:**
- IA nunca acessa banco direto
- IA só opera via API pública
- IA nunca modifica dados sem confirmação
- IA é plugável (modelos trocáveis)

---

### 2.5 Experience Capabilities (Camada 4 — Experiência)

```
                  ┌──────────────────────────────┐
                  │   Integration Layer (C-05)   │
                  │   Automation Engine (C-06)   │
                  └──────────┬───────────────────┘
                             │
                  ┌──────────▼───────────────────┐
                  │     Omnichannel Layer         │
                  │   (Inbox, Campaigns, CRM      │
                  │    Conversacional)            │
                  │         (C-08)                │
                  └──────────┬───────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌────────────┐ ┌────────────┐ ┌────────────┐
      │   Inbox   │ │ Campaigns  │ │  CRM Conv  │
      │ Unificada │ │ Multicanal │ │            │
      └────────────┘ └────────────┘ └────────────┘
```

#### C-08: Omnichannel Layer

| Campo | Valor |
|-------|-------|
| **ID** | `C-08` |
| **Nome** | Omnichannel Layer |
| **Tipo** | Apresentação |
| **Status** | 🔮 Futuro |
| **Dono** | Core Team |
| **Prioridade** | P2 — Estratégico |
| **Depende de** | C-05 (Integration Layer), C-06 (Automation Engine) |
| **Dependem dele** | Nada (camada mais externa) |

**Responsabilidades:**
- Inbox unificada multi-canal
- CRM conversacional com histórico completo
- Campanhas multicanal (WhatsApp + Email + SMS)
- Analytics de engajamento

---

### 2.6 MCP Capabilities (Infraestrutura de Agentes)

```
                  ┌──────────────────────────────┐
                  │         OpenCode              │
                  │      (Engine Principal)       │
                  └──────┬───────────┬───────────┘
                         │           │
              ┌──────────▼──┐  ┌─────▼──────────┐
              │  GitHub     │  │   Supabase     │
              │  MCP (M-01) │  │   MCP (M-02)  │
              └─────────────┘  └────────────────┘
              ┌──────────┐  ┌──────────┐  ┌──────────────┐
              │ Terminal │  │Filesystem│  │  Playwright  │
              │ MCP(M-03)│  │MCP (M-04)│  │  MCP (M-05) │
              └──────────┘  └──────────┘  └──────────────┘
```

#### M-01: GitHub MCP

| Campo | Valor |
|-------|-------|
| **ID** | `M-01` |
| **Nome** | GitHub MCP |
| **Tipo** | MCP |
| **Status** | ✅ Ativo |
| **Config** | `@modelcontextprotocol/server-github` v0.6.2 |
| **Token** | `GITHUB_MCP_TOKEN` |
| **Responsabilidade** | Histórico, branches, PRs, versionamento, rastreabilidade |
| **NÃO substitui** | Filesystem MCP (código local) |

**Ferramentas disponíveis:** 26 (create_or_update_file, search_repositories, get_file_contents, push_files, create_issue, create_pull_request, list_commits, list_issues, search_code, search_users, etc.)

---

#### M-02: Supabase MCP

| Campo | Valor |
|-------|-------|
| **ID** | `M-02` |
| **Nome** | Supabase MCP |
| **Tipo** | MCP |
| **Status** | ✅ Ativo |
| **Config** | `@supabase/mcp-server-supabase@latest` |
| **Token** | `sbp_...` (access token) |
| **Responsabilidade** | Schema, tabelas, migrations, RLS, índices, queries |

**Ferramentas disponíveis:** 29

---

#### M-03: Terminal MCP

| Campo | Valor |
|-------|-------|
| **ID** | `M-03` |
| **Nome** | Terminal MCP |
| **Tipo** | MCP |
| **Status** | ✅ Ativo (built-in OpenCode) |
| **Responsabilidade** | Comandos, build, testes, migrations, lint, debug |

---

#### M-04: Filesystem MCP

| Campo | Valor |
|-------|-------|
| **ID** | `M-04` |
| **Nome** | Filesystem MCP |
| **Tipo** | MCP |
| **Status** | ✅ Ativo (workspace OpenCode) |
| **Responsabilidade** | Ler código atual, modificar arquivos locais |

---

#### M-05: Playwright MCP

| Campo | Valor |
|-------|-------|
| **ID** | `M-05` |
| **Nome** | Playwright MCP |
| **Tipo** | MCP |
| **Status** | 📋 Planejado |
| **Responsabilidade** | Validar UX, testar fluxos, revisar responsividade |

---

### 2.7 Domain Capabilities (Módulos Verticais)

```
                  ┌──────────────────────────────┐
                  │     Multi-Tenant Engine       │
                  │         (C-02)                │
                  └──────┬───────────┬───────────┘
                         │           │
              ┌──────────▼──┐  ┌─────▼──────────┐
              │ BarberGestor│  │  OdontoGestor  │
              │  (D-01)     │  │   (D-02)       │
              └─────────────┘  └────────────────┘
              ┌──────────────┐
              │ ClimaGestor  │
              │   (D-03)     │
              └──────────────┘
```

#### D-01: BarberGestor

| Campo | Valor |
|-------|-------|
| **ID** | `D-01` |
| **Nome** | BarberGestor |
| **Tipo** | Domínio (Nicho) |
| **Status** | ✅ Ativo |
| **Dono** | Core Team |
| **Depende de** | C-02 (Multi-Tenant), C-03 (Repository) |
| **Features:** | Agenda, Vendas/PDV, Caixa, Comissões, Colaboradores, Serviços, Produtos, Fornecedores, CRM, Agendamento Online, Landing Pages, Relatórios |

**Tabelas:** `barber_services`, `barber_products`, `barber_suppliers`, `barber_collaborators`, `barber_sales`, `barber_sale_items`, `barber_cash_sessions`, `barber_settlements`, `barber_advances`, `barber_appointments`, `barber_working_hours`, `barber_booking_blocks`, `barber_booking_settings`, `barber_booking_landing`, `barber_client_notes`, `barber_client_tags`, `barber_client_events`, `barber_audit_logs`

---

#### D-02: OdontoGestor

| Campo | Valor |
|-------|-------|
| **ID** | `D-02` |
| **Nome** | OdontoGestor |
| **Tipo** | Domínio (Nicho) |
| **Status** | 🔮 Futuro |
| **Dono** | — |
| **Depende de** | C-02 (Multi-Tenant), C-03 (Repository) |

**Observação:** Deve ser implementado usando as capabilities do Core, **nunca** copiando o BarberGestor.

---

#### D-03: ClimaGestor

| Campo | Valor |
|-------|-------|
| **ID** | `D-03` |
| **Nome** | ClimaGestor |
| **Tipo** | Domínio (Nicho) |
| **Status** | 🔮 Futuro |
| **Dono** | — |
| **Depende de** | C-02 (Multi-Tenant), C-03 (Repository) |

---

### 2.8 Cross-Cutting Capabilities

Estas capabilities atravessam **todas as camadas**.

#### X-01: Feature Guards / Plans

| Campo | Valor |
|-------|-------|
| **ID** | `X-01` |
| **Nome** | Feature Guards & Plans |
| **Tipo** | Cross-Cutting |
| **Status** | ⚠️ Parcial (duplicado backend + frontend) |
| **Prioridade** | P0 |
| **Responsabilidade** | Controlar acesso a features baseado no plano da empresa |

**Problema atual:** `planFeatures.js` existe tanto no backend quanto no frontend, com risk de inconsistency.  
**Solução:** Centralizar em `@multgestor/shared` e validar sempre no backend primeiro.

---

#### X-02: Observability & Logging

| Campo | Valor |
|-------|-------|
| **ID** | `X-02` |
| **Nome** | Observability & Logging |
| **Tipo** | Cross-Cutting |
| **Status** | ⚠️ Parcial (console.error apenas) |
| **Prioridade** | P1 |
| **Responsabilidade** | Logs estruturados, correlação, métricas |

**Ferramenta proposta:** Pino (logger) + correlação por request ID.

---

#### X-03: Validation (Zod)

| Campo | Valor |
|-------|-------|
| **ID** | `X-03` |
| **Nome** | Centralized Validation |
| **Tipo** | Cross-Cutting |
| **Status** | 📋 Planejado |
| **Prioridade** | P0 |
| **Responsabilidade** | Validar toda entrada de dados com schemas centralizados |

---

#### X-04: Error Handling

| Campo | Valor |
|-------|-------|
| **ID** | `X-04` |
| **Nome** | Error Handling |
| **Tipo** | Cross-Cutting |
| **Status** | 📋 Planejado |
| **Prioridade** | P0 |
| **Responsabilidade** | Error hierarchy, error handler middleware, mensagens padronizadas |

---

#### X-05: Audit & Compliance

| Campo | Valor |
|-------|-------|
| **ID** | `X-05` |
| **Nome** | Audit & Compliance |
| **Tipo** | Cross-Cutting |
| **Status** | ⚠️ Parcial (audit_logs, auth_audit_logs, barber_audit_logs existem mas não são completos) |
| **Prioridade** | P1 |
| **Responsabilidade** | Registrar toda ação relevante para auditoria |

---

## 3. Matriz de Dependências

```
                       Depende de
         ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
         │C01│C02│C03│C04│C05│C06│C07│C08│C09│   │
───┬─────┼───┼───┼───┼───┼───┼───┼───┼───┼───┤ D │
C01│     │   │   │   │   │   │   │   │   │   │ e │
C02│  ●  │   │   │   │   │   │   │   │   │   │ p │
C03│  ●  │ ● │   │   │   │   │   │   │   │   │ e │
C04│  ●  │ ● │   │   │   │   │   │   │   │   │ n │
C05│  ●  │ ● │   │ ● │   │   │   │   │   │   │ d │
C06│  ●  │ ● │   │ ● │ ● │   │   │   │   │   │ e │
C07│  ●  │ ● │ ● │ ● │   │ ● │   │   │   │   │ n │
C08│  ●  │ ● │   │ ● │ ● │ ● │   │   │   │   │ c │
C09│  ●  │ ● │   │ ● │   │   │   │   │   │   │ i │
D01│  ●  │ ● │ ● │   │   │   │   │   │   │   │ a │
───┴─────┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
```

**Legenda:** ● = depende de

**Ordem de implementação (topológica):**

```
C-01 Shared Kernel          → 1º (sem dependências)
C-02 Multi-Tenant Engine    → 2º (depende de C-01)
C-03 Repository Pattern     → 3º (depende de C-01, C-02)
C-04 Event Bus              → 3º (depende de C-01, C-02)
C-09 N8N Bridge             → 4º (depende de C-04)
C-05 Integration Layer      → 5º (depende de C-04)
C-06 Automation Engine      → 6º (depende de C-04, C-05)
C-08 Omnichannel Layer      → 7º (depende de C-05, C-06)
C-07 AI Operational Layer   → 8º (depende de C-04, C-06)
D-01 BarberGestor           ← Já existe (precisa refatorar)
D-02 OdontoGestor           → 9º (após C-03)
D-03 ClimaGestor            → 9º (após C-03)
```

---

## 4. Status Geral

| Status | Significado | Quantidade |
|--------|-------------|-----------|
| ✅ Ativo | Em produção, funcionando | 4 |
| ⚠️ Parcial | Existe mas incompleto ou problemático | 3 |
| 📋 Planejado | Próximo a ser implementado | 6 |
| 🔮 Futuro | Previsto para fases seguintes | 5 |

### Status por camada

```
Core (C-01 a C-04):     ■■□□□  40% completo
Integration (C-05, C-09): □□□□□  0% completo (fora Email isolado)
Operational (C-06):      □□□□□  0% completo
AI (C-07):               □□□□□  0% completo
Experience (C-08):       □□□□□  0% completo
MCP (M-01 a M-05):      ■■■■□  80% completo
Domain (D-01 a D-03):   ■□□□□  33% completo (1 de 3 nichos)
Cross-Cutting (X-01-05): ■■□□□  40% completo
```

---

## 5. Gaps Identificados

### Gaps críticos (bloqueiam evolução)

| Gap | Capability afetada | Impacto |
|-----|-------------------|---------|
| **Sem Repository Pattern** | Todas | SQL em services, banco não trocável, sem testes |
| **Sem Event Bus** | C-05, C-06, C-07, C-09 | WhatsApp, IA, automações bloqueados |
| **Sem Shared Kernel** | Todas | Erro, validação, log duplicados |
| **Barber.service.js god class** | D-01 | Impede evolução do BarberGestor |
| **planFeatures.js duplicado** | X-01 | Feature gates inconsistentes |

### Gaps médios (precisam de planejamento)

| Gap | Impacto |
|-----|---------|
| Sem TypeScript | Sem segurança de tipos, contratos implícitos |
| Sem logger estruturado | Debug difícil, sem correlação |
| Sem validação centralizada (Zod) | Validação ad-hoc frágil |
| Sem error handling centralizado | 3 versões de sendError |
| Sem multi-tenant automático | Risco de data leak por esquecimento |

### Gaps baixos (monitorar)

| Gap | Impacto |
|-----|---------|
| Sem testes unitários | Regressões não detectadas |
| Sem API documentation | Integração de terceiros difícil |
| Timezone hardcoded | Expansão multi-região bloqueada |
| In-memory rate limiter | Não escala horizontalmente |
| JWT sem refresh token | Sessões irrevogáveis |

---

## 6. Capacidades Futuras (Roadmap)

### Fase 1 — Shared Kernel + Repository

```
C-01 Shared Kernel       → Error classes, BaseRepository, Zod schemas
C-03 Repository Pattern  → Kysely, queries tipadas
X-04 Error Handling      → Error hierarchy, middleware centralizado
X-03 Validation          → Zod schemas centralizados
X-02 Observability       → Pino logger
```

### Fase 2 — Desacoplamento

```
D-01 BarberGestor        → Quebrar barber.service.js em 12 domain services
X-01 Feature Guards      → Centralizar planFeatures.js
C-02 Multi-Tenant        → Middleware automático de company_id
```

### Fase 3 — Event Bus

```
C-04 Event Bus           → Outbox pattern, eventos core
C-09 N8N Bridge          → Webhooks, API de ações
```

### Fase 4 — Integration Layer

```
C-05 Integration Layer   → ChannelAdapter, WhatsApp Cloud API
C-05 Integration Layer   → Migrar Email para Integration Layer
```

### Fase 5 — Automation Engine

```
C-06 Automation Engine   → Triggers, Conditions, Actions
C-06 Automation Engine   → Templates por nicho
```

### Fase 6 — Omnichannel

```
C-08 Omnichannel Layer   → Inbox unificada
C-08 Omnichannel Layer   → CRM conversacional
```

### Fase 7 — AI Operational Layer

```
C-07 AI Layer            → Assistant, Predictions, Agents
```

### Fase 8 — Novos Nichos

```
D-02 OdontoGestor        → Usando capabilities do Core
D-03 ClimaGestor         → Usando capabilities do Core
```

---

## 7. Regras de Capabilities

### R-CAP-01: Toda capability deve ter um dono

Nenhuma capability pode existir sem um responsável claro.

### R-CAP-02: Capabilities não se duplicam

Se uma capability já existe, ela deve ser **reutilizada**, nunca copiada.

### R-CAP-03: Capabilities evoluem independentemente

Uma capability deve poder ser alterada sem impactar outras capabilities (desde que mantenha o contrato).

### R-CAP-04: Toda capability tem um contrato

Toda capability expõe uma interface/API clara. Nada é acessado internamente.

### R-CAP-05: Capabilities Core vêm primeiro

Nenhuma capability de camada superior pode ser implementada antes das capabilities que ela depende estarem prontas.

### R-CAP-06: Toda feature usa capabilities

Nenhuma feature nova deve implementar lógica que já existe em uma capability. Use a capability.

### R-CAP-07: MCPs são capabilities de infraestrutura

MCPs são tratados como capabilities de infraestrutura para agentes IA e seguem as mesmas regras.

---

## 8. Catálogo Completo

| ID | Nome | Tipo | Status | Prioridade | Depende de |
|----|------|------|--------|-----------|------------|
| C-01 | Shared Kernel | Core | 📋 Planejado | P0 | — |
| C-02 | Multi-Tenant Engine | Core | ✅ Parcial | P0 | C-01 |
| C-03 | Repository Pattern | Core | 📋 Planejado | P0 | C-01, C-02 |
| C-04 | Event Bus | Core | 📋 Planejado | P0 | C-01, C-02 |
| C-05 | Integration Layer | Integração | 📋 Planejado | P1 | C-04 |
| C-06 | Automation Engine | Operacional | 📋 Planejado | P1 | C-04, C-05 |
| C-07 | AI Operational Layer | IA | 🔮 Futuro | P2 | C-04, C-06, C-03, C-02 |
| C-08 | Omnichannel Layer | Apresentação | 🔮 Futuro | P2 | C-05, C-06 |
| C-09 | N8N Bridge | Integração | 📋 Planejado | P1 | C-04 |
| D-01 | BarberGestor | Domínio | ✅ Ativo | — | C-02, C-03 |
| D-02 | OdontoGestor | Domínio | 🔮 Futuro | — | C-02, C-03 |
| D-03 | ClimaGestor | Domínio | 🔮 Futuro | — | C-02, C-03 |
| M-01 | GitHub MCP | MCP | ✅ Ativo | — | OpenCode |
| M-02 | Supabase MCP | MCP | ✅ Ativo | — | OpenCode |
| M-03 | Terminal MCP | MCP | ✅ Ativo | — | OpenCode |
| M-04 | Filesystem MCP | MCP | ✅ Ativo | — | OpenCode |
| M-05 | Playwright MCP | MCP | 📋 Planejado | — | OpenCode |
| X-01 | Feature Guards & Plans | Cross-Cutting | ⚠️ Parcial | P0 | C-02 |
| X-02 | Observability & Logging | Cross-Cutting | ⚠️ Parcial | P1 | C-01 |
| X-03 | Centralized Validation | Cross-Cutting | 📋 Planejado | P0 | C-01 |
| X-04 | Error Handling | Cross-Cutting | 📋 Planejado | P0 | C-01 |
| X-05 | Audit & Compliance | Cross-Cutting | ⚠️ Parcial | P1 | C-02 |

---

## 9. Proteção Arquitetural do Core — Capability Layer

### 9.1 Regras de Proteção de Capabilities

As regras abaixo protegem o ecossistema de capabilities contra overengineering, duplicação e implementação fora da ordem topológica.

| # | Regra | Onde se aplica | Gatilho |
|---|-------|----------------|---------|
| R-CAP-08 | **Nova capability só é criada se reutilizável por 2+ módulos** | Proposta de nova capability | Se atende apenas 1 nicho → é feature do módulo, não capability do Core |
| R-CAP-09 | **Nenhuma capability pode ser implementada fora da ordem topológica** | Ordem de implementação (seção 3) | Se capability depende de C-01, C-04 etc. → depende? |
| R-CAP-10 | **Nenhuma capability pode duplicar responsabilidade de outra** | Registry central (seção 8) | Se ID diferente com mesma responsabilidade → consolidar |
| R-CAP-11 | **IA/agentes não podem criar capabilities sem aprovação** | Todo agente que propõe capability | Se capability proposta sem passar pelo checklist V-01 a V-13 |
| R-CAP-12 | **Toda capability deve ter dono claro** | Registry (seção 8) | Se campo "Dono" vazio → capability não aprovada |
| R-CAP-13 | **Capability sem uso por 90 dias é desativada** | Lifecycle de capability | Se nenhum módulo consome a capability → marcar como candidata a desativação |

### 9.2 Validação Pré-Criação de Capability

Antes de criar qualquer capability nova, o Master Orchestrator DEVE responder:

```markdown
## Validação de Nova Capability

### Identificação
- **Nome proposto**:
- **Tipo**: Core / Integração / Operacional / IA / Apresentação / MCP
- **Proponente**: Core Team / Agente / Usuário

### Validações (V-01 a V-13)
- [ ] V-01: Realmente precisa existir agora?
- [ ] V-02: Já existe equivalente?
- [ ] V-03: Shared Kernel suporta?
- [ ] V-04: Contrato/eventos definidos?
- [ ] V-05: Tenant isolation?
- [ ] V-06: Rollback plan?
- [ ] V-07: Observabilidade?
- [ ] V-08: Impacto no Event Bus?
- [ ] V-09: Risco de acoplamento?
- [ ] V-10: Dependência topológica respeitada?
- [ ] V-11: Capability governance respeitada?
- [ ] V-12: Sem padrão paralelo?
- [ ] V-13: Alinhada ao Capability-Driven Core?

### Decisão
✅ Aprovada / ❌ Rejeitada / ⏳ Aguardando dependência

### Justificativa
<explicação da decisão>
```

### 9.3 Gatilhos de Rejeição de Capability

Uma capability é **automaticamente rejeitada** se:

- ❌ Duplica responsabilidade de capability existente
- ❌ Depende de capability que não existe e não está planejada
- ❌ Não tem dono definido
- ❌ Não serve a 2+ módulos (é feature de nicho, não capability do Core)
- ❌ Viola a ordem topológica (capability superior antes de dependências)
- ❌ Não tem contrato/interface definido
- ❌ Violação do Pattern Selection (introduz padrão paralelo sem ADR)

---

## Referências

| Documento | Caminho |
|-----------|---------|
| Decisões arquiteturais | `docs/architecture-decisions.md` |
| Proteção Arquitetural | `docs/architecture-decisions.md#8-proteção-arquitetural-do-core` |
| Lições aprendidas | `docs/lessons-learned.md` |
| Histórico do Core | `docs/MULTGESTOR_CORE_HISTORY.md` |
| Mapa de capabilities | `docs/capabilities-map.md` (este) |
| Event Bus Architecture | `docs/event-bus-architecture.md` |
| MCP Governance | `docs/mcp-governance.md` |
| Runtime Map | `docs/core/runtime-map.md` |
| Decisões técnicas | `.agent/memory/decisions.md` |
| Stack | `.agent/context/stack.md` |
| Roadmap | `.agent/context/roadmap.md` |
