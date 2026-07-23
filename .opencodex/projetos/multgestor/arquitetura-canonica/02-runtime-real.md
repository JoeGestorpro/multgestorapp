# GATE 2 — Mapa do Runtime Real

> **Missão 1 — Arquitetura Canônica do Core MultGestor**
> **Baseline:** `ba55065` · **Data:** 2026-07-20

## 1. Fluxo de Inicialização do Servidor

```
server.js
├── dotenv.config()
├── sentry.init()                          ← Se VITE_SENTRY_DSN configurado
├── Express app criado
├── trust proxy = 1                        ← Render proxy
├── Middlewares globais (ordem):
│   ├── cors()                             ← ALLOWED_ORIGINS fixas + env
│   ├── helmet()                           ← crossOriginResourcePolicy: cross-origin
│   ├── cookieParser()
│   ├── express.json(limit: 3mb)           ← rawBody para webhooks
│   ├── correlationId                      ← X-Request-ID
│   ├── httpMetricsMiddleware              ← Prometheus contadores
│   ├── /metrics (auth + handler)          ← Prometheus endpoint
│   ├── requestLogger                      ← Pino request logging
│   └── tenantContext                      ← extractTenant/requireTenant
├── /uploads (static)                      ← Imagens de avatar/banner
├── Rotas montadas (14 routers)
├── errorHandler (Sentry + custom)
├── OutboxWorker.start()                   ← Polling a cada 1s
├── Jobs:
│   ├── runTrialEmailJob()                 ← A cada 1h
│   ├── runRefreshTokenPurgeJob()          ← A cada 24h
│   └── runAppointmentReminderJob()        ← A cada 15min
├── Graceful shutdown (SIGTERM/SIGINT)
└── Assert poolTenant (NOBYPASSRLS)        ← Startup não-bloqueante
```

**Fonte:** `backend/src/server.js:1-546`

---

## 2. Mapa de Rotas

### 2.1 Rotas Públicas (sem autenticação)

| Prefixo | Arquivo | Função |
|---------|---------|--------|
| `GET /api/health` | inline | Health check básico |
| `GET /api/health/deep` | inline | Health check profundo (DB, Redis, Outbox, Email, WhatsApp, Integrações) |
| `GET /api/test-email` | inline | Rota de teste de email (bloqueada em produção) |
| `POST /api/auth/register` | `auth.routes.js` | Registro de usuário |
| `POST /api/auth/login` | `auth.routes.js` | Login |
| `POST /api/auth/refresh` | `auth.routes.js` | Refresh token |
| `POST /api/auth/forgot-password` | `auth.routes.js` | Esqueci senha |
| `POST /api/auth/reset-password` | `auth.routes.js` | Reset senha |
| `GET /api/public/auth/session` | `public-auth.routes.js` | Sessão pública |
| `POST /api/public/auth/login` | `public-auth.routes.js` | Login público |
| `POST /api/public/auth/refresh` | `public-auth.routes.js` | Refresh público |
| `POST /api/public/auth/register` | `public-auth.routes.js` | Registro público |
| `POST /api/public/booking/:slug` | `public-booking.routes.js` | Booking público |
| `POST /api/booking-auth/login` | `booking-auth.routes.js` | Login booking |
| `POST /api/booking-auth/refresh` | `booking-auth.routes.js` | Refresh booking |
| `GET /api/barber/public/:slug/booking-info` | `barber.routes.js` | Info pública booking (rate limited) |
| `GET /api/barber/public/:slug/available-slots` | `barber.routes.js` | Slots disponíveis (rate limited) |
| `POST /api/barber/public/:slug/appointments` | `barber.routes.js` | Criar agendamento público (rate limited) |
| `POST /api/webhooks/whatsapp` | inline | Webhook WhatsApp |
| `GET /api/webhooks/whatsapp` | inline | Verificação WhatsApp |

**Fonte:** `server.js:226-390`, `barber.routes.js:46-74`

### 2.2 Rotas Autenticadas — Master

| Prefixo | Middleware Stack | Arquivo |
|---------|----------------|---------|
| `/api/master/*` | `requireAuth` → `requireMasterAdminAuth` | `master.routes.js` |

### 2.3 Rotas Autenticadas — Barber/Tenant

| Prefixo | Middleware Stack | Arquivo |
|---------|----------------|---------|
| `/api/barber/*` | `requireAuth` → `requireBarberAdminAuth` → `requireCompany` → `requireBarberModule` → `[rateLimit]` → `[requireActivePlan]` → `[requirePlanFeature]` | `barber.routes.js:76-218` |
| `/api/barber/ai/*` | Mesmo stack | `barber-ai.routes.js` |
| `/api/client/*` | `requireAuth` → `requireBarberAdminAuth` → `requireCompany` | `client.routes.js` |
| `/api/clima/*` | `requireAuth` → `requireTenantAdminAuth` → `requireCompany` → `requireClimaModule` | `clima.routes.js` |

### 2.4 Rotas Internas

| Prefixo | Middleware Stack | Arquivo |
|---------|----------------|---------|
| `/internal/*` | Sem autenticação (uso interno) | `internal.routes.js` |

### 2.5 Rotas Booking (Customer)

| Prefixo | Middleware Stack | Arquivo |
|---------|----------------|---------|
| `/api/booking-auth/*` | Público (login/refresh) | `booking-auth.routes.js` |

**Fonte:** `server.js:370-383`, `barber.routes.js:76-79`

---

## 3. Pipeline de Requisição (Request Lifecycle)

```
Cliente HTTP
  ↓
CORS + Helmet
  ↓
Cookie Parser
  ↓
JSON Body Parser (3mb limit, rawBody para webhooks)
  ↓
Correlation ID (X-Request-ID)
  ↓
HTTP Metrics (Prometheus counters)
  ↓
Request Logger (Pino)
  ↓
Tenant Context (extractTenant — apenas se req.user existir)
  ↓
Router matching
  │
  ├── Rota pública → Controller → (Service → Repository → DB)
  │
  └── Rota autenticada:
       ├── requireAuth (JWT verify) → req.user
       ├── requireXxxScope (role/scope guard)
       ├── requireCompany (poolTenant.connect + BEGIN + GUC app.current_company_id)
       ├── requireXxxModule (company_modules check com cache de 5min)
       ├── [rateLimit] (Redis/in-memory, fail-open)
       ├── [requireActivePlan] (plano ativo gate)
       ├── [requirePlanFeature] (feature toggle)
       ├── Controller
       ├── Service (regras de negócio)
       ├── Repository (BaseRepository ou SQL direto)
       └── Database (pool ou client com tenant context)
  ↓
Response (success/fail/paginate)
  ↓
Error Handler (se exceção → AppError hierarchy + Sentry)
```

**Fonte:** `server.js`, análise combinada dos middlewares e rotas.

---

## 4. Autenticação — 3 Fluxos

### 4.1 Backoffice (Master + Barber)

```
POST /auth/login
  → auth.service.js: validate credentials (bcrypt)
  → JWT (access_token, 15min) em memória
  → Refresh token (HttpOnly cookie, 7 dias)
  → Response: { access_token, user, company, modules }

POST /auth/refresh
  → Cookie → verify refresh token
  → Rotaciona (revoga old, emite new)
  → Novo access_token

GET /auth/me
  → requireAuth → user + company + modules

POST /auth/logout
  → Revoga refresh token no DB
  → Limpa cookie
```

### 4.2 Booking Customer

```
POST /booking-auth/login
  → customer credentials → JWT (scope: booking_customer)
  → Refresh token separado

POST /booking-auth/refresh
  → Cookie separado (booking_refresh_token)
```

### 4.3 Público (Customer)

```
POST /api/public/auth/login
GET /api/public/auth/session
  → Endpoints para cliente final
  → Auth via public-booking.routes.js
```

**Fonte:** `auth.service.js`, `auth.routes.js`, `booking-auth.routes.js`, `public-auth.routes.js`, `auth.middleware.js`

---

## 5. Isolamento Multi-tenant

### 5.1 Fluxo de tenant-aware request

```
requireAuth → req.user.company_id
  ↓
requireCompany → poolTenant.connect()
  → BEGIN
  → SELECT set_config('app.current_company_id', <id>, true)
  → runWithTenantClient(client, companyId, next)
  → res.on('finish/close') → COMMIT/ROLLBACK + release
  ↓
Service/Repository → pool.query()
  → tenantAwareQuery: se store.client → usa client da transação
  → senão → pool direto (bypass RLS intencional)
  ↓
Database → RLS policy lê current_setting('app.current_company_id')
```

### 5.2 Dual Pool

| Pool | Connection String | Role | BYPASSRLS | Uso |
|------|-----------------|------|-----------|-----|
| `pool` | `DATABASE_URL` | owner/superuser | Sim | Leitura sem tenant, master, jobs, migrações |
| `poolTenant` | `APP_RUNTIME_URL` | `app_runtime` | Não | Escritas tenant-aware |

**Fonte:** `database.js:68-81`, `requireCompany.js:11-80`

### 5.3 Cache de módulo por tenant

```
createModuleGuard(slug):
  → cacheManager.get(`mg:module:${companyId}:${slug}`)  ← TTL 5min
  → Se miss: SELECT company_modules WHERE company_id + slug + active
  → cacheManager.set(cacheKey, allowed, TTL)
  → Se não allowed: 403 "Módulo X não liberado"
```

**Fonte:** `createModuleGuard.js:1-80`

---

## 6. Eventos e Assíncrono

### 6.1 Event Bus (In-Memory)

```
eventBus.publish(eventName, payload, metadata)
  → Emite para listeners síncronos (EventEmitter)
  → Logging estruturado
  → Usado para eventos intra-processo

Consumidores registrados:
  → registerDefaultConsumers() em server.js:42
  → Eventos de appointment: created, confirmed, canceled, completed, rescheduled
```

**Fonte:** `event-bus.js:1-88`

### 6.2 Outbox Pattern

```
OutboxWorker (polling a cada 1s, batch de 50):
  → SELECT pending messages (FOR UPDATE SKIP LOCKED)
  → Marca como 'processing'
  → Para cada: lookup handlers registrados
  → Se handler já processado (outbox_message_handlers): skip
  → Processa handler → INSERT/UPDATE outbox_message_handlers
  → Se falha: retry exponencial (2^retry_count segundos) até max_retries
  → Se sucesso: status = 'processed'
  → Se max_retries excedido: status = 'failed'

Handlers registrados:
  payment.* → billing provisioning
  subscription.* → billing provisioning
  wallet.topup.* → wallet provisioning
  appointment.* → audit log + integrações
  [QUARENTENA] sale.created → loyalty + package (Fase C)
```

**Fonte:** `outbox-worker.js:1-182`, `server.js:395-434`

### 6.3 Jobs Periódicos

| Job | Intervalo | Descrição |
|-----|-----------|-----------|
| Trial email job | 1h | Envia emails de trial expiring |
| Refresh token purge | 24h | Limpa tokens expirados/revogados |
| Appointment reminder | 15min (configurável) | Lembretes de agendamento |

**Fonte:** `server.js:443-484`

---

## 7. Health Checks

### 7.1 `/api/health` (simples)
```json
{ "success": true, "message": "Backend rodando", "time": "...", "integration": {...} }
```

### 7.2 `/api/health/deep` (completo)
```json
{
  "success": true/false,
  "status": "healthy" | "degraded" | "unhealthy",
  "checks": {
    "database": { "status": "ok", "latency_ms": N },
    "redis": { "status": "ok" | "degraded" },
    "outbox": { "status": "ok" | "degraded", "pending_messages": N },
    "email_provider": { "status": "ok", "provider": "smtp" | "resend" },
    "whatsapp_provider": { "status": "ok" | "degraded", "provider": "mock" | "meta_cloud_api" },
    "integrations": { ... }
  },
  "uptime_seconds": N,
  "version": "2.0.0"
}
```

**Fonte:** `server.js:226-316`

---

## 8. Observabilidade

| Componente | Implementação | Evidência |
|------------|--------------|-----------|
| Logger | Pino (`shared/core/logger/`) | `server.js`, todos os módulos |
| Métricas | Prometheus (`prom-client`, `metrics.middleware.js`) | `GET /metrics` |
| APM | Sentry (`@sentry/node`) | `server.js:4-5`, `shared/core/monitoring/sentry.js` |
| Correlation ID | Middleware `correlation-id.middleware.js` | Headers `X-Request-ID` |
| Request Logger | Middleware `request-logger.middleware.js` | Pino request/response logging |

---

## 9. Rate Limiting

| Configuração | Janela | Max | Escopo |
|-------------|--------|-----|--------|
| Padrão (createRateLimit) | 15min | 5 | IP + método + rota |
| Barber public read | 15min | 60 | IP (booking-info, available-slots) |
| Barber public booking (IP) | 15min | 10 | IP (criar agendamento) |
| Barber public booking (tenant) | 1h | 30 | Slug do tenant |

Comportamento: **fail-open** — se Redis falha, request é liberada com warning.

**Fonte:** `rate-limit.middleware.js:1-62`, `barber.routes.js:52-74`

---

## 10. Cache

| Cache | Mecanismo | TTL | Fallback |
|-------|-----------|-----|----------|
| Módulo por tenant | Redis + fallback in-memory | 5min | RAM local (Map) |
| Rate limit | Redis + fallback in-memory | configurável | RAM local (Map) |
| Geral (cacheManager) | Redis + fallback in-memory | configurável | RAM local (Map, 10k entries max) |

**⚠️ Redis não está configurado em produção** — health check confirma fallback in-memory ativo.

**Fonte:** `cache-manager.js:1-111`, health check de produção

---

## 11. POST-GATE 2

| Verificação | Status |
|-------------|--------|
| Fluxo de inicialização | ✅ Documentado (source: `server.js`) |
| Mapa de rotas completo | ✅ 14 routers, 200+ endpoints |
| Pipeline de requisição | ✅ 10+ middlewares documentados |
| 3 fluxos de autenticação | ✅ Backoffice, Booking, Público |
| Isolamento multi-tenant | ✅ Dual pool + GUC + RLS |
| Event Bus (in-memory) | ✅ Documentado |
| Outbox Pattern | ✅ 15+ handlers, polling, retry |
| Jobs periódicos | ✅ 3 jobs documentados |
| Health checks | ✅ 2 endpoints (simples + deep) |
| Observabilidade | ✅ Pino + Prometheus + Sentry + Correlation ID |
| Rate limiting | ✅ 3 perfis, fail-open |
| Cache | ✅ Redis + fallback in-memory (⚠️ sem Redis em produção) |
| Nenhum arquivo operacional alterado | ✅ |
| Nenhum código/migration/CI/deploy alterado | ✅ |
