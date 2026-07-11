---
tipo: capability
area: produto
status: parcial
progresso: 40
criticidade: media
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Estoque

## O que é
Controle de produtos/insumos e fornecedores por tenant.

## Estado atual
Tabelas existem (barber_products, barber_suppliers com RLS); fluxo não validado.

## O que já existe
Modelo de dados de produtos e fornecedores.

## O que falta
Validar fluxo básico (`stock-basic-flow-validation`); integração com vendas ([[financeiro]]).

## Riscos
Baixo no curto prazo. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[multi-tenant]]
### Bloqueia
—
### Usa
[[financeiro]]
### É usado por
[[barbearia]]

## Próximas ações
`stock-basic-flow-validation`.

## Links
- [[financeiro]] · [[barbearia]]
