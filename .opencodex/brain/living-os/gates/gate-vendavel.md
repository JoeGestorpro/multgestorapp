# Gate: Vendável (Piloto Pago)

> **Atualizado:** 2026-06-19 · **Status:** 🔴 BLOQUEADO (6/13 critérios do piloto atendidos)
> **Propósito:** Checklist formal para aprovar que o sistema pode ser vendido como piloto pago.

---

## Pré-requisito

O [[gate-producao|Gate Produção]] deve estar **APROVADO** antes deste gate ser avaliado.

---

## Estágio 1 — Piloto Pago Controlado

### Critérios de bloqueio

| # | Critério | Status | Notas |
|---|---|---|---|
| 1 | Fluxo trial → pago testado E2E | ❌ | |
| 2 | Webhook de pagamento processa ativação | ❌ | |
| 3 | Feature gate bloqueia tenant inadimplente | ❌ | |
| 4 | Política de privacidade + consentimento mínimos | ❌ | LGPD |
| 5 | Confirmação ao cliente funciona (email ou WhatsApp) | 🟡 Parcial | |

### Critérios desejáveis

| # | Critério | Status |
|---|---|---|
| 6 | Booking público POST testado E2E | 🟡 Parcial |
| 7 | Painel do dono validado como utilizável | 🟡 Parcial |

---

## Template de veredito

```markdown
## Veredito Gate Vendável — YYYY-MM-DD

### Pré-requisito
[ ] Gate Produção: APROVADO

### Resultado
[APROVADO | BLOQUEADO | APROVADO_COM_NOTAS]

### Bloqueios
- [ ] Gate Produção aprovado: [OK | PENDENTE]
- [ ] Fluxo trial→pago E2E: [OK | PENDENTE]
- [ ] Webhook pagamento: [OK | PENDENTE]
- [ ] Feature gate inadimplente: [OK | PENDENTE]
- [ ] Política privacidade: [OK | PENDENTE]
- [ ] Confirmação cliente: [OK | PENDENTE]

### Assinatura
- **Humano:** [nome]
- **Agente:** [modelo + data]

### Notas
[observações livres]
```
