# Memory Snapshot — MultGestor / BarberGestor

> Última atualização: 26/05/2026 — Sprint 17 concluída
> Propósito: Permitir que qualquer agente de IA retome o contexto completo do projeto instantaneamente.

## 🟢 SPRINT 17 CONCLUÍDA — 26/05/2026

**343 testes, 0 falhas** (19 skipped — integração sem DB).

**Resolvido na Sprint 0 (25/05/2026):**
- ✅ CF-001 a CF-008 — ver critical-fixes.md para detalhes

**Resolvido na Sprint 1 (25/05/2026):**
- ✅ CF-011 a CF-014 + health check melhorado

**Resolvido na Sprint 2 (26/05/2026):**
- ✅ CF-009: JWT localStorage → HttpOnly cookie
  - `authStorage.js` — in-memory Map (sem localStorage)
  - `auth.service.js` — access token 1h, `generateRefreshToken()`, `REFRESH_COOKIE_OPTIONS`
  - `auth.controller.js` — cookies `mg_refresh_barber/master/booking` no login; endpoints `/refresh` e `/logout`
  - `AuthContext.jsx` + `BookingAuthContext.jsx` — refresh via cookie no mount; logout limpa cookie

**Resolvido na Sprint 3 (26/05/2026) — 268 testes, 0 falhas:**
- ✅ CF-015: CashFlowService conectado ao BarberCoreService — caixa restaurado (openCash + 8 métodos)
- ✅ CF-010 (parcial): 4 submodules extraídos do barber.controller.js — cash.js, company.js, dashboard.js, public.js

**Resolvido na Sprint 4 (26/05/2026) — baseline 268 testes:**
- ✅ CF-010 (concluído): 11 arquivos de domínio criados, 97 handlers em 15 arquivos, barber.controller.js deletado
- Todos convertidos para `asyncHandler`, imports circulares corrigidos, index.js = 15 linhas

**Resolvido na Sprint 5 (26/05/2026) — 273 testes, 0 falhas:**
- ✅ Helmet.js — 11 security headers (XSS, clickjacking, MIME sniffing)
- ✅ Rate limiting em todos os endpoints de auth (login: 10/15min, register/refresh: 20/h)
- ✅ requireBarberModule extraído do inline → `middlewares/requireBarberModule.js` com cache 5min
- ✅ 5 testes de segurança adicionados (security-middleware.test.js)

**Resolvido na Sprint 6 (26/05/2026):**
- ✅ CI/CD pipeline completo: `.github/workflows/ci.yml` (unit + integration + frontend), `deploy.yml` (Render + Vercel após CI), `security-audit.yml` (semanal), PR template, `docs/CI_CD.md`
- **Ação manual necessária:** configurar 4 segredos no GitHub — `RENDER_DEPLOY_HOOK_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

**Resolvido na Sprint 7 (26/05/2026) — ~290 testes, 0 falhas:**
- ✅ Zod validation: 11 schemas criados (6 auth + 5 barber), aplicados em 14 rotas
- ✅ 17 novos testes de schema (validation-schemas.test.js)
- Rotas protegidas: /login, /register, /forgot-password, /reset-password, /set-password, /barber/sales, /barber/collaborators, /barber/services, /barber/appointments, /barber/advances, /booking-auth/login

**Resolvido na Sprint 8 (26/05/2026) — 290 testes, 0 falhas:**
- ✅ `shared/capabilities/booking-engine/` criado — primeira capability reutilizável da plataforma
  - `scheduling-utils.js` — 19 funções puras + 4 constantes, zero dependência de banco
  - `README.md` — documentação para futuros verticais
- ✅ `client-booking.service.js` de 1671 linhas → facade de 37 linhas
  - Decomposto em 3 services: `booking-customer-auth.service.js`, `booking-scheduling.service.js`, `booking-appointments.service.js`
- ✅ `APPOINTMENT_STATUS` unificado na capability (elimina duplicação entre appointment.service.js e client-booking)

**Resolvido na Sprint 9 (26/05/2026) — 296 testes, 0 falhas:**
- ✅ ClimaGestor scaffold — segundo vertical validando arquitetura multi-nicho
  - `createModuleGuard.js` — factory genérica para guardas de módulo (cache compartilhado)
  - `requireClimaModule.js` — guarda do segundo vertical
  - `clima-core.service.js` — CRUD de profissionais e serviços; reutiliza booking-engine capability
  - `controllers/clima/index.js` + `routes/clima.routes.js` — 5 endpoints protegidos
  - Migration `clima.sql` — tabelas `clima_professionals` e `clima_services`

**Resolvido na Sprint 10 (26/05/2026) — ~301 testes, 0 falhas:**
- ✅ Redis cache: 3 Maps in-memory → cacheManager com Redis + fallback gracioso
  - `shared/core/cache/redis-client.js` — ioredis com graceful degradation
  - `shared/core/cache/cache-manager.js` — get/set/del/delByPrefix, singleton
  - Namespaces: `mg:plan:{id}` (60s), `mg:schema_config` (5min), `mg:module:{id}:{slug}` (5min)
  - `company-plan.service.js` + `createModuleGuard.js` migrados
  - `docker-compose.yml` + CI integration-tests + `.env.docker` atualizados
  - `ioredis` adicionado às dependências

**Resolvido na Sprint 11 (26/05/2026) — 307 testes, 0 falhas:**
- ✅ Pino structured logging: `logger.js` singleton (dev pretty, prod JSON, test silent)
- ✅ Correlation ID: `X-Request-Id` gerado/propagado; `req.logger` child logger por request
- ✅ Request logger middleware: method, url, statusCode, durationMs por request; skip healthchecks
- ✅ Error handler: 5xx com stack trace em dev, 4xx sem; nenhum `console.*` em produção
- ✅ `/health/deep`: check Redis (latência ms / fallback degraded)
- ✅ `jest.setup.js`: `LOG_LEVEL=silent` + `NODE_ENV=test` para todos os testes
- ✅ 8 testes (`logger-middleware.test.js`): correlationId, propagação, errorHandler

**Resolvido na Sprint 12 (26/05/2026) — 314 testes, 0 falhas:**
- ✅ ClimaGestor agendamento completo — segundo vertical funcionalmente operacional
  - Migration `clima_appointments.sql` — tabela `clima_appointments` + índices + `working_hours` em profissionais
  - `clima-core.service.js` — +5 métodos: `getAvailability`, `createAppointment`, `listAppointments`, `getAppointment`, `cancelAppointment`
  - `buildAvailabilitySlots` integrado: `conflictsFn` por overlap real de `[start, end)`, `startsAtFloor = now`
  - Conflito 409 por overlap temporal; validação de `start_at` no futuro
  - `controllers/clima/index.js` — +5 handlers; `clima.routes.js` — +4 rotas
  - `clima-requests.schema.js` — 2 schemas Zod (availability query + create appointment)
  - +7 testes em `clima-core-service.test.js`

**Resolvido na Sprint 13 (26/05/2026) — Emergency production fixes (314 testes, 0 falhas):**
- ✅ `columnExists` no hot path de auth eliminado: `auth.service.js` agora usa `getCompanyPlanSchemaConfig()` cacheada de `company-plan.service.js` (TTL 5min) — 3 queries `information_schema` por login/refresh → 0
- ✅ Bug de data silencioso em `booking-appointments.service.js`: `hasAppointmentSource` nunca foi declarado em `createPublicAppointment` — agendamentos públicos eram gravados com `source='admin_manual'` mas retornavam `'public_link'`. Corrigido. Coluna `source` é sempre inserida (existe após migration).
- ✅ `columnExists` morto em `createClientAppointment` removido (chamado mas resultado nunca usado)
- ✅ Encoding corrompido em `requireActivePlan.js`: `'Seu perÃ­odo...'` → `'Seu periodo...'`
- ✅ `GET /api/db-test` removido do `server.js` (endpoint aberto sem auth)
- ✅ `docs/DEPLOY_CHECKLIST.md` criado — checklist de secrets GitHub, Render paid tier, variáveis de ambiente, verificação pós-deploy
- ✅ `ai-operating-rules.md` atualizado — seção 12 com MCPs disponíveis (GitHub, Playwright, Supabase) e regras de uso

**Resolvido na Sprint 14 (26/05/2026) — 314 testes, 0 falhas:**
- ✅ `ErrorBoundary.jsx` — class component com `componentDidCatch` + `getDerivedStateFromError`; fallback com mensagem amigável + botão "Recarregar página"
- ✅ `PageLoader.jsx` — spinner CSS puro para fallback do Suspense
- ✅ `App.jsx` — 22 imports de páginas convertidos para `React.lazy()`; `<Suspense fallback={<PageLoader />}>` global
- ✅ `main.jsx` — aplicação inteira envolvida com `<ErrorBoundary>`
- ✅ 6 rotas de booking público (`/agendar/:slug/*`) envolvidas com `<ErrorBoundary fallback={...}>` específico
- ✅ Build validado — code splitting funcionando (cada página virou chunk separado no Vite)

**Resolvido na Sprint 15 (26/05/2026) — 323 testes, 0 falhas:**
- ✅ Trial email sequence completa (D+0 welcome, D+4 progress, D+6 expiring, D+7 expired)
  - `trial-emails.service.js` — 4 templates HTML com links para dashboard e `/escolher-plano`
  - `trial-email-job.js` — job que varre empresas em trial e envia email conforme dias desde registro
  - `trial_email_log.sql` — migration com deduplicação (`UNIQUE(company_id, email_type)`)
  - Integrado em `server.js` com `setInterval` de 1h + execução no startup (após 30s)
  - Welcome email disparado em `auth.service.js` no registro (try/catch — não bloqueia)
  - Protegido por `TRIAL_EMAILS_ENABLED=true` (default false em dev)
- ✅ Self-service de plano
  - `GET /api/public/plan-options` — 3 planos (Essencial/Profissional/Premium) com preços e features
  - `ChoosePlan.jsx` + `ChoosePlan.css` — página de seleção de plano acessível sem autenticação
  - Interceptor axios em `api.js` — redireciona para `/escolher-plano` em 403 com `error: 'Plano inativo'`
  - Links Kiwify configuráveis via `VITE_KIWIFY_URL_*`
- ✅ +9 testes (`trial-emails.service.test.js` + `trial-email-job.test.js`)

**Resolvido na Sprint 16 (26/05/2026) — 327 testes, 0 falhas:**
- ✅ Sentry no backend: `@sentry/node` instalado; `shared/core/monitoring/sentry.js` com init condicional (só ativa se `SENTRY_DSN` definido)
  - `error-handler.middleware.js` — erros 5xx capturados com `correlationId` como tag; 4xx ignorados (sem ruído)
  - `server.js` — `sentry.init()` na primeira linha após dotenv; `setupExpressErrorHandler(app)` antes do errorHandler custom
- ✅ Sentry no frontend: `@sentry/react` instalado; `lib/sentry.js` com init condicional (`VITE_SENTRY_DSN`)
  - `main.jsx` — `sentry.init()` antes de `createRoot`
  - `ErrorBoundary.jsx` — `captureException` no `componentDidCatch` (com tag `component: ErrorBoundary`)
- ✅ Documentação: `backend/.env.example` + `frontend/.env.example` com variáveis Sentry
  - `docs/DEPLOY_CHECKLIST.md` — seção 8 completa: Sentry (criar projeto, DSN, config) + UptimeRobot (passo a passo, prevenção de spin-down)
- ✅ +4 testes (`sentry.test.js`): isEnabled false/true, captureException sem SENTRY_DSN não lança

**Resolvido na Sprint 17 (26/05/2026) — 343 testes, 0 falhas:**
- ✅ PostgreSQL Row-Level Security (RLS) — segunda camada de defesa multi-tenant
  - `rls_tenant_tables.sql` — 24 tabelas tenant com `ENABLE ROW LEVEL SECURITY` + policy `tenant_isolation`
  - Tabelas cobertas: barber_* (services, collaborators, appointments, sales, cash, etc.), clima_*, booking_customers, settings, integration_configs
  - Tabelas master sem RLS: companies, users (master admin com company_id NULL), plans, modules, outbox, trial_email_log
  - `config/database.js` — helper `withTenantContext(client, companyId, fn)` que executa `SET LOCAL app.current_company_id`
- ✅ Zod validation em 8 rotas PUT/PATCH restantes do BarberGestor
  - `updateServiceSchema`, `updateServiceStatusSchema`, `updateAppointmentStatusSchema`, `rescheduleAppointmentSchema`
  - `updateCustomerSchema`, `updateCustomerStatusSchema`, `updateCollaboratorSchema`, `updateCollaboratorStatusSchema`
  - Aplicadas em `barber.routes.js` nas rotas de update de serviços, agendamentos, clientes e colaboradores
- ✅ +8 testes (`validation-update-schemas.test.js` + `with-tenant-context.test.js`)

**Próximas frentes:**
- WhatsApp real (substituir mock provider pelo Meta Cloud API — backlog)
- Analytics e métricas de uso

**Ação manual obrigatória antes do primeiro deploy:**
- Render: fazer upgrade Free → Starter ($7/mês) para evitar spin-down do OutboxWorker
- GitHub Secrets: `RENDER_DEPLOY_HOOK_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Ver `docs/DEPLOY_CHECKLIST.md` para checklist completo

**Infraestrutura adicionada:**
- `docker-compose.yml` — Postgres 16 + Redis 7 + Backend + Frontend + PgAdmin
- `backend/Dockerfile.dev` + `frontend/Dockerfile.dev`
- `.env.docker` — variáveis de exemplo para ambiente local (inclui REDIS_URL)
- `GET /api/public/plan-config` — endpoint público de configuração de planos
- `GET /api/health/deep` — health check detalhado com 5 checks
- `shared/core/cache/` — redis-client + cache-manager (fallback gracioso)
- `shared/core/logger/logger.js` — pino singleton (dev pretty / prod JSON / test silent)
- `middlewares/correlation-id.middleware.js` — X-Request-Id por request
- `middlewares/request-logger.middleware.js` — method, url, statusCode, durationMs
- `middlewares/error-handler.middleware.js` — structured error logging centralizado

## Visão Geral

MultGestor é um SaaS multi-tenant com módulos especializados por nicho de mercado. O primeiro módulo ativo é o **BarberGestor** (gestão de barbearias). O sistema permite que barbearias gerenciem agenda, vendas, comissões, colaboradores, relatórios e agendamento online.

## Stack Resumida

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express (CommonJS) |
| Banco | Supabase PostgreSQL |
| Cache | Redis 7 (ioredis, fallback in-memory) |
| Storage | Supabase Storage |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |
| E-mail | Resend |

## Arquitetura

- Separação total frontend/backend (dois repositórios ou pastas separadas)
- Multi-tenant com isolamento por `company_id` (NUNCA por `owner_id`)
- Master Admin isolado dos módulos tenant
- API REST com Express
- Rotas públicas e privadas
- Autenticação por JWT + PIN opcional

## Regras Críticas (Violação = Bug de Segurança)

1. **company_id** é a chave de isolamento multi-tenant. Toda query tenant deve filtrar por `company_id`.
2. **Backend é a fonte única de segurança.** Frontend nunca deve ser confiável para validação crítica.
3. **GET de integração WhatsApp nunca retorna token real.** Tokens ficam criptografados no banco.
4. **.env nunca vai para o GitHub.**
5. **FRONTEND_URL** é usado para links de e-mail; em produção nunca usar `localhost`.
6. **Master Admin** não acessa dados de tenant. Módulos tenant não acessam dados mestre.

## Módulos Ativos

- BarberGestor (completo): agenda, vendas, caixa, comissões, colaboradores, relatórios, agendamento online, configurações visuais

## Módulos Futuros (Previstos)

- Próximos nichos (não iniciados): clínicas, salões, etc.

## Fluxos de Trabalho Obrigatórios para IA

| Tipo | Fluxo |
|------|-------|
| Criação nova | Brainstorm → Architecture → Plan → Create → Debug → Test → Deploy |
| Correção pequena | Context Discovery → Plan → Surgical Fix → Debug → Test |
| Visual/UI | Context Discovery → Frontend Design → UX/UI Review → Create → Test |
| Backend crítico | Context Discovery → Architecture → Backend Security → Database Design → Create → Test |

## Como Usar Este Arquivo

1. **Sempre comece por aqui.** Leia este snapshot antes de qualquer ação.
2. Consulte os arquivos específicos em `.agent/context/` para detalhes:
   - `project-overview.md` — visão geral do negócio e usuários
   - `stack.md` — tecnologias e ambientes
   - `architecture.md` — arquitetura detalhada
   - `backend-rules.md` — regras de backend
   - `frontend-rules.md` — regras de frontend
   - `database-rules.md` — regras de banco de dados
   - `deployment-rules.md` — regras de deploy
   - `ai-operating-rules.md` — regras de operação para IA
   - `roadmap.md` — próximos passos
3. Responda sempre em português do Brasil.
4. Seja cirúrgico: altere apenas o necessário, não invente, não extrapole.
