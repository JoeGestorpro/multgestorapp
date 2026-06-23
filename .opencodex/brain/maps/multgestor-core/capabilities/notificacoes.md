---
tipo: capability
area: produto
status: parcial
progresso: 50
criticidade: alta
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Notificações

## O que é
Comunicação com cliente: e-mail (Resend) e WhatsApp.

## Estado atual
E-mail configurado (Resend, OK no health). WhatsApp em **mock** (A-010) — divergência: capabilities-map diz "Produção", health diz "mock".

## O que já existe
Resend integrado; jobs trial-email e appointment-reminder; integração WhatsApp via consumer.

## O que falta
WhatsApp real ou decisão formal ([[fluxo-whatsapp]]); e-mail transacional validado E2E.

## Riscos
Confirmação não chega ao cliente (no-show). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[render-backend]]
### Bloqueia
[[fluxo-onboarding-cliente]]
### Usa
[[fluxo-whatsapp]]
### É usado por
[[agenda]] · [[clientes]]

## Próximas ações
`email-real-production`; `whatsapp-official-decision-or-integration`.

## Links
- [[fluxo-whatsapp]] · [[fluxo-onboarding-cliente]]
