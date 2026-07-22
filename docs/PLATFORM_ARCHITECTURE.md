# MultGestor — Platform Architecture

> Versão: 2.0 | Atualizado: Maio 2026
> Documento vivo. Toda decisão arquitetural importante deve ser registrada aqui.

---

## 1. Visão Geral da Plataforma

O MultGestor é uma **plataforma SaaS multi-tenant, event-driven e AI-native** para negócios locais.

**Não é um sistema de barbearia.**
É um Core operacional capaz de gerar verticais independentes:

```
MultGestor Core
├── BarberGestor     (vertical 1 — barbearias)        ✅ Ativo
├── ClimaGestor      (vertical 2 — clínicas estética)  📋 Backlog
├── PetGestor        (vertical 3 — pet shops)          🔮 Futuro
├── AutoGestor       (vertical 4 — oficinas)           🔮 Futuro
├── HotelGestor      (vertical 5 — pousadas)           🔮 Futuro
└── AgroGestor       (vertical 6 — agronegócio)        🔮 Futuro
```

---

## 2. Princípios Arquiteturais Obrigatórios

### P1 — Capabilities, não Features
Toda feature implementada DEVE ser pensada como uma **capability reutilizável do Core**:

| Feature específica | Capability do Core |
|---|---|
| "Agenda de barbearia" | **Booking Engine** |
| "Notificação WhatsApp" | **Communication Layer** |
| "Planos e assinaturas" | **Recurring Revenue Engine** |
| "Chatbot de IA" | **AI Operational Layer** |
| "Relatório financeiro" | **Analytics Engine** |

### P2 — Multi-Tenant by Design
- Toda tabela de dados operacionais TEM `company_id`
- `company_id` é extraído do JWT, NUNCA do body da requisição
- Nenhum query acessa dados cross-tenant sem auditoria explícita

### P3 — Event-Driven por Padrão
- Toda ação de negócio significativa publica um **Domain Event**
- Consumidores são desacoplados dos produtores
- Eventos persistidos via **Outbox Pattern** (garantia de entrega)

### P4 — AI-Native
- IA não é um chatbot. É a **camada operacional de inteligência**
- Eventos de negócio alimentam modelos de classificação, predição e recomendação
- Toda feature deve ter "AI hooks" desde o design

### P5 — White-Label Ready
- Nenhum hardcode de marca, nome de empresa ou cor no código
- Toda identidade visual vem de configuração por tenant
- Slugs públicos são únicos por tenant

---

## 3. Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTS                               │
│   Web App (React)  │  Mobile (PWA)  │  API Consumers    │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / REST
┌──────────────────────────▼──────────────────────────────┐
│                   API GATEWAY LAYER                      │
│   Auth · Rate Limiting · Correlation · Tenant Context   │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                  APPLICATION LAYER                       │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Routes     │  │ Controllers │  │   Middlewares   │  │
│  │  (HTTP)     │  │ (thin)      │  │   (guards)      │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────┘  │
│         └────────────────┘                               │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   DOMAIN LAYER                           │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Services   │  │ Repositories│  │  Domain Events  │  │
│  │ (business)  │  │ (data)      │  │  (event bus)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│              PLATFORM CAPABILITIES                       │
│                                                          │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ Booking      │  │ Communication │  │ Billing /    │  │
│  │ Engine       │  │ Layer         │  │ Revenue Eng. │  │
│  └──────────────┘  └───────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ CRM Engine   │  │ Analytics Eng │  │ AI Ops Layer │  │
│  └──────────────┘  └───────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌───────────────┐                     │
│  │ Automation   │  │ Outbox /      │                     │
│  │ Engine       │  │ Event Store   │                     │
│  └──────────────┘  └───────────────┘                     │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│               INFRASTRUCTURE LAYER                       │
│  PostgreSQL · Redis (futuro) · Supabase · Pino Logger   │
│  Resend Email · WhatsApp API · Payment Gateway           │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Platform Capabilities (Core Reutilizável)

### 4.1 Booking Engine
**O que é:** Motor de agendamento genérico, não específico de barbearia.

**Capabilities:**
- Disponibilidade por recurso (colaborador, sala, equipamento)
- Slots configuráveis por dia/horário
- Bloqueios manuais e automáticos
- Fila de espera
- Confirmação e lembretes automáticos

**Eventos publicados:**
- `appointment.created`
- `appointment.confirmed`
- `appointment.canceled`
- `appointment.rescheduled`
- `appointment.completed`

**Verticais que usam:** BarberGestor, ClimaGestor, PetGestor

---

### 4.2 Communication Layer
**O que é:** Camada unificada de comunicação (não é "WhatsApp feature").

**Channels suportados:**
- WhatsApp Business API
- E-mail transacional (Resend/SMTP)
- SMS (futuro)
- Push Notification (futuro)

**Interface:**
```js
communicationLayer.send({
  channel: 'whatsapp' | 'email' | 'sms',
  to: { phone, email },
  template: 'appointment.confirmation',
  data: { appointment, company, customer }
})
```

**Estado atual:** WhatsApp em mock. Email funcional.

---

### 4.3 Recurring Revenue Engine
**O que é:** Motor de billing/assinatura multi-gateway.

**Capabilities:**
- Planos (trial, free, essencial, profissional, premium)
- Feature flags por plano
- Limites por plano (max_collaborators)
- Integração com gateways (Kiwify ativa, outros futuro)
- Webhooks de eventos de cobrança

**Estado atual:** Funcional via Kiwify. Sem processamento online de pagamento.

---

### 4.4 CRM Engine
**O que é:** Motor de relacionamento com cliente final do tenant.

**Capabilities:**
- Histórico de interações
- Segmentação
- Notas e tags
- Frequência e valor
- Campanhas (futuro)

---

### 4.5 AI Operational Layer (Futuro)
**O que é:** Inteligência operacional, não chatbot.

**Capabilities:**
- Classificação de clientes (frequência, churn risk)
- Predição de demanda (dias/horários pico)
- Recomendação de serviços
- Anomalia em caixa
- Score de colaborador

---

### 4.6 Automation Engine (Futuro)
**O que é:** Motor de workflows automáticos event-driven.

**Capabilities:**
- Triggers baseados em eventos de domínio
- Ações: enviar mensagem, criar tarefa, atualizar status
- Conditions: filtros por tenant, plano, dados do evento
- Retry automático

---

## 5. Multi-Tenant Security Model

### Isolamento por `company_id`
```
JWT Token → company_id → Injetado em TODA query
```

### Regras de ouro:
1. `company_id` NUNCA vem do body ou query params
2. Todo INSERT em tabela tenant inclui `company_id`
3. Todo SELECT em tabela tenant filtra por `company_id`
4. Toda deleção verifica `company_id` antes de executar
5. JOINs entre tabelas tenant incluem `company_id` em ambas

### Tenant Isolation Error
```js
throw new TenantIsolationError('Operação cross-tenant detectada')
```
Este erro deve ser logado com alta prioridade e nunca exposto ao usuário final.

---

## 6. Domain Events (Catálogo)

Ver arquivo completo: `docs/DOMAIN_EVENTS_CATALOG.md`

### Eventos Core (já implementados):
| Evento | Publicado por | Consumidores |
|---|---|---|
| `appointment.created` | AppointmentService | Communication Layer, CRM |
| `appointment.completed` | AppointmentService | CRM, Analytics |
| `sale.created` | SaleService | Analytics, CRM |
| `cash.opened` | CashFlowService | Analytics |
| `cash.closed` | CashFlowService | Analytics |

### Eventos pendentes de implementação:
| Evento | Prioridade |
|---|---|
| `customer.registered` | Alta |
| `subscription.activated` | Alta |
| `subscription.expired` | Alta |
| `whatsapp.message.received` | Média |
| `ai.insight.generated` | Baixa |

---

## 7. Vertical Module Structure

Cada vertical deve seguir esta estrutura:

```
backend/src/
  modules/
    barber/               ← Vertical BarberGestor
      routes/
      controllers/
      services/
      repositories/
      events/
      schemas/
    clima/                ← Vertical ClimaGestor (futuro)
    shared/               ← Capabilities do Core
      booking-engine/
      communication-layer/
      billing-engine/
      crm-engine/
      ai-layer/
```

---

## 8. Observabilidade

### Logging (implementado)
- Pino structured logging
- Correlation ID por request (`x-trace-id`)
- Request logger middleware

### Métricas (pendente)
- Latência por endpoint
- Taxa de erro por vertical
- Eventos publicados/consumidos
- Queries lentas (> 100ms)

### Tracing (pendente)
- OpenTelemetry integration
- Distributed tracing por request

### Health Checks
- `/api/health` — básico
- `/api/health/deep` — banco + integrações (✅ implementado)

---

## 9. Riscos Arquiteturais Identificados

| # | Risco | Severidade | Status |
|---|---|---|---|
| R1 | CORS completamente aberto (`cors()` sem allowlist) | 🔴 Crítico | Pendente |
| R2 | `columnExists()` executado a cada request (11 queries de introspecção) | 🔴 Crítico | Pendente |
| R3 | JWT em localStorage (vulnerável a XSS) | 🟠 Alto | Pendente |
| R4 | OutboxWorker não inicializado no server.js | 🟠 Alto | Pendente |
| R5 | EventBus in-memory (eventos perdidos em restart) | 🟠 Alto | Aceitável temporariamente |
| R6 | barber.service.js é um God Service (3000+ linhas) | 🟠 Alto | Refatoração necessária |
| R7 | Sem cache de plano (DB hit a cada request protegido) | 🟠 Alto | Pendente |
| R8 | WhatsApp provider global com companyId=null | 🟡 Médio | Pendente |
| R9 | Dois diretórios de middleware (`middleware/` e `middlewares/`) | 🟡 Médio | ✅ Resolvido — apenas `middlewares/` existe no código |
| R10 | `Barber.jsx` (276KB) e `session-ses_1c4f.md` (501KB) no root | 🟡 Médio | Limpeza necessária |
| R11 | AuthContext duplicado (AuthContext.jsx + auth.context.js) | 🟡 Médio | Pendente |
| R12 | `BookingPage.tsx` isolado em projeto JSX | 🟡 Médio | Pendente |
| R13 | planFeatures.js duplicado (backend e frontend podem divergir) | 🟡 Médio | Pendente |
| R14 | Sem migrations versionadas (sem tabela de controle) | 🟡 Médio | ✅ Resolvido — 37 SQL migrations + schema_migrations table + advisory lock |
| R15 | Sem Docker/Podman para desenvolvimento local | 🟡 Médio | Pendente |
