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

# CORE-BOOKING-001 — Catálogo de invariantes da Booking Capability

> Nenhuma invariante aqui foi implementada. Este documento define o contrato que a implementação futura (`CORE-BOOKING-004`) deve satisfazer e que os testes (`CORE-BOOKING-002`/`003`) devem caracterizar/verificar.

| ID | Invariante | Justificativa | Ponto de aplicação | Forma de teste | Comportamento sob falha | Responsabilidade |
|---|---|---|---|---|---|---|
| I-01 | Nenhuma operação lê ou escreve `Booking`/`BookableResource`/`AvailabilityBlock` fora do `TenantId` do chamador | Vazamento cross-tenant é o risco de maior severidade em qualquer SaaS multi-tenant; o inventário mostrou que a trilha pública atual depende só de filtro manual, sem RLS | Toda query de persistência do Core | Teste de integração com dois tenants fixture, tentando ler/escrever cruzado | Erro `BOOKING_TENANT_MISMATCH`, nunca retorno parcial | Core |
| I-02 | `TimeRange.end` é estritamente posterior a `TimeRange.start` | Intervalo inválido não tem significado de domínio | Construção do value object `TimeRange` | Teste unitário puro | Rejeição na construção, antes de qualquer I/O | Core |
| I-03 | Toda operação com `TimeRange` opera sobre timestamp absoluto (UTC); timezone é metadado de exibição/regra, nunca de armazenamento primário | Ambiguidade de fuso é fonte de bug silencioso (ver achado de `America/Cuiaba` vs `America/Sao_Paulo` no código atual) | Construção de `TimeRange`, comparação de conflito | Teste unitário com DST e fusos diferentes produzindo o mesmo resultado de conflito | Rejeição se `Timezone` ausente onde exigido pelo adapter | Core (armazenamento/comparação) · Adapter (exibição) |
| I-04 | Uma `CapacityAllocation` só pode ser criada se há capacidade disponível no `BookableResource` para o `TimeRange` solicitado | Definição básica de "reserva válida" | `CheckAvailability`, `CreateBooking` | Teste de integração: reservar capacidade zero deve falhar | Erro `BOOKING_NOT_AVAILABLE` | Core |
| I-05 | A soma das `CapacityAllocation` ativas sobre um `(ResourceId, TimeRange sobreposto)` nunca ultrapassa `Capacity` do recurso | Generalização de "sem overlap" para recursos com capacidade >1 (ex.: sala com 2 vagas) | Mesma fronteira transacional de I-06 | Teste de concorrência (N requisições simultâneas para capacidade N-1) | Erro `BOOKING_CAPACITY_EXCEEDED` para o excedente | Core |
| I-06 | Verificar disponibilidade e alocar capacidade formam uma única operação atomicamente segura (transação + proteção de banco contra corrida) | O inventário confirmou que **nenhuma trilha atual tem essa proteção** — ambas fazem check-then-insert sem lock nem constraint | `CreateBooking`, `RescheduleBooking` | Teste de concorrência real (não mockado): 2 requisições simultâneas para a última capacidade, só uma confirma | Uma das requisições recebe `BOOKING_CONFLICT`, a outra sucesso — nunca as duas sucesso | Core |
| I-07 | Repetir a mesma solicitação com a mesma `IdempotencyKey` não gera duas reservas — retorna a reserva já criada | O inventário confirmou **ausência total** de idempotência hoje | `CreateBooking` | Teste: mesma chave, duas chamadas, uma única linha resultante | Segunda chamada retorna o mesmo `BookingId` da primeira, sem erro | Core |
| I-08 | Cancelar ou reagendar não apaga o registro nem destrói o histórico da reserva original | Auditabilidade e suporte ao cliente exigem histórico | `CancelBooking`, `RescheduleBooking` | Teste: após reagendar, a reserva original ainda é consultável com seu estado terminal | Nunca `DELETE`; sempre transição de estado | Core |
| I-09 | Toda transição de estado confirmada emite o evento de domínio correspondente, de forma transacionalmente consistente com a mudança de estado (outbox) | O inventário confirmou que a trilha pública **não emite nenhum evento** hoje — quebra de paridade com a trilha staff | Toda mutação de estado | Teste de integração: mutação sem evento correspondente no outbox falha o teste | Evento ausente é tratado como bug, não como comportamento aceitável | Core |
| I-10 | Nenhuma invariante universal (I-01 a I-09) depende de um dado que só existe em `BookingMetadata` de nicho | Um adapter não pode ser obrigado a preencher campo de outro nicho para passar validação central | Validação de comandos do Core | Revisão de cada contrato: nenhum campo obrigatório do Core é nome de nicho | Erro de design se violado — não é erro de runtime, é critério de review | Core |
| I-11 | Um adapter pode adicionar regras próprias (ex.: exigir aprovação → usar `PENDING`; exigir depósito antes de `CONFIRMED`) sem alterar o contrato central | Extensibilidade sem reescrever o Core a cada nicho | Camada de adapter, via hooks definidos em [[CORE-BOOKING-001-core-adapter-boundary]] | Teste de contrato: mesmo conjunto de testes do Core passa com adapter fake que injeta regra extra | Adapter que tenta pular I-01 a I-09 é rejeitado no nível do Core, não do adapter | Adapter (regra) · Core (guarda-corpo) |

## Relações
### Depende de
[[CORE-BOOKING-001-capability-spec]]
### Usa
[[CORE-BOOKING-001-transition-map]] (evidência do código atual que motivou I-06, I-07, I-09)
### É usado por
[[CORE-BOOKING-001-contracts]] · [[CORE-BOOKING-001-test-strategy]]
