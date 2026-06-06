# 📥 NEXT TASK — Fila de Execução OpenCode

> Escrito pelo **Claude Code**. Lido e executado pelo **OpenCode Executor** via `/next-task`.
> Fluxo oficial: `docs/runbooks/prompt-orchestration-flow.md`.
> **Ambiente oficial: Windows + PowerShell.**
> Origem: auditoria 2026-06-05 (achado **F6**, reforçado por **F5**). Diagnóstico do Event Bus: `docs/event-bus-architecture.md`.

---
status: pending
task_id: eventbus-unhandled-handler-noop
title: OutboxWorker — evento sem handler vira no-op (processed) em vez de failed permanente (cura F6/F5)
shell: powershell
mode: EXECUTE_WITH_REVIEW
requires_human_approval: false
promoted_by: Claude Code (escolha delegada pelo humano em 2026-06-06 — "decide com base na necessidade do projeto")
required_branch: fix/eventbus-unhandled-outbox
created_branch: fix/eventbus-unhandled-outbox
updated_by: Claude Code
updated_at: 2026-06-06
diagnosis_source: auditoria F6/F5 (sessão 2026-06-05)
---

## MODEL CAPABILITY ASSESSMENT
- **Executor recomendado:** Big Pickle, **EXECUTE_WITH_REVIEW** — toca o **dispatcher central** (OutboxWorker). Auditoria final do Claude Code obrigatória.
- **Nível de risco:** **Médio** — muda a semântica de um caminho do Event Bus durável. **Produção:** sem deploy nesta missão; efeito só após deploy futuro.
- **Escalonamento:** qualquer mudança fora dos 2 arquivos da ALLOWLIST, ou tocar o produtor (`sale.service.js`) / schema / `server.js` → **PARAR e reportar** (ESCALATE).

## Contexto (causa-raiz — F6)
`sale.service` grava `sale.created` na outbox (`uow.addEvent`, [sale.service.js:289](../../backend/src/services/sale.service.js)), mas os handlers de `sale.created` estão em **quarentena** ([server.js:406-414](../../backend/src/server.js)) e **nenhum consumidor ativo** existe. O `OutboxWorker._process` marca evento de tipo sem handler como `status='failed'` **permanente** ([outbox-worker.js:86-94](../../backend/src/shared/core/outbox/outbox-worker.js)). Resultado: **toda venda acumula uma linha `failed`** e nada é processado. F5: a mesma semântica perde eventos em deploy producer-antes-consumer.

## Decisão arquitetural (vinculante para esta missão)
- **"Evento sem handler registrado" NÃO é falha.** É um no-op legítimo em pub/sub — princípio do próprio Event Bus: *"produtores não sabem quem consome"*. Marcar `failed` viola isso.
- **Correção:** quando `handlersMap` está vazio/ausente para `event.type`, marcar a mensagem como **`processed`** (no-op), com **`appLogger.warn`** (`event_id`, `type`, "no handler registered — no-op") e **sem** preencher `last_error` como erro. Não consumir CPU em retry.
- **NÃO** é replay/event-sourcing: eventos emitidos enquanto não havia consumidor são legitimamente não entregues a consumidores inexistentes. Quando a **Fase C** registrar handlers de `sale.created`, vendas **futuras** serão processadas normalmente.
- **GATE break vs continue** (múltiplos handlers): **DEFERIDO para a Fase C** — não alterar o laço de handlers nesta missão.

## ALLOWLIST (escopo autorizado — APENAS estes 2 arquivos)
- `backend/src/shared/core/outbox/outbox-worker.js`
- `backend/tests/unit/outbox-worker.test.js`

> Qualquer arquivo fora destes 2 = violação de escopo = **PARAR e reportar**.

## Passos
1. **`outbox-worker.js` — `_process`, ramo "sem handler"** (hoje `UPDATE ... status='failed'`):
   - Trocar para `UPDATE outbox_messages SET status='processed', processed_at=NOW() WHERE id=$1`.
   - Antes do update, `this.logger?.warn?.(...)` **ou** `appLogger.warn(...)` — usar o logger já disponível no módulo; se não houver, importar `appLogger` (não criar logger novo). Mensagem: `event_id`, `type`, `"no handler registered — marked processed (no-op)"`.
   - **Não** mexer no laço `for (const [name, handler] of handlersMap)` nem no `break`/retry existentes.
2. **`outbox-worker.test.js`**:
   - Atualizar/!adicionar teste que hoje espera `failed` para tipo sem handler → passar a esperar **`processed`** + ausência de `last_error` de erro.
   - Garantir que o comportamento de retry/idempotência por handler existente **não regrediu** (testes atuais verdes).

## Validação obrigatória (antes de qualquer push)
```powershell
Set-Location backend
npm run test:unit
Set-Location ..
```
- **Esperado:** suíte unit verde; teste de "sem handler" agora afirma `processed`.

## Critérios de aceite
- [ ] Evento de tipo sem handler → `status='processed'` (não `failed`), com WARN logado.
- [ ] Caminho de handler com falha real (retry/backoff/`failed` após `max_retries`) **inalterado**.
- [ ] Idempotência por handler (`outbox_message_handlers`) **inalterada**.
- [ ] `npm run test:unit` verde, sem skip/xfail.
- [ ] Diff restrito aos 2 arquivos da ALLOWLIST.
- [ ] **Sem** tocar `sale.service.js`, `server.js`, schema, produção ou secrets.

## ❌ Escopo proibido
- ❌ Tocar o produtor (`sale.service.js`) ou tirar `sale.created` da quarentena (isso é **Fase C**).
- ❌ Alterar schema (`outbox.sql`) / adicionar status novo.
- ❌ Resolver o GATE break vs continue (é **Fase C**).
- ❌ `git push` sem confirmação humana.

## 🛑 Hard stops
1. Se algum teste de retry/idempotência regredir → **PARAR e reportar**.
2. Se a correção exigir tocar fora dos 2 arquivos → **PARAR** (provável sinal de que precisa ser repensada).
3. Se o diff escapar da ALLOWLIST → **PARAR**.

## Instruções para o OpenCode Executor
1. Rodar o **PREFLIGHT** (`.opencodex/templates/preflight-check.md`) — 5 checagens.
2. Branch esperada: **`fix/eventbus-unhandled-outbox`** (humano cria/entra manualmente; runner NÃO cria branch).
3. Espelhar em `current-task.md` (`running`) e executar.
4. Pós-execução: `/complete-task` → `/audit-task` → devolver ao **Claude Code**. **Push só com confirmação humana.**

## Pós-execução (somente Claude Code)
- Auditar; se APPROVE, registrar e **flag de ops**: reconciliar linhas `failed` já acumuladas
  (`UPDATE outbox_messages SET status='processed' WHERE type='sale.created' AND status='failed' AND last_error LIKE 'No handler%'`)
  — **data fix separado**, fora desta missão de código.
- Esta missão **destrava parcialmente a Fase C** (remove o efeito colateral do producer-sem-consumer);
  a Fase C ainda decide o GATE break/continue e religa emissão+handlers de loyalty/package.
