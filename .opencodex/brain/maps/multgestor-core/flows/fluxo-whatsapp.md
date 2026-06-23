---
tipo: fluxo
area: produto
status: bloqueado
progresso: 25
criticidade: alta
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Fluxo: WhatsApp

## O que é
Envio de confirmações/lembretes de agendamento por WhatsApp.

## Estado atual
**Divergência a resolver:** `capabilities-map` diz "Produção (Meta Cloud API)", health check diz **mock** (A-010). Provider degradado em produção.

## O que já existe
Integração via consumer (`appointment-integration.consumer.js`); resolver per-tenant; token encryption.

## O que falta
Confirmar o estado real; decidir Meta Cloud API real vs documentar mock; corrigir capabilities-map.

## Riscos
Confirmação não chega ao cliente → no-show. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[notificacoes]] · [[render-backend]]
### Bloqueia
[[fluxo-onboarding-cliente]]
### Usa
[[backend]]
### É usado por
[[agenda]]

## Próximas ações
`whatsapp-official-decision-or-integration` (resolver divergência + ADR).

## Links
- [[notificacoes]] · [[RISCOS-MULTGESTOR]]
