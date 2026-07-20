# Booking Engine — Core Capability

Utilitarios e contratos reutilizaveis por qualquer vertical do MultGestor
que precise de agendamento de servicos.

## Conteudo

- `scheduling-utils.js` — funcoes puras: calculo de slots, timezone, conflitos

## Verticals usando esta capability

- BarberGestor: `services/booking-customer-auth.service.js`, `services/barber/booking-scheduling.service.js`, `services/barber/booking-appointments.service.js`

> **ADR-007 (2026-07-20):** os serviços com estado (`booking-appointments`, `booking-scheduling`)
> foram rebaixados para `services/barber/` — eles consultam tabelas `barber_*` diretamente
> e nunca foram genéricos de fato (91 ocorrências de `barber_` entre os dois). Apenas
> `scheduling-utils.js` (esta pasta) é código genuinamente compartilhado.

## Como adicionar um novo vertical

1. Importe `schedulingUtils` de `shared/capabilities/booking-engine`
2. Implemente o adapter para o schema do seu vertical
3. Registre neste README
