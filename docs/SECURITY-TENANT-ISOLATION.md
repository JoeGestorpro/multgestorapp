# Security: Tenant Isolation (RLS) — Diagnóstico Corrigido

> Última atualização: 2026-06-05
> Status: **DIAGNÓSTICO CORRIGIDO** — substitui o plano de go-live baseado em `FORCE ROW LEVEL SECURITY` (inválido).
> Fonte da correção: auditoria via Supabase MCP (projeto `mfayajizbkqkcbhqmean`, somente leitura), 2026-06-05.
> Decisão arquitetural pendente: **requer aprovação humana + revisão de segurança antes de qualquer implementação.**

---

## 0. TL;DR — O que mudou e por quê

O diagnóstico anterior recomendava ativar `FORCE ROW LEVEL SECURITY` por tabela como caminho de go-live do isolamento RLS. **Isso está incorreto e não resolveria nada em produção.**

A auditoria provou que o app de produção conecta no Postgres como o role **`postgres`, que tem `rolbypassrls = true` (BYPASSRLS)**. BYPASSRLS ignora **todas** as policies de forma incondicional — inclusive `FORCE ROW LEVEL SECURITY`. FORCE só altera o comportamento do *owner* de uma tabela; **não tem efeito algum sobre um role com BYPASSRLS**.

Consequências:

1. As policies em [`rls_tenant_tables.sql`](../backend/src/database/rls_tenant_tables.sql) estão **sintaticamente corretas, mas INERTES em produção**. O isolamento real hoje vem **exclusivamente** dos filtros `WHERE company_id` na camada de aplicação (repositories). RLS é defesa-em-profundidade que **não está ativa**.
2. Adicionar `FORCE` **não** resolve — BYPASSRLS está hierarquicamente acima de FORCE.
3. Os testes de isolamento em [`tenant-isolation-rls.test.js`](../backend/tests/integration/tenant-isolation-rls.test.js) falham no CI porque a conexão de teste também é superuser/bypass — o que reflete **fielmente** o comportamento de produção, não um bug do teste.

**A correção real exige trocar o role de runtime** por um sem BYPASSRLS. É uma mudança de alto blast radius (seção 4) e está **bloqueada até aprovação**.

---

## 1. Evidências da auditoria (Supabase MCP, read-only)

### Roles (`pg_roles`)

| Role | superuser | bypassrls | Uso |
|---|---|---|---|
| `postgres` | false | **true** | **Role de runtime do app em produção** (e do CI) |
| `service_role` | — | **true** | Supabase service role |
| `authenticated` | — | false | Role JWT autenticado (não-bypass) |
| `anon` | — | false | Role anônimo (não-bypass) |

### Tabelas tenant (amostra: `barber_services`, `barber_appointments`, `booking_customers`, `clima_appointments`, …)

| Atributo | Valor | Significado |
|---|---|---|
| `owner` | `postgres` | Owner é o mesmo role bypass usado em runtime |
| `relrowsecurity` | true | RLS está **ENABLE** |
| `relforcerowsecurity` | false | FORCE não está ativo |

### Por que ENABLE + FORCE não bastaria aqui

- `ENABLE ROW LEVEL SECURITY`: aplica policies a roles **não-owner e não-bypass**.
- `FORCE ROW LEVEL SECURITY`: estende a aplicação de policies também ao **owner** da tabela.
- **BYPASSRLS** (atributo do role): ignora policies **sempre**, independente de ENABLE/FORCE e independente de ser owner.

Como o runtime é `postgres` (owner **e** bypass), nenhuma combinação de ENABLE/FORCE produz isolamento. O único caminho é o runtime deixar de ter BYPASSRLS.

---

## 2. Arquitetura atual (correta e mantida)

A infra de binding tenant→conexão via AsyncLocalStorage (ALS) está bem construída e **continua válida** — ela é pré-requisito para o RLS funcionar assim que o role runtime for corrigido. O que estava errado era apenas a conclusão de que FORCE ativaria o isolamento.

### Binding tenant→conexão via ALS

```
HTTP Request
  → requireCompany middleware
    → pool.connect() → BEGIN → SET LOCAL app.current_company_id = $1 (via set_config)
    → runWithTenantClient(client, companyId, next)  ← ALS context { client, companyId }
      → pool.query(...)  ← wrap B1: usa client do ALS
      → pool.connect()   ← wrap B1b: intercepta BEGIN → SET LOCAL automático
    → res.on('finish'/'close') → COMMIT/ROLLBACK + release
```

- `config/database.js`: `AsyncLocalStorage` (`tenantStore`) + wrap de `pool.query` (B1) + wrap de `pool.connect()` (B1b).
- `requireCompany.js`: abre conexão dedicada, `BEGIN` + `set_config('app.current_company_id', …, true)`, release garantido. Armazena `{ client, companyId }` no ALS.
- **Timeouts de proteção**: `statement_timeout` (30s) + `idle_in_transaction_session_timeout` (60s).

> Quando o runtime role for não-bypass, esse GUC passa a ser **efetivo** — as policies `company_id = current_setting('app.current_company_id', true)::uuid` começam a filtrar de verdade.

### RLS Policies (inertes hoje, prontas para amanhã)

Definidas em [`rls_tenant_tables.sql`](../backend/src/database/rls_tenant_tables.sql):
```sql
CREATE POLICY tenant_isolation ON <table>
  USING (company_id = current_setting('app.current_company_id', true)::uuid);
```

Estado atual em produção: `ENABLE` sem FORCE, mas **bypassadas** pelo role `postgres`. Isolamento primário = filtros `company_id` na aplicação.

---

## 3. Auditoria de Bypass aplicacional (camada que REALMENTE isola hoje)

Como o RLS está inerte, **o isolamento de produção depende 100% dos filtros `company_id`**. Esta auditoria (queries fora do contexto ALS no caminho HTTP) permanece válida e crítica.

| Categoria | Rotas | Risco | Justificativa |
|---|---|---|---|
| Auth flows (login, register, password reset, refresh) | `/api/auth/*`, `/api/booking-auth/*` | LOW | Pre-tenant por design; queries por identidade |
| Public booking | `/api/public/booking/*`, `/api/public/scheduling/*` | LOW | Público por design; queries por slug |
| Webhook receivers | `/api/webhooks/*` | LOW | Externo; queries por gateway + event_id |
| Master admin | `/api/master/*` | LOW | Cross-tenant por design; `requireMasterAdminAuth` |
| Health endpoints | `/api/health`, `/api/health/deep` | NONE | Sem dados tenant |
| OutboxWorker / Jobs | Background | **REVISAR** | Ver seção 4.1 — jobs cross-tenant quebram sob role não-bypass |

---

## 4. Correção real (PROPOSTA — bloqueada até aprovação)

> ⚠️ Alto blast radius. **Não implementar sem aprovação humana e revisão de segurança.** Não fazer deploy.

**Introduzir um role de runtime least-privilege SEM BYPASSRLS** e fazer o backend conectar com ele.

Opções:
- Usar um role existente não-bypass (`authenticated`), ou
- Criar um role dedicado `app_runtime` (não-bypass), com `GRANT`s explícitos (SELECT/INSERT/UPDATE/DELETE) nas tabelas tenant.

Mudanças necessárias:
- Trocar o usuário no `DATABASE_URL`/secret em **produção** e no **CI** para o role não-bypass.
- Manter `postgres` **apenas** para migrations/admin (DDL não sofre RLS).

### 4.1 Impactos a avaliar antes de implementar

| Área | Impacto | Mitigação a definir |
|---|---|---|
| **Migrations** | Rodam como `postgres` — DDL não sofre RLS. OK. | Nenhuma; manter `postgres` só para migrations. |
| **Job cross-tenant** [`appointment-reminder-job.js`](../backend/src/jobs/appointment-reminder-job.js) | `pool.connect()` **fora** do ALS, sem GUC, varre `barber_appointments` sem `WHERE company_id`. Sob role não-bypass + RLS → **0 linhas, quebra silenciosa**. | Setar GUC por empresa (loop por company) **ou** rodar sob role privilegiado controlado e auditado. |
| **OutboxWorker / demais jobs** | Mesmo padrão (background, fora do ALS). | Auditar cada job; decidir GUC-por-tenant vs. role admin. |
| **`service_role`** | bypassrls=true. | Usar **somente** onde o bypass é intencional e documentado. |
| **Master admin (`/api/master/*`)** | Cruza tenants por design. | Definir se usa role admin separado ou GUC especial. |
| **Pool de conexões** | Troca de role pode interagir com pgBouncer/Supabase pooler. | Validar modo de pool (session vs. transaction) com o novo role. |

### 4.2 Ordem segura de execução (somente após aprovação)

1. Criar role não-bypass + `GRANT`s (em staging primeiro).
2. Ajustar jobs cross-tenant (GUC por empresa ou role admin explícito).
3. Apontar `DATABASE_URL` do **CI** para o role não-bypass.
4. Atualizar [`tenant-isolation-rls.test.js`](../backend/tests/integration/tenant-isolation-rls.test.js) para conectar com esse role. Com runtime **não-bypass e não-owner**, `ENABLE` já basta (FORCE só seria necessário se o runtime fosse o owner). Validar suíte completa (32/32) no Postgres do CI.
5. Staging: trocar o role, smoke + load test.
6. Produção: trocar o secret, monitorar.

---

## 5. Hardening de RLS abrangente (backlog — advisors Supabase)

Fora do escopo imediato, mas registrado. O security advisor do Supabase reporta:

- **`rls_disabled_in_public` (ERROR)**: `subscriptions`, `invoices`, `password_reset_tokens`, `first_access_tokens`, `settings`, `audit_logs`, entre outras — tabelas sem RLS habilitado.
- **`security_definer_view`**: `public.appointments`.
- **`sensitive_columns_exposed`**: coluna `token` em `*_tokens`.

Avaliar num esforço dedicado de hardening, junto com a correção do role runtime.

---

## 6. Itens a corrigir no backlog/governança

- [`.opencodex/queue/backlog.md`](../.opencodex/queue/backlog.md) — a missão `fase1-b1b-rls-prod-activation` ("Ativação de FORCE em produção, rollout por tabela") parte da premissa **inválida**. Deve ser substituída pela missão de **role runtime least-privilege** (seção 4), marcada como bloqueada até aprovação.

---

## 7. Restrições operacionais (invioláveis)

- **NÃO** apontar testes para o Supabase de produção. `DATABASE_URL` no `.env` é produção; há `guardAgainstProduction`.
- **NÃO** fazer deploy nem trocar role/secret sem aprovação humana.
- A troca de role runtime é decisão arquitetural com revisão de segurança obrigatória.

---

## 8. Rollback / segurança da própria correção

- A infra ALS já existente permanece funcional independentemente do role.
- Se a troca de role em staging causar problema: reverter o `DATABASE_URL` para `postgres` restaura o comportamento atual em segundos (RLS volta a ficar inerte, isolamento aplicacional intacto).
- Nenhuma alteração de schema/DDL é exigida pela correção do role — apenas `GRANT`s e troca de credencial.

---

## Apêndice — Diagnóstico anterior (SUPERSEDED)

A versão anterior deste documento descrevia um "Plano de Go-Live Faseado" (Fases 2–4) ativando `ENABLE` e depois `FORCE ROW LEVEL SECURITY` tabela a tabela em produção. **Esse plano é inválido** pelos motivos da seção 0/1 (runtime com BYPASSRLS). Mantido aqui apenas como registro histórico da decisão corrigida. Não executar.
