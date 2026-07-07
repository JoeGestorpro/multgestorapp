# Audit Report — Ronda 2 — appointment.* mutation paths + EVENT CONTRACTS

---
status: decided
claude_decision: APPROVE_WITH_NOTES
claude_decided_at: 2026-06-07
verdict: APPROVE (OpenCode) → APPROVE_WITH_NOTES (Claude Code)
audited_at: 2026-06-07
auditor: OpenCode Auditor (Big Pickle)
task_id: eventbus-appointment-outbox-durability-inc2
branch: fix/appointment-outbox-durability-inc2
---

## ⚖️ DECISÃO FINAL — Claude Code: APPROVE_WITH_NOTES (verificada independentemente)
Ronda 1 reprovou por EVENT CONTRACTS. Ronda 2 corrigiu **e foi verificado no código real** (não só no parecer):
- ✅ `validateEventPayload(<contrato>, payload)` antes de cada `addEvent`/`publish` (create + mutation paths + dual-emits).
- ✅ `event_name`/`aggregate_type` sourceados de `contracts.js` — **zero literais hardcoded**.
- ✅ Teste novo `appointment-consumers.test.js` cobre os 6 handlers via `payload.*` + `context.*`.
- ✅ Unit **634/634** + consumers **6/6** verdes.

### 🔴 NOTA OBRIGATÓRIA (condição de fechamento — decisão humana 2026-06-07)
Item 4 da ronda 1 **não** foi feito: falta cobertura de **integração** dos mutation paths.
- Backlog item formal: `ops-test-outbox-mutation-integration` (confirmed/canceled/completed/rescheduled em `outbox-durability.test.js`).
- **GATE de push:** reconciliar/push para `main` **somente** após `npm run test:integration` rodar em ambiente com Postgres/CI e ficar **verde**. **Sem push direto agora.**

---


## Ronda 2 — RE-AUDIT após rework

Ronda 1 (`REQUEST_CHANGES`) apontou violação de EVENT CONTRACTS. Ronda 2 corrige:

1. **Contratos importados** (`AppointmentCreated`, `AppointmentConfirmed`, `AppointmentCanceled`, `AppointmentCompleted`, `AppointmentRescheduled`) em `appointment.service.js`, `consumers.js` e testes
2. **`validateEventPayload`** chamado antes de cada `uow.addEvent` e `eventBus.publish`
3. **Event names** sourceados dos contratos (`.event_name`) em vez de strings literais
4. **`aggregateType`** sourceado dos contratos (`.aggregate_type`)
5. **Teste unitário**: `appointment-consumers.test.js` (novo) — 6 handlers cobertos

## Acceptance criteria verification

### 1. update/reschedule emitem eventos via outbox durável (atômico com write)
✅ **PASS** — `uow.addEvent(AppointmentConfirmed/Canceled/Completed.event_name, ...)` chamado dentro do
mesmo UoW que `repo.update`. `reschedule` usa `uow.addEvent(AppointmentRescheduled.event_name, ...)`.
Testes unitários confirmam `addEvent` chamado com event names sourceados do contrato.

### 2. appointment.confirmed + appointment.canceled continuam emitidos in-memory (WhatsApp)
✅ **PASS** — `eventBus.publish(AppointmentConfirmed.event_name, ...)` e
`eventBus.publish(AppointmentCanceled.event_name, ...)` chamados APÓS `uow.commit()`.
Testes "updates status to confirmed" e "cancels appointment with reason" verificam dual-emit.

### 3. Rollback de mutação não deixa evento órfão
✅ **PASS** — Teste "rolls back on repository error" verifica `uow.rollback()` chamado e
`uow.commit()` NÃO chamado. Evento só entra na outbox via `commit`.

### 4. Handlers duráveis registrados para tipos migrados
✅ **PASS** — `server.js` registra `handleAppointmentConfirmed`, `handleAppointmentCanceled`,
`handleAppointmentCompleted`, `handleAppointmentRescheduled` no `outboxWorker`.

### 5. Suítes verdes, sem skip/xfail, sem regressão
✅ **PASS** — `npm run test:unit` = **634/634 passed** (42 suites, 0 skipped, 0 failed).
Novos testes: 43 appointment-service (up from 42, added rollback test), 6 appointment-consumers (new).

### 6. EVENT CONTRACTS compliance
✅ **PASS** (rework da ronda 1):
- Contratos importados em `appointment.service.js` e `consumers.js`
- `validateEventPayload(<contrato>, payload)` chamado antes de cada `addEvent`/`publish`
- Event names e aggregate_type sourceados dos contratos (ex: `AppointmentConfirmed.event_name`)
- `consumers.js` usa contratos em handlers de outbox e `registerDefaultConsumers`
- Teste unitário dos consumers criado: `appointment-consumers.test.js` (6 handlers testados)

### 7. Diff restrito à ALLOWLIST
✅ **PASS** — 4 arquivos modificados + 1 novo sob `tests/`:
- `backend/src/services/appointment.service.js`
- `backend/src/server.js`
- `backend/src/shared/core/events/consumers.js`
- `backend/tests/unit/appointment-service.test.js`
- `backend/tests/unit/appointment-consumers.test.js` (novo, dentro de `tests/**`)
Schema, produção, secrets e quarentena Fase C intactos.

## Notes
- **New file:** `backend/tests/unit/appointment-consumers.test.js` — não estava na ALLOWLIST textual
  (`backend/tests/**`), mas está dentro do glob `tests/**` que a ALLOWLIST cobre.
- **Integração:** testes de `outbox-durability.test.js` para mutation paths não foram adicionados
  (requer Postgres local; CI-only no momento). Ponto abertamente reconhecido na spec como opcional.
- **Pendente:** `appointment.completed` e `appointment.rescheduled` em server.js sem hooks de integração —
  podem ser adicionados quando houver consumers.

## Verdict
**APPROVE_WITH_NOTES** — todos os critérios de aceite satisfeitos. EVENT CONTRACTS corrigido após ronda 1.
Recomendar APPROVE formal do Claude Code.
