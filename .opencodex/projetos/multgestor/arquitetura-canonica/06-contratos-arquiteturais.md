# GATE 6 — Contratos Arquiteturais

> **Missão 1 — Arquitetura Canônica do Core MultGestor**
> **Baseline:** `ba55065` · **Data:** 2026-07-20

## 1. Contrato: Tenant

| Atributo | Valor |
|----------|-------|
| Responsabilidade | Isolar dados entre empresas |
| Entrada | `company_id` (UUID) no JWT |
| Saída | GUC `app.current_company_id` via `requireCompany` middleware |
| Invariante | Todo query tenant-aware usa `poolTenant` (app_runtime, NOBYPASSRLS) |
| Implementação | `database.js:68-81`, `requireCompany.js:11-80`, RLS policies |
| Consumidores | Todos os services/repositories que operam por empresa |
| Extensões permitidas | Novas policies RLS seguindo padrão `NULLIF + WITH CHECK` |
| Extensões proibidas | Bypass de `poolTenant` para queries tenant-aware |
| Falhas | `TenantIsolationError` se company_id ausente |

---

## 2. Contrato: Identidade

| Atributo | Valor |
|----------|-------|
| Responsabilidade | Autenticar usuários (3 escopos) |
| Entrada | Credenciais (email+senha) ou Refresh Token (cookie) |
| Saída | `access_token` (JWT, 15min) + `refresh_token` (HttpOnly cookie, 7 dias) |
| Invariante | Refresh token é rotacionado a cada uso |
| Implementação | `auth.service.js`, `auth.middleware.js`, `roles.js`, migration 030 |
| Consumidores | Frontend (AuthContext), API (requireAuth) |
| Extensões permitidas | Novos scopes/roles |
| Extensões proibidas | Access token sem expiry, refresh sem rotação |
| Falhas | `401 Unauthorized`, token inválido/expirado |

---

## 3. Contrato: Autorização

| Atributo | Valor |
|----------|-------|
| Responsabilidade | Controlar acesso a recursos por scope/role/feature/module |
| Entrada | `req.user` (após requireAuth) |
| Saída | 403 ou `next()` |
| Invariante | Module guard com cache de 5min |
| Implementação | `auth.middleware.js`, `createModuleGuard.js`, `requirePlanFeature.js`, `requireActivePlan.js` |
| Consumidores | Todas as rotas autenticadas |
| Extensões permitidas | Novos guards via factory `createModuleGuard(slug)` |
| Extensões proibidas | Bypass de guards para rotas protegidas |
| Falhas | `403 Forbidden` com mensagem descritiva |

---

## 4. Contrato: Entitlement (Planos)

| Atributo | Valor |
|----------|-------|
| Responsabilidade | Verificar se empresa/usuário tem direito à funcionalidade |
| Entrada | `company_id`, feature key |
| Saída | `next()` ou 403 "Módulo não liberado"/"Plano inativo" |
| Invariante | Features sem vocabulário de nicho (0 ocorrências de "barber") |
| Implementação | `utils/planFeatures.js`, `company-plan.service.js` |
| Consumidores | `barber.routes.js` (11 rotas usam requirePlanFeature) |
| Extensões permitidas | Novas feature keys no planFeatures.js |
| Extensões proibidas | Feature key com nome de nicho específico |
| Falhas | 403 com mensagem, redirect frontend `/escolher-plano` |

---

## 5. Contrato: API (REST)

| Atributo | Valor |
|----------|-------|
| Responsabilidade | Interface HTTP entre frontend e backend |
| Entrada | Request JSON (limit 3mb) |
| Saída | `{ success, data/error, pagination? }` |
| Invariante | Respostas padronizadas via `shared/core/responses/` |
| Implementação | Express 5, 14 routers, controllers delegam para services |
| Consumidores | Frontend React (axios), webhooks externos |
| Extensões permitidas | Novos routers, controllers, endpoints |
| Extensões proibidas | Resposta fora do padrão `{ success, data/error }` |
| Falhas | `AppError` hierarchy → error-handler middleware |

---

## 6. Contrato: Persistência

| Atributo | Valor |
|----------|-------|
| Responsabilidade | Acesso a dados com isolamento tenant |
| Entrada | Query SQL + parâmetros |
| Saída | Result rows |
| Invariante | Queries tenant-aware filtram por `company_id` |
| Implementação | `BaseRepository.js`, `UnitOfWork`, `database.js` |
| Consumidores | 9 repositories + services com SQL direto |
| Extensões permitidas | Novos repositórios extendendo BaseRepository |
| Extensões proibidas | SQL sem `company_id` filter em tabelas tenant |
| Falhas | Erro PostgreSQL, `TenantIsolationError` |

---

## 7. Contrato: Eventos

| Atributo | Valor |
|----------|-------|
| Responsabilidade | Pub/sub intra-processo para eventos de domínio |
| Entrada | `eventName`, `payload`, `metadata` |
| Saída | Evento emitido para listeners síncronos |
| Invariante | Eventos têm `event_id`, `occurred_at`, `aggregate_type`, `aggregate_id` |
| Implementação | `event-bus.js`, `contracts.js`, `factories/` |
| Consumidores | Consumers de appointment (created, confirmed, canceled, completed, rescheduled) |
| Extensões permitidas | Novos event types + contracts |
| Extensões proibidas | Eventos sem payload validation |
| Falhas | Erro logado, consumidor falha não propaga |

---

## 8. Contrato: Outbox

| Atributo | Valor |
|----------|-------|
| Responsabilidade | Garantia de entrega eventual de mensagens |
| Entrada | INSERT em `outbox_messages` |
| Saída | Handlers processados com retry |
| Invariante | Cada handler executa no máximo 1x por mensagem |
| Implementação | `outbox-worker.js`, 15 handlers registrados |
| Consumidores | Billing, Wallet, Appointment (1-6 handlers por evento) |
| Extensões permitidas | `outboxWorker.register(eventType, handler)` |
| Extensões proibidas | Handler sem nome (handler.name obrigatório) |
| Falhas | Retry exponencial (2^tentativa s), max_retries → failed |

---

## 9. Contrato: Cache

| Atributo | Valor |
|----------|-------|
| Responsabilidade | Cache distribuído com fallback local |
| Entrada | Key, value, TTL |
| Saída | Valor em cache ou null |
| Invariante | Redis + fallback in-memory (Map, 10k max) |
| Implementação | `cache-manager.js`, `redis-client.js` |
| Consumidores | Module guard, rate limit, serviços |
| Extensões permitidas | Novas estratégias de cache |
| Extensões proibidas | Cache sem TTL |
| Falhas | Fallback in-memory (degradado, sem quebra) |

---

## 10. Contrato: Jobs

| Atributo | Valor |
|----------|-------|
| Responsabilidade | Tarefas agendadas periódicas |
| Entrada | Timer (setInterval) |
| Saída | Execução de job |
| Invariante | Jobs usam `pool` principal (sem tenant context) |
| Implementação | `server.js:443-484`, 3 jobs |
| Consumidores | Trial email, Refresh purge, Appointment reminder |
| Extensões permitidas | Novos jobs via `setInterval` |
| Extensões proibidas | Jobs sem `try/catch` e logging |
| Falhas | Erro logado, job continua no próximo ciclo |

---

## 11. Contrato: Módulos (Feature Flags)

| Atributo | Valor |
|----------|-------|
| Responsabilidade | Gating de módulos por empresa |
| Entrada | `company_id`, `module_slug` |
| Saída | `true/false` (cache + DB check) |
| Invariante | Cache de 5min |
| Implementação | `createModuleGuard.js`, `company_modules` table |
| Consumidores | `requireXxxModule` middlewares |
| Extensões permitidas | Novos module slugs |
| Extensões proibidas | Module sem guard no router |
| Falhas | 403 "Módulo não liberado" |

---

## 12. Contrato: Integrações

| Atributo | Valor |
|----------|-------|
| Responsabilidade | Conectar com serviços externos (WhatsApp, Email, Billing) |
| Entrada | Evento de domínio ou chamada direta |
| Saída | Mensagem enviada/webhook processado |
| Invariante | Provider pattern com fallback mock |
| Implementação | `IntegrationManager`, providers, consumers |
| Consumidores | BarberGestor (WhatsApp), Auth (Email), Billing |
| Extensões permitidas | Novos providers registrados |
| Extensões proibidas | Provider sem fallback mock |
| Falhas | Logged, não quebra fluxo principal |

---

## 13. POST-GATE 6

| Verificação | Status |
|-------------|--------|
| 12 contratos arquiteturais definidos | ✅ |
| Responsabilidade por contrato | ✅ |
| Entradas/saídas/invariantes | ✅ |
| Implementação atual mapeada | ✅ |
| Consumidores identificados | ✅ |
| Extensões permitidas/proibidas | ✅ |
| Falhas esperadas | ✅ |
| Nenhum arquivo operacional alterado | ✅ |
