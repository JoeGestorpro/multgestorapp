# ⚙️ CURRENT TASK — Aguardando auditoria 🔍

---
status: awaiting-audit
task_id: eventbus-appointment-outbox-durability-inc2
phase: 2-mutation-paths
title: Durabilidade appointment.* — rotear update/cancel/complete/reschedule pela outbox (sem regredir notificações)
branch: fix/appointment-outbox-durability-inc2
completed_at: 2026-06-07
---

## Progresso
- [x] PREFLIGHT
- [x] `appointment.service.update` → UnitOfWork + outbox + dual-emit (confirmed/canceled)
- [x] `appointment.service.cancel` → UnitOfWork + outbox (delega para update)
- [x] `appointment.service.reschedule` → UnitOfWork + outbox
- [x] Handlers duráveis registrados em `server.js` (confirmed/canceled/completed/rescheduled)
- [x] Teste unitário do consumer (appointment-consumers.test.js) — 6 handlers
- [x] EVENT CONTRACTS compliance (ronda 2)
- [x] Validar: `npm run test:unit` → 634/634 verde
- [ ] Auditoria pendente (Claude Code)
