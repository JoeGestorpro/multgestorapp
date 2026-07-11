---
tipo: fluxo
area: comercial
status: parcial
progresso: 40
criticidade: alta
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Fluxo: Pagamento

## O que é
Jornada de cobrança: trial → assinatura → webhook → ativação de plano → liberação de features.

## Estado atual
Providers integrados ([[faturamento]]: Kiwify, AbacatePay), mas fluxo não testado E2E (A-022).

## O que já existe
Webhooks de billing; feature gates (`requireActivePlan`); tabelas de assinatura.

## O que falta
Teste E2E trial→pago em sandbox; bloqueio de inadimplente; dashboard de assinatura.

## Riscos
Cobrar e não liberar acesso; eventos de billing sem RLS (A-006). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[faturamento]] · [[auth]]
### Bloqueia
[[SISTEMA-VENDAVEL]]
### Usa
[[backend]]
### É usado por
[[barbergestor]]

## Próximas ações
`billing-trial-to-paid-flow`; `kiwify-webhook-e2e`.

## Links
- [[faturamento]] · [[SISTEMA-VENDAVEL]]
