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

# ADR-009 — Booking Engine: reposicionamento estratégico (não reverte ADR-008)

> **Status:** ✅ **APROVADA** — corrige o *enquadramento* da ADR-008, não a *ação* já executada.
> **Complementa:** [[ADR-008-booking-engine-formalizacao]] (não reverte — o `git mv` para `services/barber/` permanece)
> **Motivação:** correção trazida pelo humano em revisão da ADR-008, registrada nesta sessão em 2026-07-20.

## Por que este documento existe

A ADR-008 formalizou "rebaixar o Booking Engine ao BarberGestor" com base em evidência real: sem segundo consumidor genuíno, sem testes, com o Clima tendo reimplementado do zero. Essa leitura tratou implicitamente o estado atual do código como evidência sobre o **destino arquitetural** do domínio — não apenas sobre a segurança de mover código agora.

Essas são duas perguntas diferentes:

1. *Devemos mover agora o código atual para o Core?* → Não, ainda não (ADR-008 permanece correta).
2. *O Core deve possuir, no futuro, uma capacidade genérica de Booking?* → Sim — e a ADR-008, por si só, não deveria ser lida como resposta "não" a essa segunda pergunta.

O risco corrigido aqui: a ADR-008, sem este adendo, pode ser lida como "booking é permanentemente do nicho", quando a evidência que ela reúne só sustenta "booking não deve ser extraído *agora*, com o código *atual*".

## Correção de enquadramento

**Hierarquia correta do MultGestor:**

```
MultGestor Core
      ↓
capacidades reutilizáveis
      ↓
contratos estáveis
      ↓
BarberGestor (nicho piloto) · outros nichos futuros
```

O BarberGestor **consome, testa e comprova** o Core. Ele não **define** o Core. O papel do BarberGestor é: nicho em desenvolvimento, piloto, ambiente de validação, primeiro consumidor de capacidades, prova de reutilização — **não** coração do sistema, fonte de regras universais, autoridade arquitetural ou substituto do Core.

Nota adicional trazida na correção: a afirmação de que a decisão da ADR-008 já estava "implementada em produção" não deve ser lida como validação do modelo arquitetural do nicho — o BarberGestor ainda não é um nicho comercial em produção; o que está saudável em produção é o backend após o `git mv`, não uma tese de arquitetura testada por uso real multi-nicho.

## O que a evidência da ADR-008 sustenta e o que não sustenta

| Pergunta | Resposta sustentada pela evidência | A ADR-008 respondeu? |
|---|---|---|
| Devemos fazer uma extração imediata do código atual para o Core? | Não | Sim, corretamente |
| O Core deve possuir uma capacidade genérica de Booking? | Sim, desenhada como capacidade neutra de nicho | Não — pergunta diferente, não respondida por aquela evidência |

## Decisão

**Não reverter o rebaixamento da ADR-008.** O código permanece em `services/barber/`.

**Adicionar ao registro de arquitetura:** o `MultGestor Core` deve, no futuro, possuir a definição canônica de uma capacidade genérica de Booking, com o `BarberGestor` como primeiro adapter e ambiente de validação — não como fonte da verdade sobre o que essa capacidade deve ser.

**Não autorizada por este documento:** qualquer extração de código. Este é um registro de reposicionamento estratégico, não uma missão de implementação.

## Estrutura-alvo (documentada para orientar trabalho futuro, não implementada agora)

**Core — Booking Capability (genérico, sem conhecimento de nicho):**
recurso agendável, serviço agendável, disponibilidade, intervalo de tempo, reserva, confirmação, cancelamento, reagendamento, prevenção de conflito, capacidade, timezone, status, eventos, idempotência, isolamento por tenant, contratos de extensão.

**O Core não deve conhecer:** barbeiro, cadeira de barbearia, corte, barba, comissão de barbeiro, preferência por barbeiro, ou qualquer nomenclatura específica de nicho.

**BarberGestor — tradução/especialização:** recurso agendável → barbeiro; serviço agendável → corte/barba/pacote; reserva → horário do cliente; regras de comissão/encaixe/preferência ficam no nicho.

Outros nichos futuros (exemplos ilustrativos, não compromissos): clínica (recurso → médico/sala; serviço → consulta/procedimento); oficina (recurso → mecânico/box; serviço → revisão/manutenção).

## Ordem estratégica recomendada (não autoriza execução — orienta priorização futura)

1. Definir a capacidade genérica de Booking no Core (contratos: `CreateBooking`, `CheckAvailability`, `CancelBooking`, `RescheduleBooking`, `ConfirmBooking`).
2. Definir invariantes e contratos neutros de nicho.
3. Criar testes de comportamento (endereça a lacuna de cobertura já identificada na ADR-008).
4. Separar regras genéricas das regras específicas de barbearia.
5. Fazer o BarberGestor consumir o contrato do Core (não o contrário).
6. Validar com um segundo nicho real.
7. Só então declarar o Booking Core consolidado.

Esta ordem também é a via natural de resolução do achado da ADR-008 sobre as **duas trilhas paralelas** de criação de agendamento (`DOMAIN-002B`): convergir ambas para o contrato do Core, em vez de consolidá-las pensando apenas no BarberGestor.

## Consequências positivas

- Evita a leitura equivocada de que "Booking Engine = BarberGestor" permanentemente.
- Preserva a decisão operacional segura da ADR-008 (nada é extraído sem testes e contratos).
- Dá direção de longo prazo ao trabalho de `DOMAIN-002B` e ao replanejamento de `NICHEKIT-001`, evitando que ambos sejam otimizados apenas para o nicho piloto.

## Consequências negativas

- Nenhuma mudança de código nasce deste documento — quem ler apenas a ADR-008 sem este adendo continuará com o enquadramento antigo até que o vínculo seja seguido.
- Introduz um objetivo de longo prazo (Booking Capability no Core) sem cronograma ou responsável definido — risco de ficar apenas como intenção se não virar missão.

## Critérios de reversão

Esta correção deixa de se aplicar se, e somente se, o MultGestor decidir formalmente que o BarberGestor não é mais o nicho piloto de referência para capacidades compartilhadas — cenário não previsto hoje.

## Relações
### Depende de
[[ADR-008-booking-engine-formalizacao]] (complementa, não reverte)
### Bloqueia
—
### Usa
[[../matriz-consolidacao-core]] `DOMAIN-002`, `NICHEKIT-001`
### É usado por
Orienta o replanejamento futuro de `DOMAIN-002B` e `NICHEKIT-001`

## Próximas ações

1. Nenhuma implementação autorizada por este documento.
2. Ao planejar `DOMAIN-002B` (consolidação das duas trilhas), considerar este reposicionamento como orientação de destino, não apenas como limpeza interna do nicho.
3. Ao replanejar `NICHEKIT-001`, formular o DoD em torno de uma futura Booking Capability no Core (mesmo que sua implementação seja posterior), em vez de assumir permanentemente "cada nicho reimplementa".

## Links
- [[ADR-008-booking-engine-formalizacao]] — decisão operacional complementada por esta
- [[ADR-007-booking-engine]] — decisão original
- [[../matriz-consolidacao-core]] — `DOMAIN-002`, `NICHEKIT-001`
