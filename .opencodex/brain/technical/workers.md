# Workers e Jobs — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[technical/eventos]] · [[technical/backend]] · [[technical/observabilidade]]

---

## Jobs Ativos

| Job | Função | Status |
|---|---|---|
| OutboxWorker | Processa eventos pendentes da outbox | 🟢 `failed=0` |
| AppointmentReminderJob | Envia lembrete de agendamento | 🟢 Ativo |
| TrialEmailJob | Sequência de trial email | 🟢 Ativo |

## Arquitetura

```
Outbox DB → OutboxWorker → Handlers (15 handlers)
                              ├── WhatsApp Confirmação
                              ├── Email Lembrete
                              └── Integrações
```

## Status

- 15 handlers registrados
- `failed=0` (orphaned reconciled A-003)
- Handlers idempotentes (mark-before-emit)
- Sem handler → no-op (F6)

## Referências

- [[technical/eventos]] — Eventos e outbox
- [[technical/backend]] — Backend
- [[maps/multgestor-core/capabilities/notificacoes]] — Notificações
