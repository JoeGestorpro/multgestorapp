# Plano Operacional — Migration 031 `ai_suggestions`

> **NÃO EXECUTAR EM PRODUÇÃO SEM AUTORIZAÇÃO HUMANA**
> Arquivo: `backend/src/database/20260708_031_ai_suggestions.sql` · PR #32
> Validado em Postgres 17 descartável (2026-07-11). Não executado em produção.

## 1. Pré-requisitos
- PR #32 aprovada e CI verde.
- Migrations 001–030 já aplicadas em produção (031 não depende de tabelas Fase 2; cria tabela nova isolada).
- Acesso de migração com privilégio de `CREATE TABLE`/`CREATE POLICY` no schema `public`.
- Role `app_runtime` já existente (migration 026) — 031 concede grants a ela.

## 2. Backup necessário
- Migration **cria tabela nova** (`ai_suggestions`); não altera dados existentes → risco de perda de dados = nulo.
- Ainda assim, confirmar que o backup diário mais recente concluiu (rotina B2) antes de aplicar, como política.

## 3. Verificação ANTES
```sql
SELECT to_regclass('public.ai_suggestions');           -- esperado: NULL (não existe)
SELECT 1 FROM pg_roles WHERE rolname='app_runtime';    -- esperado: 1
SELECT MAX(version) FROM schema_migrations;             -- esperado: ...030
```

## 4. Aplicação controlada
- Via pipeline de deploy (`npm run migrate`) OU aplicação manual autorizada do arquivo 031.
- Idempotente: `CREATE TABLE/INDEX IF NOT EXISTS`, `ALTER` guardado por `pg_constraint`, `DROP POLICY IF EXISTS`+`CREATE POLICY`. Reexecução é segura (comprovado: re-aplicação direta do SQL → RC=0).

## 5. Duração observada (banco descartável)
- **9–15 ms** por execução. Tabela nova, sem backfill.

## 6. Locks esperados
- **Nenhum lock em tabelas existentes.** A migration só cria e opera sobre `ai_suggestions` (inexistente até aqui) → sem contenção com tráfego de produção. `CREATE INDEX` é sobre tabela vazia (instantâneo). Sem `ALTER` em tabelas quentes.

## 7. Verificação DEPOIS
```sql
SELECT to_regclass('public.ai_suggestions');                       -- não-NULL
SELECT relrowsecurity FROM pg_class WHERE relname='ai_suggestions';-- t
SELECT policyname, (with_check IS NOT NULL) AS has_with_check
  FROM pg_policies WHERE tablename='ai_suggestions';               -- tenant_isolation | t
SELECT indexname FROM pg_indexes WHERE tablename='ai_suggestions'; -- idx_ai_suggestions_company
```

## 8. Teste de RLS entre empresas A e B (pós-migration, ambiente de teste)
Conectado como `app_runtime` (NOBYPASSRLS), tenant=A:
- INSERT com `company_id` da B → **bloqueado 42501** (comprovado).
- SELECT/UPDATE/DELETE de linhas da B → **0 linhas** (comprovado).
- Sem contexto de tenant → bloqueado/0 linhas (comprovado).

## 9. Comportamento sem chaves de LLM
- Sem `OPENROUTER_API_KEY`/`NVIDIA_API_KEY`, o serviço usa **MockProvider** (zero custo, zero chamada externa). A migration não depende de chaves; a tabela apenas armazena sugestões geradas quando/se houver provider.

## 10. Rollback
- Reversível e de baixo risco (tabela nova, sem dados de negócio no momento da aplicação):
```sql
DROP TABLE IF EXISTS public.ai_suggestions CASCADE;
DELETE FROM schema_migrations WHERE version = '20260708_031';
```
- Executar rollback **somente** com autorização; se já houver sugestões geradas, avaliar preservação antes do DROP.

## 11. Critério de abortar
- Verificação ANTES falha (role `app_runtime` ausente, migrations <030 pendentes).
- Erro inesperado na aplicação (exit ≠ 0). O pipeline já bloqueia deploy em falha de migration (PR #26).

## 12. Observabilidade pós-deploy
- Monitorar logs do backend para erros de query em `/api/barber/ai/*`.
- Conferir rate limits ativos nos endpoints de IA (read/refresh/dismiss).
- Confirmar que, sem chaves LLM, não há chamadas externas (MockProvider).

## 13. Responsável pela autorização
- **Autorização humana explícita** (proprietário do repositório) antes de qualquer execução em produção, conforme constituição do projeto.

---
**Resumo de risco:** BAIXO. Tabela nova, idempotente, ~15ms, sem locks em tabelas existentes, RLS comprovada, rollback trivial. **Continua exigindo autorização humana.**
