---
tipo: painel
area: comercial
status: parcial
progresso: 45
criticidade: alta
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Sistema Vendável MultGestor

## O que é
O que falta para vender o [[barbergestor]] para um cliente pagante. Volta para [[MAPA-MULTGESTOR-CORE]].

## Necessário para vender
- Fundação P1 fechada (ver [[PRODUCAO]])
- POST de agendamento testado em produção ([[fluxo-agendamento-publico]])
- [[fluxo-pagamento]] testado E2E
- [[fluxo-whatsapp]] real ou decisão formal documentada

## O que falta em onboarding
[[fluxo-onboarding-cliente]] simples e self-service; primeiro agendamento < 10 min sem suporte.

## O que falta em suporte
Canal de suporte básico; documentação de uso; FAQ.

## O que falta em cobrança
[[faturamento]] trial→pago E2E; [[fluxo-pagamento]] (Kiwify/AbacatePay); feature gates por plano; bloqueio de inadimplente.

## O que falta em documentação comercial
Precificação, planos Starter/Pro, material de venda.

## O que falta em experiência do cliente
[[frontend]] UX validada; estados vazios; cold start mitigado ([[render-backend]]); [[notificacoes]] reais.

## Riscos
Ver [[RISCOS-MULTGESTOR]] (categoria Comercial).

## Próximas ações
Fundação primeiro ([[PROXIMA-MELHOR-ACAO]]), depois [[fluxo-pagamento]] e [[fluxo-onboarding-cliente]].

## Links
- [[PRODUCAO]] · [[barbergestor]] · [[faturamento]]
