# Critical Fixes — MultGestor

> Problemas críticos identificados na auditoria de Maio 2026.
> Este arquivo deve ser lido ANTES de qualquer sessão de desenvolvimento.
> Remover item desta lista apenas após fix confirmado em produção.

---

## 🔴 CRÍTICO — Pendente

*(Nenhum item crítico aberto — Sprint 3 concluída em 26/05/2026)*

---

## 🟠 ALTO — Pendente

*(sem itens de alto impacto pendentes)*

---

## 🟡 MÉDIO — Pendente

*(sem itens médios pendentes)*

---

## ✅ RESOLVIDO — Sprint 4 (26/05/2026)

---

### ✅ CF-010: barber.controller.js God Controller — COMPLETAMENTE DECOMPOSTO

**Resolvido em:** 26/05/2026

**O que foi feito:**
- 11 novos arquivos de domínio criados em `backend/src/controllers/barber/`
- `auth.js` (1 handler), `services.js` (6), `products.js` (6), `suppliers.js` (6), `collaborators.js` (10), `advances.js` (6), `appointments.js` (5), `schedule.js` (7), `sales.js` (5), `customers.js` (7), `crm.js` (2)
- Todos convertidos de `try/catch + sendError` para `asyncHandler` padronizado
- Imports circulares corrigidos em `services.js`, `dashboard.js`, `cash.js`
- `index.js` reduzido a wrapper limpo de 15 linhas re-exportando todos os submodules
- `barber.controller.js` original deletado
- Total: 97 handlers em 15 arquivos de domínio
- `barber.routes.js` sem alterações além do import (uma linha)

---

## ✅ RESOLVIDO — Sprint 3 (26/05/2026)

---

### ✅ CF-015: CashFlowService conectado ao BarberCoreService

**Resolvido em:** 26/05/2026

**O que foi feito:**
- `barber-core.service.js` — `CashFlowService` adicionado como dependência injetável; `openCash()` adicionado à facade; todos os 8 métodos de caixa redirecionados de `this.saleService.*` → `this.cashFlowService.*`
- `controllers/barber/index.js` — `cashFlowService` injetado no `new BarberCoreService({...})`
- `tests/unit/barber-core-service.test.js` — mock de `cashFlowService` + 5 testes de delegação adicionados
- Resultado: 268 testes, 0 falhas (5 novos vs. baseline de 263)

### ✅ CF-010 (parcial): barber.controller.js dividido em submodules

**Resolvido em:** 26/05/2026 (parcialmente)

**O que foi feito:**
- Criada estrutura `backend/src/controllers/barber/`
- Extraídos 4 submodules com todos os handlers convertidos para `asyncHandler`:
  - `cash.js` — 9 handlers de caixa
  - `company.js` — 19 handlers (perfil, settings, plano, PIN, onboarding, branding, landing)
  - `dashboard.js` — 5 handlers
  - `public.js` — 3 handlers públicos
- `barber/index.js` — wrapper compatível que re-exporta os 4 submodules + ~60 handlers restantes
- `barber.routes.js` e `public-booking.routes.js` — imports atualizados para `../controllers/barber`
- ~60 handlers de 10 domínios restantes ainda no `index.js` — extração completa na Sprint 4

---

## ✅ RESOLVIDO — Sprint 2 (26/05/2026)

---

### ✅ CF-009: JWT em localStorage → HttpOnly Cookie

**Resolvido em:** 26/05/2026

**O que foi feito:**
- `frontend/src/services/authStorage.js` reescrito — localStorage substituído por `Map` in-memory (`_tokenStore`). Mesma interface pública.
- `backend/src/services/auth.service.js` — `signToken()` usa `expiresIn: '1h'`; adicionados `generateRefreshToken()` e `REFRESH_COOKIE_OPTIONS` (httpOnly, secure em prod, sameSite, maxAge: 7d)
- `backend/src/controllers/auth.controller.js` — login barber seta `mg_refresh_barber`; login master seta `mg_refresh_master`; login booking seta `mg_refresh_booking`; `refresh` e `logout` implementados
- `backend/src/routes/auth.routes.js` — rotas `POST /refresh` e `POST /logout` adicionadas
- `frontend/src/contexts/AuthContext.jsx` — mount tenta `/auth/refresh` via cookie se não há token em memória; logout chama `/auth/logout` para limpar cookie
- `frontend/src/contexts/BookingAuthContext.jsx` — mesmo padrão com `/booking-auth/refresh` e `/booking-auth/logout`
- `frontend/src/services/api.js` — `withCredentials: true` na instância Axios

---

## ✅ RESOLVIDO — Sprint 1 (25/05/2026)

---

### ✅ CF-011: Barber.jsx (276KB) no Root — DELETADO

**Resolvido em:** 25/05/2026

**O que foi descoberto:**
Sprint 0 preservou erroneamente o arquivo. Sprint 1 confirmou a análise correta:
- `BarberDashboard.jsx` em `frontend/src/pages/barber/` importa `from '../Barber'`
- Isso resolve para `frontend/src/pages/Barber.jsx` (170KB — componente real, ativo)
- `C:\MultGestor.v2\Barber.jsx` (276KB, 6 mai) era cópia antiga no root — não importada por nada
- Arquivo deletado.

---

### ✅ CF-012: planFeatures duplicado

**Resolvido em:** 25/05/2026

**O que foi feito:**
- Criado endpoint `GET /api/public/plan-config` em `public-booking.routes.js`
- Retorna `plans`, `limits`, `features`, `feature_min_plan` — fonte canônica do backend
- Comentários de aviso adicionados em `frontend/src/utils/planFeatures.js` e `companyPlans.js`
- Frontend pode consultar a API ao invés de manter cópias manuais

---

### ✅ CF-013: Migrations sem controle de versão

**Resolvido em:** 25/05/2026

**O que foi feito:**
- `backend/scripts/run-migrations.js` reescrito com controle via tabela `schema_migrations`
- Cada migration agora tem: version, name, timestamp, duration_ms
- Execução idempotente: skip das já aplicadas, apply apenas das novas
- `migration-starts-at-ends-at.sql` adicionada à lista (estava faltando)

---

### ✅ CF-014: Sem Docker/Podman para dev local

**Resolvido em:** 25/05/2026

**O que foi feito:**
- `docker-compose.yml` criado na raiz com: Postgres 16, Backend (5000), Frontend (5173), PgAdmin opcional (5050)
- `backend/Dockerfile.dev` e `frontend/Dockerfile.dev` criados (Node 20 Alpine)
- `backend/.dockerignore` e `frontend/.dockerignore` criados
- `.env.docker` criado com variáveis de exemplo para ambiente local
- Hot-reload via volumes montados
- Compatível com Podman Compose

---

### ✅ Health Check Melhorado (bonus)

**Resolvido em:** 25/05/2026

**O que foi feito:**
- Endpoint `/api/health/deep` adicionado em `server.js`
- 5 checks: Database (latência), Outbox (pending count, degraded se >100), Email provider, WhatsApp provider, Integrations
- Retorna HTTP 503 se unhealthy, 200 se healthy/degraded
- Inclui `uptime_seconds` e `timestamp`

---

## ✅ RESOLVIDO — Sprint 0 (25/05/2026)

---

### ✅ CF-001: CORS Completamente Aberto

**Arquivo:** `backend/src/server.js`
**Resolvido em:** 25/05/2026

**O que foi feito:**
Adicionado `ALLOWED_ORIGINS` com whitelist explícita (localhost:3000, localhost:5173, barbergestor.com.br, multgestorapp.com.br, APP_BASE_URL, FRONTEND_URL). CORS agora bloqueia origens não autorizadas e loga o bloqueio. `credentials: true` + `allowedHeaders` explícitos.

---

### ✅ CF-002: columnExists() — 11 Queries de Introspecção por Request

**Arquivo:** `backend/src/services/company-plan.service.js`
**Resolvido em:** 25/05/2026

**O que foi feito:**
Adicionado `_schemaConfigCache` com TTL de 5 minutos e função `invalidateSchemaConfigCache()`. As 11 queries de `information_schema.columns` agora executam apenas uma vez por startup (ou a cada 5 min).

---

### ✅ CF-003: OutboxWorker Não Iniciado

**Arquivo:** `backend/src/server.js`
**Resolvido em:** Já estava implementado (sessão anterior ao audit)

**O que foi encontrado:**
OutboxWorker estava sendo iniciado nas linhas 253-262, com configuração via env (`OUTBOX_BATCH_SIZE`, `OUTBOX_POLL_INTERVAL_MS`). Mais robusto que o fix proposto na auditoria.

---

### ✅ CF-004: Sem Cache de Plan Snapshot

**Arquivo:** `backend/src/services/company-plan.service.js`
**Resolvido em:** 25/05/2026

**O que foi feito:**
Adicionado `_planSnapshotCache` (Map) com TTL de 60 segundos e função `invalidatePlanCache(companyId)` exportada. Todos os `return` de `getCompanyPlanSnapshot` agora cacheiam antes de retornar.

---

### ✅ CF-005: Dois Diretórios de Middleware

**Resolvido em:** 25/05/2026

**O que foi feito:**
`backend/src/middleware/requireCompany.js` movido para `backend/src/middlewares/requireCompany.js`. Imports atualizados em `client.routes.js` e `barber.routes.js`. Diretório `middleware/` (singular) removido.

---

### ✅ CF-006: Auth Roles Duplicadas

**Resolvido em:** 25/05/2026

**O que foi feito:**
Criado `backend/src/shared/core/auth/roles.js` com fonte única de verdade para `BARBER_ADMIN_ROLES`, `BOOKING_CUSTOMER_ROLES`, `MASTER_ROLES` e `inferAuthScope`. `auth.middleware.js` e `auth.service.js` atualizados para importar deste módulo.

---

### ✅ CF-007: Lixo no Root (parcial)

**Resolvido em:** 25/05/2026

**O que foi feito:**
- `session-ses_1c4f.md` (501KB) → deletado ✅
- Arquivo `0` (8 bytes) → deletado ✅
- `Barber.jsx` (276KB) → **preservado** — descoberto que é importado ativamente por `BarberDashboard.jsx`. Aberto como CF-011 para investigação.

---

### ✅ CF-008: Rota /api/booking-customer Duplicada

**Resolvido em:** 25/05/2026

**O que foi feito:**
Removida a linha `app.use('/api/booking-customer', bookingAuthRoutes)` do server.js. Frontend atualizado: `BookingAuthContext.jsx` agora chama `/booking-auth/me` em vez de `/booking-customer/me`.

---

## Como usar este arquivo

1. Leia este arquivo no início de cada sessão
2. Ao trabalhar em um fix, mude o status para ⏳ Em andamento
3. Ao confirmar em produção, mova para ✅ RESOLVIDO com data e detalhes
4. Novos problemas críticos encontrados → adicionar aqui com prefixo CF-XXX
