# 📥 NEXT TASK — Fila de Execução OpenCode

> Escrito pelo **Claude Code**. Lido e executado pelo **OpenCode Executor** via `/next-task`.
> Fluxo oficial: `docs/runbooks/prompt-orchestration-flow.md`.
> **Ambiente oficial: Windows + PowerShell.**
> Gate do APPROVE_WITH_NOTES do inc.2 (`0d654f3`). Backlog: `ops-test-outbox-mutation-integration`.

---
status: pending
task_id: eventbus-mutation-integration-tests
title: Testes de integração dos mutation paths appointment.* (gate de push do inc.2)
shell: powershell
mode: EXECUTE_WITH_REVIEW
requires_human_approval: false
promoted_by: Claude Code (condição do APPROVE_WITH_NOTES — decisão humana 2026-06-07)
required_branch: fix/appointment-outbox-durability-inc2
created_branch: fix/appointment-outbox-durability-inc2
updated_by: Claude Code
updated_at: 2026-06-07
diagnosis_source: latest-audit.md (inc.2 ronda 2, NOTA OBRIGATÓRIA)
---

## 📐 REGRA OBRIGATÓRIA — EVENT CONTRACTS (vinculante)
> Toca asserções sobre eventos → seguir `.opencodex/rules/event-contracts.md`: acessar campos pelo formato
> correto (outbox: `payload.*` + colunas `type`/`company_id`/`aggregate_id` da linha `outbox_messages`),
> sem variável solta; nomes de evento via `contracts.js` (`AppointmentConfirmed.event_name` etc.).

## MODEL CAPABILITY ASSESSMENT
- **Executor recomendado:** Big Pickle, **EXECUTE_WITH_REVIEW** — só testes, mas valida o gate de push de um path P0.
- **Nível de risco:** **Baixo** — apenas teste de integração. **Produção:** nulo.
- **Escalonamento:** tocar código de produção (service/worker/consumers) → **PARAR e reportar** (ESCALATE). Esta missão é **test-only**.

## Contexto
O inc.2 (`0d654f3`) migrou os mutation paths para a outbox durável e foi **APPROVE_WITH_NOTES** — pendente só
a cobertura de **integração** desses caminhos. O `outbox-durability.test.js` hoje cobre apenas o `create` (inc.1).

## Objetivo
Adicionar a `backend/tests/integration/outbox-durability.test.js` testes que provem, **end-to-end com Postgres**,
que cada mutation path grava o evento correto em `outbox_messages` na **mesma transação** do `update`/`reschedule`.

## ALLOWLIST (escopo autorizado — APENAS este arquivo)
- `backend/tests/integration/outbox-durability.test.js`

> Qualquer alteração de código de produção = violação = **PARAR e reportar**.

## Passos
1. Para cada caminho, criar um agendamento (helper/seed) e então:
   - **confirmed:** `service.update(..., { status: 'confirmed' })` → assert linha `outbox_messages` com `type = AppointmentConfirmed.event_name`, `company_id`, payload coerente.
   - **canceled:** `service.update(..., { status: 'canceled', canceled_reason })` → assert `type = AppointmentCanceled.event_name`.
   - **completed:** `service.update(..., { status: 'completed' })` → assert `type = AppointmentCompleted.event_name`.
   - **rescheduled:** `service.reschedule(...)` → assert `type = AppointmentRescheduled.event_name`.
2. Provar **atomicidade**: simular erro pós-`addEvent` (ou usar um caminho que dê rollback) e assert que **nenhum** evento ficou na outbox.
3. Usar os nomes de evento via `contracts.js` (sem literais).

## Validação obrigatória (antes de qualquer push)
```powershell
# Requer Postgres local (mesmo schema do CI). Se indisponível local, validar no CI.
Set-Location backend
npm run test:integration
Set-Location ..
```
- **Esperado:** suíte de integração **verde** cobrindo os 4 mutation paths (sem skip nos casos novos quando há DB).

## Critérios de aceite
- [ ] 4 mutation paths (confirmed/canceled/completed/rescheduled) com teste de integração que verifica a gravação em `outbox_messages`.
- [ ] Teste de atomicidade (rollback → outbox vazia).
- [ ] Nomes de evento sourceados de `contracts.js` (EVENT CONTRACTS).
- [ ] `npm run test:integration` **verde** em Postgres/CI (não pode ficar skipped nos casos novos).
- [ ] Diff restrito ao arquivo da ALLOWLIST; **zero** código de produção tocado.

## 🛑 GATE DE PUSH (decisão humana 2026-06-07)
> Só reconciliar/push do inc.2 (`0d654f3`) para `main` **após** esta missão estar **verde no CI** e auditada APPROVE.

## Instruções para o OpenCode Executor
1. Rodar o **PREFLIGHT** (`.opencodex/templates/preflight-check.md`). **Atenção:** o inc.2 (`0d654f3`) já está commitado nesta branch; o working tree deve estar limpo de código antes desta missão.
2. Branch esperada: **`fix/appointment-outbox-durability-inc2`** (mesma do inc.2).
3. Espelhar em `current-task.md` (`running`) e executar (test-only).
4. Pós-execução: `/complete-task` → `/audit-task` → devolver ao **Claude Code**. **Push só após gate + confirmação humana.**

## Pós-execução (somente Claude Code)
- Auditar; se APPROVE e CI verde → liberar a reconciliação/push do inc.2 + estes testes para `main`.
