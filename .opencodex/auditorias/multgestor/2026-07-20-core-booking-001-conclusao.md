---
tipo: auditoria
missao: CORE-BOOKING-001
data: 2026-07-20
resultado: APROVADA
---

# CORE-BOOKING-001 — Relatório de encerramento

## Estado final

```
CORE_BOOKING_001_CONCLUIDA
```

Significa: Capability definida · Contratos definidos · Invariantes definidas · Adapters definidos · Testes planejados · Transição planejada · Documentação reconciliada.

**Não significa:** Booking Kernel implementado · BarberGestor migrado · Segundo nicho validado · Booking Core comprovado em produção.

## O que foi produzido

| Documento | Conteúdo |
|---|---|
| [[../../projetos/multgestor/core/booking/CORE-BOOKING-001-capability-spec]] | Objetivo, glossário neutro (validado contra 3 nichos), modelo de domínio, agregado (`CapacityAllocation`), estados/transições, decisão de timezone |
| [[../../projetos/multgestor/core/booking/CORE-BOOKING-001-invariants]] | 11 invariantes (I-01 a I-11), cada uma com justificativa, ponto de aplicação, forma de teste e responsável (Core/adapter) |
| [[../../projetos/multgestor/core/booking/CORE-BOOKING-001-contracts]] | 9 contratos conceituais (`CreateBooking`, `CheckAvailability`, `ConfirmBooking`, `CancelBooking`, `RescheduleBooking`, `BlockAvailability`, `ReleaseAvailability`, `GetBooking`, `ListBookings`) |
| [[../../projetos/multgestor/core/booking/CORE-BOOKING-001-core-adapter-boundary]] | Matriz Core vs. adapter + catálogo de 9 eventos de domínio |
| [[../../projetos/multgestor/core/booking/CORE-BOOKING-001-test-strategy]] | 5 camadas de teste, incluindo os 4 cenários de concorrência que hoje não existem |
| [[../../projetos/multgestor/core/booking/CORE-BOOKING-001-transition-map]] | Classificação componente-a-componente das duas trilhas legadas + roadmap de 7 missões futuras com DoD/rollback/autorização |
| [[../../projetos/multgestor/matriz-consolidacao-core]] | `DOMAIN-002` e `NICHEKIT-001`/`002` reconciliados, sem apagar histórico |

## Evidência de base (Gate 2 — inventário comportamental)

Levantamento READ-ONLY sobre `services/barber/booking-*`, `repositories/appointment.repository.js`, `controllers/barber/appointments.js`, `controllers/client-booking.controller.js`. Achados que sustentam as decisões acima:

- **Nenhuma das duas trilhas protege contra corrida na criação** (check-then-insert sem lock nem constraint de banco) → motivou I-06 e a marca "Alto risco" no mapa de transição.
- **Zero idempotência** em qualquer trilha → motivou I-07 e idempotência obrigatória para adapters públicos.
- **A trilha pública usa o pool sem RLS ativo** (`pool.connect()` fora de `requireCompany`) → achado **novo e crítico**, reclassificado como `SUBSTITUIR`/Crítico, independente do cronograma de consolidação.
- **A trilha pública não emite nenhum evento de domínio** → motivou I-09 e o catálogo de eventos explícito.
- **Divergência de timezone default** (`America/Cuiaba` vs `America/Sao_Paulo`) entre trilhas → motivou a proibição de timezone default no Core (I-03).
- **Enum de 7 estados na aplicação vs. 5 no CHECK constraint do banco** — `arrived`/`in_progress` nunca persistem → classificado `INVESTIGAR`, não herdado pelo Core sem prova de uso real.
- **Nenhum teste cobre a trilha pública; a trilha staff só testa conflito com repository mockado** → motivou a estratégia de testes de concorrência com requisições paralelas reais, não mockadas.

## Auditoria adversarial (Gate 15)

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Algum termo do Core continua acoplado ao BarberGestor? | Não — glossário validado contra 3 exemplos de nicho (barbearia, clínica, oficina); termos proibidos listados explicitamente por linha |
| 2 | Alguma regra específica foi promovida como universal? | Não — comissão, preferência de colaborador, depósito, janela de cancelamento, landing pública: todos classificados `ADAPTAR`/`MANTER_NO_NICHO` |
| 3 | Alguma invariante ficou sem forma de teste? | Não — as 11 têm coluna "forma de teste" preenchida |
| 4 | Concorrência foi adiada sem decisão? | Não — I-06 decide explicitamente "transação + proteção de banco contra corrida"; 4 cenários de teste obrigatórios definidos |
| 5 | Timezone ficou implícito? | Não — UTC absoluto como armazenamento é decisão explícita (§5 da spec), com justificativa |
| 6 | Idempotência ficou indefinida? | Não — I-07 + `IdempotencyKey` obrigatória em adapters públicos |
| 7 | Há contrato dependendo de tabela atual? | Não — contratos são conceituais, nenhum nome de tabela/SQL neles |
| 8 | O adapter poderia contornar uma regra central? | Não — seção explícita "o que o adapter não pode fazer" na fronteira Core/adapter |
| 9 | O plano trata BarberGestor como autoridade? | Não — exemplos de adapter marcados explicitamente como ilustrativos, não vinculantes |
| 10 | O plano promete reutilização sem segundo consumidor? | Não — `CORE-BOOKING-VALIDATION-001` é definida como a única evidência aceitável, explicitamente não atingida ainda |
| 11 | Algum documento foi marcado como concluído sem implementação? | Não — todo documento tem `implementado: false` no frontmatter e disclaimer no cabeçalho distinguindo "definição concluída" de "implementação concluída" |
| 12 | Alguma evidência de produção foi inferida? | Não — `TENANT-003` (cobertura RLS) permanece citada como não mensurada, sem inferência |
| 13 | A transição preserva o comportamento atual? | Sim — nenhum arquivo de código foi tocado; mapa de transição só classifica, não executa |
| 14 | Existe caminho de rollback para futuras etapas? | Sim — adicionado durante a auditoria (ver tabela de roadmap no transition-map): cada uma das 7 missões futuras tem rollback próprio definido |
| 15 | A missão ultrapassou o escopo documental? | Não — apenas os 6 documentos novos + atualização da matriz; nenhum código, teste executável, migration, rota ou frontend alterado |

**Achado de auditoria corrigido durante o próprio Gate 15:** a primeira versão do roadmap (Gate 13) listava apenas objetivo/dependência por missão futura, sem riscos/DoD/rollback/autorização — item exigido pelo próprio Gate 13. Corrigido antes de fechar este relatório (ver [[../../projetos/multgestor/core/booking/CORE-BOOKING-001-transition-map]]).

### Veredito

```
APROVADA
```

## Critérios de aceitação (checklist da missão)

```
[x] ADR-008 e ADR-009 reconciliadas
[x] Glossário neutro aprovado
[x] Modelo de domínio definido
[x] Agregado e fronteira transacional definidos
[x] Estados e transições definidos
[x] Invariantes documentadas
[x] Contratos documentados
[x] Erros documentados
[x] Timezone definido
[x] Concorrência definida
[x] Idempotência definida
[x] Eventos definidos
[x] Outbox considerada
[x] Contrato de adapter definido
[x] Isolamento multi-tenant documentado
[x] Estratégia de testes completa
[x] Duas trilhas atuais mapeadas
[x] Plano de migração incremental produzido
[x] NICHEKIT-001 reconciliado
[x] Matriz atualizada sem apagar histórico
[x] Nenhum código runtime alterado
[x] Nenhuma migration criada
[x] Nenhum banco alterado
[x] Nenhum deploy executado
[x] Auditoria adversarial aprovada
```

## Achado fora do escopo desta missão, para priorização humana

O uso do pool sem RLS pela trilha pública/cliente (`booking-appointments.service.js`, `booking-scheduling.service.js`) é um risco de segurança **independente** desta cadeia de missões de Booking Capability — não precisa esperar `CORE-BOOKING-004`. Recomenda-se avaliação humana de prioridade separada (possível candidato a missão própria de segurança, correlacionada a `TENANT-002`/`TENANT-003`).

## Próximos passos (não autorizados por este documento)

1. Priorização humana da sequência `CORE-BOOKING-002` → `CORE-BOOKING-CLOSEOUT` (ver roadmap completo).
2. Decisão humana em separado sobre o achado de segurança acima.
3. `DOMAIN-002B` (consolidar as duas trilhas) permanece como missão técnica separada, já registrada na ADR-008.

## Links
- [[../../projetos/multgestor/mapas/decisions/ADR-008-booking-engine-formalizacao]]
- [[../../projetos/multgestor/mapas/decisions/ADR-009-booking-engine-reposicionamento-estrategico]]
- [[../../projetos/multgestor/core/booking/CORE-BOOKING-001-capability-spec]]
- [[../../projetos/multgestor/matriz-consolidacao-core]]
