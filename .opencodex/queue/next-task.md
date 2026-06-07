# 📥 NEXT TASK — Fila de Execução OpenCode

> Escrito pelo **Claude Code**. Lido e executado pelo **OpenCode Executor** via `/next-task`.
> Fluxo oficial: `docs/runbooks/prompt-orchestration-flow.md`.
> **Ambiente oficial: Windows + PowerShell.**
> Continuação de `eventbus-appointment-outbox-durability` inc.1 (APPROVE, `823107c`). Diagnóstico: F2.

---
status: pending
task_id: eventbus-appointment-outbox-durability-inc2
phase: 2-mutation-paths
title: Durabilidade appointment.* — rotear update/cancel/complete/reschedule pela outbox (sem regredir notificações)
shell: powershell
mode: EXECUTE_WITH_REVIEW
requires_human_approval: false
promoted_by: Claude Code (continuação natural do inc.1 — necessidade do projeto: Event Bus)
required_branch: fix/appointment-outbox-durability-inc2
created_branch: fix/appointment-outbox-durability-inc2
updated_by: Claude Code
updated_at: 2026-06-07
diagnosis_source: auditoria F2 (sessão 2026-06-05)
---

## 🔴 CHANGES REQUESTED (Claude Code, 2026-06-07) — EVENT CONTRACTS reprovado
> A execução ficou funcionalmente correta (atomicidade, dual-emit, 628 unit), **mas violou a regra
> obrigatória EVENT CONTRACTS** — que é critério de aceite. Corrigir **antes** de re-auditar:
>
> 1. **Importar `contracts.js`** no `appointment.service.js` e **chamar `validateEventPayload(<contrato>, payload)`**
>    antes de publicar cada evento (create + update/cancel/complete/reschedule).
> 2. **Sourcing do contrato:** trocar literais hardcoded por campos do contrato — `AppointmentConfirmed.event_name`,
>    `AppointmentConfirmed.aggregate_type`, etc. (em `consumers.js` e no service). Nada de `'appointment.confirmed'` solto.
> 3. **Teste unitário dos handlers de consumer** (`handleAppointmentConfirmed/Canceled/Completed/Rescheduled`)
>    cobrindo o acesso a campo via `payload.*` + `context.*`.
> 4. **Integração:** adicionar cobertura dos **mutation paths** em `outbox-durability.test.js` e **rodar
>    `npm run test:integration` contra um Postgres** (não pode ficar skipped) — passo 2 do plano humano.
> 5. Rodar o teste específico do evento **antes** da integração (regra item 6).
>
> Mantido o que já está certo: formato `payload.*`+`context.*` nos handlers, atomicidade e dual-emit.

## 📐 REGRA OBRIGATÓRIA — EVENT CONTRACTS (vinculante)
> Esta missão toca um Service que **publica eventos** → aplicar `.opencodex/rules/event-contracts.md` na íntegra:
> 1) localizar o contrato em `backend/src/shared/core/events/contracts.js` (`AppointmentConfirmed`, `AppointmentCanceled`,
>    `AppointmentCompleted`, `AppointmentRescheduled`); 2) nunca usar campo solto sem origem; 3) acessar pelo formato
>    correto (in-memory `event.event_name`/`event.company_id`/`event.aggregate_id` **vs** outbox handler `payload.*`
>    + `context.companyId`/`context.eventId`); 4) helper centralizado se o campo variar entre os dois formatos;
>    5) criar/atualizar teste unitário do consumer/EventBus; 6) rodar o teste específico **antes** da integração.
> Validar o payload com `validateEventPayload(<contrato>, payload)` ao publicar. **Auditor reprova se violado.**

## ⚠️ LIÇÃO DO INCREMENTO 1 (regra dura desta missão)
O inc.1 falhou na 1ª auditoria por **dropar `appointment.confirmed`**, quebrando o WhatsApp de confirmação.
**NÃO repita:** o `AppointmentIntegrationConsumer` ([appointment-integration.consumer.js:147-164](../../backend/src/integrations/consumers/appointment-integration.consumer.js)) escuta **no eventBus in-memory** os eventos `appointment.confirmed`, `appointment.canceled` e `appointment.reminder` e envia WhatsApp ao cliente. **Toda migração para a outbox DEVE preservar a emissão in-memory desses eventos** (dual-emit: durável + in-memory pós-commit), até que o consumer de integração seja migrado para a outbox (incremento futuro, fora daqui).

## MODEL CAPABILITY ASSESSMENT
- **Executor recomendado:** Big Pickle, **EXECUTE_WITH_REVIEW** — produtor de domínio P0 + notificações customer-facing. Auditoria final do Claude Code obrigatória.
- **Nível de risco:** **Médio-alto** — toca cancelamento/confirmação que disparam WhatsApp ao cliente. **Produção:** sem deploy nesta missão.
- **Escalonamento:** dropar qualquer evento in-memory com consumidor ativo, ou sair da ALLOWLIST → **PARAR e reportar** (ESCALATE).

## Objetivo
Migrar os caminhos de **mutação** de `appointment.service` (`update` → confirmed/canceled/completed, e `reschedule`) para a **outbox durável** via `UnitOfWork`, **sem regredir** as notificações WhatsApp. Padrão idêntico ao inc.1: write+evento atômicos; eventos com consumidor in-memory ativo continuam emitidos in-memory pós-commit.

## ALLOWLIST (escopo autorizado — APENAS estes arquivos)
- `backend/src/services/appointment.service.js`
- `backend/src/server.js` (APENAS registrar handlers duráveis de auditoria para `appointment.confirmed/canceled/completed/rescheduled`; **não** tocar quarentena Fase C)
- `backend/src/shared/core/events/consumers.js` (handlers duráveis reutilizáveis, se necessário)
- `backend/tests/**`

> Qualquer arquivo fora desta lista = violação de escopo = **PARAR e reportar**.

## Passos
1. **`update()`** (status confirmed/canceled/completed): envolver `repo.update` num `UnitOfWork` (begin/commit/rollback), trocar cada `eventBus.publish(...)` por `uow.addEvent(...)` **durável** com metadata `{ traceId, companyId, aggregateType:'appointment', aggregateId }`.
2. **Preservar notificações:** após `uow.commit()`, **re-emitir in-memory** `eventBus.publish('appointment.confirmed'|'appointment.canceled', {...mesmo payload...})` para o `AppointmentIntegrationConsumer` (dual-emit). `appointment.completed` não tem consumer de integração → só durável.
3. **`reschedule()`**: mesmo padrão — `uow.addEvent('appointment.rescheduled')` durável (sem consumer de integração hoje → não precisa dual-emit, mas confira).
4. **`server.js`**: registrar handlers duráveis de auditoria para os event types migrados (mirror do inc.1).
5. **Reads** permanecem no pool; só write+evento entram na transação.

## Validação obrigatória (antes de qualquer push)
```powershell
Set-Location backend
npm run test:unit
npm run test:integration   # se houver teste novo de integração (requer Postgres)
Set-Location ..
```
- **Esperado:** suítes verdes; testes provam atomicidade (rollback não deixa evento órfão) e **que confirmed/canceled continuam sendo emitidos in-memory**.

## Critérios de aceite
- [ ] update (confirmed/canceled/completed) e reschedule emitem o evento de domínio via **outbox durável**, atômico com o `update`.
- [ ] **`appointment.confirmed` e `appointment.canceled` continuam emitidos in-memory** pós-commit (WhatsApp preservado) — provado por teste.
- [ ] Rollback de mutação **não** deixa evento na outbox.
- [ ] Handlers duráveis de auditoria registrados para os tipos migrados.
- [ ] Suítes verdes, sem skip/xfail; sem regressão.
- [ ] **Event Contracts:** campos acessados pelo objeto do evento (sem variável solta); payload validado com `validateEventPayload`; teste unitário do consumer/EventBus criado/atualizado e rodado antes da integração (`.opencodex/rules/event-contracts.md`).
- [ ] Diff restrito à ALLOWLIST; sem tocar schema, produção, secrets ou quarentena Fase C.

## ❌ Escopo proibido
- ❌ **Dropar** qualquer evento in-memory com consumidor ativo (erro do inc.1).
- ❌ Migrar o `AppointmentIntegrationConsumer` para a outbox (incremento futuro).
- ❌ Tocar a quarentena Fase C / `sale.created` / schema.
- ❌ `git push` sem confirmação humana.

## 🛑 Hard stops
1. Se algum teste de agendamento/notificação regredir → **PARAR e reportar**.
2. Se a transação não cobrir o `addEvent` (evento fora da atomicidade) → **PARAR**.
3. Se o diff escapar da ALLOWLIST → **PARAR**.

## Instruções para o OpenCode Executor
1. Rodar o **PREFLIGHT** (`.opencodex/templates/preflight-check.md`) — 5 checagens.
2. Branch esperada: **`fix/appointment-outbox-durability-inc2`** (humano cria/entra manualmente; runner NÃO cria branch).
3. Espelhar em `current-task.md` (`running`) e executar.
4. Pós-execução: `/complete-task` → `/audit-task` → devolver ao **Claude Code**. **Push só com confirmação humana.**

## Pós-execução (somente Claude Code)
- Auditar; se APPROVE, avaliar o **incremento futuro**: migrar `AppointmentIntegrationConsumer` para a outbox (durabilidade real de confirmed/canceled), aí sim podendo remover o dual-emit in-memory.
