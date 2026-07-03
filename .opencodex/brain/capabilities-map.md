# 🧩 CAPABILITIES MAP — MultGestor Core

> **Status:** OFICIAL • VIVO · **Atualizado:** 2026-07-03
> **Origem:** `docs/capabilities-map.md` (v1.0, OURO) — **Status: Consolidado + Atualizado** com capabilities reais de 06-05→06-07.
> Capability = bloco de infra/domínio reutilizável por qualquer vertical, com contrato, dono e teste isolável.
> **Correção pós-auditoria 2026-07-03:** ver [[../../audits/2026-07-03-core-vs-nicho-audit]] —
> Core Completion Index **52/100**. Linha "Booking Engine" abaixo estava superestimada (corrigida).

## Core (infraestrutura fundamental)
| Capability | Onde | Status | Notas |
|---|---|---|---|
| Multi-Tenant Engine | `company_id` em toda query; `shared/tenant/` | ✅ Produção | Defesa em profundidade: app + RLS |
| RLS (Row-Level Security) | `database/rls_tenant_tables.sql` | 🟡 ENABLE, **inerte em runtime** | Runtime usa role com BYPASSRLS; Fase 1 CI-only feita (`app_runtime`). Ver ADR-RLS |
| Event Bus (in-memory) | `shared/core/events/event-bus.js` | ✅ Produção | Volátil; usado p/ notificações (WhatsApp) |
| Outbox (durável) | `shared/core/database/unit-of-work.js` + `outbox/outbox-worker.js` | ✅ Produção | Transacional; evento sem handler = no-op (F6) |
| Event Contracts + Factory | `shared/core/events/contracts.js` + `factories/appointment-events.js` | ✅ Produção (local) | `validateEventPayload` + factory obrigatórios (regra EVENT CONTRACTS) |
| Cache | `shared/core/cache/` (redis-client + cache-manager) | ✅ Produção | Redis + fallback in-memory |
| Logger / Observabilidade | `shared/core/logger/` (pino) + Sentry + métricas | ✅ Produção | Correlation ID por request |
| Errors / Responses / Validation | `shared/core/{errors,responses,validation}/` | ✅ Produção | AppError hierarchy + Zod schemas |
| BaseRepository | `shared/core/database/BaseRepository.js` | ✅ Produção | ⚠️ interpola nomes de coluna — exige allowlist no caller |

## Domínio (lógica compartilhável)
| Capability | Onde | Status |
|---|---|---|
| Booking Engine (utils puras) | `shared/capabilities/booking-engine/` (scheduling-utils, 19 funções puras) | ✅ Produção — reusado por Barber + Clima |
| Booking Engine (services com estado) | `services/booking-appointments.service.js`, `booking-scheduling.service.js` | 🔴 **Não é compartilhado de fato** — 59+ ocorrências de `barber_*` hardcoded; Clima reimplementa o próprio motor contra `clima_professionals`/`clima_services`. Ver auditoria 2026-07-03, achado A7. |
| Billing / Planos / Assinaturas | `shared/capabilities/billing/` (providers: AbacatePay, Kiwify) | ✅ Produção (técnico); gating de plano ainda com vocabulário do barber |
| Rate Limiting | `middlewares/rate-limit.middleware.js` (Redis, fail-open) | ✅ Produção |

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
| ClimaGestor | 🔴 Scaffold com bug de arquitetura — backend ~50% (schema+rotas+service existem, mas `clima.routes.js` usa `requireBarberAdminAuth` por engano) / frontend ~1% (`Clima.jsx` é stub de 7 linhas); nenhuma empresa real usando. Ver auditoria 2026-07-03. |

## Gaps / capabilities aspiracionais (documentadas, NÃO implementadas)
- Automation Engine, AI Operational Layer, N8N Bridge, Omnichannel — descritas em `docs/` e `.agent/runtime/` mas **não executadas**. Não tratar como reais (ver `lessons-learned`).
