# 08 — ARQUITETURA CANÔNICA DO CORE MULTGESTOR

> **Missão 1 — Arquitetura Canônica do Core MultGestor**
> **Baseline:** `ba55065` · **Data:** 2026-07-20
> **Status:** ✅ REALIDADE ATUAL DOCUMENTADA ⏳ ARQUITETURA ALVO PARCIAL

---

## REALIDADE ATUAL

---

## 1. Princípios Arquiteturais (Reais)

| Princípio | Evidência |
|-----------|-----------|
| Multi-tenant por `company_id` | Dual pool + GUC + RLS + TenantIsolationError |
| Sem ORM | pg.Pool direto, BaseRepository, SQL puro |
| Event-Driven (parcial) | EventBus in-memory + Outbox pattern |
| API-First | REST API, frontend é cliente HTTP |
| Defesa em profundidade | Auth middleware + RLS banco + Plan/Module guards |
| Monolítico modular | Express 5, rotas por módulo, services por domínio |
| Provider pattern | Integrações (WhatsApp), Email, Billing, LLM |
| Fail-open sob incerteza | Rate limit, cache (Redis indisponível → in-memory) |

---

## 2. Diagrama Lógico

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19 + Vite 8)              │
│  SPA · react-router-dom 7 · Axios · Sentry · lucide-react    │
│  AuthContext · BookingAuthContext · ThemeContext               │
│  ProtectedRoute · BarberPrivateRoute · MasterPrivateRoute     │
│  Legacy CSS (Barber.css) + Design System (ds-*)               │
├──────────────────────────────────────────────────────────────┤
│  Vercel (deploy) · Vite proxy (/api → localhost:3000)        │
├──────────────────────────────────────────────────────────────┤
│                     API LAYER (Express 5)                     │
│  14 routers · 12 controllers · 10 middlewares · 200+ endpoints│
│  /api/auth · /api/barber · /api/master · /api/clima · ...    │
├──────────────────────────────────────────────────────────────┤
│                     MIDDLEWARE STACK                          │
│  CORS → Helmet → CookieParser → JSON → CorrelationID →      │
│  Metrics → RequestLogger → TenantContext →                   │
│  [requireAuth → requireScope → requireCompany →             │
│   requireModule → requirePlan → requirePlanFeature]          │
├──────────────────────────────────────────────────────────────┤
│                     SERVICES (30+)                            │
│  auth · appointment · barber · customer · collaborator       │
│  sale · product · supplier · cash-flow · financial-report    │
│  company · company-plan · dashboard · master · master-finance│
│  wallet · loyalty · package · anamnesis · crm · branding     │
│  settings · schedule · clima-core · llm · email              │
│  booking-appointments · booking-scheduling                   │
├──────────────────────────────────────────────────────────────┤
│                     SHARED CORE FRAMEWORK                     │
│  Auth (JWT, 3 scopes, roles)                                 │
│  Cache (Redis + fallback in-memory)                          │
│  Database (dual pool, tenant-aware query, UoW)               │
│  Errors (10 tipos, AppError hierarchy)                       │
│  Events (EventBus in-memory, contracts, factories)           │
│  Logger (Pino estruturado)                                   │
│  Monitoring (Prometheus metrics, Sentry APM)                 │
│  Outbox (polling worker, retry exponencial, 15 handlers)     │
│  Responses (success, fail, pagination)                       │
│  Tenant (extractTenant, requireTenant, tenant context)       │
│  Validation (Zod schemas, validateRequest middleware)        │
├──────────────────────────────────────────────────────────────┤
│                     CAPABILITIES                              │
│  Billing (KiwifyProvider, AbacatePayProvider, registry)      │
│  Booking Engine (scheduling-utils puro — acoplado ao nicho) │
├──────────────────────────────────────────────────────────────┤
│                     REPOSITORIES (9)                          │
│  appointment · barber-services · branding · cash-session     │
│  collaborator · crm · product · sale · settings · supplier   │
├──────────────────────────────────────────────────────────────┤
│                     INTEGRATIONS                              │
│  WhatsApp (mock + Meta Cloud API) · Email (Resend/SMTP/Mock) │
│  Billing (Kiwify/AbacatePay) · Webhooks (Kiwify, WhatsApp)  │
├──────────────────────────────────────────────────────────────┤
│                     DATABASE (PostgreSQL 16)                  │
│  DATABASE_URL (pool owner, BYPASSRLS)                        │
│  APP_RUNTIME_URL (poolTenant, app_runtime, NOBYPASSRLS)      │
│  40+ tabelas com RLS · 36 SQL files · 8 migrations (024-031)│
│  Outbox: outbox_messages + outbox_message_handlers           │
├──────────────────────────────────────────────────────────────┤
│                     INFRAESTRUTURA                            │
│  Render (backend) · Vercel (frontend) · GitHub Actions (CI)  │
│  Supabase (PostgreSQL gerenciado) · Backblaze B2 (backup)    │
│  Redis: ❌ NÃO CONFIGURADO em produção                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Diagrama de Runtime

```
                  ┌─────────────┐
                  │   Cliente   │
                  │  (Browser)  │
                  └──────┬──────┘
                         │ HTTP/HTTPS
                    ┌────▼─────┐
                    │  Vercel  │
                    │  (CDN)   │
                    └────┬─────┘
                         │ index.html + assets
                    ┌────▼─────┐
                    │  React   │
                    │   SPA    │
                    └────┬─────┘
                         │ /api/* → axios
                    ┌────▼─────┐
                    │  Render  │
                    │(Backend) │
                    └────┬─────┘
                         │ Express 5
                    ┌────▼─────┐
                    │Middleware│
                    │  Stack   │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
         ┌────▼───┐ ┌───▼────┐ ┌───▼──────┐
         │Service │ │  Job   │ │  Outbox  │
         │  Layer │ │Worker  │ │  Worker  │
         └────┬───┘ └───┬────┘ └────┬─────┘
              │         │           │
         ┌────▼─────────▼───────────▼──────┐
         │        PostgreSQL 16            │
         │  pool (owner) · poolTenant      │
         │  (app_runtime)                  │
         │  40+ RLS policies               │
         │  Outbox tables                  │
         └─────────────────────────────────┘
```

---

## 4. Camadas

| Camada | Diretório | Responsabilidade |
|--------|-----------|-----------------|
| Routes | `backend/src/routes/` | Define endpoints HTTP, monta middleware stack |
| Middlewares | `backend/src/middlewares/` | Auth, tenant, módulo, plano, rate limit, logging, erros |
| Controllers | `backend/src/controllers/` | Handle HTTP request/response, delega para services |
| Services | `backend/src/services/` | Regras de negócio, orquestração |
| Repositories | `backend/src/repositories/` | Acesso a dados, extendem BaseRepository |
| Shared Core | `backend/src/shared/core/` | Framework transversal (auth, cache, db, errors, events, logger, monitoring, outbox, responses, validation) |
| Tenant | `backend/src/shared/tenant/` | Isolamento multi-tenant |
| Capabilities | `backend/src/shared/capabilities/` | Billing, Booking engine |
| Integrations | `backend/src/integrations/` | Canais externos (WhatsApp, webhooks) |
| Jobs | `backend/src/jobs/` | Tarefas agendadas |
| Database | `backend/src/database/` | Migrations SQL (36 arquivos) |
| Frontend | `frontend/src/` | React SPA (pages, components, contexts, routes, services) |

---

## 5. Módulos e Dependências

```
┌─────────┐     ┌──────────┐     ┌──────────┐
│  Auth   │◄────│  Master  │────►│ Billing  │
└────┬────┘     └──────────┘     └──────────┘
     │
     │    ┌───────────────────────────┐
     ├───►│      Shared Core          │
     │    │  (cache, db, errors,      │
     │    │   events, logger, outbox, │
     │    │   responses, validation)  │
     │    └──────────┬────────────────┘
     │               │
┌────▼────┐    ┌─────▼──────┐    ┌──────────┐
│ Barber  │◄───│  Tenant    │───►│  Clima   │
│ Gestor  │    │  Context   │    │  Gestor  │
└────┬────┘    └────────────┘    └──────────┘
     │
     ├──→ WhatsApp ──→ Email ──→ Integrations
     │
     └──→ Outbox ──→ Billing/Wallet/Appointment consumers
```

---

## 6. Fluxos Críticos

### 6.1 Login + Sessão

```
Frontend: POST /auth/login
  → Backend: auth.service.js (bcrypt verify)
  → JWT access_token (15min) + Refresh token (7d, HttpOnly cookie)
  → Refresh token armazenado em refresh_tokens table
  → Frontend: AuthContext armazena token em memória
  
GET /auth/me
  → requireAuth (JWT verify)
  → Retorna user + company + modules

POST /auth/refresh
  → Cookie → DB verify → rotaciona → novo access_token
```

### 6.2 Requisição Tenant-aware

```
Frontend → /api/barber/servicos
  → requireAuth (JWT → req.user.company_id)
  → requireBarberAdminAuth (scope check)
  → requireCompany (poolTenant.connect + BEGIN + GUC)
  → requireBarberModule (cache + DB check)
  → barberController.listServices()
  → barber-service.service.js
  → appointment.repository.js (BaseRepository.findAll)
  → pool.query() → tenantAwareQuery → client da transação
  → RLS policy: company_id = app.current_company_id
  → Resultados filtrados por tenant
  → res.finish → COMMIT + client.release()
```

### 6.3 Criação de Agendamento (público)

```
Frontend → POST /api/barber/public/:slug/appointments
  → Rate limit (IP: 10/15min, Tenant: 30/h)
  → barberController.createPublicBookingAppointment()
  → booking-appointments.service.js
  → INSERT barber_appointments (company_id do slug)
  → eventBus.publish('appointment.created')
  → OutboxWorker: processa consumers de appointment
  → WhatsApp notification (se configurado)
```

### 6.4 Processamento de Pagamento (Outbox)

```
Kiwify webhook → POST /api/webhooks
  → webhooks.controller.js → billing event
  → INSERT outbox_messages (type: 'payment.approved')
  → OutboxWorker (poll 1s):
    1. SELECT pending (FOR UPDATE SKIP LOCKED)
    2. handleBillingProvisioning(event)
    3. Atualiza subscription
    4. Marca como processed
```

---

## ARQUITETURA ALVO

---

## 7. Alvo Arquitetural

### 7.1 Core Framework Consolidado

- Mesma estrutura de camadas, com contratos formalizados (GATE 6)
- Redis/Valkey a provisionar (Decisão D-M1-REDIS): rate limit compartilhado prioritário; cache, locks e coordenação como secundários
- APP_RUNTIME_URL padronizada em todos os ambientes

### 7.2 Booking Engine Rebaixado (Decisão D-M1-BOOKING)

- **Opção A aprovada** (ADR-007, 2026-07-20):
  - `scheduling-utils.js` permanece capability compartilhada do Core
  - Services com dependência de `barber_*` permanecem no BarberGestor
  - Reavaliar promoção apenas quando existir segundo nicho real reutilizando a abstração

### 7.3 Kit de Nicho (NICHEKIT-001)

- Core provê: tenant, auth, billing, email, cache, rate limit, outbox, event bus, health, logging, metrics, error kernel, validation, design system
- Nicho provê: tabelas prefixadas (`nicho_*`), services específicos, controllers, páginas
- Fronteira clara via `createModuleGuard()`

### 7.4 Observabilidade

- Dashboard Grafana (ou similar) consumindo /metrics
- Alertas para health checks degradados
- Logs centralizados

---

## DÉBITOS

---

| ID | Débito | Gravidade | Gate |
|----|--------|-----------|------|
| OPS-001 | Redis não configurado em produção | 🔴 CRÍTICO | GATE 7 |
| ARC-001 | Booking acoplado ao BarberGestor | 🟡 ALTO | GATE 5 |
| ARC-002 | God service (~6500 linhas) | 🟡 ALTO | GATE 7 |
| OPS-002 | APP_RUNTIME_URL ausente em dev | 🟡 ALTO | GATE 7 |
| BILL-001 | Fase C consumers em quarentena | 🟡 ALTO | GATE 7 |
| SEG-001 | Fase 2 RLS não registrada | 🟡 ALTO | GATE 7 |
| TEST-001 | Cobertura de testes | 🟡 ALTO | GATE 7 |
| DOC-001 | capacidades.md com divergências | 🟢 MÉDIO | GATE 7 |
| +11 débitos menores | Ver GATE 7 completo | 🟢 MÉDIO/🔵 BAIXO | GATE 7 |

---

## DECISÕES TOMADAS

---

Registradas em 2026-07-20 com base nas evidências da Missão 1. Nenhuma implementação operacional está autorizada — cada execução deve ter missão própria.

| Decisão | Resolução | ADR | Justificativa |
|---------|-----------|-----|---------------|
| D-M1-BOOKING | Opção A: **REBAIXAR** | ADR-007 | scheduling-utils.js já é compartilhado (0 arber_); services têm 59+32 arber_ — são do nicho. ClimaGestor reimplementou do zero. Promover só com segundo nicho real. |
| D-M1-REDIS | **PROVISIONAR** Redis/Valkey gerenciado | ADR-REDIS | Rate limit in-memory é local à instância; contadores não sobrevivem a restart/spin-down. Custo e plano a confirmar antes da contratação. |
| D-M1-FASE_C | **PROMOVER COM AUDITORIA** + feature flag | ADR-FASE-C | Código existe e tem testes; mantê-lo inativo cria diferença entre funcionalidade implementada e operacional. Ativação inicial desabilitada. |

---

## 8. POST-GATE 8

| Verificação | Status |
|-------------|--------|
| Princípios arquiteturais | ✅ 7 princípios documentados |
| Diagrama lógico | ✅ |
| Diagrama de runtime | ✅ |
| Camadas | ✅ 10 camadas |
| Módulos e dependências | ✅ |
| Fluxos críticos | ✅ 4 fluxos documentados |
| REALIDADE ATUAL | ✅ Comprovada por evidência |
| ARQUITETURA ALVO | ⚠️ Parcial (depende de decisões humanas) |
| DÉBITOS | ✅ Todos registrados |
| DECISÕES PENDENTES → TOMADAS | ✅ 3 resolvidas, registradas em ADRs |
| Nenhum arquivo operacional alterado | ✅ |
