# Audit Report — OutboxWorker — evento sem handler vira no-op (processed) em vez de failed permanente (cura F6/F5)

---
status: decided
claude_decision: APPROVE
claude_decided_at: 2026-06-06
claude_decision_note: diff confere com spec; outbox-worker 15/15 verde; laço de handlers/retry inalterados; commit local 6c3c81a (sem push).
task_id: eventbus-unhandled-handler-noop
title: OutboxWorker — evento sem handler vira no-op (processed) em vez de failed permanente (cura F6/F5)
audited_by: OpenCode Auditor (Big Pickle)
audited_at: 2026-06-06
verdict: APPROVE
risk_level: Médio (muda semântica do dispatcher central)
branch: fix/eventbus-unhandled-outbox
---

## 1. Contexto
Os cenários F6/F5 descritos em `current-task.md` (next-task) diagnosticam um problema no
`OutboxWorker._process()`: eventos sem handler registrado eram marcados como `failed`
permanentemente, sem chance de retry ou reconciliação futura. Um handler que chega atrasado
(dead letter reconciler, deploy de handler novo) nunca conseguiria processar esses eventos.
A correção muda o status para `processed` com um `warn` log, tratando o gap como no-op
(consome e não falha).

## 2. ALLOWLIST — 2/2 arquivos, sem scope drift
| # | Arquivo | Tipo | Status |
|---|---------|------|--------|
| 1 | `backend/src/shared/core/outbox/outbox-worker.js` | Editado | ✅ |
| 2 | `backend/tests/unit/outbox-worker.test.js` | Editado | ✅ |

Nenhuma alteração fora da ALLOWLIST. `.opencodex/` (governança) tracking apenas.

## 3. Verificação item a item

### 3.1. `outbox-worker.js`
- Novo import: `const { appLogger } = require('../logger')` ✅
- `appLogger.warn({ event_id, type }, 'no handler registered — marked processed (no-op)')` ✅
- `UPDATE outbox_messages SET status = 'processed', processed_at = NOW()` em vez de `failed` com `last_error` ✅
- `return` precoce mantido (mata processamento sem chamar handler inexistente) ✅
- Sem regressão nos demais paths (handler único, múltiplos handlers) — não alterados ✅

### 3.2. `outbox-worker.test.js`
- Descrição do teste renomeada: `'sem handler registrado → mensagem processed (no-op)'` ✅
- Asserção nova: busca query com `status = 'processed'` e `processed_at`; espera `toBeDefined()` ✅
- Asserção antiga migrada: busca query com `status = 'failed'`; espera `toBeUndefined()` ✅
- Demais testes do arquivo intactos (single-handler retrocompat, múltiplos handlers, erro, retry) ✅

## 4. Critérios de aceite
- [x] Evento sem handler vira `processed` (não `failed`) — não trava dead letter
- [x] `appLogger.warn` emitido com `event_id` e `type` para observabilidade
- [x] **626/626** unit tests passed (`npm test`)
- [x] **Sem `skip`**, **sem `xfail`**
- [x] **Sem alteração em produção** — apenas worker + teste
- [x] **Sem exposição de secrets**
- [x] **Diff restrito aos 2 arquivos da ALLOWLIST**

## 5. Escopo proibido — verificado
- ❌ Nenhum arquivo fora dos 2 da ALLOWLIST foi alterado ✅
- ❌ Nenhuma string de conexão, secret, ou credencial no diff ✅
- ❌ `deploy.yml`, migrations, schemas de banco intactos ✅
- ❌ Nenhum `skip`/`xfail` introduzido ✅

## 6. Veredito
**APPROVE** — 2/2 ALLOWLIST respeitado, sem scope drift, sem secrets, sem produção.
626/626 unit tests verdes. Mudança semântica correta (no-op seguro com warn em vez de failed
permanente). Cura os cenários F6/F5 do diagnóstico.
