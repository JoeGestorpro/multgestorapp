# 🟡 IMPACT — Adicionar Recorrência ao Agendamento

> **Severidade:** 🟡 Moderado
> **Data da análise:** 2026-06-24

---

## 1. Informações Básicas

| Campo | Valor |
|---|---|
| **Alteração** | Adicionar suporte a agendamentos recorrentes (ex: toda segunda-feira) |
| **Motivação** | Clientes com serviços periódicos (ex: corte a cada 15 dias) |
| **Severidade** | 🟡 Moderado |

## 2. Impacto por Categoria

| Categoria | Afetado? | Detalhes |
|---|---|---|
| **APIs** | ✅ Sim | `/api/appointments/recurring` (novo), alterar POST appointments |
| **Telas** | ✅ Sim | Booking público, agenda admin |
| **Tabelas** | 🟡 Sim | Nova tabela `recurring_appointments` ou campo `recurring` em appointments |
| **Componentes** | ✅ Sim | BookingWidget (adicionar opção de recorrência) |
| **Serviços** | ✅ Sim | AppointmentService (nova lógica de recorrência), novo worker |
| **Testes** | ✅ Sim | Novos testes para lógica de recorrência |
| **Auditorias** | 🟡 Sim | RLS (nova tabela), performance |
| **PRDs** | ✅ Sim | Criar/atualizar PRD |
| **Agentes** | ✅ Sim | Product Manager, Platform Architect, Database, Frontend |
| **Skills** | ❌ Não | Habilidade existente |
| **Riscos** | 🟡 Sim | Complexidade de cancelamento, edição em massa |

## 3. Análise Detalhada

### APIs
| Endpoint | Método | Mudança |
|---|---|---|
| `/api/appointments` | POST | Novo parâmetro `recurring` |
| `/api/appointments/recurring` | GET,POST,DELETE | Novo recurso |
| `/api/appointments/recurring/:id/skip` | POST | Pular uma ocorrência |

### Telas
| Rota | Componente | Mudança |
|---|---|---|
| `/public/booking` | BookingWidget | Checkbox "Repetir agendamento" |
| `/agenda` | AgendaView | Indicador visual de recorrência |

### Tabelas
| Tabela | Mudança |
|---|---|
| `appointments` | Novo campo `recurring_rule` (JSON com regras iCalendar) |
| Opção: `recurring_patterns` | Nova tabela para padrões de recorrência |

### Serviços
| Service | Mudança |
|---|---|
| AppointmentService | Nova função `createRecurring` |
| Novo: RecurringWorker | Job semanal que cria agendamentos futuros |

## 4. Testes Necessários

- [x] Unit tests de geração de ocorrências
- [x] Integration tests de CRUD recorrente
- [x] Testes de edge cases (cancelamento, pulo)
- [x] Regressão de agendamento simples

## 5. Auditorias Necessárias

- [x] RLS (nova tabela/campos)
- [x] Performance (muitas recorrências)
- [x] UX (clareza da interface)

## 6. Agentes Envolvidos

| Agente | Papel |
|---|---|
| [[agents/product-manager]] | Definição de UX |
| [[agents/platform-architect]] | Modelagem de dados |
| [[agents/database-architect]] | Schema |
| [[agents/frontend-specialist]] | UI de recorrência |
| [[agents/qa]] | Testes |

## 7. Riscos Introduzidos

| Risco | Impacto | Mitigação |
|---|---|---|
| Geração excessiva de registros | Médio | Limitar horizonte de recorrência |
| Cancelamento complexo | Alto | UI clara para editar/cancelar série |
| Conflito com feriados | Baixo | Calendário de exceções |

## 8. Recomendação

- [x] Aprovado (funcionalidade com bom custo-benefício)
- [ ] Aprovado com ressalvas
- [ ] Recusado

---

> **Última atualização:** 2026-06-24
> **Cenário:** Planejado — não implementado
> **Links:** [[product/feature-genome/GENOME-agendamento]] · [[product/simulation-center/SIMULATION-adiciona-recorrencia]]
