---
tipo: nicho
area: produto
status: pronto
progresso: 85
criticidade: alta
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# BarberGestor

## O que é
Primeiro vertical ativo do MultGestor — gestão completa para barbearias.

## Estado atual
Vertical completo no [[frontend]] e [[backend]]: agenda, atendimento, colaboradores, clientes, vendas, caixa, acertos, relatórios, configurações, agendamento online.

## O que já existe
Todas as capabilities barber em produção; tenant real `barbearia-joefelipe`.

## O que falta
Fechar fundação P1 e itens de venda ([[SISTEMA-VENDAVEL]]) para o primeiro cliente pagante.

## Riscos
~90% do código é barber-específico (A-024) → dívida multi-nicho. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[multgestor-core]]
### Bloqueia
—
### Usa
[[agenda]] · [[clientes]] · [[financeiro]] · [[servicos]] · [[colaboradores]] · [[faturamento]]
### É usado por
clientes barbearia

## Próximas ações
Servir de referência para o template de vertical; preparar para piloto pago.

## Links
- [[multgestor-core]] · [[SISTEMA-VENDAVEL]]
