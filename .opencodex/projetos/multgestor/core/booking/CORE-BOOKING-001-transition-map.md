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

# CORE-BOOKING-001 — Mapa de transição do legado + roadmap de implementação

> Classificação do código atual, não execução de mudança. Fonte primária: inventário comportamental READ-ONLY realizado nesta missão (Gate 2), sobre `services/barber/`, `repositories/appointment.repository.js`, `controllers/barber/appointments.js`, `controllers/client-booking.controller.js`.

## Legenda de destino

`REUTILIZAR` (já genérico, só muda de lugar depois de testado) · `ADAPTAR` (vira parte do adapter BarberGestor) · `SUBSTITUIR` (comportamento será reimplementado no Core, o código atual não migra) · `MANTER_NO_NICHO` (é de nicho por natureza, nunca vai ao Core) · `DEPRECAR` (defeito do código atual, não deve virar requisito) · `INVESTIGAR` (achado que precisa de decisão humana antes de qualquer missão futura)

## Trilha 1 — Staff (`AppointmentService` / `AppointmentRepository`)

| Componente | Comportamento atual | Destino | Dependência | Risco | Missão futura |
|---|---|---|---|---|---|
| `scheduling-utils.js` | Funções puras de horário/slot, já sem `barber_`/`clima_` | `REUTILIZAR` | Nenhuma — já é `DOMAIN-001`, concluído | Baixo | Nenhuma (já Core) |
| Verificação de conflito (`findConflicts`, `appointment.repository.js:92-111`) | Query de overlap sem lock, dentro de transação | `SUBSTITUIR` | Requer I-06 (proteção de banco contra corrida) inexistente hoje | Alto — corrida real possível | `CORE-BOOKING-004` |
| Máquina de transição de `update()`/`reschedule()` | Nenhuma validação de transição (aceita qualquer status) | `SUBSTITUIR` | Nenhuma | Médio — hoje permite transições sem sentido (ex.: `canceled` → `confirmed`) | `CORE-BOOKING-004` |
| Emissão de eventos (outbox + dual-emit) | Cobertura parcial: `delete` não emite nada; `reschedule` só outbox | `ADAPTAR` (mecanismo de outbox é `EVENT-002`, já Core; o quê/quando emitir muda) | `EVENT-001`, `EVENT-002` | Baixo — mecanismo já sólido, só falta cobertura completa | `CORE-BOOKING-004` |
| `AppointmentIntegrationConsumer` (WhatsApp) | Consome eventos in-memory da Trilha 1 | `MANTER_NO_NICHO` | Eventos do Core (via catálogo) | Baixo | `BARBER-BOOKING-ADAPTER-001` |
| Filtro `collaborator_id`, `service_id`→comissão | Específico de barbearia | `MANTER_NO_NICHO` | — | — | `BARBER-BOOKING-ADAPTER-001` |
| Enum de 7 estados na aplicação vs. 5 no CHECK constraint do banco (`arrived`, `in_progress` nunca persistem) | Divergência ativa não exercitada | `INVESTIGAR` | — | Médio — comportamento morto ou bug latente, precisa de decisão humana: remover do enum ou implementar de fato | Decisão antes de `CORE-BOOKING-004` |
| Timezone default `America/Cuiaba` (`appointment.repository.js:52`) | Hardcoded, diferente do resto do sistema | `DEPRECAR` | — | Baixo hoje, alto se replicado no Core | Corrigir junto de `CORE-BOOKING-004` |

## Trilha 2 — Cliente/público (`booking-appointments.service.js` / `booking-scheduling.service.js`)

| Componente | Comportamento atual | Destino | Dependência | Risco | Missão futura |
|---|---|---|---|---|---|
| `validateBookableSlot`/`getConflicts` | Mesma lógica de overlap da Trilha 1, duplicada, sem lock | `SUBSTITUIR` | I-06 | Alto | `CORE-BOOKING-004` |
| Ausência de emissão de eventos | Cliente cria/cancela sem `eventBus`/outbox — sem notificação, sem paridade com staff | `SUBSTITUIR` | I-09, catálogo de eventos | Alto — hoje o cliente não recebe confirmação por WhatsApp, por exemplo | `CORE-BOOKING-004` |
| Uso do pool privilegiado sem RLS (`pool.connect()` fora de `requireCompany`) | Depende só de `WHERE company_id` manual | `SUBSTITUIR` | I-01, `TENANT-002` | **Crítico** — maior risco de todo o inventário | Deve ser tratado antes ou junto de `CORE-BOOKING-004`, não pode esperar `CLOSEOUT` |
| Ausência de idempotência | Requests duplicados podem criar reservas duplicadas | `SUBSTITUIR` | I-07 | Alto | `CORE-BOOKING-004` |
| Janela de cancelamento (`cancellation_limit_hours`) | Regra de negócio configurável por empresa | `ADAPTAR` | Nenhuma — vira hook de adapter (I-11) | Baixo | `BARBER-BOOKING-ADAPTER-001` |
| Depósito/pagamento antecipado (`WalletService`) | Acoplado a wallet, específico | `MANTER_NO_NICHO` | — | — | `BARBER-BOOKING-ADAPTER-001` |
| Landing pública (`barber_booking_landing`) | Apresentação, não booking | `MANTER_NO_NICHO` | — | — | Fora do escopo de Booking Capability |
| `allow_customer_select_collaborator`/`allow_any_collaborator` | Regra de seleção de recurso específica do nicho | `ADAPTAR` | Nenhuma — mapeia para lógica de escolha de `BookableResource` no adapter | Baixo | `BARBER-BOOKING-ADAPTER-001` |

**Nota sobre o achado crítico:** o uso do pool sem RLS pela Trilha 2 já era um risco conhecido antes desta missão (mencionado na ADR-008 apenas como "achado ortogonal"). Esta missão reclassifica-o formalmente como `SUBSTITUIR`/`Crítico` porque impacta diretamente a invariante I-01 do Core — mas **nenhuma correção é executada aqui**; fica registrado para priorização humana, possivelmente antes mesmo de `CORE-BOOKING-002`, dado que é um risco de segurança independente da consolidação arquitetural.

## Roadmap de implementação (sequência, sem execução)

| # | Missão | Depende de | Escopo | Principal risco | DoD | Rollback | Autorização |
|---|---|---|---|---|---|---|---|
| 1 | `CORE-BOOKING-002` | Esta missão (definição) | Escrever testes de caracterização sobre o comportamento atual das duas trilhas, sem mover código | Testes caracterizarem comportamento incorreto como se fosse requisito (ex.: ausência de idempotência) | Suíte de caracterização cobrindo os 9 pontos do inventário (§1-9), rodando em CI | Deletar a suíte nova — não toca código de produção | Humana, baixo risco (só testes) |
| 2 | `CORE-BOOKING-003` | `CORE-BOOKING-002` | Implementar as interfaces/contratos deste documento como código executável, em paralelo ao legado (sem substituí-lo) | Interfaces vazarem vocabulário de nicho por pressa | Contratos de [[CORE-BOOKING-001-contracts]] existem como código, testados contra adapter fake, legado intocado | Remover módulo novo — legado continua funcionando, nada foi trocado | Humana |
| 3 | `CORE-BOOKING-004` | `CORE-BOOKING-003` | Implementar I-01 a I-11 de fato, incluindo proteção de concorrência real (lock/constraint de banco) | Migration de constraint de banco mal projetada afeta tabela em produção | Todos os testes de concorrência de [[CORE-BOOKING-001-test-strategy]] passam contra banco real | Reverter migration (se houver) + feature flag desligando o Kernel novo | Humana — primeira missão desta cadeia que toca banco |
| 4 | `BARBER-BOOKING-ADAPTER-001` | `CORE-BOOKING-004` | BarberGestor consome o Core para casos **novos**; legado atual permanece intacto e em uso | Adapter reintroduzir acoplamento (Core importar algo do Barber) | Nenhuma dependência do Core em módulo `barber`; suíte de contrato roda também contra este adapter | Desativar rota/flag do adapter novo — trilhas antigas continuam servindo tráfego | Humana |
| 5 | `BARBER-BOOKING-MIGRATION-001` | `BARBER-BOOKING-ADAPTER-001` | Convergência gradual das duas trilhas legadas para o adapter, incremental, sem big bang | Perda de paridade de comportamento (ex.: notificação WhatsApp parar de disparar) | Cada etapa migrada mantém paridade validada pela suíte de `CORE-BOOKING-002`; nenhuma etapa migra >1 fluxo por vez | Cada etapa é revertível independentemente — trilha antiga não é removida até a nova estar validada em produção | Humana, por etapa |
| 6 | `CORE-BOOKING-VALIDATION-001` | `BARBER-BOOKING-MIGRATION-001` (ou paralelo, se um segundo nicho concreto surgir antes) | Segundo nicho real consumindo a Capability do Core, sem reimplementar o motor | Repetir o erro do ClimaGestor (reimplementar por pressão de prazo) | Segundo adapter passa a mesma suíte de contrato do Core, sem cópia de lógica de agendamento | Nicho novo pode continuar temporariamente com solução própria se a validação falhar — não bloqueia o nicho, só adia a conclusão da Capability | Humana |
| 7 | `CORE-BOOKING-CLOSEOUT` | `CORE-BOOKING-VALIDATION-001` | Consolidação e evidência final; só aqui "Booking Core consolidado" pode ser declarado | Declarar consolidação sem os dois consumidores reais comprovados | Matriz atualizada refletindo `DOMAIN-002` como `PROMOVIDO`, com os dois adapters como evidência | N/A — é um documento de encerramento, não uma mudança de sistema | Humana |

Nenhuma destas sete missões está autorizada por `CORE-BOOKING-001`. Cada uma exige abertura e autorização humana próprias, no momento em que for priorizada.

## Relações
### Depende de
[[CORE-BOOKING-001-capability-spec]] · [[CORE-BOOKING-001-invariants]]
### É usado por
`CORE-BOOKING-002` (ponto de partida do inventário)
