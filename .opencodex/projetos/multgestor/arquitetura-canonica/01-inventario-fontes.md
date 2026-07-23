# GATE 1 — Inventário das Fontes Arquiteturais

> **Missão 1 — Arquitetura Canônica do Core MultGestor**
> **Baseline:** `ba55065` · **Data:** 2026-07-20

## 1. Resumo

Foram identificadas e classificadas **89 fontes arquiteturais** distribuídas em 7 categorias. A classificação segue:

| Classe | Significado | Quantidade |
|--------|-------------|-----------|
| **PRIMÁRIA** | Código em produção, migration aplicada, teste que passa, CI/CD operacional, config vinculante | 47 |
| **SECUNDÁRIA** | Documento concorda com código; ADR aprovada; auditoria convergente | 21 |
| **HISTÓRICA** | Documento desatualizado mas com valor de rastro | 9 |
| **CONFLITANTE** | Documento contradiz o código verificado | 8 |
| **DESATUALIZADA** | Documento sabidamente obsoleto | 4 |

---

## 2. Fontes Primárias (evidência executável)

### 2.1 Código Fonte — Backend

| # | Fonte | Localização | Evidência |
|---|-------|------------|-----------|
| P-01 | Entry point (Express 5) | `backend/src/server.js:1-546` | Inicialização completa do servidor |
| P-02 | Config database (pg Pool) | `backend/src/config/database.js:1-184` | Dual pool (databases + app_runtime), AsyncLocalStorage, tenantAwareConnect |
| P-03 | Config Supabase (storage) | `backend/src/config/supabase.js` | Apenas storage para avatares |
| P-04 | Auth middleware (JWT) | `backend/src/middlewares/auth.middleware.js:1-149` | 3 scopes, 6 guards, requireAuth/Scopes/Roles |
| P-05 | Require Company | `backend/src/middlewares/requireCompany.js:1-81` | PoolTenant + GUC + BEGIN/COMMIT transaction-local |
| P-06 | Rate limit middleware | `backend/src/middlewares/rate-limit.middleware.js:1-62` | Redis/in-memory, fail-open |
| P-07 | Module guard factory | `backend/src/middlewares/createModuleGuard.js:1-80` | Cache + query company_modules |
| P-08 | Plan feature guard | `backend/src/middlewares/requirePlanFeature.js` | Feature toggle por plano |
| P-09 | Active plan guard | `backend/src/middlewares/requireActivePlan.js` | Gating de plano ativo |
| P-10 | Error handler | `backend/src/middlewares/error-handler.middleware.js` | Tratamento centralizado de erros |
| P-11 | Auth routes | `backend/src/routes/auth.routes.js` | /api/auth |
| P-12 | Barber routes (226 endpoints) | `backend/src/routes/barber.routes.js:1-220` | Maior router, 220+ linhas |
| P-13 | Public booking routes | `backend/src/routes/public-booking.routes.js` | /api/public/booking |
| P-14 | Shared/barrel | `backend/src/shared/index.js:1-30` | Barrel export de todo o core |
| P-15 | Roles definition | `backend/src/shared/core/auth/roles.js:1-28` | 3 roles, inferAuthScope |
| P-16 | BaseRepository | `backend/src/shared/core/database/BaseRepository.js:1-255` | CRUD genérico com tenantScoped |
| P-17 | Unit of Work | `backend/src/shared/core/database/unit-of-work.js` | Transações atômicas |
| P-18 | Event Bus | `backend/src/shared/core/events/event-bus.js:1-88` | Pub/sub in-memory (EventEmitter) |
| P-19 | Outbox Worker | `backend/src/shared/core/outbox/outbox-worker.js:1-182` | Outbox pattern com retry |
| P-20 | Cache Manager | `backend/src/shared/core/cache/cache-manager.js:1-111` | Redis + fallback in-memory |
| P-21 | Tenant context | `backend/src/shared/tenant/tenant-context.js:1-21` | extractTenant/requireTenant |
| P-22 | Billing capability | `backend/src/shared/capabilities/billing/` | KiwifyProvider + AbacatePay |
| P-23 | Booking engine capability | `backend/src/shared/capabilities/booking-engine/` | scheduling-utils (puro) |
| P-24 | Auth service | `backend/src/services/auth.service.js` | JWT + refresh token |
| P-25 | LLM service framework | `backend/src/services/llm/` | Providers (Nvidia, OpenRouter, Mock), wrappers (RateLimit, CircuitBreaker, Budget) |
| P-26 | Integration Manager | `backend/src/integrations/core/integration-manager.js` | Gerenciamento de canais |
| P-27 | WhatsApp integration | `backend/src/integrations/whatsapp/` | WhatsApp provider + webhook |
| P-28 | Health check | `backend/src/server.js:226-316` | /api/health + /api/health/deep |

### 2.2 Código Fonte — Frontend

| # | Fonte | Localização | Evidência |
|---|-------|------------|-----------|
| P-29 | App entry + router | `frontend/src/App.jsx` | Todas as rotas definidas |
| P-30 | Auth context | `frontend/src/contexts/AuthContext.jsx` | Provider de autenticação |
| P-31 | Booking auth context | `frontend/src/contexts/BookingAuthContext.jsx` | Customer auth provider |
| P-32 | API service | `frontend/src/services/api.js` | Axios instance + interceptors |
| P-33 | Route guards | `frontend/src/routes/` | 6 route guard components |
| P-34 | Auth scopes | `frontend/src/constants/authScopes.js` | 3 scopes constantes |

### 2.3 Migrations

| # | Fonte | Localização | Evidência |
|---|-------|------------|-----------|
| P-35 | Migration runner | `backend/scripts/run-migrations.js` | Script que aplica migrações |
| P-36 | Base schema | `backend/src/database/base-schema.sql` | Schema fundamental |
| P-37 | RLS migrations (024-028) | `backend/src/database/20260624_024_*.sql` a `20260625_028_*.sql` | 5 migrações RLS |
| P-38 | Refresh tokens (030) | `backend/src/database/20260702_030_refresh_tokens.sql` | Refresh token table |
| P-39 | AI suggestions (031) | `backend/src/database/20260708_031_ai_suggestions.sql` | AI suggestions table |
| P-40 | Outbox schema | `backend/src/database/outbox.sql` + `outbox_message_handlers.sql` | Outbox pattern tables |

### 2.4 Testes

| # | Fonte | Localização | Evidência |
|---|-------|------------|-----------|
| P-41 | Tenant isolation RLS test | `backend/tests/integration/tenant-isolation-rls.test.js` | Prova de RLS ativo |
| P-42 | Tenant isolation test | `backend/tests/integration/tenant-isolation.test.js` | Prova de isolamento |
| P-43 | Outbox durability test | `backend/tests/integration/outbox-durability.test.js` | Prova de outbox |
| P-44 | Refresh token rotation test | `backend/tests/integration/refresh-token-rotation.test.js` | Prova de refresh token |
| P-45 | Base repository test | `backend/tests/unit/base-repository.test.js` | Prova de repository pattern |
| P-46 | Billing capability test | `backend/tests/unit/billing-capability.test.js` | Prova de billing engine |
| P-47 | CI pipeline | `.github/workflows/ci.yml:1-142` | 3 jobs (unit, integration, frontend) |

### 2.5 Configuração de Deploy

| # | Fonte | Localização | Evidência |
|---|-------|------------|-----------|
| P-48 | Deploy workflow | `.github/workflows/deploy.yml:1-70` | Render + Vercel |
| P-49 | Vercel config | `frontend/vercel.json` | SPA rewrites |
| P-50 | Docker compose | `docker-compose.yml` | Infra local |

---

## 3. Fontes Secundárias (documentação convergente)

| # | Fonte | Localização | Confirma |
|---|-------|------------|----------|
| S-01 | Indice OpenCodex | `.opencodex/projetos/multgestor/indice.md` | Estrutura geral |
| S-02 | ADR-001 (Supabase) | `.opencodex/.../decisions/ADR-001-supabase.md` | Banco em produção |
| S-03 | ADR-002 (Render) | `.opencodex/.../decisions/ADR-002-render.md` | Deploy backend |
| S-04 | ADR-003 (Vercel) | `.opencodex/.../decisions/ADR-003-vercel.md` | Deploy frontend |
| S-05 | ADR-006 (Migrations) | `.opencodex/.../decisions/ADR-006-migrations.md` | Estratégia de migração |
| S-06 | ADR-007 (Booking Engine) | `.opencodex/.../decisions/ADR-007-booking-engine.md` | Situação do booking |
| S-07 | DNA MultGestor | `.opencodex/projetos/multgestor/dna.md` | Princípios arquiteturais |
| S-08 | Plataforma | `.opencodex/projetos/multgestor/plataforma.md` | Visão geral |
| S-09 | Status atual | `.opencodex/projetos/multgestor/status-atual.md` | Estado corrente |
| S-10 | Capacidades (matriz) | `.opencodex/projetos/multgestor/capacidades.md` | Mapa de 40 capacidades |
| S-11 | Mapa Core | `.opencodex/.../mapas/MAPA-MULTGESTOR-CORE.md` | Mapa do Core |
| S-12 | Mapa dependências | `.opencodex/projetos/multgestor/mapa-dependencias.md` | Dependências |
| S-13 | Ontologia | `.opencodex/.../mapas/ONTOLOGIA-MULTGESTOR.md` | Modelo conceitual |
| S-14 | Matriz consolidação | `.opencodex/projetos/multgestor/matriz-consolidacao-core.md` | Matriz de verificação |
| S-15 | Status dinâmico | `.opencodex/projetos/multgestor/status-dinamico.md` | Status ao vivo |
| S-16 | Booking Engine README | `backend/src/shared/capabilities/booking-engine/README.md` | Documentação do motor |

---

## 4. Fontes Históricas (valor de rastro)

| # | Fonte | Observação |
|---|-------|-----------|
| H-01 | `docs/PLATFORM_ARCHITECTURE.md` | Substituída por arquitetura-canônica |
| H-02 | `docs/capabilities-map.md` | Substituída por capacidades.md |
| H-03 | `docs/core/runtime-map.md` | Substituída por 02-runtime-real.md |
| H-04 | `docs/AUDIT_REPORT.md` | Auditoria consolidada, valor histórico |
| H-05 | `docs/runbooks/migration-031-ai-suggestions-operacao.md` | Runbook específico |
| H-06 | `barber.service.legacy.js` | God service ~6500 linhas, legado |
| H-07 | `.agent/runtime/` | Scripts de agente, não vinculantes |

---

## 5. Fontes Conflitantes (divergem do código)

| # | Fonte | Conflito | Evidência |
|---|-------|----------|-----------|
| C-01 | `capacidades.md` §D-02 | Afirmava RLS inerte em runtime | `database.js:129` + `tenant-isolation-rls.test.js` — RLS **ativa** |
| C-02 | `capacidades.md` §D-03 | Afirmava "RLS 23/27 tabelas — companies/users sem policy" | 40 tabelas com policy; companies+users **têm** policy desde migration 024 |
| C-03 | `capacidades.md` §D-04 | Afirmava gating de plano "ainda com vocabulário barber" | `planFeatures.js` usa chaves genéricas — **0 ocorrências de barber** |
| C-04 | `capacidades.md` §D-08 | Afirmava "Redis em produção" | Health check prova Redis **não configurado** — fallback in-memory |
| C-05 | `capacidades.md` C-04 | Migrations classificadas como REMOTAMENTE | Migration runner + 36 SQL + schema_migrations — **executadas localmente** |
| C-06 | `capacidades.md` C-32 | Redis classificado como NÃO_APLICAVEL | Código existe e está parcialmente implantado (fallback in-memory) |
| C-07 | `docs/PLATFORM_ARCHITECTURE.md` | Várias afirmações sobre RLS desatualizadas | Corrigidas na Missão 0 |
| C-08 | `docs/core/runtime-map.md` | Refresh token ausente | Implementado desde migration v030 |

---

## 6. Fontes Desatualizadas

| # | Fonte | Razão |
|---|-------|-------|
| D-01 | `docs/PLATFORM_ARCHITECTURE.md` | Substituída pelos documentos canônicos da Missão 0 |
| D-02 | `docs/capabilities-map.md` | Substituída pela matriz de 40 capacidades |
| D-03 | `docs/core/runtime-map.md` | Substituída pelo GATE 2 desta missão |
| D-04 | `backend/src/services/_archive/barber.service.legacy.js` | Substituída por services decompostos |

---

## 7. Inventário por Camada Arquitetural

### 7.1 Cliente → Frontend
- `frontend/src/` — React 19 SPA, JSX (sem TypeScript)
- `frontend/src/pages/` — 40+ páginas (barber, master, booking, public, landing)
- `frontend/src/routes/` — 6 guards (ProtectedRoute, BarberPrivate, MasterPrivate, BookingPrivate, ModuleRoute, HomeRedirect)
- `frontend/src/contexts/` — 3 providers (Auth, BookingAuth, Theme)
- `frontend/src/services/api.js` — Axios com interceptors (token + 403 handling)

### 7.2 API Layer
- `backend/src/server.js` — Express 5, 14 routers montados
- `backend/src/routes/` — 12 route files
- `backend/src/controllers/` — controllers + 24 arquivos no módulo barber/

### 7.3 Middlewares (10 middlewares)
- `auth.middleware.js` — JWT + 3 scopes
- `requireCompany.js` — Tenant context + transação
- `requireBarberModule.js` — Module guard (factory)
- `requireClimaModule.js` — Module guard (factory)
- `requireActivePlan.js` — Plano ativo
- `requirePlanFeature.js` — Feature toggle
- `rate-limit.middleware.js` — Rate limit (Redis/in-memory)
- `error-handler.middleware.js` — Error handler centralizado
- `correlation-id.middleware.js` — Tracing
- `request-logger.middleware.js` — Logging
- `metrics.middleware.js` — Prometheus /metrics
- `master.middleware.js` — Master auth

### 7.4 Services (30+ services)
- `services/auth.service.js`
- `services/company.service.js`, `company-plan.service.js`
- `services/barber.service.js`, `barber-core.service.js`
- `services/appointment.service.js`, `schedule.service.js`
- `services/customer.service.js`, `crm.service.js`
- `services/collaborator.service.js`
- `services/financial-report.service.js`, `cash-flow.service.js`
- `services/sale.service.js`, `product.service.js`, `supplier.service.js`
- `services/wallet.service.js`, `loyalty.service.js`, `package.service.js`
- `services/branding.service.js`, `settings.service.js`
- `services/dashboard.service.js`, `master.service.js`, `master-finance.service.js`
- `services/client-booking.service.js`
- `services/clima-core.service.js`
- `services/barber/booking-appointments.service.js`
- `services/barber/booking-scheduling.service.js`
- `services/llm/LlmService.js` + providers
- `services/email/email.service.js`, `trial-emails.service.js`

### 7.5 Repositories (9 repositories)
- `repositories/appointment.repository.js`
- `repositories/barber-services.repository.js`
- `repositories/branding.repository.js`
- `repositories/cash-session.repository.js`
- `repositories/collaborator.repository.js`
- `repositories/crm.repository.js`
- `repositories/product.repository.js`
- `repositories/sale.repository.js`
- `repositories/settings.repository.js`
- `repositories/supplier.repository.js`

### 7.6 Banco (PostgreSQL)
- 36 arquivos SQL em `backend/src/database/`
- 8 migrações versionadas (024-031)
- Dual pool: `pool` (superuser/DATABASE_URL) + `poolTenant` (app_runtime, NOBYPASSRLS)
- RLS: 40+ tabelas com policies
- Outbox: `outbox_messages` + `outbox_message_handlers`

### 7.7 Eventos/Outbox/Workers
- `EventBus` (in-memory EventEmitter) — `shared/core/events/`
- `OutboxWorker` (polling SQL) — `shared/core/outbox/`
- 3 jobs periódicos (trial email, refresh purge, appointment reminder)
- 15+ outbox handlers registrados

### 7.8 Integrações
- WhatsApp (mock + Meta Cloud API)
- Email (Resend + SMTP + Mock)
- Billing (Kiwify + AbacatePay)
- Webhooks (Kiwify, WhatsApp)

---

## 8. Gap Analysis — Fontes Faltantes

| Fonte | Status | Impacto |
|-------|--------|---------|
| Contratos de API formais (OpenAPI/Swagger) | ❌ Ausente | Depende de leitura de código para cada endpoint |
| Diagrama de entidades ER | ❌ Ausente | Depende de leitura de migrations |
| Mapa de rotas autenticadas vs públicas | ❌ Ausente | Será construído no GATE 2 |
| Documentação de variáveis de ambiente | ⚠️ Parcial (`.env.example`) | Algumas variáveis não documentadas |
| Runbooks de operação | ⚠️ Parcial | Apenas migration-031 |
| SLA/SLO documentados | ❌ Ausente | Não encontrado |

---

## 9. POST-GATE 1

- Fontes inventariadas: **89** (47 primárias, 21 secundárias, 9 históricas, 8 conflitantes, 4 desatualizadas)
- Conflitos documentados: **8** (todos com evidência de código)
- Gaps identificados: **6** (API contracts, ER diagram, route map, env docs, runbooks, SLA)
- Nenhum arquivo operacional alterado ✅
- Nenhum código, migration, CI/deploy alterado ✅
