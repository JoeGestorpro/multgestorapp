---
tipo: componente
area: seguranca
status: bloqueado
progresso: 50
criticidade: alta
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# RLS e Segurança Multi-Tenant

## O que é
Row-Level Security como defesa em profundidade do isolamento por `company_id`.

## Estado atual
RLS habilitado na maioria das tabelas tenant, mas **inerte em runtime** (role `postgres` com BYPASSRLS). `companies` e `users`: RLS=true, **0 policies** (A-001, P1).

## O que já existe
Policies em ~30 tabelas tenant; testes de isolamento (`tenant-isolation-rls.test.js`); RLS Fase 1 CI-only.

## O que falta
Policies em companies/users; role runtime sem BYPASSRLS (Fase 2/3, gated); RLS em billing tables (A-006).

## Riscos
Se um filtro de aplicação falhar, não há rede RLS em companies/users. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[banco-de-dados]] · [[multi-tenant]]
### Bloqueia
[[PRODUCAO]]
### Usa
—
### É usado por
[[multi-tenant]]

## Próximas ações
Missão `security/rls-companies-users-policy` (após backup externo).

## Links
- [[multi-tenant]] · [[politicas-producao]] · [[RISCOS-MULTGESTOR]]
