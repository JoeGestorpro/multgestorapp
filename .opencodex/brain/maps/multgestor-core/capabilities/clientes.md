---
tipo: capability
area: produto
status: parcial
progresso: 60
criticidade: media
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Clientes (CRM)

## O que é
Gestão de clientes e histórico: notas, eventos, tags, fidelidade.

## Estado atual
CRM básico em produção (client notes/events/tags, loyalty).

## O que já existe
Tabelas barber_client_* com RLS; booking_customers; loyalty/packages.

## O que falta
Histórico unificado do cliente; recuperação de inativos; CRM como capability multi-nicho.

## Riscos
PII em logs (A-019). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[multi-tenant]] · [[banco-de-dados]]
### Bloqueia
[[relatorios]]
### Usa
[[notificacoes]]
### É usado por
[[barbergestor]] · [[relatorios]]

## Próximas ações
`customer-history-crm`; política de retenção/LGPD.

## Links
- [[relatorios]] · [[notificacoes]]
