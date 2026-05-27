# Booking Engine — Core Capability

Utilitarios e contratos reutilizaveis por qualquer vertical do MultGestor
que precise de agendamento de servicos.

## Conteudo

- `scheduling-utils.js` — funcoes puras: calculo de slots, timezone, conflitos

## Verticals usando esta capability

- BarberGestor: `services/booking-customer-auth.service.js`, `services/booking-scheduling.service.js`

## Como adicionar um novo vertical

1. Importe `schedulingUtils` de `shared/capabilities/booking-engine`
2. Implemente o adapter para o schema do seu vertical
3. Registre neste README
