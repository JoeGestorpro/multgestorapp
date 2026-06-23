---
tipo: componente
area: core
status: parcial
progresso: 70
criticidade: critica
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Multi-Tenant

## O que é
Engine de isolamento por `company_id` em toda query + middleware `requireCompany` (`SET LOCAL app.current_company_id`). Defesa em profundidade: aplicação + RLS.

## Estado atual
Isolamento real por filtro de aplicação. RLS habilitado mas inerte em runtime (role `postgres` com BYPASSRLS).

## O que já existe
`company_id` em todas as tabelas tenant; `requireCompany`; `withTenantContext`.

## O que falta
RLS efetivo (role runtime sem BYPASSRLS) — [[rls-seguranca]]; policies em companies/users.

## Riscos
Se um filtro de aplicação falhar e RLS for inerte → cross-tenant. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[banco-de-dados]]
### Bloqueia
[[multgestor-core]]
### Usa
[[rls-seguranca]]
### É usado por
[[agenda]] · [[clientes]] · [[financeiro]] · [[auth]]

## Próximas ações
Fechar [[rls-seguranca]] (companies/users) e planejar role runtime least-privilege.

## Links
- [[rls-seguranca]] · [[banco-de-dados]]
