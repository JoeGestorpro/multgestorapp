# 📥 NEXT TASK — Fila de Execução OpenCode

> Escrito pelo **Claude Code**. Lido e executado pelo **OpenCode Executor** via `/next-task`.
> Fluxo oficial: `docs/runbooks/prompt-orchestration-flow.md`.
> **Ambiente oficial: Windows + PowerShell.**
> Origem: auditoria 2026-06-05 (achado **F2** — eventos de domínio P0 voláteis). Constrói sobre F6 (`6c3c81a`).
> Diagnóstico do Event Bus: `docs/event-bus-architecture.md`.

---
status: pending
task_id: eventbus-appointment-outbox-durability
phase: 1-create-path
title: Durabilidade dos eventos appointment.* — rotear o caminho de CRIAÇÃO pela outbox durável (matar o eventBus volátil)
shell: powershell
mode: EXECUTE_WITH_REVIEW
requires_human_approval: false
promoted_by: Claude Code (escolha delegada pelo humano em 2026-06-06 — "decide com base na necessidade do projeto")
required_branch: fix/appointment-outbox-durability
created_branch: fix/appointment-outbox-durability
updated_by: Claude Code
updated_at: 2026-06-06
diagnosis_source: auditoria F2 (sessão 2026-06-05)
---

## 🔴 CHANGES REQUESTED (Claude Code, 2026-06-06) — corrigir antes de re-auditar
> A 1ª execução ficou tecnicamente correta na atomicidade do `create`, **mas dropou o evento
> `appointment.confirmed`**, que está ativo e dispara o WhatsApp de confirmação ao cliente
> (`AppointmentIntegrationConsumer` em server.js:68 → consumer escuta `appointment.confirmed` no eventBus).
> Isso é **regressão customer-facing** e desvio do spec ("preservar appointment.confirmed").
>
> **Fix mínimo exigido (NÃO mexer em mais nada):**
> - No `create()`, **após** `uow.commit()`, voltar a emitir `eventBus.publish('appointment.confirmed', {...})`
>   com o mesmo payload de antes (o consumer de integração escuta o **eventBus in-memory**).
> - Manter `appointment.created` durável (outbox) como já está.
> - Atualizar/!adicionar teste cobrindo que `create` dispara `appointment.confirmed` para o consumer.
> - **Sem** migrar o consumer de integração para a outbox nesta missão (incremento futuro).
> - Re-rodar `npm run test:unit` (+ integração) e devolver via `/complete-task` → `/audit-task`.

## MODEL CAPABILITY ASSESSMENT
- **Executor recomendado:** Big Pickle, **EXECUTE_WITH_REVIEW** — toca um **produtor de domínio P0** e o boot de consumers. Auditoria final do Claude Code obrigatória.
- **Nível de risco:** **Médio** — muda a entrega de eventos P0 do agendamento de volátil → durável (transação). **Produção:** sem deploy nesta missão.
- **Escalonamento:** sair da ALLOWLIST, ou converter caminhos além do **create** (update/cancel/complete/reschedule), ou tocar schema/produção → **PARAR e reportar** (ESCALATE). Esses caminhos são o **incremento 2** (próxima missão).

## Contexto (causa-raiz — F2)
`appointment.service` publica `appointment.created`/`appointment.confirmed` via **`eventBus` in-memory volátil**
([appointment.service.js:155,173](../../backend/src/services/appointment.service.js)): fire-and-forget, sem
durabilidade, **erros engolidos** ([event-bus.js:56-64](../../backend/src/shared/core/events/event-bus.js)),
e **fora da transação** do banco. São eventos P0 que a arquitetura promete entregar At-least-once. Já existe a
infra durável correta (`UnitOfWork` + outbox + `OutboxWorker`), usada por `sale`/`cash-flow`. Com **F6** (`6c3c81a`),
eventos sem handler são no-op seguro — então é seguro migrar agora.

## Pré-condições confirmadas (pelo arquiteto)
- `AppointmentRepository extends BaseRepository`, `constructor(db)`, usa `this.db.query` → **compatível com `uow.repository(AppointmentRepository)`** (recebe o client transacional). Mesmo padrão de `sale.service`.
- Nenhum consumidor ativo de `appointment.*` na outbox hoje; os consumers in-memory (`auditLog`, `eventLogger`) só logam.

## Decisão arquitetural (vinculante)
- **Caminho de CRIAÇÃO** (`AppointmentService.create`) passa a usar `UnitOfWork`: `repo = uow.repository(AppointmentRepository)`, `repo.create(...)` + `uow.addEvent('appointment.created', ...)` (e `'appointment.confirmed'` quando aplicável, preservando o payload atual), `await uow.commit()` / `rollback()`. Espelha `sale.service`.
- **Substituir** as duas chamadas `eventBus.publish(...)` do `create` por `uow.addEvent(...)` com metadata `{ companyId, aggregateType:'appointment', aggregateId, traceId }`.
- **Registrar handler durável** de auditoria para `appointment.*` no boot (espelha `auditLogConsumer`), para preservar o log que hoje vem do bus volátil — agora durável e idempotente por handler.
- **Reads** (`findById`, `findConflicts`, `findAll`) permanecem no pool (não exigem transação). A checagem de conflito pode rodar antes do `begin()`.
- **NÃO** converter update/cancel/complete/reschedule nesta missão (incremento 2). Inconsistência temporária (create durável, update volátil) é aceitável e documentada.

## ALLOWLIST (escopo autorizado — APENAS estes arquivos)
- `backend/src/services/appointment.service.js`
- `backend/src/server.js` (APENAS registrar o handler durável de auditoria para `appointment.*` no `outboxWorker`; **não** tocar quarentena Fase C nem outros wirings)
- `backend/src/shared/core/events/consumers.js` (se necessário, expor um handler durável reutilizável para `appointment.*`)
- `backend/tests/**` — teste novo/atualizado de durabilidade do create (unit ou integração)

> Qualquer arquivo fora desta lista = violação de escopo = **PARAR e reportar**.

## Passos
1. Em `appointment.service.create`: envolver `repo.create` + `addEvent` num `UnitOfWork` (begin/commit/rollback), substituindo os dois `eventBus.publish` por `uow.addEvent`.
2. Registrar no boot (`server.js`) um handler durável para `appointment.created`/`appointment.confirmed` que faça o **audit-log durável** (idempotente; pode reutilizar/derivar de `consumers.js`).
3. Manter o import de `eventBus` **apenas** se ainda usado pelos caminhos não migrados (update/cancel/etc.); não remover o bus nesta fase.
4. Teste: provar que criar um agendamento **grava `appointment.created` em `outbox_messages`** na mesma transação (rollback não deixa evento órfão) e que o handler de auditoria processa.

## Validação obrigatória (antes de qualquer push)
```powershell
Set-Location backend
npm run test:unit
npm run test:integration   # se o teste novo for de integração (requer Postgres local)
Set-Location ..
```
- **Esperado:** suítes verdes; novo teste de durabilidade do create passa; nenhuma regressão.

## Critérios de aceite
- [ ] `appointment.service.create` emite `appointment.created` (e `confirmed` quando aplicável) via **outbox durável**, na mesma transação do `create`.
- [ ] Rollback da criação **não** deixa evento na outbox (atomicidade).
- [ ] Handler durável de auditoria para `appointment.*` registrado e idempotente.
- [ ] Caminhos update/cancel/complete/reschedule **inalterados** (ainda voláteis — incremento 2).
- [ ] Suítes verdes, sem skip/xfail.
- [ ] Diff restrito à ALLOWLIST; sem tocar schema, produção, secrets ou quarentena Fase C.

## ❌ Escopo proibido
- ❌ Converter update/cancel/complete/reschedule (incremento 2).
- ❌ Remover o `eventBus` in-memory enquanto houver caminhos volátteis vivos.
- ❌ Tocar a quarentena Fase C / `sale.created` / schema.
- ❌ `git push` sem confirmação humana.

## 🛑 Hard stops
1. Se a checagem de conflito ou os testes de agendamento regredirem → **PARAR e reportar**.
2. Se a transação do `create` não cobrir o `addEvent` (evento fora da atomicidade) → **PARAR** (design errado).
3. Se o diff escapar da ALLOWLIST → **PARAR**.

## Instruções para o OpenCode Executor
1. Rodar o **PREFLIGHT** (`.opencodex/templates/preflight-check.md`) — 5 checagens.
2. Branch esperada: **`fix/appointment-outbox-durability`** (humano cria/entra manualmente; runner NÃO cria branch).
3. Espelhar em `current-task.md` (`running`) e executar.
4. Pós-execução: `/complete-task` → `/audit-task` → devolver ao **Claude Code**. **Push só com confirmação humana.**

## Pós-execução (somente Claude Code)
- Auditar; se APPROVE, registrar e promover o **incremento 2** (update/cancel/complete/reschedule → outbox).
- Após os dois incrementos, reavaliar a remoção do `eventBus` in-memory para `appointment.*`.
