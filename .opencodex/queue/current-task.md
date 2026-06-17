# ⚙️ MISSÃO ATUAL — ⏸️ idle (nenhuma missão em execução)

---
status: idle
updated_at: 2026-06-17
note: >-
  Slot in-flight vazio. O último ciclo (XSS data-sanitization, Bloco A + A v2) foi CONCLUÍDO e
  ARQUIVADO em `archive/2026-06-15-xss-data-sanitization.md`. Nada está running/claimed agora
  (CHECK 4 do preflight passa).
---

## 🎯 P0 atual = BACKUP-RESTORE-CHECK
A prioridade ativa vive em [`next-task.md`](next-task.md): **backup-restore-check** (P0,
`mode: PLAN_ONLY`, `requires_human_approval: true`). É um **portão operacional conduzido por humano** —
não é executado pelo runner (sem ALLOWLIST/critérios executáveis, de propósito). Por isso o slot
in-flight permanece `idle`: não há missão de código em execução, e sim um gate de backup aguardando o humano.

## 🔒 Próxima na fila (BLOQUEADA)
**Fase C — Integração de Negócio + Testes de Integração** (`fase-c-integracao-e-testes`) está
**BLOQUEADA até o plano de backup ser aprovado**. Card completo em [`backlog.md`](backlog.md).

## Ciclo XSS — encerrado (arquivado)
`companies.name`, `users.name`, `public_display_name`, `business_description`, `barber_services.name`
todos com `~ '[<>]'` = 0; portão `/register` com `<script>` → 400. Detalhe completo em
[`archive/2026-06-15-xss-data-sanitization.md`](archive/2026-06-15-xss-data-sanitization.md).
