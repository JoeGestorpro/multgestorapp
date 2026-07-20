---
tipo: especificacao
area: dominio
missao: CORE-BOOKING-001
status: definido
progresso: 100
criticidade: alta
implementado: false
ultima_revisao: 2026-07-20
---

# CORE-BOOKING-001 — Matriz Core vs. Adapter

> Fronteira arquitetural: o Core não importa módulos do BarberGestor (ou de qualquer nicho). O adapter importa e chama o Core.

## Pertence ao Core

Identidade da reserva · tenant · intervalo temporal · disponibilidade · capacidade · conflito · confirmação · cancelamento · reagendamento · transições de estado · idempotência · concorrência · eventos de domínio (catálogo abaixo) · contratos (`CreateBooking` etc.) · erros genéricos (`BOOKING_*`) · interfaces de persistência (não a implementação SQL) · política de extensão via `BookingMetadata`/hooks.

## Pertence ao adapter do nicho

Nome e tipo do recurso (ex.: "barbeiro") · terminologia comercial (ex.: "corte", "consulta") · cálculo de comissão · regras de preferência de profissional · regras promocionais/depósito · duração e preço específicos do serviço · pré-requisitos do serviço · detalhes complementares (landing page, banners, depoimentos) · autorização específica do módulo (papéis do nicho) · apresentação no frontend.

## Catálogo de eventos do domínio

| Evento | Gatilho | Payload mínimo | Consumidores esperados | Dados proibidos no payload |
|---|---|---|---|---|
| `BookingCreated` | `CreateBooking` bem-sucedido | `bookingId, tenantId, resourceId, timeRange, status, causationId, correlationId` | notificação (WhatsApp/e-mail), analytics | qualquer campo de nicho (comissão, preferência) — vai em `metadata`, não em campo de topo |
| `BookingConfirmed` | `ConfirmBooking` bem-sucedido | idem + `confirmedAt` | notificação, integração externa | idem |
| `BookingCanceled` | `CancelBooking` bem-sucedido | idem + `reason, canceledAt` | notificação, liberação de capacidade em relatórios | idem |
| `BookingRescheduled` | `RescheduleBooking` bem-sucedido | `bookingId, previousTimeRange, newTimeRange` | notificação | idem |
| `BookingCompleted` | Transição para `COMPLETED` | idem `BookingConfirmed` | relatórios, faturamento (via adapter) | idem |
| `BookingExpired` | `PENDING` expira sem confirmação | `bookingId, expiredAt` | limpeza de capacidade reservada | idem |
| `BookingNoShowRecorded` | Marcação de não comparecimento | `bookingId, recordedAt` | relatórios | idem |
| `AvailabilityBlocked` | `BlockAvailability` | `resourceId, timeRange, reason?` | agenda, relatórios | idem |
| `AvailabilityReleased` | `ReleaseAvailability` | `resourceId, timeRange` | agenda | idem |

Todos os eventos seguem o padrão já `CONCLUÍDO` de `EVENT-001` (contratos de evento + factory) e `EVENT-002` (outbox transacional): versão, `tenantId`, `causationId`, `correlationId`, e emissão idempotente. Esta missão não redefine esse mecanismo — apenas confirma que o catálogo acima deve segui-lo.

**Achado do inventário que este catálogo corrige:** hoje só a Trilha 1 (staff) emite eventos, e de forma parcial (`AppointmentRescheduled` e `delete` não têm dual-emit; a Trilha 2/pública não emite nenhum evento). O Core, ao ser implementado, deve emitir o evento correspondente em **toda** mutação de estado (I-09) — a paridade entre canais de criação deixa de depender de qual trilha foi usada.

## O que o adapter pode fazer (extensão)

- Adicionar validação própria antes de chamar um contrato do Core (ex.: exigir depósito antes de `ConfirmBooking`).
- Anexar dados em `BookingMetadata` (opaco ao Core).
- Definir sua própria autorização/RBAC antes de invocar o contrato.
- Definir duração/preço de `BookableService` e resolvê-los para o Core no momento da chamada.
- Implementar hooks de projeção de leitura (ex.: view "agenda do barbeiro" com nome do colaborador) consumindo eventos do Core.
- Decidir se usa `PENDING` como estado intermediário ou pula direto para `CONFIRMED`.

## O que o adapter não pode fazer

- Ignorar `TenantId` ou usar um pool sem enforcement de RLS para operações de Booking (viola I-01 — acha do inventário: é exatamente o que a Trilha 2 pública faz hoje).
- Alterar estados centrais fora dos contratos do Core (ex.: `UPDATE` direto em tabela de booking).
- Contornar a verificação de conflito/capacidade (I-04, I-05, I-06).
- Criar eventos com nome ou payload incompatível com o catálogo acima.
- Modificar tabelas centrais do Core diretamente via SQL do nicho.
- Acessar dados de `Booking` de outro tenant, mesmo que por engano de query.

## Exemplo aplicado (BarberGestor como adapter piloto, ilustrativo — não implementado)

```
Core: BookableResource(id=barbeiro-42)      Adapter: resolve nome, foto, especialidades
Core: CreateBooking(resourceId=barbeiro-42) Adapter: injeta metadata.preferredCollaborator, calcula comissão após BookingConfirmed
Core: BookingConfirmed (evento)             Adapter: consumer dispara notificação WhatsApp (reaproveita AppointmentIntegrationConsumer já existente)
```

## Relações
### Depende de
[[CORE-BOOKING-001-capability-spec]] · [[CORE-BOOKING-001-invariants]] · [[CORE-BOOKING-001-contracts]]
### Usa
`EVENT-001` · `EVENT-002` · `TENANT-001` · `TENANT-002`
### É usado por
`BARBER-BOOKING-ADAPTER-001` (missão futura, não iniciada)
