# 🧩 CAPABILITIES MAP — MultGestor Core

> **Status:** OFICIAL • VIVO · **Atualizado:** 2026-06-07
> **Origem:** `docs/capabilities-map.md` (v1.0, OURO) — **Status: Consolidado + Atualizado** com capabilities reais de 06-05→06-07.
> Capability = bloco de infra/domínio reutilizável por qualquer vertical, com contrato, dono e teste isolável.

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
| Booking Engine | `shared/capabilities/booking-engine/` (scheduling-utils, 19 funções puras) | ✅ Produção (reusado por Barber + Clima) |
| Billing / Planos / Assinaturas | `shared/capabilities/billing/` (providers: AbacatePay, Kiwify) | ✅ Produção |
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
| BarberGestor | ✅ Completo |
| ClimaGestor | 🟡 Scaffold + agendamento |

## Gaps / capabilities aspiracionais (documentadas, NÃO implementadas)
- Automation Engine, AI Operational Layer, N8N Bridge, Omnichannel — descritas em `docs/` e `.agent/runtime/` mas **não executadas**. Não tratar como reais (ver `lessons-learned`).
