---
tipo: decisao
area: dominio
status: superseded
progresso: 100
substituido_por: [ADR-008-booking-engine-formalizacao, ADR-009-booking-engine-reposicionamento-estrategico]
criticidade: alta
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-07-23
---

# ADR-007 — Booking Engine: rebaixar ou promover

> ⚠️ **SUPERSEDED (2026-07-23, KNOWLEDGE-001).** Este ADR **não representa mais a decisão vigente**. A decisão foi tomada e consolidada por [[ADR-008-booking-engine-formalizacao]] (rebaixar — o motor permanece em `services/barber/`) e reposicionada estrategicamente por [[ADR-009-booking-engine-reposicionamento-estrategico]] (o Core terá, no futuro, uma Booking Capability genérica; o BarberGestor é o primeiro consumidor, não o dono). O conteúdo abaixo é preservado apenas para **rastreabilidade histórica** da proposta original.

> **Status original:** PROPOSTA — requer decisão humana. Nenhum código alterado.
> **Origem:** [[../matriz-consolidacao-core]] `DOMAIN-002`, ANEXO F item #1 (backlog pós-03D)
> **Regra vigente do backlog:** *"escrever código antes do ADR é o erro que criou o achado A7"* — este documento existe para não repetir esse erro.

## O que é

Decisão sobre o destino do motor de agendamento (`booking-*.service.js`): ele hoje se chama "genérico" mas **é** do BarberGestor. Decidir se ele fica assim (rebaixar) ou se torna reutilizável de verdade (promover).

## Estado atual — evidência, não resumo

| Camada | O que é | Acoplamento |
|---|---|---|
| `shared/capabilities/booking-engine/scheduling-utils.js` | Funções puras — cálculo de slot, timezone, conflito | **0 ocorrências de `barber_`** — genuinamente compartilhado, usado por Barber e Clima |
| `services/booking-appointments.service.js` | Serviço com estado — 27KB | **59 ocorrências de `barber_`** (`FROM barber_services`, `FROM barber_collaborators`, …) |
| `services/booking-scheduling.service.js` | Serviço com estado | **32 ocorrências de `barber_`** |
| `services/clima-core.service.js` | Motor do ClimaGestor | **0 ocorrências de `barber_`** — reimplementa do zero contra `clima_professionals`, `clima_services` |

Confirmado por leitura direta em 2026-07-20 (`grep -c`), reproduzindo os números do achado A7 da auditoria de 03/07 — **convergência total**, sem divergência de contagem.

### O README já previa a resposta certa

`shared/capabilities/booking-engine/README.md`, seção *"Como adicionar um novo vertical"*:

```text
1. Importe schedulingUtils de shared/capabilities/booking-engine
2. Implemente o adapter para o schema do seu vertical
3. Registre neste README
```

**O passo 2 nunca foi construído.** O ClimaGestor pulou direto para reimplementar tabelas e queries próprias (`clima_professionals`, `clima_services`) em vez de escrever um adapter. O design pretendia uma porta de persistência; o que existe é uma cópia paralela.

### Por que isso é P1 e não bloqueia o v1

`DOMAIN-002` bloqueia o marco **Core Multi-nicho Comprovado** — não bloqueia o **Core Consolidado v1**, que já está provado pelo BarberGestor em produção. Nenhuma ação aqui é urgente para o negócio atual; é urgente para qualquer segundo nicho.

## Decisão

**Este documento não decide.** Apresenta as duas opções, sem recomendação — a escolha depende de um dado que só o operador tem: **existe um segundo nicho real no roadmap de curto prazo, ou o ClimaGestor scaffold é o único horizonte visível?**

### Opção A — Rebaixar

Mover `booking-appointments.service.js` e `booking-scheduling.service.js` para dentro do módulo `barber/`, remover a pretensão de nome genérico. `scheduling-utils.js` permanece em `shared/` — ele já é honesto.

| | |
|---|---|
| **Custo** | Baixo — mover arquivos, ajustar imports, sem mudança de schema ou comportamento |
| **Risco** | Nenhum — puramente organizacional |
| **Ganho** | Elimina o falso rótulo de Core; a estrutura passa a refletir a realidade |
| **Preço futuro** | Se um segundo nicho de agendamento aparecer, reimplementa do zero — como o Clima já fez |

### Opção B — Promover

Extrair uma porta de persistência real: os serviços `booking-*` passam a receber um *adapter* de schema (nomes de tabela, mapeamento de coluna) em vez de hardcodar `barber_*`. O ClimaGestor migra para consumir o motor com seu próprio adapter, substituindo `clima-core.service.js`.

| | |
|---|---|
| **Custo** | Alto — reescrever a camada de acesso a dados dos dois serviços, migrar o Clima, testar os dois verticais contra o motor único |
| **Risco** | Médio — toca código em produção (BarberGestor); exige suíte de regressão robusta antes de mexer |
| **Ganho** | `NICHEKIT-001` deixa de ser parcial; um terceiro nicho reusa o motor sem reimplementar — é a condição do DoD de `NICHEKIT-001` |
| **Pré-requisito** | Esta ADR decidir B **antes** de qualquer linha de código — é a regra que o backlog já registrou |

## Recomendação de processo, não de resultado

Independente de A ou B: **não escrever código de extração antes desta ADR ser resolvida por um humano.** É a causa-raiz do achado A7 — o motor foi nomeado "genérico" sem nunca ter sido generalizado.

## Riscos de não decidir

Enquanto este ADR ficar em `proposto`, o backlog trata `DOMAIN-002` e `NICHEKIT-001` como P1 bloqueados — nenhum código deve avançar nessa direção sem a decisão. O risco de inação é baixo a curto prazo (v1 não depende disso) e cresce linearmente com a proximidade de um segundo nicho real.

## Relações
### Depende de
—
### Bloqueia
[[../matriz-consolidacao-core]] `NICHEKIT-001` (marco Multi-nicho)
### Usa
`shared/capabilities/booking-engine/`
### É usado por
`barber` (produção) · `clima` (scaffold)

## Próximas ações

1. **Decisão humana** entre Opção A e Opção B — marca este documento `aprovado`.
2. Se **A**: missão de baixo risco, pode ser feita em qualquer momento.
3. Se **B**: exige plano próprio, com suíte de regressão do BarberGestor como pré-condição — não iniciar na mesma missão desta decisão.

## Links
- [[../matriz-consolidacao-core]] — `DOMAIN-002`, `NICHEKIT-001`, ANEXO F
- Achado A7 — auditoria `2026-07-03-core-vs-nicho-audit`
