# 🔴 IMPACT — Remover Tabela `appointments`

> **Severidade:** 🔴 Crítico
> **Data da análise:** 2026-06-24

---

## 1. Informações Básicas

| Campo | Valor |
|---|---|
| **Alteração** | Remover a tabela `appointments` do banco de dados |
| **Motivação** | Hipótese: substituir por engine de agendamento externa |
| **Severidade** | 🔴 Crítico |

## 2. Impacto por Categoria

| Categoria | Afetado? | Detalhes |
|---|---|---|
| **APIs** | ✅ Sim | Todos os endpoints de `/api/appointments` e `/api/public/booking/*` |
| **Telas** | ✅ Sim | Booking público, agenda admin, dashboard |
| **Tabelas** | ✅ Sim | `appointments` (drop), `sale_items` (FK), `notifications` (FK) |
| **Componentes** | ✅ Sim | BookingWidget, AgendaView, AppointmentDetail |
| **Serviços** | ✅ Sim | AppointmentService, SlotService, NotificationService |
| **Testes** | ✅ Sim | Todos os testes de agendamento |
| **Auditorias** | ✅ Sim | Segurança, RLS, performance |
| **PRDs** | ✅ Sim | PRD de agendamento |
| **Agentes** | ✅ Sim | Platform Architect, Database Architect, Frontend, QA |
| **Skills** | ✅ Sim | Migração de dados, integração com API externa |
| **Riscos** | ✅ Sim | Perda de dados, downtime, migração |

## 3. Análise Detalhada

### APIs
| Endpoint | Método | Mudança |
|---|---|---|
| `/api/public/booking/*` | GET,POST | Remover ou redirecionar |
| `/api/appointments` | GET,POST | Remover |
| `/api/appointments/:id` | GET,PUT,DELETE | Remover |

### Telas
| Rota | Componente | Mudança |
|---|---|---|
| `/public/booking` | BookingWidget | Substituir por widget externo |
| `/agenda` | AgendaView | Substituir por integração |
| `/dashboard` | Dashboard | Remover cards de agendamento |

### Tabelas
| Tabela | Mudança | Impacto RLS |
|---|---|---|
| `appointments` | DROP | Perda do RLS existente |
| `sale_items` | Remover FK | Alterar schema |
| `notifications` | Remover referências | Alterar worker |

### Serviços
| Service | Mudança | Eventos |
|---|---|---|
| AppointmentService | Remover ou migrar | `appointment.*` deixam de existir |
| SlotService | Remover | — |
| NotificationService | Remover trigger de lembrete | — |

## 4. Testes Necessários

- [x] Unit tests de AppointmentService (remover ou migrar)
- [x] Integration tests de agendamento
- [x] E2E de booking público
- [x] Regressão geral do sistema

## 5. Auditorias Necessárias

- [x] Segurança (dados de agendamentos existentes)
- [x] Performance (migração de dados)
- [x] RLS (nova engine pode não suportar)
- [x] Dados (exportação/migração de agendamentos históricos)

## 6. Agentes Envolvidos

| Agente | Papel |
|---|---|
| [[agents/platform-architect]] | Decisão arquitetural |
| [[agents/database-architect]] | Migração de dados |
| [[agents/frontend-specialist]] | Substituição de componentes |
| [[agents/qa]] | Testes de regressão |
| [[agents/security]] | Segurança dos dados |

## 7. Riscos Introduzidos

| Risco | Impacto | Mitigação |
|---|---|---|
| Perda de agendamentos históricos | Alto | Exportação antes do DROP |
| Downtime durante migração | Alto | Manutenção programada |
| Incompatibilidade com nova engine | Alto | PoC antes da migração |
| Clientes insatisfeitos com mudança | Médio | Comunicação antecipada |

## 8. Recomendação

- [ ] Aprovado
- [ ] Aprovado com ressalvas
- [x] Recusado (sem justificativa de negócio validada)

---

> **Última atualização:** 2026-06-24
> **Cenário:** Simulação — não implementado
> **Links:** [[product/impact-graph/IMPACT-migrar-banco]] · [[product/simulation-center/SIMULATION-remove-tabela-x]]
