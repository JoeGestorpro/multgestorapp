# 📥 PRÓXIMA MISSÃO — OPS/RECONCILE-ORPHANED-OUTBOX-MESSAGES ✅ CONCLUÍDA

> **Promovido em 2026-06-18. Concluído em 2026-06-18.**
> Data-fix executado via MCP Supabase — 4 eventos `cash_session.*` marcados como `processed`.
> `outbox_messages WHERE status='failed'` → **0 linhas** em produção.

---
status: completed
completed_at: 2026-06-18
task_id: ops/reconcile-orphaned-outbox-messages
title: Data-fix — descartar outbox_messages com status=failed por falta de handler
type: ops-data-fix
mode: EXECUTE
created_by: Claude Code
created_at: 2026-06-06
audited_at: 2026-06-18
promoted_at: 2026-06-18
promoted_by: Claude Code (aprovação humana — "proxima missao")
depends_on: eventbus-unhandled-handler-noop (APPROVE 6c3c81a ✅)
unblocked_by: backup-restore-check GATE PASSOU + eventbus-unhandled-handler-noop APPROVE
requires_human_approval: false
requires_mcp_write: true
---

## Contexto

O OutboxWorker em produção tenta processar qualquer mensagem com `status='pending'` ou `status='failed'`
com `retry_count < max_retries`. Para os eventos `cash_session.opened` e `cash_session.closed`, não existe
handler registrado em `server.js`. O worker os marca como `failed` imediatamente com:

> `"No handler registered for type: cash_session.opened"`

Os 4 eventos datam de **2026-05-19** e têm `retry_count=0` — nunca foram reprocessados, pois o worker
os rejeita instantaneamente. Não há plano de registrar handler para esses tipos via outbox no curto prazo.

**Decisão:** descartar (marcar como `processed`) via UPDATE direto no banco de produção. Sem falha real —
são artefatos de um evento de negócio sem consumidor registrado.

## Estado real em produção (verificado via MCP 2026-06-18)

| type | status | count | last_error | created_at |
|---|---|---|---|---|
| `cash_session.opened` | failed | 3 | "No handler registered for type: cash_session.opened" | 2026-05-19 |
| `cash_session.closed` | failed | 1 | "No handler registered for type: cash_session.closed" | 2026-05-19 |
| `sale.created` | failed | **0** | — | — |

## Gates obrigatórios antes do UPDATE

- [ ] **DRY-RUN:** SELECT confirma exatamente 4 linhas (`cash_session.*` + `No handler%`)
- [ ] **BACKUP:** `last-status.json` exit_code=0 OU dump diário do dia confirmado
- [ ] **CONTAGEM:** nenhuma outra mensagem com `last_error LIKE 'No handler%'`

## Dry-run (SELECT — sem efeito)

```sql
SELECT id, type, status, last_error, retry_count, created_at
FROM outbox_messages
WHERE status = 'failed' AND last_error LIKE 'No handler%'
ORDER BY created_at;
-- Esperado: 4 linhas (3x cash_session.opened + 1x cash_session.closed)
```

## Aplicação (UPDATE — somente após gates ✅)

```sql
UPDATE outbox_messages
   SET status = 'processed', processed_at = NOW()
 WHERE status = 'failed' AND last_error LIKE 'No handler%';
-- Esperado: UPDATE 4
```

## Verificação pós-fix

```sql
SELECT count(*) FROM outbox_messages WHERE status = 'failed';
-- Esperado: 0
```

## Restrições

- ❌ NÃO executar UPDATE sem dry-run confirmado.
- ❌ NÃO executar UPDATE sem backup diário verificado.
- ❌ NÃO tocar mensagens com `last_error` diferente de `'No handler%'`.
- ❌ Sem deploy, sem push, sem merge, sem migration — só MCP Supabase.
- ❌ NÃO alterar `retry_count`, `payload` ou qualquer outro campo além de `status` e `processed_at`.

## Critérios de aceite

- [x] Dry-run: exatamente 4 linhas (cash_session.opened × 3, cash_session.closed × 1)
- [x] Backup diário verificado (exit_code=0, `last-status.json` OK, dump 635KB 2026-06-18T03:39)
- [x] UPDATE afeta exatamente 4 linhas
- [x] Pós-fix: `SELECT count(*) WHERE status='failed'` → 0
- [x] Nenhuma mensagem de outro tipo/motivo alterada

## Resultado: ✅ APROVADO (2026-06-18)

| Verificação | Resultado |
|---|---|
| Dry-run SELECT | 4 linhas — ids confirmados |
| Backup gate | exit_code=0, dump 635KB 2026-06-18T03:39 |
| UPDATE | 4 rows affected |
| Pós-fix `status='failed'` | 0 linhas |
| `status='processed'` total | 4 linhas |
| Outro tipo alterado? | Não — só `cash_session.*` + `No handler%` |

## Próximas na fila (ordem aprovada 2026-06-18)

1. ✅ `e2e-public-booking-validation` (concluído)
2. 🔄 **`ops/reconcile-orphaned-outbox-messages`** (atual)
3. ⏳ `ops/backup-external-copy` — cópia cloud do dump diário
4. ⏳ `security/rls-companies-users-policy` — policies para companies + users
