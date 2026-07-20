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

**Core Completion Index 52/100** (auditoria [[../../audits/2026-07-03-core-vs-nicho-audit]]) — ⚠️ métrica **não recalculada** pela 12.1A; D-02/03/04 sugerem que estava subestimada.

## Core (infraestrutura fundamental)
| Capability | Onde | Status | Notas |
|---|---|---|---|
| Multi-Tenant Engine | `company_id` em toda query; `shared/tenant/` | ✅ Produção | Defesa em profundidade: app + RLS |
| RLS (Row-Level Security) | `database/*.sql` + `config/database.js:129` | ✅ **Ativa em runtime** (VALIDADO EM CI) | ~~inerte; BYPASSRLS~~ **corrigido D-02**: `tenantAwareConnect` → `poolTenant` (`app_runtime`, NOBYPASSRLS). 40 tabelas com policy (D-03). Cobertura em **prod não verificada** → [[matriz-consolidacao-core]] `TENANT-002`/`TENANT-003` |
| Event Bus (in-memory) | `shared/core/events/event-bus.js` | ✅ Produção | Volátil; usado p/ notificações (WhatsApp) |
| Outbox (durável) | `shared/core/database/unit-of-work.js` + `outbox/outbox-worker.js` | ✅ Produção | Transacional; evento sem handler = no-op (F6) |
| Event Contracts + Factory | `shared/core/events/contracts.js` + `factories/appointment-events.js` | ✅ Produção (local) | `validateEventPayload` + factory obrigatórios (regra EVENT CONTRACTS) |
| Cache | `shared/core/cache/` (redis-client + cache-manager) | 🟡 **EXISTE PARCIALMENTE** — fallback in-memory **COMPROVADO EM PRODUÇÃO**; **Redis gerenciado: NÃO CONFIGURADO** | ~~Redis + fallback in-memory~~ **corrigido D-08 (2026-07-16)**: prod respondeu `"Redis nao configurado — fallback in-memory ativo"`. **Fallback ≠ Redis ativo**: cache local à instância, perdido em cold start/restart; em múltiplas instâncias, **não compartilhado**. Config do painel do Render **não verificada**. Ver [[matriz-consolidacao-core]] e [[../../auditorias/multgestor/2026-07-16-ops-migrations-01]] |
| Logger / Observabilidade | `shared/core/logger/` (pino) + Sentry + métricas | ✅ Produção | Correlation ID por request |
| Errors / Responses / Validation | `shared/core/{errors,responses,validation}/` | ✅ Produção | AppError hierarchy + Zod schemas |
| BaseRepository | `shared/core/database/BaseRepository.js` | ✅ Produção | ⚠️ interpola nomes de coluna — exige allowlist no caller |

## Domínio (lógica compartilhável)
| Capability | Onde | Status |
|---|---|---|
| Booking Engine (utils puras) | `shared/capabilities/booking-engine/` (scheduling-utils, 19 funções puras) | ✅ Produção — reusado por Barber + Clima |
| Booking Engine (services com estado) | `services/booking-appointments.service.js`, `booking-scheduling.service.js` | 🔴 **Não é compartilhado de fato** — 59+ ocorrências de `barber_*` hardcoded; Clima reimplementa o próprio motor contra `clima_professionals`/`clima_services`. Ver auditoria 2026-07-03, achado A7. |
| Billing / Planos / Assinaturas | `shared/capabilities/billing/` (providers: AbacatePay, Kiwify) | ✅ Técnico (VALIDADO LOCAL); ~~gating com vocabulário do barber~~ **corrigido D-04: gating já é genérico** (`utils/planFeatures.js`). Falta **prova em produção** → `BILLING-001` |
| Rate Limiting | `middlewares/rate-limit.middleware.js` (fail-open) | 🟡 **EXISTE PARCIALMENTE** — ~~(Redis, fail-open)~~ **corrigido D-08**: em produção **não há Redis** → o limite opera **in-memory, local à instância** (`:32` "degradado para memória"), é **perdido a cada cold start** e **não é compartilhado entre instâncias**. `fail-open` em erro inesperado (`:52`). Comportamento em prod **COMPROVADO** quanto à ausência de Redis; eficácia do limite **não medida** |

## Integração
| Capability | Onde | Status |
|---|---|---|
| Integration Layer / Channel Adapter | `integrations/` | ✅ Produção |
| WhatsApp (Meta Cloud API + resolver per-tenant) | `integrations/whatsapp/` + `consumers/appointment-integration.consumer.js` | ✅ Produção |
| Token Encryption (AES-256-GCM) | `integrations/config/encryption.js` | ✅ Produção |

## Operacional
| Capability | Onde | Status |
|---|---|---|
| Appointment Reminder Job | `jobs/appointment-reminder-job.js` | ✅ Produção (mark-before-emit idempotente) |
| Trial Email Sequence | `services/trial-emails.service.js` + job | ✅ Produção |

## Verticais
| Módulo | Status |
|---|---|
| BarberGestor | ✅ Completo (backend refatorado, frontend ~4.990 linhas em Barber.jsx) |
| ClimaGestor | 🔴 Scaffold — backend ~50% (schema+rotas+service; 3 tabelas com RLS) / frontend ~1% (`Clima.jsx` = 7 linhas, **confirmado**); nenhuma empresa real usando (não verificado). ~~usa `requireBarberAdminAuth` por engano~~ **corrigido D-01**: usa `requireTenantAdminAuth`, que é **alias** da função barber — acoplamento deliberado e documentado, não bug. Problema real = reimplementa o motor de booking → [[matriz-consolidacao-core]] `NICHEKIT-002` |

## Gaps / capabilities aspiracionais (documentadas, NÃO implementadas)
- Automation Engine, AI Operational Layer, N8N Bridge, Omnichannel — descritas em `docs/` e `.agent/runtime/` mas **não executadas**. Não tratar como reais (ver `lessons-learned`).
