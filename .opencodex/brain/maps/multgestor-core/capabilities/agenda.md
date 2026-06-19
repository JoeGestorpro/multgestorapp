---
tipo: capability
area: produto
status: pronto
progresso: 80
criticidade: alta
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Agenda

## O que é
Booking Engine reutilizável (`shared/capabilities/booking-engine/`) — slots, disponibilidade, agendamento.

## Estado atual
Funcional; GET de booking-info e available-slots validados em produção. Usado por [[barbergestor]] e [[climagestor]].

## O que já existe
19 funções puras de scheduling; slots por colaborador; timezone por tenant.

## O que falta
E2E automatizado; POST de agendamento testado em produção; reagendamento/cancelamento/no-show endurecidos.

## Riscos
Sem E2E, regressão silenciosa. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[multi-tenant]] · [[banco-de-dados]]
### Bloqueia
[[fluxo-agendamento-publico]]
### Usa
[[servicos]] · [[colaboradores]]
### É usado por
[[barbergestor]] · [[climagestor]]

## Próximas ações
Cobrir [[fluxo-agendamento-publico]] com testes; endurecer cancelamento/no-show.

## Links
- [[fluxo-agendamento-publico]] · [[servicos]]
