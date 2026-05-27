# Workflow: /run-migrations

**Trigger:** `/run-migrations [--env staging|production]`
**Responsável:** DevOps Engineer + Database Architect
**Risco:** **CRITICAL** — alteração irreversível do schema de produção

---

## 1. PRÉ-REQUISITOS OBRIGATÓRIOS

Antes de executar qualquer migration, confirmar **TODOS** os itens abaixo:

- [ ] Backup completo do Supabase realizado (PITR ou dump manual)
- [ ] `DATABASE_URL` do ambiente alvo configurada e testada
- [ ] Branch `principal` local está sincronizada com o remoto (`git fetch`)
- [ ] `scripts/run-migrations.js` foi revisado e não contém comandos destrutivos
- [ ] Equipe de desenvolvimento notificada (janela de manutenção definida)
- [ ] Rollback plan documentado (seção 7 deste workflow)
- [ ] Staging foi validado com sucesso antes de produção

---

## 2. VERIFICAÇÃO PRÉ-EXECUÇÃO

### 2.1 Verificar migrations já aplicadas

```bash
psql $DATABASE_URL -c "SELECT version, name, applied_at FROM schema_migrations ORDER BY version;"
```

**Esperado:** Lista parcial das 17 migrations. Novas migrations devem aparecer como ausentes.

### 2.2 Verificar arquivos SQL existentes

```bash
ls -la backend/src/database/*.sql | wc -l
```

**Esperado:** 17 arquivos SQL presentes.

### 2.3 Ordem de execução (definida em `scripts/run-migrations.js`)

| Versão | Arquivo | Descrição |
|--------|---------|-----------|
| 20260101_001 | auth-security.sql | Auth + PIN reset tokens |
| 20260101_002 | master-dashboard.sql | Master admin views |
| 20260101_003 | master-finance.sql | Financeiro master |
| 20260101_004 | master-admin.sql | Administração master |
| 20260101_005 | barber.sql | Core barber (serviços, colaboradores) |
| 20260101_006 | client-booking.sql | Booking de clientes |
| 20260101_007 | first-access.sql | First access flow |
| 20260101_008 | booking-landing.sql | Landing pages de booking |
| 20260101_009 | crm-tables.sql | CRM + clientes |
| 20260101_010 | migrations-availability.sql | Disponibilidade de horários |
| 20260101_011 | outbox.sql | Outbox pattern para eventos |
| 20260101_012 | integration-configs.sql | Configurações de integrações |
| 20260101_013 | migration-starts-at-ends-at.sql | Refatoração agendamentos (starts_at/ends_at) |
| 20260526_014 | clima.sql | Módulo Clima (módulo independente) |
| 20260526_015 | clima_appointments.sql | Agendamentos Clima |
| 20260526_016 | trial_email_log.sql | Log de emails de trial |
| 20260526_017 | rls_tenant_tables.sql | **RLS + Row Level Security** |

---

## 3. EXECUÇÃO

### 3.1 Ambiente Staging (sempre primeiro)

```bash
export DATABASE_URL="postgresql://..."  # URL do Supabase staging
node backend/scripts/run-migrations.js
```

### 3.2 Ambiente Production (após staging validado)

```bash
export DATABASE_URL="postgresql://..."  # URL do Supabase production
node backend/scripts/run-migrations.js
```

**ATENÇÃO:** A migration `rls_tenant_tables.sql` (v20260526_017) deve ser **testada em staging** antes de produção. Ela aplica políticas RLS que podem bloquear acessos existentes se houver queries sem `company_id`.

---

## 4. VERIFICAÇÃO PÓS-EXECUÇÃO

### 4.1 Confirmar todas as 17 versões na tabela

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM schema_migrations;"
```

**Esperado:** `17`

### 4.2 Verificar integridade do schema

```bash
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

**Esperado:** Todas as tabelas do sistema presentes.

### 4.3 Verificar tabela crítica de health check

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pin_reset_tokens;"
```

**Esperado:** Query executa sem erro (a tabela existe).

---

## 5. RLS — ALERTA ESPECIAL

A migration `rls_tenant_tables.sql` contém:
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- `CREATE POLICY tenant_isolation ON ... USING (company_id = current_setting('app.current_company')::uuid);`

### Riscos:
1. Queries sem `company_id` explícito serão bloqueadas
2. Aplicações legadas podem parar de funcionar
3. O `current_setting('app.current_company')` deve ser setado por toda conexão

### Mitigação:
- Testar em staging com dados reais (cópia anonimizada)
- Verificar se o `BaseRepository` seta o `app.current_company` no `pg` pool
- Confirmar que `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS) é usado apenas em jobs/admin

---

## 6. CHECKLIST DE SEGURANÇA

### Antes
- [ ] Backup do banco confirmado
- [ ] `DATABASE_URL` aponta para ambiente correto (staging primeiro)
- [ ] Janela de manutenção notificada
- [ ] Rollback plan revisado

### Durante
- [ ] Logs do `run-migrations.js` monitorados em tempo real
- [ ] Nenhum erro de constraint ou permissão
- [ ] Duração de cada migration registrada

### Após
- [ ] Todas as 17 migrations aparecem em `schema_migrations`
- [ ] Health check do Render retorna 200
- [ ] Smoke test passa (ver workflow `/smoke-test`)
- [ ] Métricas de erro (Sentry) não aumentaram

---

## 7. ROLLBACK

### Estratégia por migration

**Migrations idempotentes (CREATE IF NOT EXISTS / ALTER):**
- Geralmente seguras; rollback manual via `DROP` se necessário

**Migrations destrutivas (DROP, TRUNCATE):**
- **NÃO EXISTEM** no projeto atual. Se forem adicionadas futuramente, exigem backup + script de reversão dedicado.

**RLS (rls_tenant_tables.sql):**
```sql
-- Para desabilitar RLS em caso de emergência:
ALTER TABLE barber_appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE barber_services DISABLE ROW LEVEL SECURITY;
-- (repetir para todas as tabelas afetadas)
```

### Rollback completo (PITR — Point in Time Recovery)
1. Acessar Supabase Dashboard → Database → Backups
2. Selecionar PITR para o momento anterior à execução
3. Restaurar (pode levar 5-15 min)
4. Re-executar migrations que já estavam aplicadas antes do rollback

---

## 8. COMANDO DE REFERÊNCIA

```bash
# Staging
DATABASE_URL="postgresql://...staging..." node backend/scripts/run-migrations.js

# Production (com confirmação)
read -p "CONFIRMA PROD? (type PROD): " confirm && [ "$confirm" = "PROD" ] && DATABASE_URL="postgresql://...prod..." node backend/scripts/run-migrations.js
```
