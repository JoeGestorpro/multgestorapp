---
tipo: capability
area: produto
status: pronto
progresso: 80
criticidade: media
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Serviços

## O que é
Catálogo de serviços por tenant: nome, duração, preço, vínculo a colaboradores.

## Estado atual
Funcional; 15 serviços ativos em produção (1 desativado desde criação do tenant de teste).

## O que já existe
Tabela barber_services com RLS; integração com [[agenda]] e slots.

## O que falta
Validação de edição/desativação; serviços como capability genérica (multi-nicho).

## Riscos
Baixo. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[multi-tenant]]
### Bloqueia
[[agenda]]
### Usa
—
### É usado por
[[agenda]] · [[colaboradores]] · [[financeiro]]

## Próximas ações
Validar fluxo de edição/desativação.

## Links
- [[agenda]] · [[colaboradores]]
