# 01 — Mapa Vivo

> **Status:** VIVO · **Atualizado:** 2026-06-19
> **Propósito:** Responder o que é o MultGestor, seus nichos, capacidades reutilizáveis e camadas.

---

## O que é o MultGestor

Multi-tenant SaaS de gestão para pequenos negócios. Um core reutilizável (booking engine, billing, event bus, multi-tenant) que atende diferentes nichos — começando por barbearias.

- **Stack:** React 19 + Vite · Node 18 + Express 5 (CommonJS) · PostgreSQL (Supabase) · Redis 7 (fallback in-memory)
- **Deploy:** Frontend Vercel · Backend Render · Banco Supabase (sa-east-1)
- **Estado:** 🟢 Produção ativa (`barbergestor.com.br`), piloto controlado, não vendendo ativamente

---

## Nichos

| Nicho | Status | O que faz |
|---|---|---|
| BarberGestor | ✅ Completo | 16 controllers, 30 services, frontend completo, booking online |
| ClimaGestor | 🟢 Parcial (CRUD completo) | Profissionais, serviços, appointments, availability, frontend, testes |
| PetGestor | ⚪ Visão | Não iniciado |
| AutoGestor | ⚪ Visão | Não iniciado |
| AgroGestor | ⚪ Visão | Não iniciado |
| MultAcademy | ⚪ Visão | Não iniciado |
| Barber Store | ⚪ Visão | Não iniciado |

---

## Capacidades reutilizáveis (Core)

| Capacidade | Status | Reusada por |
|---|---|---|
| Multi-Tenant Engine (`company_id`) | ✅ Produção | Todos os nichos |
| Booking Engine (19 funções puras) | ✅ Produção | Barber + Clima |
| Billing (AbacatePay + Kiwify) | ✅ Produção | Todos os nichos |
| EventBus in-memory | ✅ Produção | Notificações, integrações |
| Outbox durável | ✅ Produção | 15 handlers, `failed=0` |
| Cache (Redis + fallback in-memory) | 🟡 Parcial | Produção sem Redis |
| Logger + Sentry + Métricas | ✅ Produção | Todas as rotas |
| RLS (23/27 tabelas) | 🟡 Parcial | companies + users sem policy |
| Rate Limiting | 🟡 Parcial | Depende de Redis |
| WhatsApp (Meta API) | 🟡 Parcial | Infra existe, mock ativo |
| Token Encryption (AES-256-GCM) | ✅ Produção | Integrações |

---

## Camadas técnicas e operacionais

### 1. Core (infraestrutura fundamental)
```
shared/core/        → cache, logger, errors, responses, validation
shared/core/events/ → event-bus, contracts, factories
shared/core/database/ → BaseRepository, unit-of-work (outbox)
shared/tenant/      → multi-tenant engine (company_id)
```

### 2. Domínio (lógica compartilhável)
```
shared/capabilities/booking-engine/ → scheduling-utils (19 funções puras)
shared/capabilities/billing/        → AbacatePay + Kiwify providers
```

### 3. Integração
```
integrations/whatsapp/    → Meta Cloud API (mock ativo)
integrations/config/      → encryption (AES-256-GCM)
```

### 4. Operacional
```
jobs/appointment-reminder-job.js  → lembrete de agendamento
services/trial-emails.service.js  → sequência de trial
outbox/outbox-worker.js           → processamento assíncrono de eventos
```

### 5. Vertical (nichos)
```
backend/src/controllers/  → 16 controllers (BarberGestor)
backend/src/services/     → 30 services
frontend/src/             → 33 páginas, booking flow completo
```

---

## 1-minuto: o que qualquer pessoa precisa saber

> MultGestor é um SaaS que já processa agendamentos reais de barbearia. O core é multi-tenant e reutilizável — o mesmo motor que agenda corte de cabelo pode agendar serviço de climatização. O sistema está online, backup ativo, sem dívida técnica crítica, mas ainda faltam 4 itens P1 de segurança e operação antes de vender para o primeiro cliente pagante.
