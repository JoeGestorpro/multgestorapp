# 🧩 CAPABILITIES MAP — MultGestor Core

> **Status:** 🟡 **RESUMO — NÃO É MAIS A FONTE FACTUAL** · **Atualizado:** 2026-07-03 · **Revisado:** 2026-07-16
> **Fonte factual do estado do Core:** [[matriz-consolidacao-core]] (missão 12.1A, ancorada em `4c8ce847`).
> Em conflito sobre **estado de capacidade**, a matriz prevalece. Este documento permanece como mapa conceitual.
> Capability = bloco de infra/domínio reutilizável por qualquer vertical, com contrato, dono e teste isolável.

---

## ⚠️ 4 divergências factuais confirmadas em 2026-07-16 — leia antes de usar

A auditoria READ_ONLY 12.1A verificou este documento contra o código em `4c8ce847` e encontrou **quatro afirmações factualmente incorretas**. Correções abaixo; detalhe e proveniência no ANEXO E da matriz.

| # | Este doc afirma | Fato verificado (2026-07-16) |
|---|---|---|
| **D-02** | RLS "ENABLE, **inerte em runtime**; runtime usa role com BYPASSRLS" | ❌ **Falso.** RLS **ativa**. `tenantAwareConnect` (`config/database.js:129`) roteia writes com contexto tenant para `poolTenant` (`app_runtime`, **NOBYPASSRLS**); GUC transaction-local em `requireCompany.js:44-54`. CI cria a role real NOBYPASSRLS e roda `tenant-isolation-rls.test.js`. Fechado em `02c5396` (2026-07-02) — **um dia antes deste documento**. |
| **D-03** | "RLS 23/27 tabelas — `companies` e `users` sem policy" | ❌ **Falso nos dois números e na exceção.** **40 tabelas** com `CREATE POLICY` nas migrations; `companies` e `users` **têm** policy desde a migration 024 (2026-06-24). ⚠️ 40 também **não é** o número de produção — ver limitação L-4 da matriz. |
| **D-04** | "gating de plano ainda com vocabulário do barber" | ❌ **Falso.** `utils/planFeatures.js` usa chaves genéricas (`collaborators`, `advanced_reports`, `financial_dashboard`, `extra_permissions`, `advanced_schedule`, `future_modules`). `shared/capabilities/billing/` → **0** ocorrências de `barber`; `company-plan.service.js` → **0**. |
| **D-01** | ClimaGestor: "`clima.routes.js` usa `requireBarberAdminAuth` **por engano**" | 🟡 **Impreciso.** Usa `requireTenantAdminAuth` desde `ae31b65`. Mas o alias **é** `requireBarberAdminAuth` (`auth.middleware.js:128`) — acoplamento **deliberado e documentado no código**, não engano. Reclassificado de bug de autorização para **débito P2**. |

**✅ O que resistiu à verificação:** o achado **A7** (Booking Engine services não compartilhados) foi **confirmado com precisão** — 59 ocorrências de `barber_` em `booking-appointments.service.js` e 32 em `booking-scheduling.service.js`. É o achado crítico real deste documento.

### D-08 — Redis não está configurado em produção · adicionada em 2026-07-16 (OPS-MIGRATIONS-01)

| | |
|---|---|
| **Este doc afirmava** | Cache: *"✅ Produção — Redis + fallback in-memory"* · Rate Limiting: *"`rate-limit.middleware.js` (**Redis**, fail-open) — ✅ Produção"* |
| **Fato observado em produção** | `GET https://multgestor-backend.onrender.com/api/health/deep` (2026-07-16T19:48:25Z, HTTP 200) → `"redis":{"status":"degraded","message":"Redis nao configurado — fallback in-memory ativo"}` |
| **Classificação** | Implementação: **EXISTE PARCIALMENTE** · Evidência: **COMPROVADO EM PRODUÇÃO** para o fallback in-memory · **Redis gerenciado em produção: NÃO CONFIGURADO** |
| **Por que importa** | **Fallback não equivale a Redis ativo.** Cache e rate limit ficam **locais à instância**; o estado é **perdido em cold start ou restart** (o free tier hiberna — cold start de 33s observado); com **múltiplas instâncias**, limites e cache **podem não ser compartilhados**. Toda análise de abuso (regra R-003) deve assumir isso. |
| **Limitação** | A **configuração do painel do Render permanece NÃO VERIFICADA** — a ausência de Redis é comprovada **pelo comportamento do runtime**, não pela config. |
| **Corrobora** | `ADR-002-render` já registrava *"Redis ausente"* como risco aberto — ou seja, **este documento estava mais otimista que o próprio ADR**. |
| **Decisão** | **SUBSTITUIR** as duas linhas. ⛔ **Nenhuma correção executada** — configurar Redis, alterar Render/variáveis/rate limit não foi autorizado e não foi feito. |

> **Padrão:** as divergências D-02/03/04 são **pessimistas** — este documento declara quebrado o que já funciona, e subestima a segurança do próprio produto. Não descontar por viés; verificar por comando.

**Core Completion Index:** ~63/100 (recalculado via Gate 4 — 40 módulos, 21 LOCALMENTE, 14 REMOTAMENTE, 5 NÃO_APLICAVEL). Matriz abaixo substitui as tabelas anteriores como fonte factual.

---

## Matriz de 40 Capacidades (Gate 4 · 2026-07-20)

### Resumo

| Localização | Quantidade | Critério |
|---|---|---|
| **LOCALMENTE** | 21 | Código neste repositório, com ou sem testes; sem dependência externa obrigatória |
| **REMOTAMENTE** | 14 | Depende de serviço externo (SaaS, API, cloud) ou implementação parcial/incompleta |
| **NÃO_APLICAVEL** | 5 | Ausente, futuro, ou sem evidência suficiente para classificar |
| **Total** | **40** | |

### Core — Infraestrutura Fundamental

| ID | Capacidade | Domínio | Estado Gate 4 | Localização | Fonte |
|---|---|---|---|---|---|
| C-01 | Multi-tenancy RLS | INFRA | CONSOLIDADO_LOCALMENTE | LOCALMENTE | 10 SQL RLS + middleware `tenantAwareConnect` |
| C-02 | Auth JWT + Refresh Token | INFRA | CONSOLIDADO_LOCALMENTE | LOCALMENTE | `auth.service.js`, migration v030 |
| C-03 | 3 escopos de autenticação | INFRA | CONSOLIDADO_LOCALMENTE | LOCALMENTE | `authScopes`, 6 guards |
| C-04 | Migrations versionadas | INFRA | CONSOLIDADO | REMOTAMENTE | 37 SQL + runner + `schema_migrations` |
| C-06 | Health checks | INFRA | CONSOLIDADO | REMOTAMENTE | `/api/health` + `/api/health/deep` |
| C-19 | Sentry (error tracking) | INFRA | CONSOLIDADO_LOCALMENTE | LOCALMENTE | `@sentry/*` |
| C-32 | Redis / cache distribuído | INFRA | DESCONHECIDO | NÃO_APLICAVEL | Fallback no-op; sem confirmação de produção |
| C-33 | Rate limiting | INFRA | PARCIAL | REMOTAMENTE | Middleware existe, Redis ausente → in-memory |

### Core — Shared Kernel (Governança)

| ID | Capacidade | Domínio | Estado Gate 4 | Localização | Fonte |
|---|---|---|---|---|---|
| C-07 | Error kernel (AppError) | GOV | CONSOLIDADO_LOCALMENTE | LOCALMENTE | 10 tipos de erro + middleware |
| C-08 | Validation kernel (Zod) | GOV | CONSOLIDADO_LOCALMENTE | LOCALMENTE | Zod schemas + `validateRequest` |
| C-09 | Logging kernel (Pino) | GOV | CONSOLIDADO_LOCALMENTE | LOCALMENTE | Pino + request-logger |
| C-10 | Outbox (eventos duráveis) | GOV | CONSOLIDADO | REMOTAMENTE | `outbox-worker.js`, 15 handlers |
| C-11 | Event bus (in-memory) | GOV | CONSOLIDADO_LOCALMENTE | LOCALMENTE | `event-bus.js`, `contracts.js`, `factories/` |
| C-12 | Plan gating / feature guards | GOV | CONSOLIDADO_LOCALMENTE | LOCALMENTE | `requirePlanFeature`, `planFeatures.js` |
| C-34 | columnExists (shared util) | GOV | PARCIAL | REMOTAMENTE | Util compartilhado; performance issue (11 queries/request) |
| C-35 | Métricas / dashboard | GOV | PARCIAL | REMOTAMENTE | Incompleto; sem dashboard de métricas |
| C-36 | Testes automatizados (backend) | GOV | PARCIAL | REMOTAMENTE | Cobertura insuficiente |

### Core — Domínio Compartilhável

| ID | Capacidade | Domínio | Estado Gate 4 | Localização | Fonte |
|---|---|---|---|---|---|
| C-13 | Billing engine (assinaturas) | CORE | CONSOLIDADO_LOCALMENTE | LOCALMENTE | Registry + Kiwify + AbacatePay |
| C-14 | Booking engine (completo) | CORE | PARCIAL | REMOTAMENTE | VIEW acoplada ao BarberGestor |
| C-15 | Repository pattern | CORE | CONSOLIDADO_LOCALMENTE | LOCALMENTE | 10 repos, `BaseRepository.js`, `UnitOfWork` |

### BarberGestor (Vertical 1)

| ID | Capacidade | Domínio | Estado Gate 4 | Localização | Fonte |
|---|---|---|---|---|---|
| C-16 | CRUD completo (226 endpoints) | BARBER | CONSOLIDADO_LOCALMENTE | LOCALMENTE | 50 services, 226 endpoints |
| C-17 | WhatsApp | BARBER | PARCIAL | REMOTAMENTE | Real send pendente; mock ativo |
| C-18 | Master admin (44 endpoints) | BARBER | CONSOLIDADO_LOCALMENTE | LOCALMENTE | Painel administrativo |
| C-20 | Email (3 providers) | BARBER | CONSOLIDADO_LOCALMENTE | LOCALMENTE | Resend + SMTP + Mock |
| C-21 | Premium UI (32+ componentes) | BARBER | CONSOLIDADO_LOCALMENTE | LOCALMENTE | Frontend React |
| C-22 | Landing page (12 seções) | BARBER | CONSOLIDADO_LOCALMENTE | LOCALMENTE | Booking landing pages |
| C-23 | Design system (shell, tokens) | BARBER | CONSOLIDADO_LOCALMENTE | LOCALMENTE | Tokens + componentes atômicos |
| C-24 | Mobile (BottomNav, FAB) | BARBER | CONSOLIDADO_LOCALMENTE | LOCALMENTE | Suporte PWA mobile |
| C-25 | Onboarding (SetupWizard) | BARBER | CONSOLIDADO_LOCALMENTE | LOCALMENTE | Wizard de configuração |
| C-26 | Badge system | BARBER | CONSOLIDADO_LOCALMENTE | LOCALMENTE | Sistema de conquistas |
| C-28 | God service (barber.service.js) | BARBER | PARCIAL | REMOTAMENTE | ~6500 linhas, decomposição pendente |

### ClimaGestor (Vertical 2)

| ID | Capacidade | Domínio | Estado Gate 4 | Localização | Fonte |
|---|---|---|---|---|---|
| C-29 | ClimaGestor (scaffold) | NICHO | PARCIAL | REMOTAMENTE | Backend ~50%, frontend ~1% |

### Integração e Deploy

| ID | Capacidade | Domínio | Estado Gate 4 | Localização | Fonte |
|---|---|---|---|---|---|
| C-05 | CI/CD pipeline | DEPLOY | CONSOLIDADO | REMOTAMENTE | `ci.yml` + `deploy.yml` (GitHub Actions) |
| C-27 | Backup system | DEPLOY | CONSOLIDADO_LOCALMENTE | LOCALMENTE | `ops/backup/` |
| C-31 | Integration Layer | FUTURO | PARCIAL | REMOTAMENTE | Providers pendentes |

### Futuro / Ausente

| ID | Capacidade | Domínio | Estado Gate 4 | Localização | Fonte |
|---|---|---|---|---|---|
| C-30 | AI / LLM Provider | FUTURO | EM_EXPERIMENTO | REMOTAMENTE | Apenas MockProvider |
| C-37 | Testes frontend | GOV | AUSENTE | NÃO_APLICAVEL | 2 arquivos apenas |
| C-38 | Automation Engine | FUTURO | AUSENTE | NÃO_APLICAVEL | Nenhum código |
| C-39 | Omnichannel Layer | FUTURO | AUSENTE | NÃO_APLICAVEL | Nenhum código |
| C-40 | Novos nichos (Odonto, Pet, etc.) | FUTURO | AUSENTE | NÃO_APLICAVEL | Apenas scaffold Clima |

---
## Gaps / capabilities aspiracionais (documentadas, NÃO implementadas)
- Automation Engine, AI Operational Layer, N8N Bridge, Omnichannel — descritas em `docs/` e `.agent/runtime/` mas **não executadas**. Não tratar como reais (ver `lessons-learned`).
