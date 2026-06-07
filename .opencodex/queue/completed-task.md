# ✅ COMPLETED TASK — Resultado Final

---
status: audited
result: success
task_id: eventbus-appointment-outbox-durability
phase: 1-create-path
title: Durabilidade dos eventos appointment.* — rotear CRIAÇÃO pela outbox durável (incremento 1)
completed_at: 2026-06-07
branch: fix/appointment-outbox-durability
commits:
  - 823107c feat(appointment): rotear appointment.created pela outbox duravel (F2 incremento 1)
mode: EXECUTE_WITH_REVIEW
audit_verdict: REQUEST_CHANGES → APPROVE (após rework)
claude_decision: APPROVE
claude_decided_at: 2026-06-07
pushed: false                   # commit LOCAL apenas — push só com confirmação humana
---

## Resumo
`AppointmentService.create` convertido para `UnitOfWork` + outbox durável: `appointment.created` via
`uow.addEvent()` grava `outbox_messages` na **mesma transação** do INSERT. `appointment.confirmed` preservado
via `eventBus.publish()` (in-memory) **pós-commit**, mantendo o WhatsApp de confirmação
(`AppointmentIntegrationConsumer`). Handlers duráveis de auditoria registrados no OutboxWorker.

## Ciclo de auditoria
- **1ª rodada → REQUEST_CHANGES (Claude Code, 2026-06-06):** o create havia **dropado** `appointment.confirmed`,
  quebrando o WhatsApp de confirmação dos agendamentos criados pelo admin (consumer ativo em server.js:68).
- **Rework → APPROVE (2026-06-07):** `appointment.confirmed` re-emitido após `uow.commit()` com payload original.

## Verificação independente (Claude Code)
- ALLOWLIST respeitada (appointment.service.js, server.js, consumers.js, tests). Sem scope drift.
- `appointment.created` durável (atômico); `appointment.confirmed` best-effort pós-commit (como antes).
- **`npm run test:unit` → 627/627 verde** (appointment-service 42/42). Integração `outbox-durability.test.js` valida no CI/Postgres.

## Escopo NÃO incluído (próxima missão)
- update / cancel / complete / reschedule ainda usam `eventBus` volátil → **incremento 2** (`eventbus-appointment-outbox-durability-inc2`).
- Migrar `AppointmentIntegrationConsumer` para a outbox (durabilidade do confirmed/canceled) → incremento futuro.

## Pendências
- **Push:** não realizado (aguarda confirmação humana).
- Próxima missão promovida: `eventbus-appointment-outbox-durability-inc2` (ver `next-task.md`).
