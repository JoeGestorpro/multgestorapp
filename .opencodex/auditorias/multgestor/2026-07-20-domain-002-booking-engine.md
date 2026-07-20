# DOMAIN-002 — Auditoria do Booking Engine (formalização retroativa)

> **Missão:** PLANO — DOMAIN-002 / ADR do Booking Engine · **Modo:** AUTÔNOMO CONTROLADO, READ_ONLY
> **Data:** 2026-07-20 · **Reconciliação:** ADR-007 já aprovada (Opção A/"rebaixar") e **já implementada em produção** (PR #67, commit `4af95aa`, verificado saudável) antes do início desta missão.
> **Decisão de reconciliação:** formalizar retroativamente — auditoria completa, sem reabrir a escolha, numerada como `ADR-008` (supera `ADR-007` com evidência mais rigorosa).

---

## GATE 0 — Baseline

```text
branch: main @ 4af95aa
main = origin/main, divergência 0/0
bancada operacional: limpa
worktrees: 3 (nenhum conflitante)
stashes: 0
PRs abertas: nenhuma
```

`BASELINE_VALIDADO`.

## GATE 1 — Contexto canônico carregado

Lidos: Mapa Mestre (§ Fase 11, § Primeira ação), matriz `DOMAIN-001`, `DOMAIN-002`, `NICHEKIT-001`, `NICHEKIT-002`, `ADR-007` (já implementada). `CONTEXTO_CANONICO_CARREGADO`.

## GATE 2 — Inventário técnico

### Árvore atual (pós-ADR-007)

```text
services/barber/booking-appointments.service.js   (movido pela ADR-007)
services/barber/booking-scheduling.service.js     (movido pela ADR-007)
services/booking-customer-auth.service.js         (permanece — 0 barber_)
services/client-booking.service.js                (facade público)
services/appointment.service.js                   (NÃO tocado pela ADR-007 — achado novo)
repositories/appointment.repository.js            (NÃO tocado pela ADR-007 — achado novo)
shared/capabilities/booking-engine/scheduling-utils.js  (0 barber_/clima_)
shared/core/events/factories/appointment-events.js      (0 barber — contratos de evento)
services/clima-core.service.js                    (reimplementação paralela do Clima)
```

### Rotas

`routes/barber.routes.js`, `routes/booking-auth.routes.js`, `routes/client.routes.js`, `routes/clima.routes.js`, `routes/public-booking.routes.js`.

### Controllers — duas trilhas paralelas (achado central desta auditoria)

| Trilha | Controller | Serviço | Persistência |
|---|---|---|---|
| 1 — staff (interno) | `controllers/barber/appointments.js` | `AppointmentService` (repository + eventBus + UoW) | `AppointmentRepository` → SQL cru em `barber_appointments` |
| 2 — cliente (público) | `controllers/client-booking.controller.js` | `client-booking.service.js` (facade) → `barber/booking-appointments.service.js` | SQL cru direto em `barber_appointments` |

**As duas trilhas escrevem na mesma tabela por caminhos de código completamente diferentes**, uma com padrão repository+eventos, outra com SQL cru direto no service. Isto não existia no radar da ADR-007.

### Migrations / tabelas

`barber_appointments`, `barber_booking_settings`, `barber_booking_blocks`, `barber_booking_landing`, `booking_customers` (Barber) · `clima_professionals`, `clima_services`, `clima_appointments` (Clima). **Todas** com `company_id UUID NOT NULL REFERENCES companies(id)`.

`BOOKING_ENGINE_INVENTARIADO`.

## GATE 3 — Mapa de responsabilidades

| Componente | Arquivo | Responsabilidade | Classificação | Evidência | Destino recomendado |
|---|---|---|---|---|---|
| `scheduling-utils.js` | `shared/capabilities/booking-engine/` | Funções puras — slot, timezone, conflito | **CORE_GENÉRICO** | 0 ocorrências `barber_`/`clima_`; usado por Barber e Clima | Permanece no Core |
| `booking-appointments.service.js` | `services/barber/` | CRUD de agendamento (fluxo staff+cliente) | **NICHO_BARBERGESTOR** | 59 `barber_`; já rebaixado (ADR-007) | Confirmado — permanece |
| `booking-scheduling.service.js` | `services/barber/` | Disponibilidade/slot | **NICHO_BARBERGESTOR** | 32 `barber_`; já rebaixado | Confirmado — permanece |
| `booking-customer-auth.service.js` | `services/` | Auth de cliente (pré-registro, confirmação de e-mail) | **CORE_CANDIDATO** | 0 `barber_`; não movido pela ADR-007 | Permanece em `services/` — candidato real a Core se um 2º nicho o consumir |
| `appointment.service.js` | `services/` | Orquestração via repository + `eventBus` + Unit of Work | **CORE_CANDIDATO** | 0 `barber_` direto; depende de repository nicho-acoplado | Não mover agora; é o padrão-alvo se um Kernel vier a existir |
| `appointment.repository.js` | `repositories/` | Persistência de agendamento | **NICHO_BARBERGESTOR** | **40** ocorrências `barber_`; toda query hardcoded para `barber_appointments` | Precisaria virar `BarberAppointmentRepository` nomeado, ou ganhar parametrização, para justificar a genericidade do service acima |
| `appointment-events.js` (factory) | `shared/core/events/factories/` | Contratos de evento (`AppointmentCreated`, `Confirmed`, `Canceled`, `Completed`, `Rescheduled`) | **CORE_GENÉRICO** | 0 `barber_`; valida contra `contracts.js`; proteção anti-drift documentada no próprio arquivo | Já correto — nenhuma ação |
| `clima-core.service.js` | `services/` | Motor de agendamento do ClimaGestor | **DUPLICAÇÃO** | 0 `barber_`; reimplementa do zero em vez de adaptar; **sem transação/locking** (ao contrário do Barber) | Não é candidato a fusão automática; é a prova viva de que reimplementar é o padrão real hoje |
| **Duas trilhas de criação de agendamento no mesmo nicho** | `appointment.service+repository` vs `client-booking→booking-appointments.service` | Caminhos de escrita paralelos e divergentes na mesma tabela | **DUPLICAÇÃO** (achado novo) | Nenhuma menção na ADR-007 ou na matriz anterior | **Recomendado consolidar antes de qualquer trabalho de Core** — ver Entregável 4 |
| RLS em todas as tabelas de booking | `rls_tenant_tables.sql` | Isolamento por tenant | **INFRAESTRUTURA_COMPARTILHADA** | Confirmado em `barber_appointments`, `clima_appointments`, `booking_customers`, `barber_booking_*` | OK — nenhuma ação |

`FRONTEIRAS_ATUAIS_MAPEADAS`.

## GATE 4 — Auditoria de dados e segurança

- **Tenant/`company_id`:** presente e `NOT NULL` em todas as tabelas de booking, sem exceção, nos dois nichos.
- **RLS:** ativa (`ENABLE ROW LEVEL SECURITY`) em todas as tabelas relevantes, Barber e Clima igualmente.
- **Concorrência/dupla reserva:**
  - `booking-appointments.service.js` usa `BEGIN`/`COMMIT` e `FOR UPDATE` (locking real) em pelo menos um caminho de escrita.
  - `clima-core.service.js` faz a checagem de conflito com uma query solta, **sem transação** — risco de corrida que o Barber já mitigou e o Clima não.
  - **Nenhuma das duas** tem constraint de exclusão (`EXCLUDE`) ou índice único no banco que impeça dupla reserva estruturalmente — a proteção é só de aplicação, nos dois nichos igualmente. Não é lacuna específica de nicho; é débito arquitetural compartilhado, fora do escopo desta ADR.
- **Idempotência/outbox:** não localizada emissão de evento de outbox nos dois arquivos rebaixados (`booking-appointments.service.js`, `booking-scheduling.service.js`) nem no `clima-core.service.js`. A infraestrutura de evento correta (`appointment-events.js` + contratos) existe e é usada pela **trilha 1** (staff), não pela trilha 2 (cliente/público) nem pelo Clima.

`RISCO_DE_DADOS_E_SEGURANCA_CLASSIFICADO`.

## GATE 5 — Auditoria de contratos

- Endpoints staff: `GET/POST /barber/appointments`, `PATCH /barber/appointments/:id/{status,reschedule}`, `DELETE /barber/appointments/:id` — todos atrás de `requirePlanFeature('advanced_schedule')`.
- Endpoint público: `POST /barber/public/:slug/appointments`, com rate limit por IP e por tenant.
- Envelope de resposta (`{ success, data }`) é genérico; os **campos internos** (`collaborator_id`, joins com `barber_collaborators`) carregam terminologia de nicho — confirmado na trilha de persistência, não no wrapper HTTP.
- Frontend consumidor: `frontend/src/pages/booking/*` (10+ arquivos), `AgendaView.jsx`, `Barber.jsx` — todos assumem vocabulário de barbearia.

`CONTRATOS_DO_BOOKING_MAPEADOS`.

## Testes (GATE 2/3, seção separada por gravidade)

Busca exaustiva nas 11 suítes de integração e nos testes unitários: **zero testes dedicados** a criação, conflito, concorrência, reagendamento, cancelamento ou timezone de agendamento, em qualquer uma das duas trilhas. A única menção a `barber_appointments` em `tests/` é um helper genérico de limpeza de tabela e um teste do *job* de lembrete via WhatsApp (que lê, não escreve, agendamentos). **Este é o achado de maior risco prático desta auditoria** — não é específico da decisão Core-vs-nicho, mas qualquer refatoração futura no domínio (inclusive a duplicação de trilhas encontrada acima) partirá de zero cobertura de regressão.

## GATE 6 — Avaliação das alternativas

> Pontuação 0–5 por critério, aplicada com base na evidência acima. Células individuais carregam julgamento; a metodologia e a base factual estão documentadas para permitir revisão.

| Critério | Peso | A — Promover | B — Rebaixar | C — Kernel+Adapter |
|---|---:|---:|---:|---:|
| Reutilização comprovável | 5 | 1 | 2 | 2 |
| Baixo acoplamento ao BarberGestor | 5 | 1 | 5 | 3 |
| Segurança multi-tenant | 5 | 4 | 4 | 4 |
| Clareza dos contratos | 4 | 2 | 4 | 3 |
| Compatibilidade retroativa | 4 | 2 | 5 | 2 |
| Facilidade de teste | 4 | 1 | 3 | 1 |
| Custo de migração (nota alta = baixo custo) | 3 | 1 | 5 | 1 |
| Complexidade operacional (nota alta = baixa complexidade) | 3 | 2 | 5 | 2 |
| Impacto no NICHEKIT-001 | 5 | 3 | 4 | 4 |
| Capacidade de suportar 2º nicho | 5 | 2 | 3 | 3 |
| **Total ponderado** | **215 (máx)** | **84 (39%)** | **168 (78%)** | **113 (53%)** |

**Leitura honesta dos números que mais pesam contra A e C:** zero cobertura de teste hoje torna qualquer extração (A ou C) uma operação de alto risco sem rede de segurança; zero segundo consumidor real (o Clima reimplementou, não reusou) torna a "reutilização comprovável" de A e C aspiracional, não demonstrada; B tem custo de migração zero pelo fato objetivo de já estar implementada e em produção sem incidentes.

`ALTERNATIVAS_AVALIADAS`.

## Resultado

**B — Rebaixar ao BarberGestor** é a alternativa mais bem sustentada pela evidência, com folga (78% vs. 53% da segunda colocada). A decisão já tomada e implementada (ADR-007, PR #67, `4af95aa`) é **formalizada e validada**, não revisitada.

Ver `ADR-008-booking-engine-formalizacao.md` para a decisão registrada e `2026-07-20-domain-002-booking-engine.md` (este documento) como evidência de suporte.

## GATE 8 — Auditoria da própria ADR

- Evidência coletada cobre GATES 2–5 integralmente, com números revalidados por leitura direta (não citação de memória).
- Critérios do Mapa Mestre e da matriz respeitados: nenhuma alteração de código, banco, rota ou contrato nesta missão.
- Escopo autorizado respeitado: nenhum arquivo movido, nenhuma migration criada.

**Resultado do GATE 8: `APROVADA`.**

## Confirmação de ausência de alterações operacionais

| Verificação | Resultado |
|---|---|
| Código alterado | não |
| Banco alterado | não |
| Migration criada | não |
| Deploy executado | não |
| Rotas/contratos alterados | não |
| Render/Vercel/GitHub Actions tocados | não |
| Único artefato produzido | este relatório + `ADR-008` + atualizações documentais mínimas |
