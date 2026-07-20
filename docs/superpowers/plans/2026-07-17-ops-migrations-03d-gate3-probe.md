# OPS-MIGRATIONS-03D Gate 3 Probe Implementation Plan

> **For agentic workers:** Execute inline in this session. Steps use checkbox (`- [ ]`) syntax for tracking. No commit, push, PR, deploy, migration, or Render mutation is authorized.

**Goal:** Build and verify a temporary read-only probe for `MIGRATION_DATABASE_URL` that fails closed and never exposes endpoint or secret material.

**Architecture:** A standalone CommonJS script imports only `pg`, requires the dedicated environment variable, validates PostgreSQL protocol and explicit port 5432, then uses one database client for `SELECT 1`, a dedicated advisory-lock probe, unlock, and deterministic cleanup. Unit tests inject a fake client constructor and capture logs, so no real database or production variable is accessed.

**Tech Stack:** Node.js 18+, CommonJS, `pg` 8, Jest 30, PowerShell.

## Global Constraints

- Work only on `ops/migrations-03d-gate3-probe`.
- Never read `DATABASE_URL` as fallback.
- Never print URL, host, user, password, database, IP, project ref, or secret fragments.
- Never load or execute migrations.
- Do not change Render or trigger deploys.
- Stop for human authorization after local validation.

---

### Task 1: Unit-test the temporary probe

**Files:**
- Create: `backend/tests/unit/probe-migration-endpoint.test.js`
- Test: `backend/scripts/probe-migration-endpoint.js`

**Interfaces:**
- Consumes: `runProbe({ ClientCtor, env, logger })`, `validateEndpoint(raw)`, `sanitizeError(error)`, `PROBE_LOCK_KEY`.
- Produces: regression coverage for missing variable, wrong port, connection failure, lock contention, cleanup, query allowlist, no fallback, and log sanitization.

- [ ] Write tests with an injected fake `pg.Client` that records `connect`, `query`, and `end` calls.
- [ ] Assert `MIGRATION_DATABASE_URL` absence fails without constructing a client and without reading `DATABASE_URL`.
- [ ] Assert port `6543` fails before connection.
- [ ] Assert a connection error returns a sanitized code and still closes the client.
- [ ] Assert `pg_try_advisory_lock` returning false fails closed and closes the client.
- [ ] Assert successful execution issues exactly `SELECT 1`, lock, and unlock, and never imports the migration runner.
- [ ] Feed a URI and secret fragments through error fields and assert captured stdout/stderr contains none of them.
- [ ] Run `npm test -- --runInBand tests/unit/probe-migration-endpoint.test.js`; expect initial failures where the preliminary script still uses a pool and swallows cleanup failures.

### Task 2: Make the probe fail-closed and deterministic

**Files:**
- Modify: `backend/scripts/probe-migration-endpoint.js`
- Test: `backend/tests/unit/probe-migration-endpoint.test.js`

**Interfaces:**
- Consumes: injected `ClientCtor`, environment object, and logger.
- Produces: `runProbe()` resolving only after connectivity, read-only query, lock acquisition, unlock, and client close all succeed.

- [ ] Replace the pool with one `pg.Client` and call `client.end()` from `finally`.
- [ ] Keep the dedicated lock key distinct from the migration runner key.
- [ ] Permit only `SELECT 1`, `SELECT pg_try_advisory_lock($1) AS ok`, and `SELECT pg_advisory_unlock($1) AS ok`.
- [ ] Treat lock refusal, unlock failure/false, connect/query timeout, and close failure as non-zero outcomes.
- [ ] Keep raw driver messages and endpoint components out of all logs.
- [ ] Run the focused Jest file and expect all tests to pass.

### Task 3: Validate locally without production access

**Files:**
- Verify: `backend/scripts/probe-migration-endpoint.js`
- Verify: `backend/tests/unit/probe-migration-endpoint.test.js`

**Interfaces:**
- Consumes: completed probe and unit suite.
- Produces: local evidence and a human-only Render execution plan.

- [ ] Run focused probe tests.
- [ ] Run the backend unit suite with `npm run test:unit -- --runInBand`.
- [ ] Run available repository lint commands; if the backend has no lint script/config, record that limitation and run syntax checks with `node --check`.
- [ ] Search the diff for `DATABASE_URL`, migration imports, unsafe SQL, URI schemes, and logging of raw errors.
- [ ] Review `git diff` and `git status` without staging or committing.
- [ ] Present a Render plan that requires a human to run the script with the existing `MIGRATION_DATABASE_URL`, capture only sanitized output, and remove the temporary probe afterward; do not execute it.

## Self-review

- Spec coverage: all requested probe operations, negative tests, local validation, risks, and human gate are mapped above.
- Placeholder scan: no deferred implementation placeholders are present.
- Type consistency: tests and implementation use the same `ClientCtor`, `env`, and `logger` injection contract.
