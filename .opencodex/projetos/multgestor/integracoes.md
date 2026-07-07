# Integrações — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[technical/README]] · [[technical/eventos]] · [[technical/workers]]

---

## Integrações Ativas

| Integração | Status | Função |
|---|---|---|
| WhatsApp (Meta Cloud API) | 🟡 Mock ativo | Confirmação de agendamento |
| Billing (AbacatePay) | 🟢 Funcional | Processamento de pagamentos |
| Billing (Kiwify) | 🟢 Funcional | Processamento de pagamentos |
| Email (Resend) | 🟢 Funcional | Emails transacionais |
| Backblaze B2 | 🟢 Validado | Backup externo |

## Pendências

- [ ] WhatsApp real (D-003) — infra existe, mock ativo
- [ ] Webhook pagamento → trial → pago
- [ ] Canal suporte (Zendesk/outro)

## Arquitetura de Integrações

```
Evento (ex: appointment.created)
  → Outbox (durável)
    → Integration Layer
      → WhatsApp (se ativo)
      → Email (Resend)
      → Billing Webhook
```

## Referências

- [[technical/eventos]] — Eventos e integration layer
- [[technical/workers]] — Workers processam integrações
- [[maps/multgestor-core/capabilities/notificacoes]] — Notificações
