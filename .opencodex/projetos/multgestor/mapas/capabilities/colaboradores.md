---
tipo: capability
area: produto
status: pronto
progresso: 75
criticidade: media
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Colaboradores

## O que é
Gestão de colaboradores/profissionais: cadastro, disponibilidade, vínculo a serviços e agenda.

## Estado atual
Funcional; filtro `bookable` correto (is_active + available_for_booking + not deleted).

## O que já existe
12 colaboradores em produção; working hours; vínculo a [[servicos]].

## O que falta
UX de gestão; comissões integradas ([[financeiro]]).

## Riscos
Baixo. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[multi-tenant]]
### Bloqueia
[[agenda]]
### Usa
[[servicos]]
### É usado por
[[agenda]] · [[financeiro]]

## Próximas ações
Integrar comissões; polir UX.

## Links
- [[agenda]] · [[financeiro]]
