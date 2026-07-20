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

# CORE-BOOKING-001 — Especificação da Booking Capability (MultGestor Core)

> **Estado desta missão:** definição arquitetural concluída. **Nenhum código foi alterado.** Não confundir com "Booking Kernel implementado".
> **Autoridade:** [[../../mapas/decisions/ADR-008-booking-engine-formalizacao]] (decisão operacional — código permanece em `services/barber/`) + [[../../mapas/decisions/ADR-009-booking-engine-reposicionamento-estrategico]] (destino estratégico — capacidade genérica pertence ao Core).
> **Evidência de base:** inventário comportamental do código atual em [[CORE-BOOKING-001-transition-map]].

## 1. Objetivo

Definir o que é "Booking" como capacidade universal do MultGestor Core: vocabulário, modelo de domínio, invariantes, contratos, eventos, regras de concorrência/idempotência/timezone e a fronteira entre o que é Core e o que é adapter de nicho — sem mover, reescrever ou reimplementar nenhum código nesta missão.

## 2. Escopo

Dentro: definição conceitual e contratual. Fora: implementação, migration, alteração de rotas, alteração de frontend, consolidação das duas trilhas atuais do BarberGestor, deploy. Ver `CLAUDE.md` §1 quanto a rotas expostas — esta missão não cria nem altera nenhuma rota.

## 3. Glossário neutro de nicho

| Termo do Core | Definição | Exemplo — BarberGestor | Exemplo — nicho hipotético (clínica) | Exemplo — nicho hipotético (oficina) | Termos proibidos no Core |
|---|---|---|---|---|---|
| `BookableResource` | Entidade cuja capacidade finita é consumida por uma reserva em um intervalo de tempo | Barbeiro/colaborador | Médico ou sala | Mecânico ou box | `barber`, `collaborator`, `barbeiro` |
| `BookableService` | Definição do que está sendo reservado — duração, e opcionalmente preço/atributos delegados ao adapter | Corte, barba, pacote | Consulta, procedimento | Revisão, manutenção | `haircut`, `corte`, `comissão` |
| `Booking` | Uma reserva concreta de um `BookableResource` para um `BookableService` (ou serviço genérico) em um `TimeRange`, para um `TenantId` | Agendamento do cliente | Consulta marcada | Ordem de serviço agendada | `appointment` como nome de tabela/contrato — o termo é aceitável como sinônimo de uso, não como identificador canônico |
| `AvailabilityRule` | Regra que define quando um recurso está potencialmente disponível (expediente, folgas) | Horário de trabalho do barbeiro | Agenda do médico | Turno do mecânico | — |
| `AvailabilityBlock` | Bloqueio pontual de disponibilidade (folga, manutenção, reserva administrativa) | Folga do barbeiro | Bloqueio de sala | Box em manutenção | — |
| `CapacityAllocation` | O consumo de capacidade que um `Booking` confirmado representa sobre um `BookableResource` em um `TimeRange` | Um barbeiro atendendo um cliente | Um médico atendendo um paciente | Um box ocupado | — |
| `BookingParticipant` | Ator externo ao tenant vinculado à reserva (quem está sendo atendido) | Cliente da barbearia | Paciente | Cliente da oficina | `customer` é aceitável como sinônimo de uso |
| `BookingMetadata` | Extensão livre de dados específicos de nicho, opaca ao Core | Preferência de barbeiro, observação, comissão | Convênio, CID | Placa do veículo, km | — |

Regra de aceitação (ADR-009 §3.4): um termo só entra nesta tabela se tiver significado nos três exemplos de nicho acima sem reescrita — nenhum deles é membro do Core, servem apenas de teste de neutralidade.

## 4. Modelo de domínio

### 4.1 Entidades e value objects

**Entidades (identidade própria, ciclo de vida):** `Booking`, `BookableResource`, `BookableService`, `AvailabilityBlock`.

**Value objects (imutáveis, sem identidade):** `BookingId`, `TenantId`, `ResourceId`, `ServiceId`, `TimeRange` (start, end), `Duration`, `Timezone`, `Capacity`, `IdempotencyKey`, `BookingStatus`, `CancellationReason`.

### 4.2 Agregado e fronteira transacional

**Pergunta central do Gate 4:** qual agregado garante a consistência da reserva e da capacidade consumida?

**Resposta:** o agregado é `CapacityAllocation` por `(ResourceId, TimeRange)` — não o `Booking` isoladamente. Um `Booking` confirmado *pertence* a uma alocação de capacidade; a invariante "a soma das reservas concorrentes não pode ultrapassar a capacidade" (I-05) só pode ser garantida se a verificação de disponibilidade e a criação da alocação ocorrerem na mesma fronteira transacional, sobre o mesmo recurso e intervalo. Isso é a causa raiz do achado do inventário: **nenhuma das duas trilhas atuais do BarberGestor trata a alocação de capacidade como unidade transacional própria** — ambas fazem *check-then-insert* sem lock, o que é exatamente o cenário que este agregado precisa fechar (ver [[CORE-BOOKING-001-invariants]] I-05/I-06).

Consequência de design: o contrato `CreateBooking` não deve ser modelado como "inserir uma linha", e sim como "tentar consumir capacidade de um recurso em um intervalo, e só então materializar a reserva" — a ordem e a atomicidade importam mais do que a forma dos dados.

### 4.3 Estados e transições (canônicos, a definir na implementação)

Estados candidatos, cada um com justificativa (não copiados do código atual sem avaliação):

| Estado | Significado | Entra de | Sai para | Ator | Consome capacidade? |
|---|---|---|---|---|---|
| `PENDING` | Reserva solicitada, aguardando confirmação (útil quando o adapter exige aprovação) | (criação) | `CONFIRMED`, `CANCELED`, `EXPIRED` | sistema/adapter | Opcional — depende de política do adapter (ver I-11) |
| `CONFIRMED` | Reserva garantida, consumindo capacidade | `PENDING` ou direto na criação | `CANCELED`, `COMPLETED`, `NO_SHOW`, `RESCHEDULED*` | staff/cliente/sistema | Sim |
| `CANCELED` | Reserva encerrada sem atendimento, capacidade liberada | `PENDING`, `CONFIRMED` | (terminal) | staff/cliente | Não |
| `COMPLETED` | Atendimento realizado | `CONFIRMED` | (terminal) | staff | Não (já consumida no passado) |
| `NO_SHOW` | Cliente não compareceu | `CONFIRMED` | (terminal) | staff | Não |
| `EXPIRED` | `PENDING` que não foi confirmado a tempo | `PENDING` | (terminal) | sistema | Não |

`RESCHEDULED*`: reagendar não é um estado, é uma operação que gera efeito de `CANCELED` sobre a alocação antiga e `CONFIRMED` sobre uma nova, preservando histórico (I-08) — ver `RescheduleBooking` em [[CORE-BOOKING-001-contracts]].

**Achado do inventário relevante para este Gate:** o código atual da Trilha 1 usa um enum de 7 estados na aplicação (`scheduled, confirmed, arrived, in_progress, completed, canceled, no_show`) mas o `CHECK constraint` do banco só aceita 5 — `arrived` e `in_progress` nunca são de fato persistíveis. Isso é tratado como **defeito do código atual**, não como requisito para o Core: `arrived`/`in_progress` não entram no conjunto canônico acima porque não têm invariante nem uso real comprovado. Fica registrado como item a esclarecer com o time do BarberGestor antes de qualquer adapter (ver [[CORE-BOOKING-001-transition-map]] §Legado).

## 5. Timezone — decisão

**Estratégia canônica: UTC absoluto como armazenamento, timezone do tenant como contexto de exibição/regra.** Já é o padrão observado no código atual (`starts_at`/`ends_at TIMESTAMPTZ`, comparação sempre em UTC) — aqui a especificação **confirma** essa prática como invariante do Core (I-03), não a herda por padrão sem avaliação. Justificativa: comparação de conflito e ordenação são operações do Core e precisam ser inequívocas independentemente de DST/fuso; a tradução para o fuso do tenant (para exibição de slots, cálculo de expediente) é responsabilidade do adapter, que recebe/fornece um `Timezone` explícito por chamada.

**Achado do inventário a corrigir na implementação (não nesta missão):** a Trilha 1 usa timezone padrão `America/Cuiaba` e a Trilha 2 usa `America/Sao_Paulo` (config da empresa) como defaults divergentes — isso é uma inconsistência do código atual, não uma decisão de arquitetura; o Core não deve ter timezone default nenhum, deve exigi-lo explícito em toda chamada que dependa de fuso.

## 6. Concorrência e idempotência — resumo (detalhe em invariantes/contratos)

A verificação de disponibilidade e a alocação de capacidade formam uma única operação atomicamente segura (I-06), com proteção de banco (não apenas de aplicação) contra corrida — porque o inventário confirmou que **nenhuma das duas trilhas atuais tem essa proteção hoje**. Toda operação de escrita aceita uma `IdempotencyKey` opcional (obrigatória para adapters públicos/sem autenticação) — porque o inventário confirmou **ausência total de idempotência** na trilha pública atual. Detalhamento em [[CORE-BOOKING-001-invariants]] e no Gate 7 do plano.

## 7. Segurança e isolamento multi-tenant

Todo contrato do Core exige `TenantId` explícito como primeiro parâmetro, e toda interface de persistência do Core deve operar apenas sob um pool com enforcement de RLS ativo (papel equivalente a `NOBYPASSRLS`, já em uso pela Trilha 1 via `poolTenant`/`requireCompany`). Isso responde diretamente ao achado do inventário de que a Trilha 2 (pública) hoje usa o pool privilegiado sem RLS, dependendo apenas de `WHERE company_id = $N` escrito à mão — o Core **não deve reproduzir esse padrão**; qualquer adapter público deve obrigatoriamente estabelecer contexto de tenant antes de chamar um contrato do Core. A cobertura real de RLS em produção continua sendo `TENANT-003` (não mensurada) — esta especificação não infere nem declara essa cobertura.

## 8. Exemplos de adaptação (ilustrativos, não vinculantes)

```
Core: BookableResource          Nicho (Barber): Barbeiro
Core: BookableService           Nicho (Barber): Corte, barba, pacote
Core: CapacityAllocation        Nicho (Barber): Um barbeiro atendendo um cliente
Core: BookingMetadata           Nicho (Barber): Preferência de barbeiro, comissão, observação
```

O Core nunca importa módulos ou vocabulário do BarberGestor (ver [[CORE-BOOKING-001-core-adapter-boundary]]).

## 9. O que esta especificação não decide

- Nomes finais de tabelas/colunas/classes (decisão de implementação, missão `CORE-BOOKING-003`).
- Se `PENDING` será usado pelo BarberGestor (hoje ele confirma direto — decisão do adapter).
- Se e como as duas trilhas atuais convergem tecnicamente (mapeado, não decidido — ver [[CORE-BOOKING-001-transition-map]]).
- Estrutura de tabela/schema de outbox ou eventos (usa o padrão já `CONCLUÍDO` em `EVENT-001`/`EVENT-002`, não redefinido aqui).

## Relações
### Depende de
[[../../mapas/decisions/ADR-008-booking-engine-formalizacao]] · [[../../mapas/decisions/ADR-009-booking-engine-reposicionamento-estrategico]]
### Usa
`DOMAIN-001` (`scheduling-utils.js`, já Core) · `EVENT-001` · `EVENT-002` · `TENANT-001` · `TENANT-002`
### Documentos irmãos desta missão
[[CORE-BOOKING-001-contracts]] · [[CORE-BOOKING-001-invariants]] · [[CORE-BOOKING-001-core-adapter-boundary]] · [[CORE-BOOKING-001-test-strategy]] · [[CORE-BOOKING-001-transition-map]]
