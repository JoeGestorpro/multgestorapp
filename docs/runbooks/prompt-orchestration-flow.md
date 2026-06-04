# Prompt Orchestration Flow — MultGestor (governança Claude Code ↔ OpenCode)

> ⚠️ **Reconstruído em 2026-06-04** após o incidente do `git clean` que apagou `docs/runbooks/` untracked.
> Refeito a partir do fluxo praticado; revise se divergir da intenção original.

## Papéis
- **Claude Code** = Arquiteto/Auditor final. Escreve missões em `.opencodex/queue/next-task.md`, decide
  (APPROVE / APPROVE_WITH_NOTES / REQUEST_CHANGES) e **promove** a próxima do `backlog.md`.
- **OpenCode Executor (Big Pickle)** = executa a missão de `next-task.md`. Roda o **PREFLIGHT** antes.
- **OpenCode Auditor (read-only)** = audita e escreve parecer em `.opencodex/audits/latest-audit.md`
  (não decide; alimenta a decisão do Claude).

## Arquivos da fila (`.opencodex/` — RASTREADA no git desde `ce034ae`)
| Arquivo | Papel |
|---|---|
| `queue/next-task.md` | Missão pronta (`status: pending`) / `empty` / `claimed` |
| `queue/current-task.md` | `idle` / `running` (espelha a missão em execução) |
| `queue/completed-task.md` | Resultado do executor (`awaiting-audit` → `audited`) |
| `queue/backlog.md` | Missões bloqueadas + `unblock_condition` encadeadas |
| `audits/latest-audit.md` | Parecer do auditor / decisão do Claude |
| `templates/preflight-check.md` | Protocolo obrigatório antes de `/next-task` |
| `rules/auditor-flow.md` | Regras de auditoria e promoção |

## Ciclo de uma missão
1. **Claude** grava `next-task.md` (allowlist + critérios de aceite + hard stops + modo).
2. **OpenCode** `/next-task` → **roda PREFLIGHT** (`templates/preflight-check.md`); se passar, espelha
   `current-task.md=running` e cria a branch do card.
3. **OpenCode** implementa com **staging seletivo** (allowlist 1:1; sem `git add -A`).
4. **OpenCode** `/complete-task` → preenche `completed-task.md` com evidência real de testes.
5. Se modo **EXECUTE_WITH_REVIEW** → `/audit-task` (auditor) → devolve ao **Claude** para **decisão final**.
6. **Claude** decide, reconcilia a fila e **promove** a próxima missão do `backlog.md`.

## Modos de execução
- **EXECUTE:** risco baixo; auto-validação por testes basta.
- **EXECUTE_WITH_REVIEW:** pagamentos, LGPD, auth/RLS, dispatcher central ou customer-facing →
  **auditoria final do Claude obrigatória**.

## Regras invioláveis
- **PREFLIGHT** antes de qualquer `/next-task` (5 checagens bloqueantes).
- **Nunca** `git clean` / `git stash` / troca-de-branch / criar-branch automaticamente.
- Quarentenas (ex.: Fase C `sale.created`) só saem por promoção formal.
- `docs/private/` nunca entra em commit.

## Referências
- `.opencodex/templates/preflight-check.md` · `.opencodex/rules/auditor-flow.md` ·
  `.opencode/rules/auto-queue-runner.md`
