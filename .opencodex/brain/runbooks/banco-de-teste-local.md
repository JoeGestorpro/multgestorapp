# Runbook — Banco de Teste Local (TEST_DATABASE_URL)

> **Status:** OFICIAL • VIVO
> **Criado:** 2026-06-29 (missão P1.3 — auditoria de retomada)
> **Propósito:** Provisionar um Postgres de teste **fora de produção** para validar
> migrations, RLS e transações sem tocar no Supabase de produção.
> **Relacionado:** [[03-TIMELINE]] · [[decisions/D-016-plano-joefelipe-premium]] · `.github/workflows/ci.yml`

---

## Contexto

- O harness de testes tem **guarda anti-produção** (`tests/helpers/test-db.js` →
  `guardAgainstProduction`): recusa rodar se a URL contém `supabase.co`/`production`
  (salvo `SUPABASE_TEST_ALLOW=true`). Portanto integração/RLS **nunca** rodam contra prod.
- A máquina local tem **PostgreSQL 17 em `localhost:5432`** (`postgres`/`postgres`).
- O CI (`.github/workflows/ci.yml`) usa o mesmo padrão: DB `multgestor_test`,
  role `app_runtime` NOBYPASSRLS, `npm run migrate`.

## Provisionamento (uma vez por máquina)

```sh
# 1) criar database + role app_runtime (idempotente)
#    DB: multgestor_test | role: app_runtime / senha app_runtime (NOBYPASSRLS)
psql "postgresql://postgres:postgres@localhost:5432/postgres" \
  -c "CREATE DATABASE multgestor_test;"
psql "postgresql://postgres:postgres@localhost:5432/multgestor_test" \
  -c "CREATE ROLE app_runtime LOGIN PASSWORD 'app_runtime' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT;"
```
(Sem `psql` no PATH: usar um script node/pg equivalente — ver `scratchpad/provision-testdb.js` da sessão.)

## Migrations + grants

```sh
cd backend
export NODE_ENV=test
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/multgestor_test"
export APP_RUNTIME_URL="postgresql://app_runtime:app_runtime@localhost:5432/multgestor_test"
npm run migrate
psql "$DATABASE_URL" -f src/database/runtime_role_grants.sql
```

> `NODE_ENV=test` desliga SSL em `config/database.js`. O runner carrega `.env` mas o
> `dotenv` **não sobrescreve** vars já exportadas — por isso o `export` acima vence
> o `DATABASE_URL` de produção do `.env`.

## Rodar testes

```sh
cd backend
export NODE_ENV=test
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/multgestor_test"
export APP_RUNTIME_URL="postgresql://app_runtime:app_runtime@localhost:5432/multgestor_test"
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/multgestor_test"
export ADMIN_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/multgestor_test"
export JWT_SECRET="ci-test-secret-not-for-production"

npm run test:integration                              # gate0 + RLS + outbox + tenant isolation
npx jest --testPathPatterns="tenant-isolation-rls"    # só enforcement RLS
```

## Resultado validado (2026-06-29)

- `npm run migrate` no banco zerado: **todas as migrations OK**, incl. 027/028/029.
- `npm run test:integration`: **91 testes / 7 suites — todos passando**.
- `tenant-isolation-rls`: **34 testes** (cross-tenant deny, WITH CHECK/USING,
  default-deny company/user, app_runtime via APP_RUNTIME_URL respeita RLS).

## Pendência conhecida (P2)

`run-migrations.js` registra `20260603_018..021` (`mg_prepaid/packages/loyalty/anamnese_v1.sql`)
mas os **arquivos não existem** em `src/database/` → runner emite `[warn] arquivo não encontrado`
e segue. Migrations efetivamente ausentes do schema reconstruído. Investigar se foram
renomeadas/perdidas ou remover do registro.
