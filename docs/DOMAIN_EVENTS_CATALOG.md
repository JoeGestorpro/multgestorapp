# MultGestor — Domain Events Catalog

> Versão: 1.0 | Atualizado: Maio 2026
> Todo evento de domínio publicado no sistema deve ser registrado aqui.

---

## Convenção de Nomenclatura

```
<aggregate>.<ação>
```

Exemplos:
- `appointment.created`
- `subscription.expired`
- `customer.registered`

---

## Eventos por Domínio

---

### BOOKING ENGINE

#### `appointment.created`
Publicado quando um agendamento é criado (por admin ou cliente final).

```json
{
  "event_name": "appointment.created",
  "company_id": "uuid",
  "aggregate_type": "appointment",
  "aggregate_id": "uuid",
  "payload": {
    "appointment_id": "uuid",
    "customer_id": "uuid",
    "collaborator_id": "uuid",
    "service_id": "uuid",
    "starts_at": "2026-05-25T10:00:00Z",
    "ends_at": "2026-05-25T10:30:00Z",
    "status": "scheduled",
    "source": "backoffice | public_booking"
  }
}
```

**Consumidores:**
- Communication Layer → envia confirmação WhatsApp/email ao cliente
- CRM Engine → atualiza última interação do cliente

---

#### `appointment.confirmed`
Publicado quando o cliente confirma o agendamento.

```json
{
  "payload": {
    "appointment_id": "uuid",
    "confirmed_at": "ISO8601"
  }
}
```

---

#### `appointment.canceled`
Publicado quando um agendamento é cancelado.

```json
{
  "payload": {
    "appointment_id": "uuid",
    "canceled_by": "customer | admin",
    "reason": "string | null",
    "canceled_at": "ISO8601"
  }
}
```

---

#### `appointment.rescheduled`
Publicado quando um agendamento é reagendado.

```json
{
  "payload": {
    "appointment_id": "uuid",
    "old_starts_at": "ISO8601",
    "new_starts_at": "ISO8601",
    "rescheduled_by": "customer | admin"
  }
}
```

---

#### `appointment.completed`
Publicado quando um atendimento é finalizado.

```json
{
  "payload": {
    "appointment_id": "uuid",
    "collaborator_id": "uuid",
    "service_id": "uuid",
    "completed_at": "ISO8601"
  }
}
```

**Consumidores:**
- CRM Engine → incrementa visitas, atualiza ticket médio
- Analytics Engine → atualiza métricas de colaborador/serviço

---

### SALES / ATENDIMENTO

#### `sale.created`
Publicado quando uma venda/atendimento é registrado.

```json
{
  "payload": {
    "sale_id": "uuid",
    "collaborator_id": "uuid",
    "customer_id": "uuid | null",
    "items": [
      { "type": "service | product", "id": "uuid", "price": 0.00, "commission": 0.00 }
    ],
    "total": 0.00,
    "payment_method": "pix | credito | debito | dinheiro | permuta",
    "appointment_id": "uuid | null"
  }
}
```

---

#### `sale.canceled`
Publicado quando uma venda é cancelada.

```json
{
  "payload": {
    "sale_id": "uuid",
    "canceled_by": "uuid",
    "canceled_at": "ISO8601"
  }
}
```

---

### CASH FLOW / CAIXA

#### `cash.opened`
Publicado quando o caixa é aberto.

```json
{
  "payload": {
    "cash_session_id": "uuid",
    "collaborator_id": "uuid",
    "opened_at": "ISO8601",
    "opening_balance": 0.00
  }
}
```

---

#### `cash.pre_closed`
Publicado quando o caixa entra em pré-fechamento.

---

#### `cash.closed`
Publicado quando o caixa é fechado.

```json
{
  "payload": {
    "cash_session_id": "uuid",
    "collaborator_id": "uuid",
    "closed_at": "ISO8601",
    "total_sales": 0.00,
    "total_by_payment_method": {}
  }
}
```

---

### CUSTOMER / CRM

#### `customer.registered` ⚠️ Pendente
Publicado quando um cliente final se cadastra (via booking público).

```json
{
  "payload": {
    "customer_id": "uuid",
    "name": "string",
    "email": "string",
    "phone": "string | null",
    "source": "public_booking | backoffice"
  }
}
```

---

#### `customer.updated` ⚠️ Pendente

---

#### `customer.churned` ⚠️ Pendente
Publicado quando um cliente fica inativo por X dias (AI-triggered).

---

### SUBSCRIPTION / BILLING

#### `subscription.activated` ⚠️ Pendente
Publicado quando um plano é ativado para um tenant.

```json
{
  "payload": {
    "company_id": "uuid",
    "plan_type": "essencial | profissional | premium",
    "gateway": "kiwify | stripe | manual",
    "starts_at": "ISO8601",
    "ends_at": "ISO8601 | null"
  }
}
```

---

#### `subscription.expired` ⚠️ Pendente
Publicado quando um plano expira.

---

#### `subscription.downgraded` ⚠️ Pendente

---

### COMMUNICATION

#### `whatsapp.message.received` ⚠️ Pendente

```json
{
  "payload": {
    "from": "+55...",
    "message_id": "string",
    "body": "string",
    "timestamp": "ISO8601"
  }
}
```

---

#### `notification.sent` ⚠️ Pendente
Publicado após qualquer notificação enviada com sucesso.

```json
{
  "payload": {
    "channel": "whatsapp | email | sms",
    "to": "string",
    "template": "string",
    "status": "sent | failed"
  }
}
```

---

### AI / INSIGHTS

#### `ai.insight.generated` 🔮 Futuro

```json
{
  "payload": {
    "insight_type": "churn_risk | peak_demand | service_recommendation",
    "entity_type": "customer | collaborator | company",
    "entity_id": "uuid",
    "score": 0.0,
    "explanation": "string"
  }
}
```

---

## Regras de Eventos

1. **Todo evento DEVE ter `company_id`** para isolamento multi-tenant
2. **Todo evento DEVE ter `event_id` único** (UUID gerado no publish)
3. **Todo evento DEVE ter `occurred_at`** em ISO8601 UTC
4. **Eventos publicados via EventBus** (in-process) — devem ser persistidos via Outbox para garantia de entrega em produção
5. **Consumidores NÃO devem lançar exceção não tratada** — falha de consumidor é logada, não propaga
6. **Replay de eventos** deve ser suportado (consumidores devem ser idempotentes)

---

## Status de Implementação

| Evento | Implementado | Outbox | Consumidor |
|---|---|---|---|
| `appointment.created` | ✅ | ⚠️ | ✅ Communication |
| `appointment.completed` | ✅ | ⚠️ | ⚠️ Parcial |
| `sale.created` | ✅ | ⚠️ | ❌ |
| `cash.opened` | ✅ | ⚠️ | ❌ |
| `cash.closed` | ✅ | ⚠️ | ❌ |
| `customer.registered` | ❌ | ❌ | ❌ |
| `subscription.activated` | ❌ | ❌ | ❌ |
| `subscription.expired` | ❌ | ❌ | ❌ |
| `whatsapp.message.received` | ❌ | ❌ | ❌ |
| `notification.sent` | ❌ | ❌ | ❌ |
| `ai.insight.generated` | 🔮 | 🔮 | 🔮 |
