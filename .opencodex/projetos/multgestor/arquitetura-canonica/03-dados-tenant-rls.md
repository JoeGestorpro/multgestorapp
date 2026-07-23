# GATE 3 — Dados, Tenant e RLS

> **Missão 1 — Arquitetura Canônica do Core MultGestor**
> **Baseline:** `ba55065` · **Data:** 2026-07-20

## 1. Modelo de Tenant

### 1.1 Tenant = Empresa (`companies`)

O MultGestor usa **company_id** como identificador de tenant. Cada empresa é um tenant isolado.

### 1.2 Hierarquia de Dados

```
Master Admin (master_admin)
  └── Empresa/Tenant (companies) — company_id
       ├── Usuários (users)
       ├── Módulos ativos (company_modules)
       ├── Assinatura (subscriptions)
       │
       ├── BarberGestor (tb_* e barber_*)
       │   ├── Serviços (barber_services)
       │   ├── Colaboradores (barber_collaborators)
       │   ├── Agendamentos (barber_appointments)
       │   ├── Clientes (customers)
       │   ├── Vendas (barber_sales, barber_sale_items)
       │   ├── Produtos (barber_products)
       │   ├── Fornecedores (barber_suppliers)
       │   ├── Fluxo de caixa (barber_cash_sessions)
       │   ├── Adiantamentos (barber_advances)
       │   ├── Acertos (barber_settlements)
       │   ├── Horários (barber_working_hours)
       │   └── Booking (barber_booking_blocks, barber_booking_landing)
       │
       ├── Wallet/Financeiro (company_wallets, wallet_transactions, deposit_configs, topup_requests)
       ├── Pacotes (service_packages, customer_packages, package_redemptions)
       ├── Fidelidade (loyalty_programs, loyalty_balances, loyalty_transactions)
       ├── Anamnese (anamnesis_templates, anamnesis_responses)
       │
       ├── ClimaGestor (clima_*)
       └── ...
```

**Fonte:** Análise dos schemas SQL, migrations 024-028

---

## 2. Dual Pool — Postgres

| Pool | Connection String | Role | BYPASSRLS | Uso |
|------|-----------------|------|-----------|-----|
| `pool (databases)` | `DATABASE_URL` | owner/superuser | Sim | Leitura sem tenant, master, jobs agendados, migrações, health checks |
| `poolTenant` | `APP_RUNTIME_URL` | `app_runtime` | **Não** | Escritas tenant-aware, transações com `app.current_company_id` |

**Assert de segurança em startup (`server.js:501-515`):** verifica que `poolTenant` NÃO tem BYPASSRLS. Se tiver, loga erro crítico.

**Fonte:** `database.js:68-81`, `server.js:501-515`

---

## 3. Fluxo de Isolamento

```
Requisição autenticada
  ↓
auth.middleware → req.user.company_id
  ↓
requireCompany middleware (para rotas que precisam):
  ↓
1. client = await poolTenant.connect()     ← app_runtime role, NOBYPASSRLS
2. await client.query('BEGIN')
3. await client.query("SELECT set_config('app.current_company_id', <id>, true)")
4. runWithTenantClient(client, companyId, next)
5. res.on('finish/close') → COMMIT/ROLLBACK + client.release()
  ↓
Todos os queries durante a request:
  ├── Se via pool.connect() (services/UoW): cliente vem do poolTenant + GUC injectado após BEGIN
  │   → RLS policy lê app.current_company_id → filtra por company_id
  └── Se via pool.query() direto (leitura sem tenant, master, jobs):
      → pool databases (sem RLS, sem GUC)
```

**Fonte:** `requireCompany.js:11-80`, `database.js:94-177`

---

## 4. RLS Policies — Inventário

### 4.1 Tabelas com RLS (40+ tabelas)

**Migration 024** — `companies` + `users`
- `companies`: policy `tenant_self_read` (SELECT com USING id = current_company_id), `tenant_self_update` (UPDATE com WITH CHECK)
- `users`: policy `tenant_users_select` (SELECT), `tenant_users_insert` (INSERT), `tenant_users_update` (UPDATE) — todas usando `company_id = current_company_id`

**Migration 025** — 22 tabelas com WITH CHECK explícito
- `barber_services`, `barber_suppliers`, `barber_products`, `barber_collaborators`, `barber_appointments`, `barber_sales`, `barber_sale_items`, `barber_cash_sessions`, `barber_advances`, `barber_settlements`, `barber_working_hours`
- `barber_booking_blocks`, `barber_booking_landing`
- `customer_profiles`, `collaborator_profiles`, `collaborator_permissions`
- `booking_landing_gallery`, `branding_settings`, `settings`
- `collaborator_commissions`, `commissions_rules`
- `customers` (policies extras: `customers_select_own`, `customers_update_own`)

**Migration 026** — Cria role `app_runtime` (NOBYPASSRLS) + grants

**Migration 027** — `company_modules` (tenant_isolation) + `modules` (SELECT true para catálogo)

**Migration 028** — `subscriptions` (tenant_isolation)

**Fase 2 (não registrada como migration)** — Wallet/Pacotes/Fidelidade/Anamnese
- `company_wallets`, `wallet_transactions`, `deposit_configs`, `topup_requests`
- `service_packages`, `customer_packages`, `package_redemptions`
- `loyalty_programs`, `loyalty_balances`, `loyalty_transactions`
- `anamnesis_templates`, `anamnesis_responses`

🔴 **Débito conhecido:** Fase 2 usa padrão antigo (sem NULLIF, sem WITH CHECK). Não registrada em `run-migrations.js`. Requer harmonização.

### 4.2 Mecanismo RLS

Todas as policies usam:
```sql
USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid)
```
O GUC `app.current_company_id` é setado transaction-local via `requireCompany` middleware. O `NULLIF` trata string vazia como NULL, fazendo a policy rejeitar todos os registros (default DENY).

### 4.3 Bypasses Conhecidos

| Bypass | Contexto | Mitigação |
|--------|----------|-----------|
| `pool.query()` direto | Master admin, jobs, migrações | Intencional — pool usa role com BYPASSRLS |
| `pool.connect()` sem companyId | `requireCompany` não chamado | Intencional — serviços privilegiados |
| Testes sem `app_runtime` | CI local | Usa `DATABASE_URL` diretamente |
| `APP_RUNTIME_URL` não configurada | Local/dev | Warning em startup — RLS permanece inerte |

**Fonte:** Todas as migrações RLS + `database.js` + `requireCompany.js`

---

## 5. Autenticação vs Autorização

### 5.1 Três sistemas de auth coexistem

| Sistema | Escopo | Token | Persistência |
|---------|--------|-------|-------------|
| Backoffice (Master) | `master` | JWT 15min + Refresh 7d | HttpOnly cookie |
| Backoffice (Tenant) | `barber_admin` | JWT 15min + Refresh 7d | HttpOnly cookie |
| Booking Customer | `booking_customer` | JWT 15min + Refresh 7d | HttpOnly cookie separado |

### 5.2 Scopes e Roles

```
Roles:
  BARBER_ADMIN_ROLES = ['admin', 'owner', 'collaborator']
  BOOKING_CUSTOMER_ROLES = ['client', 'booking_customer']
  MASTER_ROLES = ['master_admin']

Auth Scopes (derivados das roles):
  master       → MasterAdminAuth
  barber_admin → BarberAdminAuth (alias: TenantAdminAuth)
  booking_customer → BookingCustomerAuth
```

**Fonte:** `roles.js:1-28`, `auth.middleware.js:80-148`

---

## 6. Proteção de Rotas (Gating)

### 6.1 Stack de Middleware por Rota

| Tipo | Middlewares |
|------|-----------|
| **Pública** | (nenhum) |
| **Master** | `requireAuth` → `requireMasterAdminAuth` |
| **Barber** | `requireAuth` → `requireBarberAdminAuth` → `requireCompany` → `requireBarberModule` |
| **Barber+Plan** | + `[requireActivePlan]` + `[requirePlanFeature]` |
| **Clima** | `requireAuth` → `requireTenantAdminAuth` → `requireCompany` → `requireClimaModule` |
| **Client** | `requireAuth` → `requireBarberAdminAuth` → `requireCompany` |

### 6.2 Module Guard

```
createModuleGuard(slug):
  1. Cache: get(`mg:module:${companyId}:${slug}`) — TTL 5min
  2. Se cache miss:
     SELECT FROM company_modules JOIN modules
     WHERE company_id = $1 AND slug = $2 AND status = 'active' AND is_active = true
  3. Cache.set(result)
  4. Se não ativo: 403 "Módulo não liberado"
```

**Fonte:** `createModuleGuard.js:1-80`

### 6.3 Plan Feature Guard

```
requirePlanFeature(featureKey):
  → company-plan.service.js verifica se plano atual tem a feature
  → Features: collaborators, advanced_reports, financial_dashboard,
    extra_permissions, advanced_schedule, future_modules
  → 0 ocorrências de "barber" nas chaves de feature
```

**Fonte:** `utils/planFeatures.js`, `requirePlanFeature.js`

---

## 7. Caminhos Públicos e Anônimos

| Prefixo | Acesso | Proteção |
|---------|--------|----------|
| `GET /api/health` | Público | Nenhuma |
| `GET /api/health/deep` | Público | Nenhuma (não expõe dados sensíveis) |
| `POST /api/auth/*` | Público (register, login, refresh, forgot/reset password) | Rate limit |
| `POST /api/public/auth/*` | Público (customer auth) | Rate limit |
| `POST /api/booking-auth/*` | Público (booking login/refresh) | Rate limit |
| `GET /api/barber/public/:slug/*` | Público (booking info, available slots) | Rate limit (60/15min IP, 30/h slug) |
| `POST /api/barber/public/:slug/*` | Público (create appointment) | Rate limit (10/15min IP, 30/h slug) |
| `POST /api/webhooks/*` | Público (WhatsApp) | Verificação de assinatura (Meta) |

**Fonte:** `server.js:226-390`, `barber.routes.js:46-74`

---

## 8. Sessão e Refresh Token

### 8.1 Backoffice

```
POST /auth/login
  → auth.service.js: bcrypt verify
  → JWT (access_token, expiresIn: 15min) em memória
  → Refresh token armazenado em refresh_tokens table
  → HttpOnly cookie (secure, sameSite=strict) com refresh_token
  → Response: { access_token, user, company, modules }

POST /auth/refresh
  → Cookie → verify refresh token (jti, user_id, company_id)
  → Rotaciona: revoga old token (revoked_at), emite novo
  → Novo access_token na resposta

POST /auth/logout
  → Revoga refresh token no DB
  → Limpa cookie

RefreshTokenPurgeJob (24h):
  → Limpa tokens expirados + revogados há mais de 30 dias
```

### 8.2 Booking Customer

```
POST /booking-auth/refresh
  → Cookie separado (booking_refresh_token)
  → Mesmo padrão de rotação
```

**Fonte:** `auth.service.js`, `20260702_030_refresh_tokens.sql`, `server.js`

---

## 9. Transações

### 9.1 Unit of Work

```
createUnitOfWork(db):
  1. client = await db.connect()          ← poolTenant para tenant context
  2. await client.query('BEGIN')
  3. Seta GUC app.current_company_id
  4. Retorna { client, commit, rollback }
```

### 9.2 requireCompany (middleware transacional)

Cada request autenticada + tenant-aware abre:
1. Conexão `poolTenant`
2. `BEGIN`
3. `SET app.current_company_id`
4. Toda a cadeia controller → service → repository usa este client
5. `res.on('finish')` → COMMIT; `res.on('error')` → ROLLBACK
6. `client.release()` devolve ao pool

**Fonte:** `unit-of-work.js`, `requireCompany.js`

---

## 10. Situação Local vs Produção

| Aspecto | Local (.env) | Produção (Render) | Gap |
|---------|-------------|-------------------|-----|
| `DATABASE_URL` | ✅ Configurado | ✅ Supabase PostgreSQL 16 | — |
| `APP_RUNTIME_URL` | ⚠️ Frequentemente DATABASE_URL | ✅ Deve ser app_runtime (NOBYPASSRLS) | Local pode ter RLS inerte |
| Redis | ⚠️ Nem sempre configurado | ❌ **Não configurado** (fallback in-memory) | 🔴 Cache e rate limit locais à instância |
| Rate limit | In-memory | In-memory (fallback) | 🔴 Sem Redis = sem rate limit compartilhado |
| Migrations | ✅ Via `npm run migrate` | ✅ Via Render buildCommand | — |
| Sentry | Se configurado | ✅ Se VITE_SENTRY_DSN setado | — |

**Fonte:** Health check produção, `.env.example`, `server.js:236-262`

---

## 11. Débitos Conhecidos

| ID | Débito | Gravidade |
|----|--------|-----------|
| DADOS-001 | Fase 2 RLS (wallet/packages/loyalty/anamnesis) não registrada em run-migrations.js | Média |
| DADOS-002 | Fase 2 RLS usa padrão antigo (sem NULLIF, sem WITH CHECK) | Baixa (funcional, mas não padronizado) |
| DADOS-003 | Redis não configurado em produção → rate limit in-memory local | Alta |
| DADOS-004 | APP_RUNTIME_URL sem configuração → RLS inerte localmente | Média |
| DADOS-005 | Dual pool: queries via pool.direct (não poolTenant) bypassam RLS | Baixa (intencional para master/jobs) |

---

## 12. POST-GATE 3

| Verificação | Status |
|-------------|--------|
| Modelo de tenant | ✅ Documentado (company_id) |
| Hierarquia de dados | ✅ Mapeada por módulo |
| Dual pool | ✅ Documentado (databases + app_runtime) |
| Fluxo de isolamento | ✅ BEGIN + GUC + COMMIT/ROLLBACK |
| RLS policies | ✅ 40+ tabelas, 5 migrações, Fase 2 pendente |
| Bypasses conhecidos | ✅ 4 cenários documentados |
| Auth vs Autorização | ✅ 3 scopes, roles, guards |
| Module guard | ✅ Factory com cache de 5min |
| Plan feature guard | ✅ Features genéricas (0 barber) |
| Caminhos públicos | ✅ 7 grupos com rate limit |
| Refresh token | ✅ Rotação implementada |
| Transações | ✅ Unit of Work + requireCompany |
| Local vs Produção | ✅ 6 gaps documentados |
| Débitos | ✅ 5 débitos registrados |
| Nenhum arquivo operacional alterado | ✅ |
| Nenhum código/migration/CI/deploy alterado | ✅ |
