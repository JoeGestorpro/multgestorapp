# ⚙️ CURRENT TASK — Em Execução

---
status: completed
task_id: eventbus-unhandled-handler-noop
title: OutboxWorker — evento sem handler vira no-op (processed) em vez de failed permanente
started_at: 2026-06-06
branch: fix/eventbus-unhandled-outbox
---

## Progresso
- [x] PREFLIGHT aprovado
- [x] Editar `outbox-worker.js` — sem handler → `processed` (no-op)
- [x] Editar `outbox-worker.test.js` — testar no-op
- [x] Validar: `npm run test:unit` verde — 626/626
