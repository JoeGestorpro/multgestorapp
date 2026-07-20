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

# CORE-BOOKING-001 — Contratos canônicos (conceituais, não interfaces de código)

> Estes são contratos arquiteturais documentados — não há criação de interfaces/classes TypeScript ou JS nesta missão. A implementação executável é escopo de `CORE-BOOKING-003`.

Nenhum contrato abaixo expõe nome de tabela, SQL ou vocabulário de nicho (`barber`, `collaborator`, `commission` etc. não aparecem em nenhuma entrada/saída/erro).

## `CreateBooking`

- **Intenção:** consumir capacidade de um `BookableResource` em um `TimeRange`, materializando um `Booking`.
- **Ator:** staff do tenant, cliente final autenticado, ou público (sem autenticação, via adapter).
- **Entrada conceitual:** `tenantId, resourceId, serviceId?, startAt, endAt|duration, timezone, capacityRequested, participantReference, idempotencyKey, metadata`
- **Validações:** I-01, I-02, I-03, I-04, I-05, I-06, I-07, I-10.
- **Saída conceitual:** `bookingId, status, startAt, endAt, resourceAllocation, createdAt, version`
- **Erros:** `BOOKING_RESOURCE_NOT_FOUND`, `BOOKING_SERVICE_NOT_FOUND`, `BOOKING_INVALID_TIME_RANGE`, `BOOKING_NOT_AVAILABLE`, `BOOKING_CAPACITY_EXCEEDED`, `BOOKING_CONFLICT`, `BOOKING_IDEMPOTENCY_CONFLICT`, `BOOKING_TENANT_MISMATCH`
- **Idempotência:** obrigatória para adapters públicos (I-07); opcional mas recomendada para staff.
- **Autorização:** delegada ao adapter — o Core não conhece papéis de nicho, só recebe um `actor` já autorizado.
- **Efeitos:** cria `Booking` + `CapacityAllocation` na mesma transação (I-06).
- **Evento produzido:** `BookingCreated`.
- **Extensão permitida ao adapter:** decidir se o estado inicial é `PENDING` ou `CONFIRMED`; enriquecer `metadata`.

## `CheckAvailability`

- **Intenção:** consultar se um `BookableResource` (ou conjunto) tem capacidade livre em um `TimeRange`, sem reservar.
- **Ator:** qualquer.
- **Entrada:** `tenantId, resourceId|resourceQuery, serviceId?, timeRangeQuery, timezone`
- **Saída:** lista de `TimeRange` disponíveis com capacidade restante por slot.
- **Erros:** `BOOKING_RESOURCE_NOT_FOUND`, `BOOKING_TENANT_MISMATCH`
- **Idempotência:** N/A (leitura).
- **Nota de concorrência:** resultado é *point-in-time* — não garante reserva; `CreateBooking` deve revalidar (I-06). Isso corresponde ao padrão já observado no código atual (checar, depois tentar criar), mas aqui a garantia real vem do `CreateBooking`, não desta consulta.

## `ConfirmBooking`

- **Intenção:** transicionar um `Booking` de `PENDING` para `CONFIRMED`.
- **Ator:** staff, sistema (auto-confirmação), ou cliente (se o adapter permitir).
- **Entrada:** `tenantId, bookingId, idempotencyKey?`
- **Validações:** transição válida (estado atual deve ser `PENDING`); I-01.
- **Erros:** `BOOKING_NOT_FOUND`, `BOOKING_INVALID_TRANSITION`, `BOOKING_TENANT_MISMATCH`
- **Evento produzido:** `BookingConfirmed`.
- **Extensão:** adapter pode anexar pré-condições (ex.: depósito pago) antes de permitir a chamada — o Core não sabe sobre depósito.

## `CancelBooking`

- **Intenção:** transicionar `Booking` para `CANCELED`, liberando capacidade.
- **Ator:** staff, cliente (dentro da política do adapter).
- **Entrada:** `tenantId, bookingId, reason?, idempotencyKey?`
- **Validações:** transição válida a partir de estado não-terminal; I-01, I-08.
- **Erros:** `BOOKING_NOT_FOUND`, `BOOKING_INVALID_TRANSITION`, `BOOKING_TENANT_MISMATCH`
- **Efeitos:** libera `CapacityAllocation` associada.
- **Evento produzido:** `BookingCanceled`.
- **Extensão:** política de janela de cancelamento (ex.: "não cancelável a menos de N horas", já existente no código atual) é regra de adapter, aplicada antes de chamar o contrato do Core.

## `RescheduleBooking`

- **Intenção:** mover um `Booking` `CONFIRMED`/`PENDING` para um novo `TimeRange`, preservando histórico.
- **Ator:** staff, cliente (conforme política do adapter).
- **Entrada:** `tenantId, bookingId, newStartAt, newEndAt|duration, idempotencyKey?`
- **Validações:** I-02, I-03, I-04, I-05, I-06, I-08.
- **Efeitos:** libera a `CapacityAllocation` antiga e cria uma nova, atomicamente (I-06); preserva o `bookingId` e histórico da reserva original (I-08).
- **Erros:** herda os de `CreateBooking` + `BOOKING_NOT_FOUND`, `BOOKING_INVALID_TRANSITION`
- **Evento produzido:** `BookingRescheduled`.

## `BlockAvailability` / `ReleaseAvailability`

- **Intenção:** criar/remover um `AvailabilityBlock` administrativo (folga, manutenção) que reduz capacidade sem ser um `Booking`.
- **Ator:** staff/adapter administrativo.
- **Entrada:** `tenantId, resourceId, timeRange, reason?`
- **Erros:** `BOOKING_RESOURCE_NOT_FOUND`, `BOOKING_INVALID_TIME_RANGE`, `BOOKING_TENANT_MISMATCH`
- **Evento produzido:** `AvailabilityBlocked` / `AvailabilityReleased`.
- **Nota:** não gera `Booking`, mas participa das mesmas invariantes de capacidade (I-04, I-05) — um `CheckAvailability` deve considerar blocks ativos.

## `GetBooking` / `ListBookings`

- **Intenção:** leitura de uma ou várias reservas do tenant, com filtros.
- **Ator:** qualquer com autorização do adapter.
- **Entrada:** `tenantId, bookingId` ou `tenantId, filters (resourceId?, status?, timeRange?, participantReference?)`
- **Erros:** `BOOKING_NOT_FOUND` (só em `GetBooking`), `BOOKING_TENANT_MISMATCH`
- **Nota:** `ListBookings` não substitui relatórios de nicho (ex.: relatório de comissão) — esses ficam inteiramente no adapter, consumindo dados de `BookingMetadata` e de suas próprias tabelas.

## Convenção de erros

Todos os códigos de erro usam o prefixo `BOOKING_`, sem termo de nicho, seguindo o padrão já `CONCLUÍDO` de `CONTRACT-003` (respostas e erros padronizados) — este documento não redefine o envelope de erro HTTP, apenas os códigos de domínio.

## Relações
### Depende de
[[CORE-BOOKING-001-capability-spec]] · [[CORE-BOOKING-001-invariants]]
### Usa
`CONTRACT-001` (validação de request) · `CONTRACT-003` (respostas/erros) · `EVENT-001` (contratos de evento)
### É usado por
[[CORE-BOOKING-001-test-strategy]] (base para testes de contrato)
