---
tipo: componente
area: core
status: parcial
progresso: 60
criticidade: critica
bloqueia_producao: true
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# MultGestor Core

## O que é
O coração da plataforma SaaS multi-nicho, multi-tenant e orientada a eventos. Sustenta todos os nichos sem reescrever a fundação. Nó central de [[MAPA-MULTGESTOR-CORE]].

## Estado atual
Fundação sólida e em produção; ~90% do código ainda é específico de barbearia (A-024). Multi-tenant real, EventBus durável, capabilities reutilizáveis.

## O que já existe
[[backend]] · [[frontend]] · [[banco-de-dados]] · [[auth]] · [[faturamento]] · [[multi-tenant]] · EventBus/outbox (durável).

## O que falta
Separação formal Core vs Vertical (boundary-map), redução de hardcode `barber`, fechamento dos P1 de fundação.

## Riscos
Virar "só sistema de barbearia". Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[supabase]] · [[render-backend]] · [[vercel-frontend]]
### Bloqueia
[[barbergestor]] e todos os nichos
### Usa
[[multi-tenant]] · [[auth]] · [[faturamento]]
### É usado por
[[barbergestor]] · [[agrogestor]] · [[autogestor]] · [[petgestor]] · [[barbearia]]

## Próximas ações
Fechar fundação P1 ([[PROXIMA-MELHOR-ACAO]]); planejar boundary-map Core/Vertical.

## Links
- [[capacidades]] · [[ROADMAP-MESTRE-MULTGESTOR-2026]] · [[STATUS-GERAL]]
