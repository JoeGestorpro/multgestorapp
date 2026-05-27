# MultGestor v2 — Relatório de Auditoria Operacional

> Data: Maio 2026
> Escopo: Backend, Frontend, Arquitetura, DevOps, Enterprise Readiness

---

## PARTE 1 — DIAGNÓSTICO TÉCNICO

---

### 1.1 O que funciona bem

**Backend:**
- ✅ Arquitetura multi-tenant bem implementada (company_id consistente)
- ✅ Sistema de erros tipado e centralizado (AppError, ValidationError, etc.)
- ✅ Correlation ID por request (x-trace-id)
- ✅ asyncHandler consistente nas rotas
- ✅ BaseRepository com proteção de company_id
- ✅ Soft delete implementado
- ✅ OutboxWorker implementado (padrão correto para mensageria durável)
- ✅ EventBus com wrapping de handlers (falha de consumidor não propaga)
- ✅ 3 providers de email (Resend, SMTP, Mock) com interface unificada
- ✅ WhatsApp com mock provider + interface para real
- ✅ Validação com Zod nos schemas
- ✅ Pino structured logging
- ✅ Tenant isolation via middleware dedicado
- ✅ Plan features isoladas em utilitário único (planFeatures.js)
- ✅ RequireActivePlan + RequirePlanFeature como middlewares reutilizáveis
- ✅ Auth scopes bem separados (barber_admin, booking_customer, master)

**Frontend:**
- ✅ Design system próprio (tokens, componentes atômicos)
- ✅ Separação contexts/services/pages/components
- ✅ AuthStorage isolado (não acessa API diretamente)
- ✅ Múltiplos contextos de auth por scope (barber, master, booking)
- ✅ Route guards por escopo

**Arquitetura:**
- ✅ Documentação `.agent/context/` rica e atualizada
- ✅ Regras claras de desenvolvimento em `.agent/memory/rules.md`
- ✅ Roadmap documentado
- ✅ Estado atual documentado

---

### 1.2 Problemas Críticos (devem ser resolvidos urgente)

---

#### ❌ CRÍTICO-1: CORS Completamente Aberto

**Arquivo:** `backend/src/server.js`, linha 126

```js
// ATUAL (INSEGURO):
app.use(cors())

// CORRETO:
app.use(cors({
  origin: [
    process.env.APP_BASE_URL,
    'http://localhost:5173',
    'https://barbergestor.com.br',
    'https://www.barbergestor.com.br'
  ].filter(Boolean),
  credentials: true
}))
```

**Risco:** Qualquer origem pode fazer requisições autenticadas à API. Em produção, isso expõe todos os dados dos tenants.

---

#### ❌ CRÍTICO-2: columnExists() Executado em Toda Requisição

**Arquivo:** `backend/src/services/company-plan.service.js`, linha 108

```js
async function getCompanyPlanSchemaConfig() {
  const [
    hasPlanType,        // query em information_schema
    hasPlanStatus,      // query em information_schema
    hasTrialEndsAt,     // query em information_schema
    hasMaxCollaborators,// query em information_schema
    // ... mais 7 queries
  ] = await Promise.all([...])
}
```

**Impacto:** Toda rota protegida por `requireActivePlan` ou `requirePlanFeature` dispara **11 queries de introspecção** + 2 queries de dados = **13 DB round-trips por request**. Em produção com 100 req/s, isso são 1300 queries/s extras em `information_schema`.

**Solução:** Cache em memória do schema config (invalida a cada reinício — OK, pois migrations não mudam em runtime):

```js
let _schemaConfigCache = null

async function getCompanyPlanSchemaConfig() {
  if (_schemaConfigCache) return _schemaConfigCache
  // ... executa as 11 queries
  _schemaConfigCache = result
  return result
}
```

---

#### ❌ CRÍTICO-3: OutboxWorker Não Inicializado no server.js

**Verificado:** `backend/src/server.js` não importa nem inicia o `OutboxWorker`.

O padrão está perfeitamente implementado em `outbox-worker.js`, mas nunca é iniciado. Isso significa que eventos inseridos na tabela `outbox_messages` **nunca são processados**.

**Solução:**
```js
const OutboxWorker = require('./shared/core/outbox/outbox-worker')
const pool = require('./config/database')

const outboxWorker = new OutboxWorker(pool, {
  batchSize: 50,
  pollIntervalMs: 2000,
  onError: (err) => appLogger.error({ err }, '[OutboxWorker] erro no poll')
})

outboxWorker.start()
appLogger.info('[OutboxWorker] iniciado')
```

---

### 1.3 Problemas Altos (resolver em breve)

---

#### ⚠️ ALTO-1: JWT Armazenado em localStorage

**Arquivo:** `frontend/src/services/authStorage.js`

JWT em localStorage é vulnerável a ataques XSS. Qualquer script malicioso pode roubar o token.

**Solução ideal:** HttpOnly cookies para o token, com CSRF protection.
**Solução intermediária:** Token com expiração curta (1h) + refresh token em cookie HttpOnly.

---

#### ⚠️ ALTO-2: barber.service.js é um God Service

Estimativa: 3.000+ linhas cobrindo colaboradores, vendas, caixa, agenda, serviços, produtos, fornecedores, CRM, dashboard, branding.

**Risco:**
- Testes unitários impossíveis de isolar
- Qualquer mudança pode quebrar funcionalidade não relacionada
- Impede crescimento para novos verticais

**Solução:** Extrair cada domínio para seu próprio service. O controlador já está organizado (instancia services separados no topo), mas o service principal ainda agrega lógica de múltiplos domínios.

---

#### ⚠️ ALTO-3: Sem Cache de Plan Snapshot

`getCompanyPlanSnapshot()` faz 2 queries ao DB (companies + subscriptions) a cada request. Com o schema config fix (CRÍTICO-2), ainda resta 2 queries por request por tenant.

**Solução:** Cache in-memory por `company_id` com TTL de 60 segundos:

```js
const planCache = new Map() // companyId -> { snapshot, expiresAt }

async function getCompanyPlanSnapshot(companyId) {
  const cached = planCache.get(companyId)
  if (cached && Date.now() < cached.expiresAt) return cached.snapshot
  // ... busca do banco
  planCache.set(companyId, { snapshot, expiresAt: Date.now() + 60_000 })
  return snapshot
}
```

---

#### ⚠️ ALTO-4: Dois Diretórios de Middleware

- `backend/src/middleware/` (singular) — contém `requireCompany.js`
- `backend/src/middlewares/` (plural) — contém auth, rate-limit, requireActivePlan, requirePlanFeature

**Solução:** Consolidar tudo em `middlewares/` (plural).

---

#### ⚠️ ALTO-5: Duplicação de Lógica de Auth

`BARBER_ADMIN_ROLES`, `BOOKING_CUSTOMER_ROLES`, `MASTER_ROLES` e `inferAuthScope` estão definidos em:
- `backend/src/middlewares/auth.middleware.js`
- `backend/src/services/auth.service.js`

**Solução:** Extrair para `backend/src/shared/core/auth/roles.js`.

---

### 1.4 Problemas Médios

| # | Problema | Arquivo | Solução |
|---|---|---|---|
| M1 | `Barber.jsx` (276KB) no root do projeto | `/Barber.jsx` | Deletar ou mover para backup |
| M2 | `session-ses_1c4f.md` (501KB) no root | `/session-ses_1c4f.md` | Deletar |
| M3 | Arquivo `0` no root | `/0` | Deletar |
| M4 | `BookingPage.tsx` isolado em projeto JSX | `frontend/src/pages/barber/BookingPage.tsx` | Converter para .jsx |
| M5 | AuthContext duplicado | `AuthContext.jsx` + `auth.context.js` | Manter apenas `auth.context.js` |
| M6 | BookingAuthContext duplicado | Idem | Consolidar |
| M7 | `/api/booking-auth` registrado duas vezes | `server.js` linhas 207-208 | Remover duplicata |
| M8 | planFeatures.js no backend e companyPlans.js no frontend | — | Fonte única de verdade |
| M9 | Sem migrations versionadas (sem tabela de controle) | `scripts/run-migrations.js` | Implementar tabela `schema_migrations` |
| M10 | Rate limiting middleware existe mas não está aplicado globalmente | — | Aplicar no server.js |

---

### 1.5 Sem Cobertura Enterprise

| Capacidade | Status | Prioridade |
|---|---|---|
| Docker/Podman para dev local | ❌ Ausente | Alta |
| Redis / cache distribuído | ❌ Ausente | Alta |
| CI/CD pipeline (GitHub Actions) | ❌ Ausente | Alta |
| Migrations versionadas | ❌ Ausente | Alta |
| Métricas (Prometheus/Grafana) | ❌ Ausente | Média |
| Distributed tracing (OpenTelemetry) | ❌ Ausente | Média |
| Audit log de ações | ❌ Ausente | Média |
| 2FA / MFA | ❌ Ausente | Média |
| Tenant provisioning workflow | ❌ Ausente | Alta |
| White-label por tenant | ⚠️ Parcial | Alta |
| Feature flags por tenant | ❌ Ausente | Média |
| Event store durável | ⚠️ Parcial (outbox) | Alta |

---

## PARTE 2 — GAPS DE AGENTES, SKILLS E WORKFLOWS

---

### 2.1 O que está bom nos agentes/skills atuais

- ✅ 20 agentes genéricos bem documentados
- ✅ Fluxo de skill loading definido
- ✅ Scripts de verificação (checklist.py, verify_all.py)
- ✅ Documentação rica em `.agent/context/`
- ✅ Marketing ecosystem completo (54 arquivos)
- ✅ Orchestrator e Context Manager definidos

### 2.2 O que está ausente (específico da plataforma)

Os agentes atuais são **agnósticos de domínio** (Antigravity Kit). Faltam agentes que conheçam **especificamente a plataforma MultGestor**:

**Agentes ausentes:**
- `platform-architect` — guardião da visão de plataforma (capabilities, verticais)
- `saas-billing-agent` — especialista em Recurring Revenue Engine
- `event-driven-agent` — guardião do event catalog e outbox patterns
- `multi-tenant-security-agent` — auditor de isolamento tenant
- `observability-agent` — métricas, traces, alertas
- `vertical-builder-agent` — cria novos verticais sobre o Core

**Skills ausentes:**
- `create-capability` — como extrair uma feature em capability reutilizável
- `create-vertical` — como criar um novo vertical sobre o Core
- `multi-tenant-patterns` — padrões de isolamento, provisioning, white-label
- `event-driven-patterns` — event catalog, outbox, idempotency, replay
- `saas-billing-patterns` — planos, features flags, webhooks de gateway

**Workflows ausentes:**
- `/create-capability` — transforma feature em capability do Core
- `/create-vertical` — scaffolding de novo vertical
- `/audit-tenant-isolation` — verifica queries sem company_id
- `/audit-event-consistency` — verifica eventos sem consumidores
- `/generate-migration` — cria migration versionada e segura
- `/prepare-release` — checklist completo de release

---

## PARTE 3 — ROADMAP OPERACIONAL

---

### Sprint 0 — Correções Críticas (esta semana)
1. [ ] Corrigir CORS (adicionar allowlist)
2. [ ] Cache do schema config em memória (eliminar 11 queries/request)
3. [ ] Inicializar OutboxWorker no server.js
4. [ ] Cache in-memory do plan snapshot (60s TTL)
5. [ ] Deletar arquivos de lixo do root (Barber.jsx, session-ses_1c4f.md, arquivo 0)

### Sprint 1 — Dívida Técnica (próximas 2 semanas)
1. [ ] Consolidar diretórios `middleware/` → `middlewares/`
2. [ ] Extrair roles/inferAuthScope para módulo compartilhado
3. [ ] Converter BookingPage.tsx → .jsx
4. [ ] Consolidar AuthContext duplicado
5. [ ] Aplicar rate limiting no server.js
6. [ ] Remover rota `/api/booking-customer` duplicada

### Sprint 2 — Infraestrutura (próximas 3 semanas)
1. [ ] Criar Dockerfile para backend
2. [ ] Criar Dockerfile para frontend
3. [ ] Criar docker-compose.yml / podman-compose.yml para dev local
4. [ ] Implementar tabela `schema_migrations` para controle de migrations
5. [ ] Criar CI/CD básico (GitHub Actions)
6. [ ] Criar `/api/health/deep` com checks reais

### Sprint 3 — Decomposição do God Service (1 mês)
1. [ ] Extrair lógica de colaborador de barber.service.js → collaborator.service.js
2. [ ] Extrair lógica de caixa → cash-flow.service.js (já existe, verificar)
3. [ ] Extrair lógica de agenda → appointment.service.js (já existe, verificar)
4. [ ] Verificar se barber.service.js pode ser deletado após extração

### Sprint 4 — Platform Capabilities (2 meses)
1. [ ] Formalizar Booking Engine como módulo compartilhado
2. [ ] Formalizar Communication Layer com interface genérica
3. [ ] Implementar WhatsApp real (substituir mock)
4. [ ] Implementar cache Redis para plan snapshot e session
5. [ ] Publicar eventos `customer.registered`, `subscription.activated`

### Sprint 5 — Enterprise Readiness (3 meses)
1. [ ] Implementar Automation Engine (trigger → condition → action)
2. [ ] Implementar AI Operational Layer (classificação de clientes)
3. [ ] Implementar observabilidade (métricas + tracing)
4. [ ] Implementar 2FA
5. [ ] Criar segundo vertical (ClimaGestor)

---

## PARTE 4 — CHECKLIST DO QUE CORRIGIR

```
CRÍTICO (bloqueia produção segura):
[ ] CORS aberto → configurar allowlist
[ ] columnExists 11x por request → cache in-memory
[ ] OutboxWorker não iniciado → inicializar no server.js
[ ] Cache de planSnapshot → TTL 60s

ALTO (dívida técnica que bloqueia crescimento):
[ ] barber.service.js god service → decompor
[ ] JWT em localStorage → migrar para HttpOnly cookie
[ ] Dois diretórios de middleware → consolidar
[ ] Lógica de auth duplicada → extrair para shared/core/auth
[ ] Arquivos de lixo no root → deletar

MÉDIO (polimento e consistência):
[ ] BookingPage.tsx → converter para .jsx
[ ] AuthContext duplicado → consolidar
[ ] Rota /api/booking-customer duplicada → remover
[ ] Rate limiting não aplicado → aplicar globalmente
[ ] Migrations sem versionamento → implementar schema_migrations

INFRAESTRUTURA (para crescimento):
[ ] Sem containers → criar Docker/Podman
[ ] Sem CI/CD → criar GitHub Actions
[ ] Sem Redis → implementar cache distribuído
[ ] Sem observabilidade → métricas + tracing
[ ] Sem audit log → implementar
```
