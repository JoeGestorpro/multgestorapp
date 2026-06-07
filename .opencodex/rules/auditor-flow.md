# 🔁 AUDITOR FLOW — Regras de auditoria e promoção (canônico)

> ⚠️ Reconstruído em 2026-06-04 após o incidente do `git clean` que apagou o original untracked.
> Conteúdo refeito a partir do fluxo praticado nesta sessão; revise se divergir da intenção original.

## Papéis
- **OpenCode Executor (Big Pickle):** executa a missão de `next-task.md`. Antes, roda o **PREFLIGHT**
  ([`.opencodex/templates/preflight-check.md`](../templates/preflight-check.md)).
- **OpenCode Auditor (read-only):** audita o resultado e escreve o parecer em `.opencodex/audits/latest-audit.md`.
  **Não decide** — apenas alimenta a decisão do Claude Code.
- **Claude Code (Arquiteto/Auditor final):** decide (APPROVE / APPROVE_WITH_NOTES / REQUEST_CHANGES),
  reconcilia a fila e **promove** a próxima missão do `backlog.md` → `next-task.md`.

## Estados da fila (`.opencodex/queue/`)
- `next-task.md`: `status: pending` (missão pronta) | `empty` (sem missão) | `claimed` (executor pegou).
- `current-task.md`: `idle` | `running`.
- `completed-task.md`: `awaiting-audit` → `audited` (com `claude_decision`).
- `audits/latest-audit.md`: `awaiting-decision` → `decided`.

## Regra de promoção (somente Claude Code)
1. Conferir `unblock_condition` da missão no `backlog.md` satisfeita (auditoria APPROVE/APPROVE_WITH_NOTES
   do antecessor + decisão final do Claude).
2. Copiar a missão para `next-task.md` com `status: pending` (allowlist + critérios de aceite + hard stops).
3. Marcar a entrada do backlog como `promoted`.

## Modos de execução
- **EXECUTE:** risco baixo, sem pagamentos/segurança/multi-tenant core. Auto-validação por testes basta;
  Claude faz confirmação final leve.
- **EXECUTE_WITH_REVIEW:** toca pagamentos, LGPD, auth/RLS, dispatcher central ou é customer-facing.
  **Auditoria final do Claude Code é obrigatória** antes de promover a próxima.

## Disciplina inviolável
- **Event Contracts** (`event-contracts.md`): ao auditar diffs de `EventBus`/`Outbox`/`Consumers`/Services que publicam eventos, **reprovar (REQUEST_CHANGES)** se houver campo de evento acessado como variável solta (sem origem), acesso no formato errado (in-memory vs outbox), ausência de helper para campo variável, ou falta do teste unitário do evento.
- Stage **seletivo** (allowlist 1:1). Sem `git add -A`.
- **Sem `git clean`** com governança untracked. `.opencodex/` é **rastreada** (commit `ce034ae`).
- Uma-missão-por-vez. Quarentenas (ex.: Fase C `sale.created`) só saem por promoção formal.
