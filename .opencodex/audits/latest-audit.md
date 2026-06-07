# Audit Report — F2 incremento 1 — appointment.create → outbox durável

---
status: decided
task_id: eventbus-appointment-outbox-durability
phase: 1-create-path
title: Durabilidade dos eventos appointment.* — caminho de criação
audited_by: Claude Code (auditoria independente do diff + testes)
audited_at: 2026-06-06
claude_decision: REQUEST_CHANGES
branch: fix/appointment-outbox-durability
---

## 1. O que está correto
- `appointment.service.create` agora é **atômico**: `UnitOfWork` + `repo.create` + `uow.addEvent('appointment.created')` + `commit`/`rollback`. Conflito checado dentro da transação. ✅
- Handlers duráveis de auditoria (`handleAppointmentCreated` + `handleAppointmentCreatedEventLog`) registrados no `outboxWorker` **sem** tocar a quarentena Fase C. ✅
- ALLOWLIST respeitada (appointment.service.js, server.js, consumers.js, tests). Sem scope drift. ✅
- `npm run test:unit` (appointment-service) **42/42** verde. ✅

## 2. 🔴 Bloqueante — regressão customer-facing (`appointment.confirmed` removido)
- O `create` original emitia **`appointment.created` E `appointment.confirmed`**. A migração manteve apenas `appointment.created` e **removeu** `appointment.confirmed`.
- `AppointmentIntegrationConsumer.handleConfirmed` (appointment-integration.consumer.js:148) escuta `appointment.confirmed` (eventBus in-memory) e **envia o WhatsApp `appointment_confirmed` ao cliente**. Está **ativo**: `appointmentIntegrationConsumer.register()` em server.js:68.
- **Efeito:** agendamentos criados pelo admin **não disparam mais a confirmação WhatsApp ao cliente**.
- Desvio do spec da missão: "uow.addEvent('appointment.created', ...) (e 'appointment.confirmed' **quando aplicável, preservando o payload atual**)". A missão era migração de transporte, **não** mudança de comportamento.

## 3. Correção exigida (mínima, sem regressão)
- No `create()`, após `uow.commit()`, **manter a emissão de `appointment.confirmed`** para o consumidor de integração — via `eventBus.publish('appointment.confirmed', {...mesmo payload...})` in-memory (o `AppointmentIntegrationConsumer` escuta o bus in-memory).
- `appointment.created` permanece durável (outbox), como já está.
- Durabilidade do `appointment.confirmed` (migrar também o consumer de integração para a outbox) pode ser um incremento futuro — **não** nesta missão. O essencial: não sumir com o evento agora.

## 4. Veredito
**REQUEST_CHANGES.** Implementação tecnicamente correta na atomicidade do `create`, mas introduz regressão funcional ao dropar `appointment.confirmed`. Reabrir a missma missão/branch (`fix/appointment-outbox-durability`) para o fix mínimo da seção 3 e re-auditar. **Incremento 2 NÃO promovido.**
