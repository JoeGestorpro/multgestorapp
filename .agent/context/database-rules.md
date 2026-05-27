# Database Rules — MultGestor / BarberGestor

## Stack

- Supabase PostgreSQL
- Cliente: `pg` (node-postgres) com Pool
- Sem ORM (SQL direto)
- Migrations: scripts SQL manuais

## Isolamento Multi-Tenant (company_id)

Regra fundamental: **todo dado pertencente a um tenant DEVE ter `company_id`**.

```sql
-- CORRETO (sempre):
SELECT * FROM sales WHERE company_id = $1

-- PROIBIDO:
SELECT * FROM sales WHERE owner_id = $1
```

Tabelas tenant conhecidas (amostra):
- `users` (usuários da empresa)
- `services` (serviços)
- `products` (produtos)
- `sales` (vendas/atendimentos)
- `collaborators` (colaboradores)
- `appointments` (agendamentos)
- `schedule_blocks` (bloqueios de agenda)
- `working_hours` (horários de funcionamento)
- `advances` (vales/adiantamentos)
- `settlements` (acertos)
- `company_settings` (configurações)
- `company_branding` (identidade visual)

Tabelas do sistema master:
- `master_users` (admins)
- `tenants` (empresas cadastradas)

Tabelas públicas:
- `plans` (planos de assinatura)

## Migrations

1. Migrations são scripts SQL em `backend/db/migrations/`.
2. Nome do arquivo: `YYYYMMDD_descricao.sql`.
3. Cada migration deve ser testada em dev antes de prod.
4. Migrations são executadas manualmente (não automáticas).

## Índices

1. Tabelas tenant DEVEM ter índice em `company_id`.
2. Índices em colunas de busca frequente: `name`, `email`, `date`, `status`.
3. Índices em chaves estrangeiras.
4. Evitar índices desnecessários que lentificam INSERT/UPDATE.

## UTC / Timezone

1. Datas no banco são armazenadas em UTC (timestamp with time zone).
2. Conversão para timezone local é feita no backend ou frontend.
3. `slot_interval_minutes`, `online_min_advance_value` etc. ficam em `company_settings`.

## Queries por Período

1. Usar `BETWEEN` ou `>= / <` para filtros de data.
2. Cuidado com inclusão de extremidades (`00:00:00` a `23:59:59`).
3. Preferir `created_at::date` para comparações diárias.

## Segurança Multi-Tenant (REGRRA CRÍTICA)

1. Toda query de leitura: `WHERE company_id = $1`
2. Toda query de escrita: `INSERT INTO ... (company_id, ...) VALUES ($1, ...)`
3. Toda query de deleção: `WHERE company_id = $1 AND id = $2`
4. UPDATE: `WHERE company_id = $1 AND id = $2`
5. JOINs entre tabelas tenant DEVEM incluir `company_id` em ambas.

## Cuidados ao Alterar Schema

1. Nunca rodar `DROP TABLE` ou `DROP COLUMN` sem plano de rollback.
2. Preferir `ALTER TABLE ... ADD COLUMN` (não destrutivo).
3. Testar migrations em database de dev primeiro.
4. Fazer backup antes de alterações em produção.
5. Alterações que podem quebrar queries existentes: coordenar com o backend.

## Consultas SQL Sempre Parametrizadas

```js
// CORRETO (parametrizado):
db.query('SELECT * FROM sales WHERE company_id = $1 AND id = $2', [companyId, saleId])

// ERRADO (vulnerável a SQL injection):
db.query(`SELECT * FROM sales WHERE company_id = ${companyId}`)
```
