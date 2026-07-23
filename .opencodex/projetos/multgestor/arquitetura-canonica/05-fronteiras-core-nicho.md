# GATE 5 — Fronteiras Core × Nicho

> **Missão 1 — Arquitetura Canônica do Core MultGestor**
> **Baseline:** `ba55065` · **Data:** 2026-07-20

## 1. Classificação

| Classe | Definição |
|--------|-----------|
| **CORE_OBRIGATORIO** | Existe em todo deploy MultGestor. Todo nicho herda. |
| **CORE_OPCIONAL** | Disponível no Core mas pode ser desligado por configuração. |
| **CAPABILITY_COMPARTILHADA** | Lógica de domínio reutilizável, mas não obrigatória. |
| **EXTENSAO_DE_NICHO** | Funcionalidade base que cada nicho estende/especializa. |
| **EXCLUSIVO_DO_NICHO** | Pertence a um nicho específico. |
| **INDEFINIDO** | Fronteira não clara — requer decisão. |

---

## 2. Mapa Core × Nicho

```
┌─────────────────────────────────────────────────────────────┐
│                    CORE OBRIGATORIO                          │
│                                                             │
│  Multi-tenancy (C-01)    │  Auth JWT + Refresh (C-02)       │
│  3 Auth Scopes (C-03)    │  Migrations (C-04)              │
│  CI/CD Pipeline (C-05)   │  Health Checks (C-06)           │
│  Error Kernel (C-07)     │  Validation (C-08)              │
│  Logging (C-09)          │  Outbox Pattern (C-10)          │
│  Event Bus (C-11)        │  Plan Gating (C-12)             │
│  Billing Engine (C-13)   │  Repository Pattern (C-15)      │
│  Master Admin (C-18)     │  Email Service (C-20)           │
│  Backup System (C-27)    │  Redis/Cache (C-32, C-33)       │
│  Metrics (C-35)          │  Testes Backend (C-36)          │
│  Testes Frontend (C-37)  │                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    CORE OPCIONAL                             │
│                                                             │
│  Design System (C-23)  │  Integration Layer (C-31)          │
│  AI/LLM Framework (C-30)                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              CAPABILITY COMPARTILHADA                        │
│                                                             │
│  Booking Engine — scheduling-utils (C-14 parcial)           │
│  WhatsApp Integration (C-17)                                │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    NICHO — BarberGestor                      │
│                                                             │
│  CRUD Completo (C-16)    │  Premium UI (C-21)              │
│  Landing Pages (C-22)    │  Mobile (C-24)                  │
│  Onboarding (C-25)       │  Badge System (C-26)            │
│  God Service (C-28)     │  WhatsApp (C-17 implementação)   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    NICHO — ClimaGestor                       │
│                                                             │
│  Clima Scaffold (C-29)                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                FORA DO CORE (planejado)                      │
│                                                             │
│  Automation Engine (C-38)  │  Omnichannel (C-39)            │
│  Novos Nichos (C-40)                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Análise por Pergunta Obrigatória

### 3.1 O que existe independentemente de barbearia?

- Multi-tenancy (`companies`, `users`, `company_modules`, `subscriptions`)
- Autenticação (3 scopes: master, barber_admin, booking_customer)
- Master Admin Panel (empresas, módulos, assinaturas, métricas)
- Plano e feature gates (plans, features, entitlements)
- Billing (Kiwify, AbacatePay — assinaturas)
- Email (Resend, SMTP, Mock — envio transacional)
- Health checks, logging, métricas, APM
- CI/CD pipeline (GitHub Actions → Render + Vercel)
- Outbox pattern e Event Bus
- Cache (Redis + fallback) e Rate Limiting
- Error kernel e validation schemas

### 3.2 O que só existe por causa do BarberGestor?

- **226+ endpoints** de CRUD (serviços, colaboradores, agendamentos, vendas, produtos, fornecedores, caixa, adiantamentos, acertos)
- **50 services** específicos de barbearia
- **24 controllers** no módulo barber/
- **Paginações específicas** (dashboard, agenda, clientes, vendas, relatórios)
- **Booking acoplado** (59+32 ocorrências de `barber_` nos serviços de booking)
- **WhatsApp** integrado ao fluxo de agendamento de barbearia
- **Mobile** (BottomNav para acesso mobile do barbeiro)
- **Onboarding** (SetupWizard específico)

### 3.3 Booking é Core ou capability compartilhada?

| Componente | Classificação | Evidência |
|-----------|--------------|-----------|
| `scheduling-utils.js` (funções puras) | ✅ CAPABILITY_COMPARTILHADA | 0 ocorrências de barber_ |
| `booking-appointments.service.js` | 🔴 **EXCLUSIVO_DO_NICHO** | 59 ocorrências de barber_ |
| `booking-scheduling.service.js` | 🔴 **EXCLUSIVO_DO_NICHO** | 32 ocorrências de barber_ |
| `clima-core.service.js` | EXCLUSIVO_DO_NICHO | Reimplementa do zero para Clima |

🔴 **Decisão pendente:** ADR-007 (proposta) aguardando decisão humana entre Opção A (rebaixar) ou Opção B (promover com adapter).

### 3.4 Serviços, profissionais e agenda são genéricos ou especializados?

| Entidade | Hoje | Classificação |
|----------|------|---------------|
| Serviços | `barber_services` | EXCLUSIVO_DO_NICHO |
| Colaboradores | `barber_collaborators` | EXCLUSIVO_DO_NICHO |
| Agendamentos | `barber_appointments` | EXCLUSIVO_DO_NICHO |
| Clientes | `customers` (genérico) | CAPABILITY_COMPARTILHADA |
| Horários | `barber_working_hours` | EXCLUSIVO_DO_NICHO |

Clientes (`customers`) é a única entidade de domínio genuinamente genérica.

### 3.5 Quais entidades são extensíveis?

- **Nenhuma.** Tabelas de nicho usam prefixo (`barber_*`, `clima_*`) — sem herança de tabela ou schema compartilhado.
- `customers` é compartilhada (company_id) — usada por todos os nichos.

### 3.6 Quais regras devem ser configuradas?

- **Feature flags por plano:** `collaborators`, `advanced_reports`, `financial_dashboard`, `extra_permissions`, `advanced_schedule`, `future_modules`
- **Módulos por empresa:** `company_modules` JOIN `modules` — gate via `createModuleGuard()`
- **Plano ativo:** `requireActivePlan` middleware

### 3.7 Quais rotas são universais?

| Prefixo | Função | Nicho-independente? |
|---------|--------|-------------------|
| `/api/auth/*` | Autenticação | ✅ Sim |
| `/api/master/*` | Admin global | ✅ Sim |
| `/api/public/auth/*` | Auth público | ✅ Sim |
| `/api/booking-auth/*` | Auth booking | ✅ Sim (mas só usado por barber) |
| `/api/public/booking/*` | Booking público | ✅ Sim (mas só tem barber) |
| `/api/internal/*` | Uso interno | ✅ Sim |
| `/api/client/*` | Cliente | ✅ Sim (mas só tem barber) |
| `/api/barber/*` | BarberGestor | ❌ Não |
| `/api/barber/ai/*` | AI/LLM | ⚠️ Parcial (ligado a barber) |
| `/api/clima/*` | ClimaGestor | ❌ Não |

### 3.8 Quais componentes pertencem ao kit de nicho?

- **Design System** (`ds-*`): CORE_OPCIONAL — UI genérica reutilizável
- **Shell/Sidebar/Topbar**: CORE_OPCIONAL — layout compartilhável
- **Route guards**: CORE — ProtectedRoute, ModuleRoute
- **Auth contexts**: CORE — AuthProvider, BookingAuthProvider
- **Páginas de nicho**: EXCLUSIVO_DO_NICHO

### 3.9 Quais integrações são opcionais?

| Integração | Classificação | Status |
|-----------|--------------|--------|
| WhatsApp | CORE_OPCIONAL | Mock ativo, Meta Cloud API configurável |
| Email (Resend/SMTP) | CORE_OPCIONAL | Ativo |
| Billing (Kiwify/AbacatePay) | CORE_OBRIGATORIO | Ativo |
| Sentry APM | CORE_OPCIONAL | Se configurado |
| Prometheus Metrics | CORE_OPCIONAL | Ativo |

---

## 4. Núcleo do Core (herdado por todo nicho)

```text
Todo deploy MultGestor tem:
├── Multi-tenancy (company_id isolado)
├── Auth (JWT + Refresh Token, 3 scopes)
├── Master Admin (gestão de empresas, módulos, assinaturas)
├── Billing (planos, features, pagamentos)
├── Email transacional
├── Health check + Logging + Métricas + APM
├── CI/CD (GitHub Actions → Render Backend + Vercel Frontend)
├── Cache + Rate Limit
├── Outbox + Event Bus
├── Error Kernel + Validation
├── Core Shared Kernel (BaseRepository, UnitOfWork)
└── Design System (UI genérico)
```

---

## 5. Zonas Cinzentas (INDEFINIDO)

| Capacidade | Problema | Requer Decisão |
|-----------|----------|---------------|
| Booking Engine (C-14) | Services acoplados ao BarberGestor | ADR-007: rebaixar (A) ou promover (B)? |
| Clientes (customers) | Tabela genérica mas só consumida pelo BarberGestor | É core ou extensão? |
| AI/LLM (C-30) | Framework existe mas providers mock | É core ou específico de nicho? |
| Integration Layer (C-31) | Apenas WhatsApp ativo | É a arquitetura final ou provisória? |

---

## 6. POST-GATE 5

| Verificação | Status |
|-------------|--------|
| Classificação das 40 capacidades | ✅ |
| Mapa Core × Nicho | ✅ |
| 9 perguntas obrigatórias respondidas | ✅ |
| Núcleo do Core definido | ✅ |
| Zonas cinzentas identificadas | ✅ 4 itens |
| Decisão humana necessária? | 🔴 ADR-007 (Booking Engine) |
| Nenhum arquivo operacional alterado | ✅ |
