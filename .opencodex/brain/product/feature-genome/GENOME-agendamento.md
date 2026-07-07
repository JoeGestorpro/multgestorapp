# 📅 GENOME — Agendamento (Booking Engine)

> **Status:** 🟢 Completo · Produção
> **PRD:** `product/prds/PRD-agendamento` (a criar)
> **Digital Twin:** [[product/digital-twin/barbergestor]]

---

## 1. Identificação

| Campo | Valor |
|---|---|
| **Nome** | Agendamento (Booking Engine) |
| **Produto** | BarberGestor |
| **Módulo** | Agenda |
| **Status** | 🟢 Completo |
| **PRD** | `product/prds/PRD-agendamento` |
| **Digital Twin** | [[product/digital-twin/barbergestor]] |

## 2. Fluxo

| Etapa | Descrição | Ator |
|---|---|---|
| 1 | Cliente acessa booking público | Cliente |
| 2 | Seleciona serviço | Cliente |
| 3 | Seleciona colaborador | Cliente |
| 4 | Seleciona horário disponível | Cliente |
| 5 | Informa dados de contato | Cliente |
| 6 | Confirma agendamento | Cliente |
| 7 | Sistema registra e notifica | Sistema |
| 8 | Lembrete automático enviado | Worker |

## 3. Banco

| Tabela | Operação | Campos |
|---|---|---|
| `appointments` | CREATE, READ, UPDATE, DELETE | id, company_id, customer_id, employee_id, service_id, start_time, end_time, status, notes |
| `customers` | CREATE, READ | id, company_id, name, phone, email |
| `services` | READ | id, company_id, name, duration, price |
| `employees` | READ | id, company_id, name, specialty |

**RLS:** Filtro por `company_id` em todas as tabelas.

## 4. API

| Método | Endpoint | Função |
|---|---|---|
| GET | `/api/public/booking/services` | Listar serviços disponíveis |
| GET | `/api/public/booking/employees` | Listar colaboradores |
| GET | `/api/public/booking/slots?date=&employee_id=&service_id=` | Horários disponíveis |
| POST | `/api/public/booking/appointments` | Criar agendamento |
| GET | `/api/appointments` | Listar agendamentos (admin) |
| PUT | `/api/appointments/:id` | Atualizar agendamento |
| DELETE | `/api/appointments/:id` | Cancelar agendamento |

## 5. Frontend

| Página | Componente | Propósito |
|---|---|---|
| `/public/booking` | BookingWidget | Fluxo de agendamento público |
| `/agenda` | AgendaView | Grid de agendamentos (admin) |
| `/agenda/[id]` | AppointmentDetail | Detalhes do agendamento |

## 6. Backend

| Service | Função | Eventos |
|---|---|---|
| `AppointmentService` | CRUD + validação de disponibilidade | `appointment.created`, `appointment.cancelled` |
| `SlotService` | Cálculo de horários disponíveis | — |
| `NotificationService` | Envio de notificações | — |

## 7. UX

| Estado | Tela | Comportamento |
|---|---|---|
| Loading | BookingWidget | Skeleton loader |
| Empty | BookingWidget | "Nenhum horário disponível" |
| Success | BookingWidget | Confirmação com resumo |
| Error | BookingWidget | Mensagem de erro amigável |

## 8. Testes

| Tipo | Cenário | Obrigatório |
|---|---|---|
| Unit | Validação de conflito de horário | Sim |
| Unit | Cálculo de slots disponíveis | Sim |
| Integration | Fluxo completo de agendamento | Sim |
| E2E | Agendamento público → confirmação | Parcial |

## 9. Riscos

| Risco | Impacto | Probabilidade | Mitigação |
|---|---|---|---|
| Booking duplicado | Alto | Baixa | Validação no backend + unique constraint |
| Cliente não comparece | Médio | Alta | Lembrete automático + no-show recovery |

## 10. Agentes

| Papel | Agente |
|---|---|
| Arquitetura | [[agents/platform-architect]] |
| Backend | — |
| Frontend | [[agents/frontend-specialist]] |
| QA | [[agents/qa]] |

---

> **Última atualização:** 2026-06-24
> **Links:** [[product/feature-genome/README]] · [[product/digital-twin/barbergestor]]
