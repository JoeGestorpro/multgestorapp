# Dependency Map — MultGestor

> **Status:** OFICIAL • VIVO
> **Atualizado:** 2026-06-24
> **Propósito:** Mapa completo de dependências entre camadas, componentes e serviços.

---

## Visão Geral

```
Usuário (Browser/Cliente)
    │
    ▼
┌──────────────────────────────┐
│        Frontend              │
│   React 19 + Vite (Vercel)  │
└──────────────┬───────────────┘
               │ HTTPS
               ▼
┌──────────────────────────────┐
│         API Layer            │
│  Express 5 + Middlewares     │
│  Auth · Rate Limit · CORS   │
│  Helmet · Logger · Sentry   │
└──────────────┬───────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│ Application  │ │  Integration │
│ Services     │ │  Layer       │
│ (30 services)│ │  WhatsApp    │
└──────┬───────┘ │  Billing     │
       │         └──────────────┘
       ▼
┌──────────────────────────────┐
│        Database Layer        │
│  PostgreSQL (Supabase)       │
│  pg.Pool · RLS · Outbox     │
│  Migrations SQL              │
└──────┬───────┬───────┬───────┘
       │       │       │
       ▼       ▼       ▼
┌──────────┐ ┌──────┐ ┌──────────┐
│  Cache   │ │Queue │ │ Workers  │
│  Redis   │ │Outbox│ │ Jobs     │
│ (memória)│ │Worker│ │Reminder  │
└──────────┘ └──────┘ └──────────┘
       │
       ▼
┌──────────────────────────────┐
│         Storage              │
│   Backblaze B2 (Backup)      │
│   Local Disk (Dump)          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          Infra               │
│   Render (Backend)           │
│   Vercel (Frontend)          │
│   Supabase (DB)              │
│   GitHub Actions (CI)        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      Deploy Pipeline         │
│  CI → Test → Migrate → CD   │
│  GitHub Actions → Render     │
│  GitHub Actions → Vercel     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     Monitoramento            │
│  Sentry · Pino · Health API │
│  Outbox Dashboard            │
└──────────────────────────────┘
```

---

## Dependências por Camada

### Frontend → API
- **Todas as chamadas** passam pelo backend (Express 5)
- Autenticação via JWT (HttpOnly cookie)
- Middleware de rate limit (fail-open)
- Sem dependência direta com banco

### API → Services
- **Controllers** chamam **Services** (30 services)
- Services contêm regras de negócio
- EventBus para eventos in-memory
- UnitOfWork para eventos duráveis (outbox)

### Services → Database
- **pg.Pool** direto (sem ORM)
- BaseRepository com queries SQL
- RLS como defesa em profundidade
- Outbox table para eventos duráveis

### Database → Workers
- **OutboxWorker** processa eventos pendentes
- **AppointmentReminderJob** envia lembretes
- **TrialEmailJob** sequência de trial

### Workers → Integrations
- WhatsApp (Meta Cloud API)
- Billing (AbacatePay, Kiwify)
- Email (Resend)

### Database → Storage (Backup)
- pg_dump diário → arquivo local
- Cópia externa → Backblaze B2
- Rotação: 7 dias de retenção

### Infra → Deploy
- GitHub Actions: CI + CD
- Render: backend deploy
- Vercel: frontend deploy
- Supabase: database

### Deploy → Monitoramento
- Sentry: erro tracking
- Pino: logging estruturado
- Health check: `/api/health/deep`

---

## Dependências Críticas

| Dependência | Risco | Mitigação |
|---|---|---|
| Frontend → API | API fora do ar → frontend inútil | Health check, alertas |
| API → Database | DB fora do ar → API 500 | Pooler Supabase, failover |
| Cache (Redis) | Sem Redis → rate limit volátil | Fallback in-memory |
| Outbox → Workers | Worker parado → eventos acumulam | `failed=0` monitorado |
| Backup → Storage | Storage cheio → backup falha | Alerta (A-018 pendente) |

---

## Dependências por Nicho

```
BarberGestor → Agenda → Booking Engine → DB
             → Clientes → CRM → DB
             → Financeiro → Caixa → DB
             → Notificações → WhatsApp → API

ClimaGestor → Agenda → Booking Engine → DB
            → Clientes → CRM → DB
            → Financeiro → Caixa → DB
```

---

## Relacionamentos

- [[00-HOME]] — Homepage
- [[technical/README]] — Technical Brain
- [[technical/arquitetura]] — Arquitetura detalhada
- [[architecture-decisions]] — ADRs
- [[maps/multgestor-core/MAPA-MULTGESTOR-CORE]] — Mapa vivo
- [[living-os/01-mapa-vivo]] — Capacidades e camadas
- [[living-os/03-producao]] — Produção segura
