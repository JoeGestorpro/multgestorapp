# 📥 PRÓXIMA MISSÃO — E2E-PUBLIC-BOOKING-VALIDATION 🟢 ATIVA (READ_ONLY_VALIDATION)

> **Promovido em 2026-06-18.** Validar o fluxo público de agendamento end-to-end
> no tenant `barbearia-joefelipe` — sem alterar código nem dados.
> **Mode: READ_ONLY_VALIDATION** — apenas requisições GET. POST só com aprovação humana explícita.

---
status: completed
completed_at: 2026-06-18
task_id: e2e-public-booking-validation
title: Validar o fluxo público de agendamento end-to-end (slug barbearia-joefelipe)
mode: READ_ONLY_VALIDATION
requires_human_approval: false
created_by: Claude Code
created_at: 2026-06-14
promoted_at: 2026-06-18
unblocked_by: backup-restore-check GATE PASSOU (aprovação humana)
standing_alert: >-
  Apenas GET contra produção. Não alterar código, dados, secrets ou config.
  POST de agendamento só com aprovação humana explícita (cria dado real).
---

## Endpoints a validar

| Endpoint | Método | Cria dado? | Auth? | Arquivo:linha |
|---|---|---|---|---|
| `/api/public/booking/:slug` | GET | ❌ | ❌ Público | `public-booking.routes.js:15` |
| `/api/barber/public/:slug/available-slots` | GET | ❌ | ❌ Público | `barber.routes.js:47` |
| `/api/public/booking/:slug/appointments` | POST | ✅ Cria agendamento real | ❌ Público | `public-booking.routes.js:16` |

> Ambos os roteamentos (`/api/public/` e `/api/barber/public/`) são funcionais e equivalentes.
> Não há rate limiting aplicado a essas rotas (só em `/register` e `/login`).

## Dados de teste — tenant `barbearia-joefelipe`

| Item | Qtde | Tabela |
|---|---|---|
| Serviços ativos | 16 | `barber_services` |
| Colaboradores bookable | 7 | `barber_collaborators` |
| Working hours configurados | 7 | `barber_working_hours` |

> `barbearia-teste` tem 0 working_hours → slots vazios (não usar).

## Fluxo de validação (read-only)

### Passo 1 — Booking Info
```http
GET /api/public/booking/barbearia-joefelipe
```
Esperado: `200` com `{ company, services, collaborators, workingHours, bookingSettings, landing }`

### Passo 2 — Available Slots
```http
GET /api/barber/public/barbearia-joefelipe/available-slots?date=<YYYY-MM-DD>
```
Esperado: `200` com lista não vazia de slots disponíveis.

### Passo 3 (opcional, human-gated) — Criar agendamento de teste
```http
POST /api/public/booking/barbearia-joefelipe/appointments
Content-Type: application/json

{
  "service_id": "<uuid>",
  "collaborator_id": "<uuid>",
  "start_time": "<ISO>",
  "customer_name": "Teste Auditoria",
  "customer_phone": "+5511999999999",
  "customer_email": "teste@auditoria.com"
}
```
> ⚠️ **Só com aprovação humana explícita.** Cria agendamento real + dispara outbox.

## Observações arquiteturais (da exploração de código)

- **Sem tenant context nas queries públicas** — `getPublicBookingInfo`, `getSchedulingAvailability` e
  `createPublicAppointment` usam `pool.query()` direto (sem `withTenantContext`). RLS não isola essas
  queries porque `app.current_company_id` não é definido. Na prática, o runtime atual (`postgres`)
  tem `BYPASSRLS`, então RLS não é gate atual — mas isso **não é um bug destes endpoints**, é uma
  característica de toda a base (documentada no runbook `runtime-role-least-privilege`).
- **Sem testes** — não há testes unitários ou de integração para `getPublicBooking`,
  `getPublicAvailableSlots` ou `createPublicAppointment`. Esta validação manual é a primeira cobertura.

## Proibições
- ❌ Alterar código/backend/frontend · ❌ SQL de escrita · ❌ deploy
- ❌ POST de agendamento sem aprovação humana explícita
- ❌ Alterar secrets, config, migrations

## Próximas na fila (ordem aprovada)
1. ✅ **`e2e-public-booking-validation`** (atual)
2. ⏳ **`ops/reconcile-failed-sale-created-outbox`** — data-fix outbox `sale.created` failed
3. ⏳ **`fase-c-integracao-e-testes`** — requer decisão `break` vs `continue` no OutboxWorker antes

## Critérios de aceite
- [x] `GET /api/public/booking/barbearia-joefelipe` → 200 com tenant info completa
- [x] `GET /api/barber/public/barbearia-joefelipe/available-slots?date=<futura>` → 200 com slots
- [-] POST de agendamento (se aprovado) → SKIPPED (human-gated — não solicitado)
- [x] Nenhum erro 500 — qualquer erro deve ser de dados/config, não de código

## Resultado: ✅ APROVADO (2026-06-18)

Critérios 1, 2 e 4 confirmados contra produção. Critério 3 (POST) não testado por decisão
de governança (standing_alert — requer aprovação humana explícita).

## Achados documentados

### Estrutura real da API vs task card
| Campo esperado | Real | Nota |
|---|---|---|
| `bookingSettings` | `settings` | Chave renomeada na implementação |
| `workingHours` (top-level) | não existe | Working hours p/ slots ficam em `barber_working_hours`, consultadas em `getSchedulingAvailability` separadamente |
| `landing` (top-level) | não existe | Dados de landing embutidos em `company.*` |

### Contagens reais vs task card
| Item | Task card | Real prod | Explicação |
|---|---|---|---|
| Serviços ativos | 16 | 15 | 1 serviço desativado/deletado desde criação do card |
| Colaboradores bookable | 7 | 1 (JoeFelipe) | `listBookableCollaborators` filtra `is_active=true AND available_for_booking=true AND NOT is_deleted` — só JoeFelipe qualifica |
| Working hours | 7 | n/a (não retornado) | `barber_working_hours` não exposto em booking-info; slots computados OK em rota separada |

### Comportamentos confirmados
- `serviceId` **obrigatório** para `/available-slots` → 400 sem ele (validação correta, não bug)
- Slots 12:00–13:30 bloqueados em 2026-06-19 e 2026-06-20 — agendamentos reais existentes
- Timezone `America/Cuiaba` ✅ retornado em `settings.timezone`
- `any_collaborator: true` sem collaboratorId; `false` com collaboratorId — correto
- Sem erros 500 em nenhum endpoint testado
