# Workflow: /generate-migration

## Quando usar
Ao criar qualquer alteração de schema no banco de dados.

## Trigger
```
/generate-migration <nome-descritivo>
```

Exemplo: `/generate-migration add-customer-tags-table`

---

## Problema atual

O sistema atual usa migrations como scripts SQL executados em ordem hardcoded em `run-migrations.js`. Não há controle de quais migrations já foram aplicadas.

**Riscos:**
- Re-executar a mesma migration causa erros (mesmo com IF NOT EXISTS)
- Sem registro histórico de quando cada migration foi aplicada
- Impossível fazer rollback controlado

---

## Solução: Tabela schema_migrations

```sql
-- Criar apenas uma vez (executar manualmente ou no primeiro run)
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  applied_at  TIMESTAMP DEFAULT NOW(),
  checksum    TEXT
);
```

---

## Convenção de nomenclatura

```
<timestamp>_<nome-descritivo>.sql

Exemplos:
20260525_001_add_customer_tags_table.sql
20260525_002_add_index_appointments_company_id.sql
20260526_001_add_notification_preferences.sql
```

---

## Template de migration

```sql
-- Migration: 20260525_001_add_customer_tags_table
-- Descrição: Adiciona tabela de tags de clientes para CRM
-- Autor: [nome]
-- Data: 2026-05-25
-- Rollback: DROP TABLE IF EXISTS customer_tags;

-- UP
CREATE TABLE IF NOT EXISTS customer_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),

  UNIQUE(company_id, customer_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_company_id
  ON customer_tags(company_id);

CREATE INDEX IF NOT EXISTS idx_customer_tags_customer_id
  ON customer_tags(company_id, customer_id);
```

---

## Checklist de migration segura

```
[ ] Nome no formato <timestamp>_<NNN>_<descricao>.sql
[ ] Usa IF NOT EXISTS (idempotente)
[ ] Usa ALTER TABLE ... ADD COLUMN IF NOT EXISTS (idempotente)
[ ] NÃO usa DROP TABLE ou DROP COLUMN sem aprovação explícita
[ ] Novos índices criados com IF NOT EXISTS
[ ] Tabelas tenant têm company_id NOT NULL com FK para companies
[ ] Tabelas tenant têm índice em company_id
[ ] Rollback documentado no comentário
[ ] Testado em banco de dev antes de produção
```

---

## Regras obrigatórias

### NUNCA fazer sem aprovação explícita:
```sql
DROP TABLE ...
DROP COLUMN ...
ALTER TABLE ... ALTER COLUMN ... SET NOT NULL  (pode quebrar linhas existentes)
UPDATE ... (sem WHERE)
DELETE ... (sem WHERE)
```

### SEMPRE fazer:
```sql
-- Ao adicionar coluna com valor padrão:
ALTER TABLE companies ADD COLUMN IF NOT EXISTS my_field TEXT DEFAULT 'valor';

-- Ao criar índice:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_name ON table(column);
-- (CONCURRENTLY evita lock na tabela em produção)
```

---

## Passos do workflow

1. **Identificar** o que precisa mudar no schema
2. **Gerar** arquivo no formato correto em `backend/src/database/`
3. **Revisar** com checklist acima
4. **Adicionar** ao array em `scripts/run-migrations.js`
5. **Testar** em banco de dev: `npm run migrate`
6. **Documentar** no `docs/DOMAIN_EVENTS_CATALOG.md` se criar tabela de eventos
7. **Deploy** em produção após validação
