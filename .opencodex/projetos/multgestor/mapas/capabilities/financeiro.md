---
tipo: capability
area: produto
status: parcial
progresso: 55
criticidade: alta
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Financeiro

## O que é
Caixa, vendas, comandas, comissões e painel financeiro do dono.

## Estado atual
Vertical existe no [[frontend]] (caixa, vendas, acertos); não endurecido/validado E2E.

## O que já existe
Tabelas barber_sales, cash_sessions, advances, settlements (com RLS).

## O que falta
Endurecer caixa/vendas/comissão (`cash-sales-commission-hardening`); painel financeiro do dono.

## Riscos
Eventos cash_session.* já tiveram orphaned (A-003, resolvido). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[agenda]] · [[servicos]]
### Bloqueia
[[relatorios]]
### Usa
[[colaboradores]]
### É usado por
[[barbergestor]] · [[relatorios]]

## Próximas ações
`cash-sales-commission-hardening`.

## Links
- [[relatorios]] · [[estoque]]
