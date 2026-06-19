---
tipo: componente
area: core
status: parcial
progresso: 55
criticidade: alta
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Frontend

## O que é
SPA React 19 + Vite, lazy loading, ErrorBoundary, design system próprio. Deploy no [[vercel-frontend]].

## Estado atual
Build CI passa; UX real em produção não validada. Zero testes de frontend.

## O que já existe
Rotas públicas/booking/barber/master protegidas; contextos auth/booking; vertical barber completa.

## O que falta
Validar UX real, estados vazios, responsividade mobile; testes de runtime; polish do booking.

## Riscos
UX não testada com cliente real; cold start percebido. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[backend]] · [[vercel-frontend]]
### Bloqueia
[[SISTEMA-VENDAVEL]] · [[fluxo-onboarding-cliente]]
### Usa
[[auth]]
### É usado por
[[barbergestor]]

## Próximas ações
Polish de UX do [[fluxo-agendamento-publico]]; testes de runtime.

## Links
- [[multgestor-core]] · [[vercel-frontend]]
