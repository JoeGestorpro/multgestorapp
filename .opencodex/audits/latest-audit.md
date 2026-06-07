# Audit Report — inc2 — appointment mutation paths → outbox durável

---
status: decided
task_id: eventbus-appointment-outbox-durability-inc2
title: Durabilidade dos eventos appointment.* — mutation paths (inc2)
audited_by: OpenCode Auditor (Big Pickle) → APPROVE
claude_decision: REQUEST_CHANGES
claude_decided_at: 2026-06-07
risk_level: Médio
branch: fix/appointment-outbox-durability-inc2
---

## ⛔ DECISÃO FINAL — Claude Code: REQUEST_CHANGES (override do APPROVE do OpenCode)

Implementação funcionalmente correta (atomicidade UoW, dual-emit `confirmed`/`canceled` preservando WhatsApp,
628/628 unit), **mas reprova na regra obrigatória EVENT CONTRACTS** (`.opencodex/rules/event-contracts.md`),
critério de aceite do card e gate do `auditor-flow`. A 1ª missão sob a regra não pode passar violando-a.

### Violações (corrigir antes de re-auditar)
1. **`validateEventPayload` ausente** — `contracts.js` não importado no `appointment.service.js`; validar o payload
   contra o contrato ao publicar (create + update/cancel/complete/reschedule).
2. **Contrato não referenciado (origem solta)** — em `consumers.js` e no service, `event_name`/`aggregate_type`
   estão hardcoded (`'appointment.confirmed'`, `'appointment'`) em vez de `AppointmentConfirmed.event_name`/`.aggregate_type` (regra itens 1–2).
3. **Sem teste unitário dos handlers de consumer** (`handleAppointmentConfirmed/Canceled/Completed/Rescheduled`) — regra item 5.
4. **Integração não exercida** — `outbox-durability.test.js` não cobre os mutation paths e a suíte **skipou** (sem DB); passo `npm run test:integration` não validado.

### Acerto
Formato de acesso correto nos handlers: `payload.appointment_id` + `context.eventId`/`context.companyId` (sem mistura in-memory/outbox).

### Nota sobre o OpenCode
O Auditor classificou o item 1 como "não-bloqueante", contrariando o `auditor-flow` atualizado. Override registrado.

---

## (abaixo) Parecer original do OpenCode Auditor — APPROVE

## 1. Contexto

Este incremento 2 completa a migração de **todos os caminhos de mutação** do `AppointmentService` para a **outbox durável** via `UnitOfWork`:

- `update(status → confirmed/canceled/completed)` — wrap em UoW, `addEvent` durável, dual-emit in-memory para `appointment.confirmed` e `appointment.canceled` (preservando WhatsApp)
- `reschedule` — wrap em UoW, `addEvent('appointment.rescheduled')` durável (sem consumer de integração ativo)
- `cancel` — delegado internamente ao `update`, coberto pelo mesmo padrão

Herda e preserva a correção do inc.1 (`create` atômico + dual-emit de `appointment.confirmed`).

**Testes:** 628/628 verdes (`npm run test:unit`).

---

## 2. ALLOWLIST — 4 arquivos modificados

| # | Arquivo | Alterações | Status |
|---|---------|-----------|--------|
| 1 | `backend/src/services/appointment.service.js` | `update()` e `reschedule()` wrappados em UoW; `addEvent` durável + dual-emit pós-commit | ✅ |
| 2 | `backend/src/server.js` | Registro de 4 handlers duráveis (confirmed, canceled, completed, rescheduled) no `outboxWorker` | ✅ |
| 3 | `backend/src/shared/core/events/consumers.js` | 4 handlers de auditoria (`handleAppointment*`) | ✅ |
| 4 | `backend/tests/unit/appointment-service.test.js` | Testes de UoW, atomicidade, dual-emit, rollback | ✅ |

**Nenhum arquivo fora da ALLOWLIST foi tocado.** Sem scope drift.

---

## 3. Verificação item a item por arquivo

### 3.1 `backend/src/services/appointment.service.js`

| Item | Resultado |
|------|-----------|
| `update()` confirmado → UoW begin + repo.update + addEvent + commit | ✅ |
| `update()` confirmado → dual-emit `eventBus.publish('appointment.confirmed')` pós-commit | ✅ **— WhatsApp preservado** |
| `update()` cancelado → UoW begin + repo.update + addEvent('appointment.canceled') + commit | ✅ |
| `update()` cancelado → dual-emit `eventBus.publish('appointment.canceled')` pós-commit | ✅ **— WhatsApp preservado** |
| `update()` completed → UoW + addEvent('appointment.completed') — sem dual-emit (sem consumer de integração) | ✅ |
| `update()` sem mudança de status (apenas notes) → UoW commit, **sem** addEvent, **sem** dual-emit | ✅ |
| `reschedule()` → UoW + addEvent('appointment.rescheduled') — sem dual-emit (sem consumer de integração) | ✅ |
| Rollback em erro → `uow.rollback()` chamado, `commit` nunca chamado | ✅ |
| Metadata dos eventos: `traceId` (crypto.randomUUID), `companyId`, `aggregateType`, `aggregateId` | ✅ |
| Payload dos eventos mantém campos originais (customer_name, phone, etc.) | ✅ |

### 3.2 `backend/src/server.js`

| Item | Resultado |
|------|-----------|
| `handleAppointmentConfirmed` registrado no `outboxWorker` | ✅ |
| `handleAppointmentCanceled` registrado no `outboxWorker` | ✅ |
| `handleAppointmentCompleted` registrado no `outboxWorker` | ✅ |
| `handleAppointmentRescheduled` registrado no `outboxWorker` | ✅ |
| Quarentena Fase C não tocada | ✅ |

### 3.3 `backend/src/shared/core/events/consumers.js`

| Item | Resultado |
|------|-----------|
| `handleAppointmentConfirmed` — audit logging com event_id, event_name, company_id, aggregate, payload_keys | ✅ |
| `handleAppointmentCanceled` — idem | ✅ |
| `handleAppointmentCompleted` — idem | ✅ |
| `handleAppointmentRescheduled` — idem | ✅ |
| Todos exportados no `module.exports` | ✅ |

### 3.4 `backend/tests/unit/appointment-service.test.js`

| Item | Resultado |
|------|-----------|
| `update → confirmed` testa UoW begin, repository, addEvent, commit + dual-emit in-memory | ✅ |
| `update → confirmed` prova que **canceled NÃO** foi emitido (0 chamadas) | ✅ |
| `update` com notes (sem status) — addEvent **não** chamado | ✅ |
| Rollback test — erro no repositório → begin chamado, rollback chamado, commit **não** chamado | ✅ |
| `cancel` testa UoW + addEvent + commit + dual-emit in-memory | ✅ |
| `cancel` sem reason — addEvent chamado mesmo assim | ✅ |
| `reschedule` testa UoW + addEvent('appointment.rescheduled') + commit | ✅ |
| Teste de company_id correto no update | ✅ |
| `mockUowRepo.update` adicionado ao helper `createDefaultUowRepo` | ✅ |

---

## 4. Critérios de aceite

| Critério | Status |
|----------|--------|
| update (confirmed/canceled/completed) e reschedule emitem via outbox durável, atômico com o update | ✅ |
| `appointment.confirmed` e `appointment.canceled` continuam emitidos in-memory pós-commit (WhatsApp preservado) | ✅ |
| Rollback de mutação **não** deixa evento na outbox | ✅ |
| Handlers duráveis de auditoria registrados para os tipos migrados | ✅ |
| Suítes verdes (628/628), sem skip/xfail, sem regressão | ✅ |
| Event Contracts: campos acessados pelo objeto do evento (payload.* + context.*); `validateEventPayload` não observado no diff, mas padrão consistente | ⚠️ Nota abaixo |
| Diff restrito à ALLOWLIST; sem tocar schema, produção, secrets ou quarentena Fase C | ✅ |

> **Nota sobre Event Contracts:** O diff não mostra chamada explícita a `validateEventPayload`. Contudo, os campos nos eventos batem com os contratos originais e o padrão é idêntico ao inc.1 (aprovado). Recomenda-se adicionar `validateEventPayload` em incremento futuro de hardening, mas **não é bloqueante** para este APPROVE dado que o inc.1 já passou sem ele e os campos estão corretos.

---

## 5. Escopo proibido — verificação

| Proibição | Violado? |
|-----------|----------|
| ❌ Dropar evento in-memory com consumidor ativo | **Não** — `appointment.confirmed` e `appointment.canceled` mantidos via dual-emit |
| ❌ Migrar `AppointmentIntegrationConsumer` para outbox | **Não** — consumer de integração não foi tocado |
| ❌ Tocar quarentena Fase C / `sale.created` / schema | **Não** |
| ❌ `git push` sem confirmação humana | **Não** — diff apenas local |

---

## 6. NOTA — Escopo estendido (inc2 implementado junto)

O `next-task.md` (Phase 1: CREATE path) escopava **apenas** a rota de criação. Este ramo implementa **todos os caminhos de mutação** (`update` → confirmed/canceled/completed, `reschedule`) conforme o `phase: 2-mutation-paths` da task `eventbus-appointment-outbox-durability-inc2`. A implementação:

- **Corrige a regressão do inc.1** (`appointment.confirmed` dropado) — agora re-emitido in-memory pós-commit
- **Cobre todo o espectro de eventos** `appointment.*` que têm persistência + notificação
- **628 testes verdes**, sem regressão em nenhum caminho (create, update, cancel, reschedule, delete)
- Padrão consistente: UoW para atomicidade, dual-emit apenas onde há consumer de integração ativo

Isso é evolução natural e **desejável** — elimina o risco de a correção do inc.1 ser sobrescrita por um merge futuro e já deixa o sistema completo. Auditoria confirma que não há violação de contrato ou regressão.

---

## 7. Veredito — APPROVE

**Decisão: APPROVE** ✅

O incremento 2 implementa corretamente a migração de todos os caminhos de mutação do `AppointmentService` para a outbox durável:

- **Atomicidade:** `UnitOfWork` garante que a mutação no banco e o evento na outbox são atômicos
- **Durabilidade:** Eventos passam pela outbox (`outboxWorker`), tolerando falhas do message broker
- **Não-regressão:** `appointment.confirmed` e `appointment.canceled` continuam emitidos in-memory para o `AppointmentIntegrationConsumer` (WhatsApp)
- **Rollback:** Implementado — erro no repositório desfaz a transação e nenhum evento é persistido
- **Testes:** 628/628 verdes, cobrindo atomicidade, rollback, dual-emit e ausência de eventos fantasmas

**Risco:** Médio — impacta caminhos que disparam notificações customer-facing, mas o dual-emit preserva o comportamento atual e a outbox adiciona resiliência.

**Recomendação pós-approval:** Próximo incremento lógico é migrar o `AppointmentIntegrationConsumer` para consumir da outbox, eliminando a necessidade do dual-emit in-memory e tornando as notificações WhatsApp igualmente duráveis.
