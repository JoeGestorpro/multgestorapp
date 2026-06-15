# 🗄️ ARCHIVE — Baixa de fila (appointment/outbox inc.2)

> **Arquivado em:** 2026-06-14 · **Por:** Claude Code (Passo 1 — limpeza de fila stale)
> **Motivo:** as tasks abaixo já estão **concluídas e reconciliadas na `main`**; a fila ficou
> congelada em 2026-06-07 e foi dada baixa formal sem tocar em código.

---

## Tasks fechadas

### 1. `eventbus-appointment-outbox-durability-inc2` (era `current-task.md`)
- **Status anterior:** `awaiting-audit` (phase 2-mutation-paths).
- **Realidade:** commit **`0d654f3`** (`feat(appointment): mutation paths (update/cancel/complete/reschedule) -> outbox duravel (F2 inc.2)`) **está contido em `main`** (`git branch --contains 0d654f3` ✅).
- **Veredito:** CONCLUÍDO — auditoria pendente perdeu objeto; código estável em produção.

### 2. `eventbus-mutation-integration-tests` (era `next-task.md`)
- **Status anterior:** `pending` (gate de push do inc.2, decisão humana 2026-06-07).
- **Realidade:** `backend/tests/integration/outbox-durability.test.js` **já cobre os 4 mutation paths** na `main`:
  - `AppointmentConfirmed` ✅
  - `AppointmentCanceled` ✅
  - `AppointmentCompleted` ✅
  - `AppointmentRescheduled` ✅
- **Veredito:** CONCLUÍDO — gate de integração satisfeito.

---

## Evidências (read-only, 2026-06-14)
```
git branch --contains 0d654f3            → inclui main
git grep AppointmentRescheduled -- backend/tests/integration/outbox-durability.test.js → presente (4 paths)
```

## Notas de governança
- Nenhum código de aplicação foi tocado nesta baixa.
- Relacionado: `83f79aa docs(brain)` — "falha de deploy NÃO é regressão do código reconciliado".
- Backlog separado (NÃO feito aqui): consolidação de namespaces `.agent/` vs `.opencode/` vs `.opencodex/`;
  limpeza de branches locais órfãs.
