# Eventos — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[technical/workers]] · [[technical/integracoes]] · [[technical/README]] · [[architecture-decisions#ADR-03]]

---

## Arquitetura de Eventos

### Dual-emit Strategy
```
Evento de Domínio
  → Outbox Durável (UnitOfWork) — atômico com a transação
  → In-memory EventBus — pós-commit (notificações best-effort)
```

### Outbox
- Tabela `outbox_messages` no PostgreSQL
- Processado pelo OutboxWorker
- Sem handler → `processed` (no-op, F6)
- `failed=0` após reconciliação A-003

### EventBus (In-memory)
- Notificações em tempo real
- Volátil (não garantido)
- Consumers: WhatsApp, Email

## Tipos de Evento

| Evento | Handler | Garantia |
|---|---|---|
| appointment.created | Outbox + EventBus | Durável |
| appointment.confirmed | Outbox + EventBus | Durável |
| appointment.canceled | Outbox + EventBus | Durável |
| appointment.completed | Outbox | Durável |
| appointment.rescheduled | Outbox | Durável |
| sale.created | Outbox | No-op (F6) |

## EVENT CONTRACTS

Todos os eventos usam:
- `contracts.js` — definição de contrato
- `AppointmentEvents` factory — criação validada
- `validateEventPayload` — validação em runtime

Ver regra: `.opencodex/rules/event-contracts.md`

## Referências

- [[architecture-decisions#ADR-03]] — ADR Event Bus + Outbox
- [[technical/workers]] — OutboxWorker
- [[technical/integracoes]] — Integrações via eventos
- [[maps/multgestor-core/core/backend]] — Backend
