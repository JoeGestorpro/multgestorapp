# Segurança — Isolamento de Tenant (Multi-tenancy)

> Status: **isolamento APLICACIONAL ativo** + **RLS dormente** (defesa-em-profundidade
> a ser ativada na Fase 3). Documento criado na Fase 1 (estabilização pré-piloto).

## Modelo atual (o que realmente protege os dados hoje)

O isolamento entre empresas (`company_id`) é garantido na **camada de aplicação**,
de forma consistente, em três pontos:

1. **`BaseRepository`** (`backend/src/shared/core/database/BaseRepository.js`)
   — `findById`, `findAll`, `update`, `softDelete`, `hardDelete`, `count`, `exists`
   recebem `companyId` e aplicam `WHERE company_id = $N`.

2. **Repositórios de domínio com `create()` próprio** — os repositórios tenant
   (appointment, barber-services, collaborator, product, supplier) **sobrescrevem**
   `create(companyId, data)` com assinatura que exige `companyId` explícito e o
   injeta no `INSERT`. Por isso o `create()` herdado do BaseRepository não é o
   caminho usado por eles.

3. **Services** — sempre passam o `companyId` derivado do JWT (`req.user.company_id`),
   nunca de parâmetro de URL controlado pelo cliente.

### Rede de segurança adicionada na Fase 1

`BaseRepository` agora aceita a flag opt-in `tenantScoped`:

```js
// 3º parâmetro, retrocompatível (default false)
super(TABLE_NAME, db, { tenantScoped: true })
```

Quando `tenantScoped === true`, `BaseRepository.create(data)` **lança** se
`company_id` estiver ausente/null. Isso protege **repositórios futuros** que
venham a usar o `create()` herdado numa tabela tenant — evitando gravar linha
sem dono. Repositórios que já têm `create()` próprio não dependem desta flag.

## RLS (Row-Level Security) — DORMENTE

Existem policies em `backend/src/database/rls_tenant_tables.sql` (aplicadas pela
migration `20260526_017`) com `USING (company_id = current_setting('app.current_company_id', true)::uuid)`.

**Porém o RLS não protege em runtime hoje**, porque:

- O helper `withTenantContext` (que faz `SET LOCAL app.current_company_id`) em
  `backend/src/config/database.js` **não é chamado** em nenhuma request real
  (só existe no próprio teste unitário). O middleware `shared/tenant/middleware.js`
  apenas anexa um getter JS, não seta a variável de sessão no banco.
- Não há `FORCE ROW LEVEL SECURITY` nas tabelas, então o role dono (usado pela app)
  **bypassa** o RLS.
- As policies usam apenas `USING`, sem `WITH CHECK` (não cobririam INSERT).

> ⚠️ Não habilitar `FORCE ROW LEVEL SECURITY` enquanto o `SET LOCAL` por request
> não estiver implementado: como as queries usam `pool.query` direto (fora de
> transação), o RLS forçado **bloquearia todo o tráfego** (a variável de sessão
> nunca é setada). A ativação é tarefa da Fase 3.

## Plano de ativação do RLS (Fase 3 — Escala)

1. Implementar um middleware/wrap transacional que rode cada request dentro de
   uma transação com `SET LOCAL app.current_company_id = <jwt.company_id>`
   (reutilizando `withTenantContext`).
2. Adicionar `WITH CHECK (company_id = current_setting(...)::uuid)` às policies.
3. Habilitar `ALTER TABLE ... FORCE ROW LEVEL SECURITY` por tabela.
4. Validar com a suíte `tests/integration/tenant-isolation.test.js` (cross-tenant
   blocking nos dois sentidos) antes de promover para produção.

## Checklist para quem cria novo repository ou rota tenant

- [ ] O repository filtra **toda** leitura/escrita por `company_id`.
- [ ] Se usar o `create()` herdado do BaseRepository numa tabela tenant, passar
      `{ tenantScoped: true }` no `super(...)`.
- [ ] O `company_id` vem **sempre** do JWT (`req.user.company_id`), nunca de
      `req.params`/`req.query`/`req.body` controlados pelo cliente.
- [ ] Adicionar caso correspondente em `tests/integration/tenant-isolation.test.js`.
- [ ] Rotas protegidas por `requireAuth` + (quando aplicável) guard de plano/módulo.
