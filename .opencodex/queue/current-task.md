# ⚙️ CURRENT TASK — Concluída ✅

---
status: completed
task_id: eventbus-appointment-outbox-durability
phase: 1-create-path
title: Durabilidade dos eventos appointment.* — rotear CRIAÇÃO pela outbox durável
branch: fix/appointment-outbox-durability
completed_at: 2026-06-07
---

## Progresso
- [x] PREFLIGHT
- [x] `appointment.service.create` → UnitOfWork + outbox
- [x] Registrar handler durável de auditoria em `server.js`
- [x] Teste de durabilidade do create
- [x] Validar: `npm run test:unit && npm run test:integration` verde
