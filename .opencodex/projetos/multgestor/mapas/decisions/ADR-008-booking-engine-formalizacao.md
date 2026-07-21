---
tipo: decisao
area: dominio
status: aprovado
progresso: 100
criticidade: alta
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-07-20
---

# ADR-008 — Booking Engine: formalização da decisão (supera ADR-007)

> **Status:** ✅ **APROVADA** — formaliza retroativamente uma decisão já tomada e já implementada.
> **Supera:** [[ADR-007-booking-engine]] (proposta com 2 alternativas, aprovada como Opção A em 2026-07-20, implementada no mesmo dia via PR #67, commit `4af95aa`, produção saudável)
> **Evidência completa:** [[../../../auditorias/multgestor/2026-07-20-domain-002-booking-engine]]

## Por que este documento existe

A `ADR-007` decidiu com duas alternativas e evidência direta, porém mais enxuta. Esta ADR reexamina a mesma questão com uma auditoria completa — inventário técnico, mapa de responsabilidades, auditoria de dados/segurança, contratos, cobertura de testes e uma matriz de pontuação com dez critérios — **sem reabrir a escolha**. O objetivo é elevar o rigor da evidência que sustenta uma decisão já em produção, não substituí-la.

**Nada foi revertido.** O código já rebaixado pela ADR-007 permanece como está.

## Contexto

MultGestor tem capacidades de agenda em níveis diferentes: utilitários genuinamente compartilhados (`DOMAIN-001`, concluído) e serviços com estado que se autodenominavam "genéricos" sem nunca terem sido generalizados (`DOMAIN-002`).

## Problema

O Booking Engine misturava responsabilidades genéricas de agendamento com regras específicas de barbearia, sob um nome (`booking-*`) que sugeria reutilização inexistente.

## Alternativas avaliadas

| | A — Promover ao Core | **B — Rebaixar (decisão)** | C — Kernel + Adapter |
|---|---|---|---|
| Pontuação (0–215) | 84 (39%) | **168 (78%)** | 113 (53%) |

Metodologia completa e justificativa célula-a-célula no relatório de auditoria.

## Decisão

**Alternativa B — Rebaixar ao BarberGestor.** Já implementada:

- `services/booking-appointments.service.js` → `services/barber/` (`git mv`, 59 ocorrências `barber_`)
- `services/booking-scheduling.service.js` → `services/barber/` (`git mv`, 32 ocorrências `barber_`)
- `shared/capabilities/booking-engine/scheduling-utils.js` permanece no Core (0 ocorrências `barber_`/`clima_` — genuinamente compartilhado)
- `services/booking-customer-auth.service.js` permanece em `services/` (0 ocorrências — candidato a Core, não movido por falta de necessidade)

## Justificativa — por que B venceu com folga

1. **Reutilização comprovável era aspiracional, não real.** O ClimaGestor — o único segundo nicho existente — **reimplementou** o motor do zero (`clima-core.service.js`) em vez de adaptar o "genérico". A prática já havia decidido antes da teoria.
2. **Zero cobertura de teste torna extração de alto risco.** Nenhuma das 11 suítes de integração cobre criação, conflito, concorrência, reagendamento ou cancelamento de agendamento. Promover ou dividir sem rede de regressão é apostar a estabilidade do BarberGestor em produção.
3. **Custo de migração de B é zero — já aconteceu**, sem incidente, com produção saudável confirmada após o deploy.
4. **Segurança multi-tenant é equivalente nas três alternativas** — RLS e `company_id NOT NULL` já cobrem todas as tabelas envolvidas, nos dois nichos, independentemente de onde o código do domínio mora.

## Achado novo desta auditoria — fora do escopo da decisão, registrado para ação futura

Existem **duas trilhas paralelas** de criação de agendamento no próprio BarberGestor, não capturadas pela ADR-007:

- **Trilha 1 (staff):** `controllers/barber/appointments.js` → `AppointmentService` (repository + `eventBus` + Unit of Work + contratos de evento validados) → `AppointmentRepository` (SQL cru, 40 ocorrências `barber_`).
- **Trilha 2 (cliente/público):** `controllers/client-booking.controller.js` → `client-booking.service.js` (facade) → `services/barber/booking-appointments.service.js` (SQL cru direto, sem repository, sem emissão de evento de outbox visível).

As duas escrevem na mesma tabela (`barber_appointments`) por caminhos de código e níveis de maturidade diferentes. **Isto não muda a decisão desta ADR** — é ortogonal a Core-vs-nicho — mas é um débito real que a próxima missão técnica deve tratar antes de qualquer trabalho adicional no domínio.

## Consequências positivas

- Estrutura do repositório passa a refletir a realidade: nada se anuncia genérico sem ser.
- `shared/capabilities/booking-engine/` fica reservado para o que é de fato compartilhado (hoje: `scheduling-utils.js`).
- Zero risco de regressão introduzido — mudança puramente organizacional, já validada em produção.

## Consequências negativas

- Um terceiro nicho que precisar de agendamento **reimplementará** o motor, como o Clima fez — não há kit pronto.
- A duplicação de trilhas (achado acima) permanece sem solução; cresce o custo de manutenção do domínio até ser tratada.

## Impacto no `NICHEKIT-001`

O DoD original de `NICHEKIT-001` pressupunha "um nicho novo obtém [...] motor de booking sem reimplementar nenhum deles". **Essa pressuposição está formalmente encerrada como falsa** para o estado atual do código. `NICHEKIT-001` deve ser replanejado assumindo que **cada nicho implementa seu próprio motor de agendamento**, reaproveitando apenas `scheduling-utils.js` (e, potencialmente, o padrão `AppointmentService`/`eventBus`/contratos de evento da Trilha 1, se generalizado no futuro — não decidido aqui).

## Impacto no BarberGestor

Nenhum. Produção já validada saudável (HTTP 200, `database: ok`) após o deploy do rebaixamento.

## Impacto no segundo nicho (ClimaGestor)

Nenhuma mudança exigida — o Clima já seguia seu próprio caminho (`clima-core.service.js`), que esta ADR não move nem altera.

## Critérios de reversão

Reabrir esta decisão se, e somente se:
- surgir um terceiro nicho real com necessidade de agendamento **antes** de qualquer generalização deliberada; ou
- a duplicação de trilhas (achado acima) for resolvida de um jeito que naturalmente produza um `AppointmentService` genérico e testado — nesse caso, promover deixaria de ter os custos que hoje pesam contra a Alternativa A.

## Relações
### Depende de
[[ADR-007-booking-engine]] (superada por esta)
### Bloqueia
—
### Usa
[[../matriz-consolidacao-core]] `DOMAIN-001`, `DOMAIN-002`, `NICHEKIT-001`, `NICHEKIT-002`
### É usado por
`barber` (produção) · `clima` (scaffold, não afetado)

## Próximas ações

1. Nenhuma implementação adicional autorizada por este documento.
2. Próxima missão técnica recomendada: **`DOMAIN-002B` — Consolidar as duas trilhas de criação de agendamento do BarberGestor** (achado desta auditoria) **e cobrir com testes de conflito/concorrência/timezone** antes de qualquer trabalho futuro no domínio.
3. `NICHEKIT-001` deve ser replanejado com a pressuposição corrigida (ver § Impacto acima) — missão separada.

## Links
- [[../../../auditorias/multgestor/2026-07-20-domain-002-booking-engine]] — evidência completa, inventário e matriz de pontuação
- [[ADR-007-booking-engine]] — decisão original, superada por esta
- [[../matriz-consolidacao-core]] — `DOMAIN-002`, `NICHEKIT-001`
