---
tipo: fluxo
area: produto
status: parcial
progresso: 60
criticidade: alta
bloqueia_producao: true
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Fluxo: Agendamento Público

## O que é
Jornada do cliente final: ver booking-info do slug → escolher serviço/horário → criar agendamento.

## Estado atual
GET de booking-info e available-slots validados em produção (read-only). POST de agendamento não testado em produção. Sem E2E automatizado.

## O que já existe
Endpoints públicos funcionais; slots corretos; `serviceId` obrigatório p/ slots.

## O que falta
E2E automatizado; POST testado em produção (cria dado real); hardening de estados vazios.

## Riscos
Regressão silenciosa sem E2E (A-008/9). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[agenda]] · [[backend]]
### Bloqueia
[[SISTEMA-VENDAVEL]]
### Usa
[[servicos]] · [[colaboradores]]
### É usado por
[[barbergestor]]

## Próximas ações
`e2e-public-booking-validation` (automatizado) → `booking-public-flow-hardening`.

## Links
- [[agenda]] · [[fluxo-onboarding-cliente]]
