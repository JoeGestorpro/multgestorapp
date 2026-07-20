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

# CORE-BOOKING-001 — Estratégia de testes da Booking Capability

> Plano, não execução. Nenhum teste foi escrito nesta missão. Cobertura real fica para `CORE-BOOKING-002` (caracterização) e `CORE-BOOKING-003`/`004` (contrato/kernel).

## Ponto de partida: lacuna confirmada

O inventário comportamental (Gate 2) confirmou, com evidência de arquivo:linha:
- A trilha pública/cliente (`booking-appointments.service.js`, `booking-scheduling.service.js`) **não tem nenhum teste**.
- A trilha staff tem teste de conflito, mas **com repository mockado** — não valida a query SQL real nem concorrência.
- **Nenhum teste de concorrência/double-booking, timezone ou transição de estado ilegal existe hoje em nenhuma das duas trilhas.**

Esta estratégia é desenhada para fechar exatamente essas lacunas, e não apenas para cobrir o Core novo.

## Camadas

### Unitários (Core, sem I/O)
- `TimeRange`: rejeita `end <= start`; compara corretamente por timezone (I-02, I-03).
- Transições de estado: cada par (estado atual, ação) resulta no estado esperado ou erro `BOOKING_INVALID_TRANSITION` — matriz completa da tabela de estados em [[CORE-BOOKING-001-capability-spec]] §4.3.
- Cálculo de capacidade restante dado um conjunto de alocações.
- Erros de validação de comandos (payload inválido, `TimeRange` inválido).

### Contrato (Core, adapter fake)
- Cada contrato (`CreateBooking`, `CheckAvailability`, ...) executado contra um adapter de teste neutro (não o BarberGestor) — garante que o Core não depende de nada de nicho.
- Eventos: toda mutação de estado gera exatamente o evento esperado no catálogo, com `tenantId`/`causationId`/`correlationId` presentes (I-09).

### Integração (Core, banco real)
- Transação: `CreateBooking` bem-sucedido e com erro fazem rollback completo (nenhuma alocação órfã).
- RLS: tentativa de leitura/escrita cross-tenant é bloqueada no nível de banco, não só de aplicação (I-01) — este teste deve rodar contra o pool com role equivalente a `NOBYPASSRLS`, replicando o padrão de `TENANT-002`, não o pool privilegiado usado hoje pela trilha pública.
- Outbox: evento é gravado na mesma transação da mutação de estado (reaproveita suíte de `EVENT-002`, já `CONCLUÍDA`).
- Idempotência: mesma `IdempotencyKey`, duas chamadas, uma única linha (I-07) — lacuna nova, não existe hoje.
- Timezone: mesmo `TimeRange` expresso em fusos diferentes produz o mesmo resultado de conflito (I-03) — cobre a divergência `America/Cuiaba` vs `America/Sao_Paulo` encontrada no inventário.

### Concorrência (obrigatórios, novos — não existem hoje)
```
Duas solicitações para a última capacidade disponível
→ apenas uma deve confirmar (I-05, I-06).

Duas solicitações com a mesma idempotency key, disparadas em paralelo
→ uma única reserva (I-07).

Reagendamento concorrente com outra criação para o novo horário
→ nenhuma capacidade duplicada (I-06).

Cancelamento concorrente com confirmação da mesma reserva
→ resultado consistente e auditável, sem estado impossível (I-08, I-09).
```
Estes quatro cenários devem rodar com requisições disparadas de fato em paralelo (não sequenciais mockadas) — é a lacuna mais crítica identificada no inventário, pois nenhuma trilha atual tem qualquer teste desse tipo.

### Multi-nicho (planejado, não executado nesta missão)
O mesmo conjunto de testes de contrato deve ser executável contra: (a) um adapter fake/neutro de teste, (b) futuramente o adapter piloto do BarberGestor. Não é obrigatório implementar um segundo adapter real agora — o requisito é que a suíte de contrato seja escrita de forma parametrizável por adapter desde o início (`CORE-BOOKING-003`), para que `CORE-BOOKING-VALIDATION-001` (segundo nicho real) possa reexecutá-la sem reescrevê-la.

## Relação com o legado

`CORE-BOOKING-002` (próxima missão sugerida) deve escrever testes de **caracterização** sobre o comportamento atual das duas trilhas antes de qualquer consolidação — não para validar que o comportamento atual está correto, mas para que a migração futura (`BARBER-BOOKING-MIGRATION-001`) tenha uma rede de segurança contra regressão de comportamento observável (mesmo que esse comportamento seja, por exemplo, "não idempotente hoje").

## Relações
### Depende de
[[CORE-BOOKING-001-invariants]] · [[CORE-BOOKING-001-contracts]]
### Usa
[[CORE-BOOKING-001-transition-map]] (evidência das lacunas de teste atuais)
### É usado por
`CORE-BOOKING-002`, `CORE-BOOKING-003` (missões futuras)
