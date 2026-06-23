---
tipo: componente
area: comercial
status: parcial
progresso: 50
criticidade: alta
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Billing

## O que é
Capability de planos/assinaturas com providers AbacatePay e Kiwify, em `shared/capabilities/billing/`.

## Estado atual
Integrado, mas fluxo trial→pago não testado E2E (A-022).

## O que já existe
Providers (Kiwify, AbacatePay), `requireActivePlan`/`requirePlanFeature`, tabelas plans/modules/subscriptions.

## O que falta
[[fluxo-pagamento]] E2E; feature gates por plano; bloqueio de inadimplente; dashboard de assinatura.

## Riscos
Cobrar e não liberar; assinatura sem isolamento RLS (A-006). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[backend]] · [[auth]]
### Bloqueia
[[SISTEMA-VENDAVEL]]
### Usa
[[fluxo-pagamento]]
### É usado por
[[barbergestor]]

## Próximas ações
Testar trial→pago E2E em sandbox; feature gates por plano.

## Links
- [[fluxo-pagamento]] · [[SISTEMA-VENDAVEL]]
