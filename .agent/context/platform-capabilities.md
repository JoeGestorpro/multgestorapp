# Platform Capabilities — MultGestor Core

> Este arquivo documenta as capabilities do Core disponíveis para todos os verticais.
> Atualizar sempre que uma nova capability for extraída ou criada.

---

## O que é uma Capability

Uma capability é uma unidade funcional reutilizável do Core que:
- É vertical-agnóstica
- É configurável por tenant
- Publica e consome eventos de domínio
- Tem interface clara e contratos definidos

Regra: antes de implementar algo num vertical, perguntar — "isso já existe como capability?"

---

## Capabilities Disponíveis

### ✅ Authentication & Authorization
**Localização:** `backend/src/shared/core/` + `backend/src/middlewares/`

Fornece:
- JWT generation/validation
- Scopes: `barber_admin`, `booking_customer`, `master`
- Roles: `owner`, `admin`, `collaborator`, `client`, `master_admin`
- Middlewares: `requireAuth`, `requireBarberAdminAuth`, `requireMasterAdminAuth`, `requireBookingCustomerAuth`
- PIN-based action protection

Usar com:
```js
const { requireAuth, requireBarberAdminAuth } = require('../middlewares/auth.middleware')
router.use(requireAuth)
router.use(requireBarberAdminAuth)
```

---

### ✅ Multi-Tenant Isolation
**Localização:** `backend/src/shared/tenant/` + `backend/src/middleware/requireCompany.js`

Fornece:
- Extração de `company_id` do JWT
- `requireCompany` middleware
- `requireTenant()` helper
- `TenantIsolationError` para brechas detectadas
- `BaseRepository` com company_id em todo CRUD

Usar com:
```js
const requireCompany = require('../middleware/requireCompany')
router.use(requireCompany)
// → req.tenantContext.companyId disponível
```

---

### ✅ Event Bus (in-process)
**Localização:** `backend/src/shared/core/events/`

Fornece:
- `eventBus.publish(eventName, payload, metadata)` — publicar evento
- `eventBus.subscribe(eventName, handler, options)` — assinar evento
- Logging automático de publish e consume
- Erro de consumidor não propaga

Usar com:
```js
const { eventBus } = require('../shared/core/events')
eventBus.publish('appointment.created', payload, { company_id: companyId })
```

---

### ✅ Outbox Pattern (entrega durável)
**Localização:** `backend/src/shared/core/outbox/outbox-worker.js`

Fornece:
- `OutboxWorker.register(eventType, handler)` — registrar handler
- `OutboxWorker.start()` — iniciar polling
- Retry com backoff exponencial (2^n segundos)
- Max retries configurável
- Status: pending → processing → processed/failed

⚠️ **ATENÇÃO:** OutboxWorker deve ser iniciado em `server.js`. Verificar!

---

### ✅ Error Handling Centralizado
**Localização:** `backend/src/shared/core/errors/`

Fornece:
- `AppError` — base
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `TenantIsolationError` (403, segurança)
- `ExternalServiceError` (502)
- `IntegrationError` (502)
- `errorHandler` middleware centralizado
- `asyncHandler` wrapper para rotas async

---

### ✅ Logging Estruturado
**Localização:** `backend/src/shared/core/logger/`

Fornece:
- Pino com correlation ID
- `appLogger` para logs do sistema
- `req.log` para logs de request (injetado pelo middleware)
- JSON em produção, pretty em desenvolvimento

---

### ✅ Recurring Revenue Engine (Plan Features)
**Localização:** `backend/src/services/company-plan.service.js` + `backend/src/utils/planFeatures.js`

Fornece:
- `getCompanyPlanSnapshot(companyId)` — snapshot atual do plano
- `isPlanActive(snapshot)` — verifica se plano está ativo
- `canUsePlanFeature(planType, featureKey)` — verifica acesso a feature
- `requireActivePlan` middleware — bloqueia se sem plano ativo
- `requirePlanFeature(key)` middleware — bloqueia se feature não inclusa no plano
- Integração com Kiwify (webhook)

⚠️ **Performance:** `getCompanyPlanSnapshot` faz 13 DB calls por request. Implementar cache!

---

### ✅ Email Service (Communication Layer — Email)
**Localização:** `backend/src/providers/email/`

Fornece:
- 3 providers: `resend`, `smtp`, `mock`
- Interface unificada: `emailService.send({ to, subject, html })`
- Seleção por env: `EMAIL_PROVIDER=resend|smtp|mock`
- Templates em `backend/src/templates/email/`

---

### ⚠️ WhatsApp Provider (Communication Layer — WhatsApp)
**Localização:** `backend/src/integrations/whatsapp/`

Status: Mock funcional, real não ativado.

Fornece:
- Interface unificada: `whatsappProvider.sendMessage({ to, message })`
- Mock provider para desenvolvimento
- Estrutura para real provider (WABA)
- Webhook handler para receber mensagens

---

### ⚠️ Booking Engine (a extrair do vertical barber)
**Localização atual:** `backend/src/services/appointment.service.js` + `backend/src/repositories/appointment.repository.js`

Status: Implementado dentro do vertical barber. Precisa ser extraído para `shared/capabilities/booking-engine/`.

Fornece (quando extraído):
- Disponibilidade por recurso
- Criação/cancelamento/reagendamento
- Slots configuráveis
- Bloqueios manuais

---

### ⚠️ CRM Engine (a extrair do vertical barber)
**Localização atual:** `backend/src/services/crm.service.js` + `backend/src/repositories/crm.repository.js`

Status: Implementado dentro do vertical barber. Precisa ser extraído.

---

## Capabilities Planejadas (Futuro)

| Capability | Prioridade | Descrição |
|---|---|---|
| Automation Engine | Alta | Trigger → Condition → Action event-driven |
| AI Operational Layer | Média | Classificação, predição, recomendação |
| Analytics Engine | Média | Métricas, dashboards, relatórios genéricos |
| Notification Center | Alta | Hub centralizado (WhatsApp, email, SMS, push) |
| File Storage | Baixa | Abstração sobre Supabase Storage |

---

## Como usar este documento

Antes de implementar qualquer feature:
1. Consultar este arquivo
2. Se já existe como capability → usar
3. Se não existe → avaliar se deve ser capability ou feature vertical
4. Se deve ser capability → seguir workflow `/create-capability`
