# Event Bus Architecture — MultGestor Core

**Arquitetura oficial do sistema de eventos assíncronos do MultGestor**  
**Versão:** 1.0.0  
**Data:** 2026-05-18  
**Status:** OFICIAL • VINCULANTE • PLANEJADO  
**Capability ID:** C-04  
**Tipo:** Core Foundation — Event-Driven Architecture  
**Classificação:** P0 — Crítico  
**Depende de:** C-01 (Shared Kernel), C-02 (Multi-Tenant Engine)  
**Dependem dele:** C-05 (Integration Layer), C-06 (Automation Engine), C-07 (AI Operational Layer), C-08 (Omnichannel Layer), C-09 (N8N Bridge)

---

## Índice

1. [Filosofia do Event Bus](#1-filosofia-do-event-bus)
2. [Arquitetura Oficial](#2-arquitetura-oficial)
3. [Event Contracts](#3-event-contracts)
4. [Event Lifecycle](#4-event-lifecycle)
5. [Event Categories](#5-event-categories)
6. [Retry Strategy](#6-retry-strategy)
7. [Dead Letter Queue](#7-dead-letter-queue)
8. [Outbox Pattern](#8-outbox-pattern)
9. [Event Governance](#9-event-governance)
10. [Consumer Architecture](#10-consumer-architecture)
11. [Producer Architecture](#11-producer-architecture)
12. [Redis Role](#12-redis-role)
13. [N8N Role](#13-n8n-role)
14. [AI Operational Role](#14-ai-operational-role)
15. [Omnichannel Role](#15-omnichannel-role)
16. [Observabilidade](#16-observabilidade)
17. [Correlation IDs](#17-correlation-ids)
18. [Runtime Orchestration](#18-runtime-orchestration)
19. [Escalabilidade](#19-escalabilidade)
20. [Roadmap Evolutivo](#20-roadmap-evolutivo)
21. [Integração com Capabilities](#21-integração-com-capabilities)
22. [Eventos Oficiais](#22-eventos-oficiais)
23. [Regras Definitivas](#23-regras-definitivas)

---

## 1. Filosofia do Event Bus

### 1.1 O Sistema Nervoso do MultGestor

O Event Bus não é uma biblioteca. Não é um pacote npm. Não é uma fila.

O Event Bus é o **sistema nervoso central** do MultGestor Core. Ele conecta cada domínio, cada serviço, cada integração e cada agente de IA em uma rede de comunicação assíncrona, confiável e rastreável.

```
Sem Event Bus:
  Service A → chama Service B → chama Email → chama WhatsApp
  (acoplamento direto, síncrono, frágil)

Com Event Bus:
  Service A → publica "SaleCreated"
    ├── Consumer Email → envia confirmação
    ├── Consumer CRM → atualiza cliente
    ├── Consumer N8N → workflow de pós-venda
    └── Consumer IA → analisa padrão de compra
  (desacoplado, assíncrono, resiliente)
```

### 1.2 Princípios Fundamentais

| Princípio | Significado | Consequência |
|-----------|-------------|--------------|
| **Eventos são fatos** | Um evento representa algo que já aconteceu. Nunca algo que pode ou deve acontecer | Eventos são imutáveis após publicados |
| **Produtores não sabem quem consome** | Quem publica um evento não conhece nem se importa com os consumers | Zero acoplamento entre domínios |
| **Consumers não afetam produtores** | Se um consumer falha, o produtor não é impactado | Resiliência por isolamento |
| **Eventos são imutáveis** | Um evento publicado nunca é alterado | Correções são novos eventos |
| **Entrega garantida** | Uma vez publicado, o evento chega a todos os consumers ativos | Outbox pattern + retry |
| **Idempotência obrigatória** | Processar o mesmo evento duas vezes produz o mesmo resultado | Consumers são responsáveis por deduplicação |
| **Ordenação por aggregate** | Eventos do mesmo aggregate são processados em ordem | Consistência dentro da entidade |

### 1.3 O Event Bus Como Foundation

O Event Bus é a fundação sobre a qual TODO o ecossistema futuro é construído:

```
                  ┌──────────────────────┐
                  │    Event Bus (C-04)   │
                  │      Outbox Pattern   │
                  └──────┬──────────┬────┘
                         │          │
         ┌───────────────┼──────────┼───────────────┐
         ▼               ▼          ▼               ▼
   ┌──────────┐   ┌──────────┐ ┌──────────┐   ┌──────────┐
   │Integration│   │Automation│ │    AI    │   │Omnichannel│
   │ Layer     │   │ Engine   │ │Operational│   │  Layer   │
   │ (C-05)   │   │ (C-06)   │ │Layer(C-07)│   │ (C-08)   │
   └──────────┘   └──────────┘ └──────────┘   └──────────┘
                         │
                         ▼
                   ┌──────────┐
                   │ N8N Bridge│
                   │  (C-09)  │
                   └──────────┘
```

**Nada acima existe sem o Event Bus.**

### 1.4 Anti-Filosofia (O Que o Event Bus NÃO É)

- ❌ Não é um barramento mágico que resolve todos os problemas
- ❌ Não é um middleware de mensageria genérico
- ❌ Não é um sistema de fila de tarefas (para isso existe BullMQ)
- ❌ Não é um pub/sub de cache (para isso existe Redis)
- ❌ Não é substituto para chamadas síncronas que precisam de resposta imediata
- ❌ Não é um audit log (embora eventos possam alimentar auditoria)

---

## 2. Arquitetura Oficial

### 2.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCER LAYER                               │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Services │  │Controllers│  │  Cron    │  │ External Webhooks │   │
│  │ Domínio  │  │   API    │  │ Jobs     │  │ (N8N, WhatsApp)  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │              │              │                 │             │
│       └──────────────┴──────────────┴─────────────────┘             │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    EVENT BUS API                              │   │
│  │                                                               │   │
│  │  eventBus.publish("SaleCreated", { ... })                     │   │
│  │                                                               │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                      │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    OUTBOX PATTERN                             │   │
│  │                                                               │   │
│  │  1. Evento salvo na tabela `event_outbox` (mesma transação)   │   │
│  2. Relê eventos não processados                                 │   │
│  3. Publica no Event Bus interno (EventEmitter)                  │   │
│  4. Marca como processado                                        │   │
│  5. Se falhar → retry na próxima rodada                          │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                      │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    EVENT ROUTER                               │   │
│  │                                                               │   │
│  │  Route → Consumers registrados para este evento               │   │
│  │  Retry → Se consumer falha, agenda retry                      │   │
│  │  DLQ   → Se excede tentativas, envia para Dead Letter Queue   │   │
│  └──────────┬──────────────────┬──────────────────┬──────────────┘   │
│             │                  │                  │                  │
│             ▼                  ▼                  ▼                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐     │
│  │  Consumer A  │  │  Consumer B  │  │    Consumer C        │     │
│  │  (Email)     │  │  (CRM)       │  │  (N8N Bridge)        │     │
│  │  → Resend    │  │  → API       │  │  → Webhook N8N      │     │
│  └──────────────┘  └──────────────┘  └──────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Arquitetura em Camadas

```
Camada 0 — Database (PostgreSQL)
├── Tabela: event_outbox (persistência de eventos)
├── Tabela: event_consumers (registro de processamento)
├── Tabela: event_dlq (eventos com falha)
└── Tabela: event_subscriptions (registro de inscrições)

Camada 1 — Outbox Publisher (Node.js)
├── Lê eventos não processados da event_outbox
├── Publica no EventEmitter
├── Marca como processed
└── Agenda retry se falhar

Camada 2 — Event Router (Node.js)
├── Mapeia evento → consumers registrados
├── Executa consumers em sequência (por prioridade)
├── Gerencia retry com backoff
└── Envia para DLQ após falha permanente

Camada 3 — Consumers (Node.js)
├── Cada consumer é um módulo independente
├── Implementa handle(event) → Promise<void>
├── Deve ser idempotente
└── Deve ter timeout
```

### 2.3 Decisões Arquiteturais

| Decisão | Opção escolhida | Alternativa rejeitada | Motivo |
|---------|----------------|----------------------|--------|
| **Persistência** | PostgreSQL (Outbox) | Redis (volátil) | Garantia de entrega, mesma transação do banco |
| **Roteamento** | EventEmitter (Node.js) | Message Broker externo | Simplicidade inicial, sem dependência extra |
| **Paralelismo** | Sequential por aggregate | Parallel total | Consistência de ordenação |
| **Retry** | Backoff exponencial | Retry fixo | Respeitar recuperação de serviços |
| **DLQ** | Tabela no PostgreSQL | Fila separada | Simplicidade, mesma stack |
| **Timeout** | 30s por consumer | Configurável por consumer | Padrão seguro para operações síncronas |

---

## 3. Event Contracts

### 3.1 Contrato Oficial do Evento

```typescript
interface Event {
  // Identificação
  event_id: string;          // UUID v4 — único globalmente
  event_name: string;        // "AppointmentConfirmed" — PascalCase
  version: number;           // 1 — para versionamento futuro

  // Tenant
  tenant_id: string;         // company_id — obrigatório para multi-tenant

  // Aggregate
  aggregate_type: string;    // "appointment", "sale", "company"
  aggregate_id: string;      // ID da entidade raiz

  // Dados
  payload: Record<string, unknown>;  // Dados específicos do evento

  // Metadados
  metadata: {
    producer: string;        // Nome do serviço que produziu
    environment: string;     // "production", "development"
    tenant_scope: string;    // "single", "system" (eventos de sistema)
  };

  // Tracing
  correlation_id: string;    // ID da cadeia de operações
  causation_id: string;      // ID do evento que causou este
  trace_id: string;          // ID da transação completa

  // Temporal
  timestamp: string;         // ISO 8601 UTC
}
```

### 3.2 Exemplo de Evento

```json
{
  "event_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "event_name": "AppointmentConfirmed",
  "version": 1,
  "tenant_id": "company_42",
  "aggregate_type": "appointment",
  "aggregate_id": "appt_789",
  "payload": {
    "appointment_id": "appt_789",
    "company_id": "company_42",
    "collaborator_id": "col_15",
    "client_id": "cli_301",
    "client_name": "João Silva",
    "service_id": "svc_7",
    "service_name": "Corte Degradê",
    "price": 65.00,
    "scheduled_at": "2026-05-20T14:00:00Z",
    "duration_minutes": 45
  },
  "metadata": {
    "producer": "barber-service",
    "environment": "production",
    "tenant_scope": "single"
  },
  "correlation_id": "corr_abc123",
  "causation_id": null,
  "trace_id": "trace_xyz789",
  "timestamp": "2026-05-18T12:00:00.000Z"
}
```

### 3.3 Versionamento de Eventos

| Estratégia | Quando usar | Exemplo |
|-----------|-------------|---------|
| **Novo campo opcional** | Adicionar campo sem quebrar consumers | `"phone": "(11) 99999-9999"` |
| **Campos obsoletos** | Marcar como `deprecated` e remover depois | `"client_name": "..." // deprecated` |
| **Nova versão** | Mudança breaking no payload | `AppointmentConfirmedV2` |

**Regras de versionamento:**
- Eventos são imutáveis — nunca alterar um evento publicado
- Consumers devem declarar qual versão suportam
- Versões diferentes do mesmo evento podem coexistir
- A versão atual do evento é sempre a mais recente

### 3.4 Schema Registry

O Schema Registry é o catálogo central de todos os eventos:

```
docs/events/
├── appointment-confirmed.v1.json
├── appointment-canceled.v1.json
├── sale-created.v1.json
├── payment-received.v1.json
├── company-created.v1.json
├── plan-changed.v1.json
├── collaborator-added.v1.json
├── low-stock-detected.v1.json
├── workflow-started.v1.json
└── ai-recommendation-generated.v1.json
```

Cada schema define:
- `event_name` e `version`
- `payload` com campos obrigatórios e opcionais
- `examples` de uso
- `consumers` registrados com suas versões suportadas

---

## 4. Event Lifecycle

### 4.1 Ciclo de Vida Completo

```
CRIADO
  │
  ▼
PERSISTIDO (outbox)
  │
  ▼
PUBLICADO (EventEmitter)
  │
  ├──→ ROTEADO → CONSUMIDO (sucesso)
  │       │
  │       └──→ FINALIZADO
  │
  ├──→ ROTEADO → FALHA TEMPORÁRIA → RETRY (backoff)
  │       │
  │       ├──→ CONSUMIDO (sucesso no retry)
  │       │
  │       └──→ FALHA PERMANENTE → DLQ
  │
  └──→ ROTEADO → TIMEOUT → RETRY
```

### 4.2 Estados do Evento

| Estado | Onde | Descrição |
|--------|------|-----------|
| `pending` | `event_outbox` | Evento persistido, aguardando processamento |
| `processing` | `event_outbox` | Evento sendo processado pelo publisher |
| `published` | `event_consumers` | Evento publicado, aguardando consumo |
| `consuming` | `event_consumers` | Consumer está processando |
| `consumed` | `event_consumers` | Processado com sucesso |
| `failed` | `event_consumers` | Falha temporária, aguardando retry |
| `dlq` | `event_dlq` | Falha permanente após todas as tentativas |
| `expired` | `event_dlq` | Evento na DLQ por mais de 7 dias |

### 4.3 Timeline

```
t=0ms    → Evento criado (service publica)
t=1ms    → Evento persistido na event_outbox (mesma transação)
t=100ms  → Outbox Publisher lê evento não processado
t=101ms  → Evento marcado como processing
t=102ms  → EventEmitter emite evento
t=103ms  → Router entrega para consumers
t=200ms  → Consumer A completa (email)
t=500ms  → Consumer B completa (CRM)
t=1500ms → Consumer C falha (N8N timeout)
t=1501ms → Retry agenda para +5s
t=6501ms → Retry: Consumer C completa
t=6502ms → Evento finalizado
```

---

## 5. Event Categories

### 5.1 Categorias Oficiais

| Categoria | Prefixo | Exemplo | Criticidade | Garantia |
|-----------|---------|---------|-------------|----------|
| **Domain Events** | (domínio) | `AppointmentConfirmed` | P0 | At-least-once |
| **System Events** | `System.` | `System.TenantCreated` | P0 | Exactly-once (idempotente) |
| **Integration Events** | `Integration.` | `Integration.WhatsAppMessageReceived` | P1 | At-least-once |
| **Automation Events** | `Automation.` | `Automation.WorkflowStarted` | P1 | At-least-once |
| **AI Events** | `AI.` | `AI.RecommendationGenerated` | P2 | Best-effort |
| **Audit Events** | `Audit.` | `Audit.SensitiveDataAccessed` | P1 | At-least-once |
| **Analytics Events** | `Analytics.` | `Analytics.PageViewed` | P3 | Best-effort |
| **Notification Events** | `Notification.` | `Notification.EmailSent` | P1 | At-least-once |

### 5.2 Domain Events (Core)

Eventos que representam **mudanças de estado no domínio**. São os eventos mais importantes do sistema.

| Evento | Trigger | Aggregate | Consumers |
|--------|---------|-----------|-----------|
| `AppointmentConfirmed` | Cliente confirma agendamento | `appointment` | Email, WhatsApp, CRM, Analytics |
| `AppointmentCanceled` | Cliente ou sistema cancela | `appointment` | Email, WhatsApp, CRM |
| `AppointmentRescheduled` | Cliente altera horário | `appointment` | Email, WhatsApp |
| `SaleCreated` | Nova venda no PDV | `sale` | Email, WhatsApp, CRM, Estoque, Analytics |
| `SaleRefunded` | Devolução de venda | `sale` | CRM, Financeiro |
| `PaymentReceived` | Pagamento confirmado | `sale` | Billing, Invoice, Email |
| `PaymentFailed` | Pagamento recusado | `sale` | Email, CRM |
| `CollaboratorAdded` | Novo colaborador | `collaborator` | Email, Onboarding |
| `CollaboratorRemoved` | Colaborador desligado | `collaborator` | Email, CRM |
| `CompanyCreated` | Nova empresa no sistema | `company` | Onboarding, Email |
| `CompanyPlanChanged` | Mudança de plano | `company` | Billing, Feature Guards |
| `LowStockDetected` | Estoque abaixo do mínimo | `product` | Notification, Email |

### 5.3 System Events

Eventos de **infraestrutura e sistema**, não de negócio.

| Evento | Trigger | Descrição |
|--------|---------|-----------|
| `System.TenantCreated` | Nova empresa criada | Setup inicial de recursos |
| `System.TenantSuspended` | Empresa suspensa | Bloqueio de acesso |
| `System.MigrationExecuted` | Migration aplicada | Sincronização de schema |
| `System.DeployCompleted` | Deploy finalizado | Notificação de nova versão |
| `System.BackupCompleted` | Backup realizado | Verificação de integridade |
| `System.ErrorThresholdExceeded` | Taxa de erro alta | Alerta operacional |

### 5.4 Integration Events

Eventos de **entrada/saída de canais externos**.

| Evento | Trigger | Descrição |
|--------|---------|-----------|
| `Integration.WhatsAppMessageReceived` | Mensagem via WhatsApp | Entrada de canal |
| `Integration.WhatsAppMessageSent` | Mensagem enviada | Saída de canal |
| `Integration.EmailSent` | Email enviado via Resend | Saída de canal |
| `Integration.EmailBounced` | Email rejeitado | Falha de entrega |
| `Integration.WebhookReceived` | Webhook de terceiro (N8N, Kiwify) | Entrada externa |
| `Integration.WebhookFailed` | Webhook sem resposta | Falha de integração |

### 5.5 Automation Events

Eventos de **orquestração de automações**.

| Evento | Trigger | Descrição |
|--------|---------|-----------|
| `Automation.WorkflowStarted` | Workflow ativado | Início de automação |
| `Automation.WorkflowCompleted` | Workflow finalizado | Fim de automação |
| `Automation.WorkflowFailed` | Workflow com erro | Falha de automação |
| `Automation.ConditionMet` | Condição de automação satisfeita | Gatilho condicional |
| `Automation.ActionExecuted` | Ação de automação executada | Registro de ação |

### 5.6 AI Events

Eventos da **camada de inteligência artificial**.

| Evento | Trigger | Descrição |
|--------|---------|-----------|
| `AI.RecommendationGenerated` | IA gera recomendação | Sugestão para usuário |
| `AI.PredictionCompleted` | Predição concluída | Demanda, churn, receita |
| `AI.ActionSuggested` | IA sugere ação | Ação proposta |
| `AI.ActionApproved` | Ação aprovada | Confirmação humana |
| `AI.ActionRejected` | Ação rejeitada | Recusa humana |
| `AI.QueryCompleted` | Consulta de IA finalizada | Auditoria |

### 5.7 Notification Events

Eventos de **notificação**, independentes do canal.

| Evento | Trigger | Descrição |
|--------|---------|-----------|
| `Notification.EmailSent` | Email enviado | Confirmação de envio |
| `Notification.EmailFailed` | Email falhou | Log de erro |
| `Notification.WhatsAppSent` | WhatsApp enviado | Confirmação de envio |
| `Notification.WhatsAppFailed` | WhatsApp falhou | Log de erro |
| `Notification.PushSent` | Push enviado | Confirmação (futuro) |

---

## 6. Retry Strategy

### 6.1 Política de Retry

| Tentativa | Atraso | Atraso acumulado | Ação |
|-----------|--------|------------------|------|
| 1 | 0s (imediato) | 0s | Primeira tentativa |
| 2 | 5s | 5s | Backoff inicial |
| 3 | 15s | 20s | Backoff médio |
| 4 | 45s | 65s | Backoff longo |
| 5 | 135s | 200s | Backoff máximo |
| 6+ | **DLQ** | — | Falha permanente |

**Fórmula de backoff:** `atraso = base * multiplier^tentativa`

```
base = 5s
multiplier = 3
tentativa 1: 0s (imediato)
tentativa 2: 5s * 3^0 = 5s
tentativa 3: 5s * 3^1 = 15s
tentativa 4: 5s * 3^2 = 45s
tentativa 5: 5s * 3^3 = 135s
```

### 6.2 Critérios para Retry

**Deve tentar novamente quando:**
- Erro de rede (timeout, ECONNRESET, DNS)
- Erro de serviço externo (5xx, rate limit 429)
- Erro temporário (serviço indisponível)

**Não deve tentar novamente quando:**
- Erro de validação (dados inválidos, 4xx)
- Erro de schema (evento não reconhecido)
- Erro de permissão (401, 403)
- Erro de idempotência (evento já processado)

### 6.3 Configuração por Consumer

```typescript
interface RetryConfig {
  maxAttempts: number;        // Máximo de tentativas (padrão: 5)
  baseDelayMs: number;        // Atraso base (padrão: 5000)
  multiplier: number;         // Multiplicador (padrão: 3)
  maxDelayMs: number;         // Atraso máximo (padrão: 300000)
  retryableErrors: string[];  // Erros que devem gerar retry
}
```

| Consumer | maxAttempts | baseDelayMs | multiplier | Motivo |
|----------|-------------|-------------|------------|--------|
| Email (Resend) | 3 | 5000 | 3 | API externa pode estar lenta |
| N8N Bridge | 5 | 5000 | 3 | Webhook pode falhar |
| CRM | 3 | 1000 | 3 | API interna, erro rápido |
| WhatsApp | 5 | 10000 | 2 | Meta API com rate limiting agressivo |
| Analytics | 2 | 5000 | 2 | Best-effort, não crítico |
| Estoque | 3 | 2000 | 3 | Precisa ser consistente |

---

## 7. Dead Letter Queue

### 7.1 Estrutura da DLQ

```sql
CREATE TABLE event_dlq (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES event_outbox(event_id),
  event_name    VARCHAR(255) NOT NULL,
  payload       JSONB NOT NULL,
  metadata      JSONB NOT NULL,
  error         JSONB NOT NULL,       -- { message, stack, code }
  attempts      INTEGER NOT NULL,
  moved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        VARCHAR(50) DEFAULT 'pending',  -- pending, reviewing, resolved, ignored
  resolution    TEXT,                 -- Análise do motivo
  resolved_by   VARCHAR(255),         -- Quem resolveu
  resolved_at   TIMESTAMPTZ,          -- Quando resolveu
  replayed_at   TIMESTAMPTZ           -- Se foi reprocessado
);
```

### 7.2 Critérios de Entrada na DLQ

- Consumer excede número máximo de tentativas
- Erro não retryable (validação, permissão)
- Timeout excede 30s em todas as tentativas
- Evento corrompido ou com schema inválido

### 7.3 Política de DLQ

| Aspecto | Regra |
|---------|-------|
| **Retenção** | 7 dias |
| **Notificação** | Alertas para eventos de criticidade P0 na DLQ |
| **Replay manual** | Possível após correção do problema |
| **Expurgo** | Após 7 dias, eventos são arquivados para auditoria |
| **Prioridade de revisão** | P0 → imediato, P1 → 24h, P2 → 72h |

### 7.4 DLQ Review Workflow

```
Evento vai para DLQ
    │
    ▼
Notificação (apenas P0/P1)
    │
    ▼
Arquiteto analisa:
├── Erro conhecido? → Resolve e faz replay
├── Bug no consumer? → Corrige e faz replay
├── Dado corrompido? → Corrige dado e faz replay
└── Erro esperado? → Ignora e arquiva
    │
    ▼
Replay: evento é reprocessado do início
    │
    ▼
Sucesso → Removido da DLQ
Falha  → Volta para DLQ (máx 3 replays)
```

---

## 8. Outbox Pattern

### 8.1 Definição

O Outbox Pattern garante que **eventos nunca sejam perdidos**, mesmo se o serviço falhar após alterar o banco mas antes de publicar o evento.

### 8.2 Fluxo do Outbox

```
1. Service inicia transação
     │
2. Service altera dados no banco (INSERT/UPDATE/DELETE)
     │
3. Service insere evento na tabela event_outbox (mesma transação)
     │
4. Transação é commitada
     │
     ├── Sucesso: evento está persistido → publicado assincronamente
     └── Falha: tudo é revertido (dados + evento)
```

### 8.3 Estrutura da Outbox

```sql
CREATE TABLE event_outbox (
  event_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name    VARCHAR(255) NOT NULL,
  version       INTEGER NOT NULL DEFAULT 1,
  tenant_id     VARCHAR(255),           -- company_id ou NULL para system
  aggregate_type VARCHAR(100),
  aggregate_id  VARCHAR(255),
  payload       JSONB NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  correlation_id VARCHAR(255),
  causation_id  VARCHAR(255),
  trace_id      VARCHAR(255),
  status        VARCHAR(50) DEFAULT 'pending',
    -- pending, processing, published, failed
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ,
  attempts      INTEGER DEFAULT 0,
  last_error    TEXT,
  locked_at     TIMESTAMPTZ,            -- Para workers concorrentes
  locked_by     VARCHAR(255)
);

CREATE INDEX idx_outbox_status ON event_outbox(status, created_at)
  WHERE status = 'pending';

CREATE INDEX idx_outbox_tenant ON event_outbox(tenant_id);
```

### 8.4 Publisher (Worker)

O Outbox Publisher é um worker que:

1. **Lê** eventos `pending` da `event_outbox` (ordenado por `created_at`)
2. **Lock** o evento (`locked_at`, `locked_by`) para evitar duplicação entre workers
3. **Publica** no EventEmitter
4. **Marca** como `published` ou `failed`
5. **Log** resultado

```typescript
// Pseudo-código do publisher
async function publishOutboxEvents(): Promise<void> {
  const events = await db.query(`
    SELECT * FROM event_outbox
    WHERE status = 'pending'
      AND (locked_at IS NULL OR locked_at < NOW() - INTERVAL '30 seconds')
    ORDER BY created_at ASC
    LIMIT 100
    FOR UPDATE SKIP LOCKED
  `);

  for (const event of events) {
    try {
      await db.query(`UPDATE event_outbox SET status = 'processing' WHERE event_id = $1`, [event.event_id]);
      eventEmitter.emit(event.event_name, event);
      await db.query(`UPDATE event_outbox SET status = 'published', processed_at = NOW() WHERE event_id = $1`, [event.event_id]);
    } catch (err) {
      await db.query(`UPDATE event_outbox SET status = 'failed', attempts = attempts + 1, last_error = $2 WHERE event_id = $1`, [event.event_id, err.message]);
    }
  }
}

// Executar a cada 1s
setInterval(publishOutboxEvents, 1000);
```

### 8.5 Garantias do Outbox

| Garantia | Como é garantida |
|----------|-----------------|
| **Nenhum evento perdido** | Mesma transação que altera os dados |
| **Entrega ao menos uma vez** | Publisher relê eventos não publicados |
| **Ordenação por aggregate** | Publisher respeita `created_at` |
| **Resiliência a crash** | Ao reiniciar, eventos `processing` ou `pending` são reprocessados |
| **Sem duplicação (publisher)** | Lock otimista com `locked_at` + `FOR UPDATE SKIP LOCKED` |

---

## 9. Event Governance

### 9.1 Registry de Eventos

Cada capability deve declarar oficialmente:

| Capability | Eventos Produzidos | Eventos Consumidos | Criticidade | Owner |
|------------|-------------------|--------------------|-------------|-------|
| **C-02 Multi-Tenant** | `CompanyCreated`, `CompanyPlanChanged` | — | P0 | Core Team |
| **C-04 Event Bus** | `System.*` | Todos | P0 | Core Team |
| **C-05 Integration Layer** | `Integration.WhatsAppMessageReceived`, `Integration.WhatsAppMessageSent`, `Integration.EmailSent` | `AppointmentConfirmed`, `SaleCreated`, `Notification.*` | P1 | Core Team |
| **C-06 Automation Engine** | `Automation.*` | Domain Events, Integration Events | P1 | Core Team |
| **C-07 AI Layer** | `AI.*` | Domain Events, `Automation.*` | P2 | Core + AI Team |
| **C-08 Omnichannel** | `Notification.*` | Domain Events, Integration Events | P2 | Core Team |
| **C-09 N8N Bridge** | `Integration.WebhookReceived` | Domain Events | P1 | Core Team |
| **D-01 BarberGestor** | `Appointment*`, `Sale*`, `Payment*`, `Collaborator*`, `LowStockDetected` | — | P0 | Core Team |

### 9.2 Template de Declaração de Evento

```markdown
## Event: AppointmentConfirmed

| Campo | Valor |
|-------|-------|
| **Nome** | `AppointmentConfirmed` |
| **Versão** | 1 |
| **Categoria** | Domain Event |
| **Criticidade** | P0 |
| **Aggregate** | `appointment` |
| **Producer** | BarberGestor — Appointment Service |
| **Consumers** | Email, WhatsApp, CRM, Analytics |
| **Retry Policy** | 5 tentativas, backoff 3x, base 5s |
| **Idempotência** | `event_id` + `aggregate_id` |
| **Payload Obrigatório** | `appointment_id`, `company_id`, `collaborator_id`, `client_id`, `scheduled_at` |
| **Payload Opcional** | `notes`, `coupon_id`, `source` |
```

### 9.3 Regras de Governança

| # | Regra | Descrição |
|---|-------|-----------|
| G-EVT-01 | **Evento precisa de dono** | Nenhum evento pode existir sem um producer responsável |
| G-EVT-02 | **Evento precisa de schema** | Nenhum evento pode ser publicado sem schema registrado |
| G-EVT-03 | **Evento precisa de consumer** | Nenhum evento pode existir sem ao menos um consumer (mesmo que seja log) |
| G-EVT-04 | **Evento não quebra consumer** | Adicionar campos é seguro; remover ou renomear é breaking |
| G-EVT-05 | **Evento é imutável** | Um evento publicado nunca é alterado |
| G-EVT-06 | **Consumer deve ser idempotente** | Processar o mesmo evento duas vezes não causa side effect |
| G-EVT-07 | **Producer não conhece consumer** | Quem publica não sabe nem se importa com quem consome |
| G-EVT-08 | **Eventos de domínio são P0** | Domain events têm a mais alta prioridade de entrega |

---

## 10. Consumer Architecture

### 10.1 Contrato do Consumer

```typescript
interface EventConsumer {
  readonly eventName: string;       // Evento que consome
  readonly consumerName: string;    // Nome único do consumer
  readonly priority: number;        // 0 (mais alta) a 10 (mais baixa)
  readonly retryConfig: RetryConfig;

  handle(event: Event): Promise<ConsumerResult>;
}

type ConsumerResult =
  | { status: 'consumed' }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: Error; retryable: boolean };
```

### 10.2 Registro de Consumers

```typescript
// Exemplo de registro
eventBus.register({
  eventName: 'AppointmentConfirmed',
  consumerName: 'email-confirmation',
  priority: 1,
  retryConfig: {
    maxAttempts: 3,
    baseDelayMs: 5000,
    multiplier: 3,
    retryableErrors: ['TimeoutError', 'NetworkError']
  },
  async handle(event) {
    const { payload, tenant_id } = event;
    await emailService.send({
      to: payload.client_email,
      template: 'appointment-confirmed',
      data: payload
    });
    return { status: 'consumed' };
  }
});
```

### 10.3 Prioridade de Consumers

| Prioridade | Quando executar | Exemplos |
|-----------|----------------|----------|
| 0 (imediata) | Primeiro, antes de qualquer outro | Auditoria, logs |
| 1 (alta) | Logo após o evento | Email confirmação, N8N Bridge |
| 5 (média) | Após consumers prioritários | CRM, Analytics |
| 10 (baixa) | Por último, pode ser atrasado | Relatórios, sincronização batch |

### 10.4 Regras para Consumers

- Consumer **nunca altera banco direto** — sempre via API do backend
- Consumer **deve ser idempotente** — processar o mesmo evento duas vezes é seguro
- Consumer **deve ter timeout** — 30s padrão, configurável
- Consumer **deve logar resultado** — sucesso, ignorado, ou falha
- Consumer **não deve lançar exceção sem tratar** — nunca deixar um erro não capturado
- Consumer **não deve depender de estado local** — todo estado necessário vem do evento ou do banco

### 10.5 Tabela de Consumers

| Consumer | Eventos que consome | Prioridade | Timeout | Idempotência |
|----------|--------------------|------------|---------|-------------|
| `email-confirmation` | `AppointmentConfirmed`, `SaleCreated` | 1 | 15s | `event_id` |
| `whatsapp-notification` | `AppointmentConfirmed`, `AppointmentCanceled` | 1 | 30s | `event_id` |
| `n8n-bridge` | `AppointmentConfirmed`, `SaleCreated`, `CompanyCreated` | 2 | 30s | `event_id` |
| `crm-update` | `AppointmentConfirmed`, `SaleCreated`, `CollaboratorAdded` | 5 | 10s | `event_id` |
| `stock-update` | `SaleCreated` | 5 | 5s | `event_id` + `product_id` |
| `analytics-track` | `AppointmentConfirmed`, `SaleCreated`, `PaymentReceived` | 10 | 30s | `event_id` |
| `audit-log` | Todos os eventos P0/P1 | 0 | 5s | `event_id` |
| `ai-feed` | `AppointmentConfirmed`, `SaleCreated`, `CompanyCreated` | 10 | 30s | `event_id` |

---

## 11. Producer Architecture

### 11.1 Contrato do Producer

```typescript
interface EventProducer {
  publish<T>(eventName: string, payload: T, options?: PublishOptions): Promise<Event>;

  publishMany(events: { eventName: string; payload: unknown; options?: PublishOptions }[]): Promise<Event[]>;
}

interface PublishOptions {
  tenant_id?: string;
  aggregate_type?: string;
  aggregate_id?: string;
  correlation_id?: string;
  causation_id?: string;
  trace_id?: string;
  delay?: number;              // Atraso em ms para publicação
  skipOutbox?: boolean;        // Apenas para eventos de baixa criticidade
}
```

### 11.2 Como Publicar um Evento

```typescript
// No service, após alterar o banco
async function confirmAppointment(appointmentId: string, companyId: string) {
  const client = await db.beginTransaction();

  try {
    // 1. Altera o estado no banco
    await db.query(
      `UPDATE barber_appointments SET status = 'confirmed' WHERE id = $1 AND company_id = $2`,
      [appointmentId, companyId],
      { client }
    );

    // 2. Publica o evento (na mesma transação)
    const event = await eventBus.publish('AppointmentConfirmed', {
      appointment_id: appointmentId,
      company_id: companyId,
      // ... demais dados
    }, {
      tenant_id: companyId,
      aggregate_type: 'appointment',
      aggregate_id: appointmentId,
      correlation_id: generateCorrelationId(),
      client  // mesma conexão de banco
    });

    // 3. Commita a transação (evento + dados)
    await client.commit();

    return event;
  } catch (err) {
    await client.rollback();
    throw err;
  }
}
```

### 11.3 Regras para Producers

- Producer **publica evento na mesma transação** que altera os dados
- Producer **não sabe quem vai consumir** o evento
- Producer **não espera retorno** de consumers
- Producer **não trata falha de consumer** — isso é responsabilidade do Event Bus
- Producer **sempre inclui tenant_id** para eventos de domínio
- Producer **sempre inclui correlation_id** para rastreabilidade
- Producer **nunca publica eventos falsos** — só publica depois que a ação realmente aconteceu

---

## 12. Redis Role

### 12.1 Papel do Redis no Event Bus

Redis **não é usado diretamente pelos services**. Redis é uma camada de infraestrutura interna do Event Bus para:

| Funcionalidade | Como o Redis é usado | Alternativa sem Redis |
|---------------|---------------------|----------------------|
| **Pub/Sub para workers** | Canal Redis para distribuir eventos entre workers | Polling no PostgreSQL |
| **Rate limiting** | Contagem de requisições por consumer | In-memory (não escala) |
| **Lock distribuído** | Lock para workers concorrentes | Lock no PostgreSQL (SKIP LOCKED) |
| **Cache de agendamento** | Eventos futuros (delayed) | Tabela adicional no PostgreSQL |
| **Health check** | Heartbeat de workers | Timestamp no banco |

### 12.2 Quando o Redis será necessário

```
FASE 1: Outbox + EventEmitter (PostgreSQL apenas)
  - EventEmitter local
  - Outbox no PostgreSQL
  - Sem Redis

FASE 2: Redis Pub/Sub + BullMQ
  - Redis para Pub/Sub entre workers
  - BullMQ para filas de trabalho
  - Lock distribuído

FASE 3: Kafka/NATS (se necessário)
  - Redis ainda usado para cache e rate limiting
  - Kafka/NATS substitui Pub/Sub para alta escala
```

### 12.3 Regras do Redis

| # | Regra | Descrição |
|---|-------|-----------|
| R-RED-01 | Services nunca acessam Redis diretamente | O Event Bus é a única camada que interage com Redis |
| R-RED-02 | Redis não é source of truth | Dados no Redis são sempre recriáveis a partir do PostgreSQL |
| R-RED-03 | Redis não persiste eventos | Eventos são sempre persistidos no PostgreSQL (Outbox) |
| R-RED-04 | Redis pode falhar sem perder dados | Sem Redis, o sistema cai para polling no PostgreSQL |

---

## 13. N8N Role

### 13.1 N8N no Ecossistema de Eventos

N8N é **executor de automações**, não source of truth, não tomador de decisões.

```
Event Bus (C-04)
    │
    ▼
N8N Bridge (C-09)  ← consumer do Event Bus
    │
    ├──→ Chama webhook do N8N com payload do evento
    ├──→ N8N executa workflow
    └──→ N8N chama callback seguro no backend
            │
            ▼
        Backend valida e registra
```

### 13.2 Fluxo N8N com Event Bus

```
1. BarberGestor: sale.created → Event Bus
2. Event Bus: consumer "n8n-bridge" recebe evento
3. N8N Bridge: chama webhook N8N com { event_id, event_name, payload }
4. N8N: executa workflow "Pós-venda"
    ├── Envia WhatsApp para cliente
    ├── Agenda lembrete de retorno (7 dias)
    └── Atualiza planilha de vendas
5. N8N: chama callback POST /api/webhooks/n8n/callback
    ├── { event_id, workflow_id, status: "completed", results: [...] }
    └── Backend valida signature, registra resultado
6. Event Bus: publica "Automation.WorkflowCompleted"
```

### 13.3 Regras do N8N

| # | Regra | Descrição |
|---|-------|-----------|
| R-N8N-01 | N8N nunca altera banco direto | Toda ação passa pela API do backend |
| R-N8N-02 | N8N nunca é source of truth | Dados de automação são sempre validados pelo backend |
| R-N8N-03 | N8N só age via eventos | N8N recebe dados do Event Bus, não consulta banco |
| R-N8N-04 | N8N tem callback obrigatório | Toda ação do N8N resulta em callback para o backend |
| R-N8N-05 | Event Bus é pré-requisito | N8N Bridge só é implementada após Event Bus |

---

## 14. AI Operational Role

### 14.1 IA no Ecossistema de Eventos

A IA é **consumidora de eventos**, não produtora de eventos de domínio. Ela reage a eventos, publica recomendações.

```
Event Bus (C-04)
    │
    ├──→ AI.RecommendationGenerated ← IA publica
    ├──→ AI.PredictionCompleted
    └──→ AI.ActionSuggested

Consumers de IA:
    ├──→ AppointmentConfirmed → IA alimenta modelo de predição
    ├──→ SaleCreated → IA analisa padrão de compra
    └──→ CompanyCreated → IA prepara onboarding personalizado
```

### 14.2 Como a IA Consome Eventos

```
1. Evento "SaleCreated" é publicado
2. Consumer "ai-feed" recebe o evento
3. AI Operational Layer processa:
    ├── Alimenta modelo de demanda
    ├── Atualiza perfil do cliente
    └── Verifica se há recomendação a fazer
4. Se houver recomendação:
    ├── IA publica "AI.RecommendationGenerated"
    └── Automation Engine avalia se deve agir
```

### 14.3 Regras da IA

| # | Regra | Descrição |
|---|-------|-----------|
| R-IA-01 | IA nunca acessa banco direto | Dados chegam via eventos ou API |
| R-IA-02 | IA publica apenas eventos AI.* | IA não publica eventos de domínio |
| R-IA-03 | IA não toma decisões autônomas | Recomendações requerem confirmação (dependendo do nível) |
| R-IA-04 | IA pode ser desativada sem afetar core | Eventos continuam fluindo sem consumidor IA |
| R-IA-05 | Eventos de IA são best-effort | Perder um evento de IA não corrompe o sistema |

---

## 15. Omnichannel Role

### 15.1 Omnichannel no Ecossistema de Eventos

Omnichannel reage a eventos de domínio para **notificar clientes** através do canal apropriado.

```
Event Bus (C-04)
    │
    ├──→ AppointmentConfirmed
    ├──→ AppointmentCanceled
    ├──→ SaleCreated
    └──→ PaymentReceived
            │
            ▼
    Omnichannel Layer (C-08)
            │
            ├──→ WhatsApp Channel
            ├──→ Email Channel
            └──→ (futuro) Instagram, SMS, Push
```

### 15.2 Fluxo Omnichannel com Event Bus

```
1. "AppointmentConfirmed" é publicado
2. Omnichannel (via consumers) recebe o evento
3. Omnichannel consulta preferências do cliente:
    ├── Canal preferido: WhatsApp
    ├── Template: "appointment-confirmed-whatsapp"
    └── Idioma: PT-BR
4. Omnichannel chama Integration Layer
    ├── WhatsApp: envia mensagem
    └── Email (fallback): se WhatsApp falhar
5. Omnichannel publica resultado:
    ├── "Notification.WhatsAppSent" ou
    └── "Notification.EmailSent"
```

### 15.3 Regras do Omnichannel

| # | Regra | Descrição |
|---|-------|-----------|
| R-OMNI-01 | Omnichannel nunca decide o que notificar | Apenas reage a eventos existentes |
| R-OMNI-02 | Omnichannel respeita preferências do cliente | Canal, horário, frequência |
| R-OMNI-03 | Omnichannel tem fallback de canal | Se WhatsApp falhar, tenta email |
| R-OMNI-04 | Omnichannel publica resultado | Todo envio gera evento de notificação |
| R-OMNI-05 | Event Bus é pré-requisito | Omnichannel só existe após Event Bus |

---

## 16. Observabilidade

### 16.1 Métricas do Event Bus

| Métrica | O que mede | Onde | Alerta |
|---------|-----------|------|--------|
| `eventbus.produced.total` | Total de eventos produzidos | Prometheus | — |
| `eventbus.produced.rate` | Taxa de produção por segundo | Prometheus | — |
| `eventbus.consumed.total` | Total de eventos consumidos | Prometheus | — |
| `eventbus.consumed.duration` | Tempo de processamento por consumer | Prometheus | > 30s |
| `eventbus.outbox.pending` | Eventos aguardando na outbox | Prometheus | > 1000 |
| `eventbus.outbox.lag` | Atraso entre criação e publicação | Prometheus | > 10s |
| `eventbus.retry.count` | Número de retries | Prometheus | — |
| `eventbus.dlq.count` | Eventos na Dead Letter Queue | Prometheus | > 0 (P0) |
| `eventbus.consumer.errors` | Erros por consumer | Prometheus | > 5% taxa |

### 16.2 Logs Estruturados

```typescript
// Evento produzido
logger.info({
  msg: 'Event published',
  event_id: event.event_id,
  event_name: event.event_name,
  tenant_id: event.tenant_id,
  correlation_id: event.correlation_id,
  duration_ms: Date.now() - start
});

// Evento consumido
logger.info({
  msg: 'Event consumed',
  event_id: event.event_id,
  consumer: consumer.consumerName,
  event_name: event.event_name,
  status: 'consumed',
  duration_ms: Date.now() - start
});

// Evento com falha
logger.error({
  msg: 'Event failed',
  event_id: event.event_id,
  consumer: consumer.consumerName,
  event_name: event.event_name,
  attempt: attempt,
  error: sanitizeError(error),  // Sem dados sensíveis
  retryable: retryable
});
```

### 16.3 Dashboard (Futuro)

```
┌─────────────────────────────────────────────────────────────┐
│  EVENT BUS DASHBOARD                                        │
├───────────────────┬───────────────────┬─────────────────────┤
│  Produzidos (24h) │  Consumidos (24h) │  DLQ Atual          │
│  12,450           │  12,380           │  3 (P0: 1, P1: 2)  │
├───────────────────┴───────────────────┴─────────────────────┤
│  Top Eventos                                                │
│  ┌──────────────────┬────────┬────────┬──────────────────┐  │
│  │ Evento           │ Produz.│ Consum.│ Taxa Erro        │  │
│  ├──────────────────┼────────┼────────┼──────────────────┤  │
│  │ SaleCreated      │ 4,250  │ 4,248  │ 0.05%            │  │
│  │ AppointmentConf. │ 3,800  │ 3,795  │ 0.13%            │  │
│  │ PaymentReceived  │ 2,100  │ 2,100  │ 0.00%            │  │
│  └──────────────────┴────────┴────────┴──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Latência Média por Consumer                                │
│  ┌──────────────────┬──────────┬──────────┬──────────────┐  │
│  │ Consumer         │ P50      │ P95      │ P99          │  │
│  ├──────────────────┼──────────┼──────────┼──────────────┤  │
│  │ audit-log        │ 2ms      │ 5ms      │ 10ms         │  │
│  │ email-confirm.   │ 150ms    │ 800ms    │ 2s           │  │
│  │ n8n-bridge       │ 500ms    │ 3s       │ 15s          │  │
│  └──────────────────┴──────────┴──────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 17. Correlation IDs

### 17.1 Estrutura de Tracing

```
trace_id (fixo para toda a cadeia de operações)
    │
    ├── correlation_id (fixo para uma operação específica)
    │       │
    │       ├── causation_id (evento que causou este)
    │       │
    │       └── event_id (este evento)
    │
    ├── correlation_id (outra operação paralela)
    │
    └── ...
```

### 17.2 Exemplo de Cadeia

```
Início: Usuário confirma agendamento no frontend
  trace_id = "trace_abc123"

Passo 1: POST /api/appointments/confirm
  correlation_id = "corr_req_001"
  causation_id = null

Passo 2: Service confirma no banco
  correlation_id = "corr_req_001"
  causation_id = null

Passo 3: Event Bus publica AppointmentConfirmed
  correlation_id = "corr_req_001"
  causation_id = null
  event_id = "evt_appt_789"

Passo 4: Consumer "email-confirmation" processa
  correlation_id = "corr_email_001"
  causation_id = "evt_appt_789"
  event_id = "evt_email_001"

Passo 5: Consumer "n8n-bridge" chama N8N
  correlation_id = "corr_n8n_001"
  causation_id = "evt_appt_789"
  event_id = "evt_n8n_001"

Passo 6: N8N chama callback
  correlation_id = "corr_callback_001"
  causation_id = "evt_n8n_001"
  event_id = "evt_callback_001"

Passo 7: Backend registra resultado
  correlation_id = "corr_callback_001"
  causation_id = "evt_callback_001"
```

**Resultado:** Podemos rastrear do clique do usuário até a mensagem de WhatsApp, passando por 7 eventos encadeados.

### 17.3 Geração de IDs

```typescript
function generateTraceId(): string {
  return `trace_${uuid.v4().slice(0, 8)}`;
}

function generateCorrelationId(): string {
  return `corr_${uuid.v4().slice(0, 8)}`;
}

// trace_id: gerado uma vez no ponto de entrada (request HTTP, webhook, cron)
// correlation_id: gerado a cada nova "operação" na cadeia
// causation_id: sempre o event_id do evento anterior
```

---

## 18. Runtime Orchestration

### 18.1 Fluxo de Inicialização

```
1. Server.start()
    │
2. Database.connect()
    │
3. EventBus.initialize()
    │
    ├── 3a. Criar tabelas (event_outbox, event_consumers, event_dlq) se não existirem
    ├── 3b. Registrar consumers
    ├── 3c. Iniciar Outbox Publisher (setInterval)
    ├── 3d. Processar eventos não finalizados (recovery)
    └── 3e. Log: "Event Bus initialized"
    │
4. Server.ready()
```

### 18.2 Fluxo de Shutdown

```
1. Server.shutdown()
    │
2. EventBus.shutdown()
    │
    ├── 2a. Parar Outbox Publisher
    ├── 2b. Aguardar consumers em andamento (timeout: 30s)
    ├── 2c. Marcar eventos processing como pending (para recovery)
    └── 2d. Log: "Event Bus shutdown"
    │
3. Database.disconnect()
```

### 18.3 Recovery ao Reiniciar

Ao reiniciar, o Event Bus deve:

1. Buscar todos os eventos com status `processing` ou `published` mas sem confirmação de consumer
2. Marcar como `pending` para reprocessamento
3. Retomar a publicação normalmente

Isso garante que **nenhum evento é perdido** durante restart.

---

## 19. Escalabilidade

### 19.1 Estratégia de Escala

| Componente | Fase 1 (Outbox + EE) | Fase 2 (Redis + BullMQ) | Fase 3 (Kafka) |
|-----------|---------------------|------------------------|----------------|
| **Outbox** | PostgreSQL | PostgreSQL | PostgreSQL |
| **Pub/Sub** | EventEmitter (single process) | Redis Pub/Sub | Kafka/NATS |
| **Fila** | Nenhuma (direto no consumer) | BullMQ (Redis) | Kafka partitions |
| **Workers** | 1 processo | Múltiplos processos | Múltiplos nós |
| **Lock** | SKIP LOCKED (PG) | Redis Redlock | Kafka partitions |
| **Throughput** | ~100 evt/s | ~1.000 evt/s | ~10.000+ evt/s |

### 19.2 Gargalos Conhecidos

| Gargalo | Fase 1 | Fase 2 | Fase 3 |
|---------|--------|--------|--------|
| **Outbox polling** | 1s interval | 100ms interval | Event-driven (LISTEN/NOTIFY) |
| **EventEmitter** | Single thread | Cluster mode | Kafka partitions |
| **Consumer paralelismo** | Sequential por aggregate | Parallel por partition | Parallel + ordered |
| **PostgreSQL write** | Outbox + dados na mesma transação | Outbox separada | Write-ahead log streaming |

### 19.3 Limites por Fase

```
Fase 1 (PostgreSQL + EventEmitter):
  Máximo: ~100 eventos/s
  Limite: Single thread, polling a cada 1s
  Ideal para: ~50 empresas ativas

Fase 2 (Redis + BullMQ):
  Máximo: ~1.000 eventos/s
  Limite: Redis throughput
  Ideal para: ~500 empresas ativas

Fase 3 (Kafka/NATS):
  Máximo: ~10.000+ eventos/s
  Limite: Partições e brokers
  Ideal para: 5.000+ empresas ativas
```

---

## 20. Roadmap Evolutivo

### 20.1 Fase 1: Outbox + EventEmitter (Agora)

**Duração:** 2 semanas  
**Stack:** PostgreSQL + EventEmitter (Node.js)  
**Objetivo:** Fundação de eventos assíncronos com entrega garantida

| Entrega | Descrição | Dependências |
|---------|-----------|-------------|
| Tabela `event_outbox` | Persistência de eventos | C-01 (Shared Kernel) |
| Tabela `event_consumers` | Registro de processamento | C-01 |
| Tabela `event_dlq` | Dead letter queue | C-01 |
| Outbox Publisher | Worker que lê e publica eventos | — |
| Event Router | Roteia eventos para consumers | — |
| 3 primeiros eventos | `AppointmentConfirmed`, `SaleCreated`, `CompanyCreated` | D-01 |
| 3 primeiros consumers | `audit-log`, `email-confirmation`, `crm-update` | — |
| Retry com backoff | Estratégia de retry exponencial | — |
| DLQ com revisão | Dead letter queue com replay manual | — |
| Logs estruturados | Pino para todos os eventos | — |

### 20.2 Fase 2: Redis + BullMQ (2-3 meses)

**Duração:** 2-3 semanas  
**Stack:** Redis + BullMQ + Cluster Node.js  
**Objetivo:** Distribuir processamento entre múltiplos workers

| Entrega | Descrição | Dependências |
|---------|-----------|-------------|
| Redis Pub/Sub | Distribuir eventos entre processos | Redis |
| BullMQ | Fila de trabalho para consumers lentos | Redis |
| Lock distribuído | Evitar duplicação entre workers | Redis |
| Cluster mode | Múltiplos processos Node.js | — |
| Rate limiting | Controle de throughput por consumer | Redis |
| Health check | Heartbeat de workers | Redis |
| Delayed events | Eventos com agendamento futuro | Redis |
| Dashboard | Métricas em tempo real | — |

### 20.3 Fase 3: Kafka/NATS (6+ meses)

**Duração:** 3-4 semanas  
**Stack:** Kafka ou NATS + Cluster multi-nó  
**Objetivo:** Escala horizontal e multi-região

| Entrega | Descrição | Dependências |
|---------|-----------|-------------|
| Kafka/NATS | Message broker distribuído | Infra Kafka/NATS |
| Partições por aggregate | Ordenação garantida por chave | — |
| Multi-region | Replicação entre regiões | — |
| Exactly-once processing | Garantia de processamento único | — |
| Schema registry | Catálogo central de schemas | — |
| Stream processing | Processamento contínuo de eventos | — |

### 20.4 Roadmap Visual

```
Fase 1 — Outbox + EventEmitter (Semanas 1-2)
████████████████████████████████░░░░░░░░░░ 80%
  ✅ Tabelas
  ✅ Outbox Publisher
  ✅ Event Router
  🔲 3 eventos iniciais
  🔲 3 consumers iniciais
  🔲 Retry + DLQ

Fase 2 — Redis + BullMQ (Semanas 9-12)
██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 15%
  🔲 Redis Pub/Sub
  🔲 BullMQ
  🔲 Lock distribuído
  🔲 Dashboard

Fase 3 — Kafka/NATS (Semanas 24+)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
  🔲 Kafka/NATS
  🔲 Multi-region
  🔲 Exactly-once
```

---

## 21. Integração com Capabilities

### 21.1 Matriz de Integração

| Capability | ID | Eventos que Produz | Eventos que Consome | Status | Depende do Event Bus? |
|-----------|-----|-------------------|--------------------|--------|----------------------|
| Shared Kernel | C-01 | — | — | 📋 Planejado | ❌ (é pré-requisito) |
| Multi-Tenant Engine | C-02 | `CompanyCreated`, `CompanyPlanChanged` | — | ✅ Parcial | 🔮 Futuro |
| Event Bus | C-04 | `System.*` | Todos | 📋 Planejado | ❌ (é ele mesmo) |
| Integration Layer | C-05 | `Integration.*`, `Notification.*` | Domain Events | 📋 Planejado | ✅ Crítico |
| Automation Engine | C-06 | `Automation.*` | Domain Events, `Integration.*` | 📋 Planejado | ✅ Crítico |
| AI Operational Layer | C-07 | `AI.*` | Domain Events, `System.*` | 🔮 Futuro | ✅ Essencial |
| Omnichannel Layer | C-08 | `Notification.*` | Domain Events | 🔮 Futuro | ✅ Essencial |
| N8N Bridge | C-09 | `Integration.WebhookReceived` | Domain Events | 📋 Planejado | ✅ Crítico |

### 21.2 Fluxo de Integração entre Capabilities

```
C-02 Multi-Tenant
  │
  ├── "CompanyCreated" → C-04 Event Bus
  │       ├── C-05 Integration Layer → Email de boas-vindas
  │       ├── C-06 Automation Engine → Workflow onboarding
  │       └── C-07 AI Layer → Preparar modelo da empresa
  │
  └── "CompanyPlanChanged" → C-04 Event Bus
          ├── C-06 Automation Engine → Atualizar feature guards
          └── C-09 N8N Bridge → Faturar diferença

D-01 BarberGestor
  │
  ├── "AppointmentConfirmed" → C-04 Event Bus
  │       ├── C-05 Integration Layer → WhatsApp/Email confirmação
  │       ├── C-06 Automation Engine → Agendar lembrete
  │       └── C-07 AI Layer → Alimentar predição
  │
  ├── "SaleCreated" → C-04 Event Bus
  │       ├── C-05 Integration Layer → Enviar recibo
  │       ├── C-06 Automation Engine → Verificar meta
  │       └── C-07 AI Layer → Recomendar upselling
  │
  └── "LowStockDetected" → C-04 Event Bus
          └── C-09 N8N Bridge → Notificar fornecedor
```

---

## 22. Eventos Oficiais

### 22.1 Catálogo de Eventos (Inicial)

| Nome | Versão | Categoria | Criticidade | Producer | Consumers Esperados |
|------|--------|-----------|-------------|----------|-------------------|
| `AppointmentConfirmed` | 1 | Domain | **P0 — Crítico** | BarberGestor | Email, WhatsApp, CRM, Analytics, IA |
| `AppointmentCanceled` | 1 | Domain | **P0 — Crítico** | BarberGestor | Email, WhatsApp, CRM |
| `AppointmentRescheduled` | 1 | Domain | P1 — Essencial | BarberGestor | Email, WhatsApp |
| `SaleCreated` | 1 | Domain | **P0 — Crítico** | BarberGestor | Email, WhatsApp, CRM, Estoque, IA |
| `SaleRefunded` | 1 | Domain | **P0 — Crítico** | BarberGestor | CRM, Financeiro |
| `PaymentReceived` | 1 | Domain | **P0 — Crítico** | BarberGestor | Billing, Invoice, Email |
| `PaymentFailed` | 1 | Domain | P1 — Essencial | BarberGestor | Email, CRM |
| `CompanyCreated` | 1 | Domain | **P0 — Crítico** | Multi-Tenant | Email, Onboarding, IA |
| `CompanyPlanChanged` | 1 | Domain | **P0 — Crítico** | Multi-Tenant | Billing, Feature Guards |
| `CollaboratorAdded` | 1 | Domain | P1 — Essencial | BarberGestor | Email, Onboarding |
| `CollaboratorRemoved` | 1 | Domain | P1 — Essencial | BarberGestor | Email, CRM |
| `LowStockDetected` | 1 | Domain | P1 — Essencial | BarberGestor | Notification, N8N |
| `WorkflowStarted` | 1 | Automation | P2 — Estratégico | Automation Engine | Audit, Analytics |
| `WorkflowCompleted` | 1 | Automation | P2 — Estratégico | Automation Engine | Audit, Analytics |
| `WorkflowFailed` | 1 | Automation | P1 — Essencial | Automation Engine | Audit, Notification |
| `AI.RecommendationGenerated` | 1 | AI | P2 — Estratégico | AI Layer | Automation Engine |
| `AI.PredictionCompleted` | 1 | AI | P3 — Estratégico | AI Layer | Analytics |
| `AI.ActionSuggested` | 1 | AI | P2 — Estratégico | AI Layer | Automation Engine |
| `AI.ActionApproved` | 1 | AI | P1 — Essencial | Automation Engine | AI Layer |
| `AI.ActionRejected` | 1 | AI | P3 — Baixa | Automation Engine | AI Layer |
| `Integration.WhatsAppMessageReceived` | 1 | Integration | P1 — Essencial | Integration Layer | Omnichannel, CRM |
| `Integration.WhatsAppMessageSent` | 1 | Notification | P2 — Estratégico | Integration Layer | Audit |
| `Integration.EmailSent` | 1 | Notification | P2 — Estratégico | Integration Layer | Audit |
| `Integration.WebhookReceived` | 1 | Integration | P1 — Essencial | N8N Bridge | Automation Engine |
| `System.TenantCreated` | 1 | System | **P0 — Crítico** | Multi-Tenant | Setup, Billing |
| `System.TenantSuspended` | 1 | System | **P0 — Crítico** | Multi-Tenant | Auth, Billing |
| `System.ErrorThresholdExceeded` | 1 | System | **P0 — Crítico** | Event Bus | Notification, Alert |

### 22.2 Schema de AppointmentConfirmed (v1)

```json
{
  "event_name": "AppointmentConfirmed",
  "version": 1,
  "payload": {
    "appointment_id": { "type": "string", "required": true },
    "company_id": { "type": "string", "required": true },
    "collaborator_id": { "type": "string", "required": true },
    "client_id": { "type": "string", "required": true },
    "client_name": { "type": "string", "required": true },
    "client_phone": { "type": "string", "required": false },
    "client_email": { "type": "string", "required": false },
    "service_id": { "type": "string", "required": true },
    "service_name": { "type": "string", "required": true },
    "price": { "type": "number", "required": true },
    "scheduled_at": { "type": "string", "format": "ISO8601", "required": true },
    "duration_minutes": { "type": "number", "required": true },
    "notes": { "type": "string", "required": false },
    "source": { "type": "string", "enum": ["app", "landing_page", "whatsapp", "api"], "required": false }
  },
  "example": {
    "appointment_id": "appt_789",
    "company_id": "company_42",
    "collaborator_id": "col_15",
    "client_id": "cli_301",
    "client_name": "João Silva",
    "client_phone": "5511999999999",
    "service_name": "Corte Degradê",
    "price": 65.00,
    "scheduled_at": "2026-05-20T14:00:00Z",
    "duration_minutes": 45
  }
}
```

---

## 23. Regras Definitivas

### 23.1 Regras Arquiteturais

| # | Regra | Violação |
|---|-------|----------|
| R-EVT-01 | **Services NÃO chamam integrações diretamente** | Service não pode fazer `emailService.send()` diretamente; deve publicar evento |
| R-EVT-02 | **IA NÃO acessa banco diretamente** | IA recebe dados via eventos ou API, nunca via connection string |
| R-EVT-03 | **N8N NÃO é source of truth** | N8N só age via API do backend, nunca altera banco direto |
| R-EVT-04 | **Redis NÃO é usado diretamente pelos services** | Services não conhecem Redis; o Event Bus abstrai |
| R-EVT-05 | **Tudo passa pelo Event Bus** | Comunicação assíncrona entre domínios sempre via eventos |

### 23.2 Regras de Eventos

| # | Regra | Descrição |
|---|-------|-----------|
| R-EVT-06 | **Consumers devem ser idempotentes** | Processar o mesmo evento duas vezes não causa efeito colateral |
| R-EVT-07 | **Eventos são imutáveis** | Um evento publicado nunca é alterado; correções são novos eventos |
| R-EVT-08 | **Eventos possuem versionamento** | Mudanças breaking exigem nova versão ou novo nome |
| R-EVT-09 | **Automações reagem a eventos** | Nenhuma automação é gatilhada por polling, cron ou hook direto |
| R-EVT-10 | **Omnichannel reage a eventos** | Omnichannel não decide o que notificar; reage a eventos de domínio |
| R-EVT-11 | **IA reage a eventos** | IA não "escuta" o banco; IA recebe dados via eventos |

### 23.3 Regras de Implementação

| # | Regra | Fase |
|---|-------|------|
| R-EVT-12 | **Outbox pattern é obrigatório desde o início** | Fase 1 |
| R-EVT-13 | **Todo evento deve ter tenant_id** | Fase 1 |
| R-EVT-14 | **Todo evento deve ter correlation_id** | Fase 1 |
| R-EVT-15 | **DLQ deve ser revisada semanalmente** | Fase 1 |
| R-EVT-16 | **Consumers devem ter timeout** | Fase 1 |
| R-EVT-17 | **Eventos P0 na DLQ disparam alerta imediato** | Fase 1 |
| R-EVT-18 | **Redis só é adicionado quando provado necessário** | Fase 2 |
| R-EVT-19 | **Kafka/NATS só após prova de escala** | Fase 3 |

### 23.4 Proibições Absolutas

- ❌ **Nunca** publicar evento sem estar na mesma transação que alterou os dados
- ❌ **Nunca** esperar resposta síncrona de um evento assíncrono
- ❌ **Nunca** criar consumer que acessa banco direto
- ❌ **Nunca** criar evento sem schema registrado
- ❌ **Nunca** ignorar falha de consumer sem DLQ
- ❌ **Nunca** usar Event Bus para comunicação síncrona (request-response)
- ❌ **Nunca** hardcodear nomes de eventos em strings soltas (usar constantes)

### 23.5 Proteção Arquitetural do Event Bus

| # | Regra | Violação | Consequência |
|---|-------|----------|-------------|
| R-EVT-20 | **Nenhum consumer pode ser implementado antes do Event Bus** | Consumer registrado sem C-04 existir | Consumer ignorado até Event Bus pronto |
| R-EVT-21 | **Nenhum esquema de evento pode ser criado sem passar pelo Schema Registry** | Evento com payload não documentado | Rejeitado no Gate 6 |
| R-EVT-22 | **Nenhum evento de automação pode existir antes dos eventos de domínio** | Automation.WorkflowStarted sem AppointmentConfirmed | Ordem topológica violada |
| R-EVT-23 | **Nenhum evento de IA pode existir antes dos eventos de domínio + automação** | AI.RecommendationGenerated sem SaleCreated | Ordem topológica violada |
| R-EVT-24 | **Nenhum sistema externo (N8N, WhatsApp) pode consumir eventos sem passar pelo Integration Layer ou N8N Bridge** | Serviço externo lendo evento direto do banco | Violação de segurança + source of truth |
| R-EVT-25 | **Event Bus não pode ser substituído por implementação paralela** | Dois sistemas de eventos concorrentes | Consolidação obrigatória |

### 23.6 Anti-Fragility do Event Bus

O Event Bus é protegido por camadas que garantem sua estabilidade mesmo sob pressão de implementação acelerada:

```
Camada 1 — Outbox Pattern
  Garante que nenhum evento é perdido, mesmo em falha de serviço

Camada 2 — Retry Policy
  Garante que falhas temporárias são absorvidas sem perder eventos

Camada 3 — DLQ
  Garante que eventos com falha permanente são preservados para análise

Camada 4 — Proteção Arquitetural (R-EVT-20 a R-EVT-25)
  Garante que o Event Bus evolui na ordem correta, sem atalhos
```

**Regra:** Se uma implementação propõe pular qualquer uma destas camadas, ela é automaticamente rejeitada por violação da Proteção Arquitetural.

---

## Apêndices

### A. Tabelas do Event Bus

```sql
-- Outbox: eventos aguardando publicação
CREATE TABLE event_outbox (
  event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name      VARCHAR(255) NOT NULL,
  version         INTEGER NOT NULL DEFAULT 1,
  tenant_id       VARCHAR(255),
  aggregate_type  VARCHAR(100),
  aggregate_id    VARCHAR(255),
  payload         JSONB NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}',
  correlation_id  VARCHAR(255),
  causation_id    VARCHAR(255),
  trace_id        VARCHAR(255),
  status          VARCHAR(50) DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  attempts        INTEGER DEFAULT 0,
  last_error      TEXT,
  locked_at       TIMESTAMPTZ,
  locked_by       VARCHAR(255)
);

-- Consumers: registro de processamento
CREATE TABLE event_consumers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES event_outbox(event_id),
  consumer_name   VARCHAR(255) NOT NULL,
  status          VARCHAR(50) DEFAULT 'pending',
  attempt         INTEGER DEFAULT 0,
  result          JSONB,
  error           TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  duration_ms     INTEGER
);

-- DLQ: eventos com falha permanente
CREATE TABLE event_dlq (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL,
  consumer_name   VARCHAR(255) NOT NULL,
  event_name      VARCHAR(255) NOT NULL,
  payload         JSONB NOT NULL,
  error           JSONB NOT NULL,
  attempts        INTEGER NOT NULL,
  moved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          VARCHAR(50) DEFAULT 'pending',
  resolution      TEXT,
  resolved_by     VARCHAR(255),
  resolved_at     TIMESTAMPTZ,
  replayed_at     TIMESTAMPTZ
);
```

### B. Glossário

| Termo | Definição |
|-------|-----------|
| **Outbox Pattern** | Padrão que garante entrega de eventos persistindo-os na mesma transação dos dados |
| **Dead Letter Queue (DLQ)** | Fila de eventos que falharam permanentemente após todas as tentativas |
| **Idempotência** | Capacidade de processar o mesmo evento múltiplas vezes sem efeito colateral |
| **Correlation ID** | ID que rastreia uma cadeia de operações relacionadas |
| **Causation ID** | ID do evento que causou o evento atual |
| **Aggregate** | Entidade raiz de um domínio (ex: appointment, sale, company) |
| **Backoff Exponencial** | Estratégia de retry onde o atraso aumenta exponencialmente |
| **Consumer** | Módulo que processa eventos de um tipo específico |
| **Producer** | Qualquer parte do sistema que publica eventos |
| **Schema Registry** | Catálogo de schemas de eventos com versões |

### C. Constantes

```typescript
// Nomes de eventos como constantes (nunca strings soltas)
const EVENTS = {
  APPOINTMENT_CONFIRMED: 'AppointmentConfirmed',
  APPOINTMENT_CANCELED: 'AppointmentCanceled',
  APPOINTMENT_RESCHEDULED: 'AppointmentRescheduled',
  SALE_CREATED: 'SaleCreated',
  SALE_REFUNDED: 'SaleRefunded',
  PAYMENT_RECEIVED: 'PaymentReceived',
  PAYMENT_FAILED: 'PaymentFailed',
  COMPANY_CREATED: 'CompanyCreated',
  COMPANY_PLAN_CHANGED: 'CompanyPlanChanged',
  COLLABORATOR_ADDED: 'CollaboratorAdded',
  COLLABORATOR_REMOVED: 'CollaboratorRemoved',
  LOW_STOCK_DETECTED: 'LowStockDetected',
  WORKFLOW_STARTED: 'WorkflowStarted',
  WORKFLOW_COMPLETED: 'WorkflowCompleted',
  WORKFLOW_FAILED: 'WorkflowFailed',
  AI_RECOMMENDATION_GENERATED: 'AI.RecommendationGenerated',
  AI_PREDICTION_COMPLETED: 'AI.PredictionCompleted',
  AI_ACTION_SUGGESTED: 'AI.ActionSuggested',
  AI_ACTION_APPROVED: 'AI.ActionApproved',
  AI_ACTION_REJECTED: 'AI.ActionRejected',
  INTEGRATION_WHATSAPP_RECEIVED: 'Integration.WhatsAppMessageReceived',
  INTEGRATION_WHATSAPP_SENT: 'Integration.WhatsAppMessageSent',
  INTEGRATION_EMAIL_SENT: 'Integration.EmailSent',
  INTEGRATION_WEBHOOK_RECEIVED: 'Integration.WebhookReceived',
  SYSTEM_TENANT_CREATED: 'System.TenantCreated',
  SYSTEM_TENANT_SUSPENDED: 'System.TenantSuspended',
  SYSTEM_ERROR_THRESHOLD: 'System.ErrorThresholdExceeded',
} as const;
```

### D. Referências

| Documento | Caminho |
|-----------|---------|
| Architecture Decisions | `docs/architecture-decisions.md` |
| Capabilities Map | `docs/capabilities-map.md` |
| MCP Governance | `docs/mcp-governance.md` |
| Runtime Map | `docs/core/runtime-map.md` |
| Core History | `docs/MULTGESTOR_CORE_HISTORY.md` |
| Lessons Learned | `docs/lessons-learned.md` |
| Master Orchestrator | `.agent/Joe-orchestrators/agents/master-orchestrator.md` |
| Event Schemas (futuro) | `docs/events/` |

---

*Este documento é vinculante para toda a arquitetura de eventos do MultGestor Core.*

*Nenhum evento pode ser criado, alterado ou removido sem seguir as regras de governança da seção 9.*

*O Event Bus é a fundação sobre a qual Integration Layer, Automation Engine, AI Operational Layer, Omnichannel e N8N Bridge são construídos. Nada disso existe sem ele.*

*Dúvidas sobre arquitetura de eventos devem ser resolvidas consultando o Enterprise Event Architect ou o Master Orchestrator.*
