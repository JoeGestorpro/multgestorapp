# Security: Tenant Isolation (RLS) — Plano de Go-Live Faseado

> Última atualização: 2026-06-04
> Missão: `fase1-b1-rls-foundation` (B1 da Fase 1)
> Próxima missão: `fase1-b1b-rls-prod-activation` (FORCE em produção)

---

## 1. Arquitetura

### Binding tenant→conexão via AsyncLocalStorage (ALS)

```
HTTP Request
  → requireCompany middleware
    → pool.connect() → BEGIN → SET LOCAL app.current_company_id = $1
    → runWithTenantClient(client, next)  ← ALS context
      → pool.query(...)  ← wrap transparente: usa client do ALS
    → res.on('finish'/'close') → COMMIT/ROLLBACK + release
```

- `config/database.js`: `AsyncLocalStorage` (`tenantStore`) + wrap de `pool.query`.
  - Se `tenantStore.getStore()?.client` existe → usa o client do request.
  - Senão → usa o pool original (OutboxWorker, jobs, auth flows, master admin).
- `requireCompany.js`: abre conexão dedicada, `BEGIN` + `SET LOCAL`, release garantido.
- **Timeouts de proteção**: `statement_timeout` (30s) + `idle_in_transaction_session_timeout` (60s).

### RLS Policies

Definidas em `backend/src/database/rls_tenant_tables.sql`:
```sql
CREATE POLICY tenant_isolation ON <table>
  USING (company_id = current_setting('app.current_company_id', true)::uuid);
```

- `ENABLE ROW LEVEL SECURITY` — policies aplicam apenas quando `FORCE ROW LEVEL SECURITY` também está ativo (para o owner da conexão).
- Em staging: ENABLE + FORCE (shadow testing).
- Em produção (atual): ENABLE sem FORCE — isolamento aplicacional (`company_id` nos repositórios) continua sendo a camada primária.

---

## 2. Auditoria de Bypass (pool.query fora do contexto ALS)

Todos os `pool.query` no caminho HTTP que rodam **sem** contexto ALS foram auditados.
**Nenhum bypass de alto risco encontrado.**

| Categoria | Rotas | Risco | Justificativa |
|---|---|---|---|
| Auth flows (login, register, password reset, refresh) | `/api/auth/*`, `/api/booking-auth/*` | LOW | Pre-tenant por design; queries por identidade (email, user ID, token) |
| Public booking | `/api/public/booking/*`, `/api/public/scheduling/*` | LOW | Público por design; queries por slug da empresa |
| Webhook receivers | `/api/webhooks/*` | LOW | Externo por design; queries por gateway + event_id |
| Master admin | `/api/master/*` | LOW | Cross-tenant por design; guardado por `requireMasterAdminAuth` |
| Health endpoints | `/api/health`, `/api/health/deep` | NONE | Sem dados tenant |
| OutboxWorker / Jobs | Background | NONE | Esperados fora do ALS (queries de sistema) |

---

## 3. Plano de Go-Live Faseado

### Fase 1: Fundação (esta missão — B1) ✅
- [x] ALS no `config/database.js` (wrap transparente de `pool.query`)
- [x] `requireCompany.js` com binding real (txn + SET LOCAL + release garantido)
- [x] Teste de isolamento RLS (unit + integration quando há TEST_DATABASE_URL)
- [x] Auditoria de bypass documentada
- [ ] **Staging**: aplicar `rls_tenant_tables.sql` com ENABLE + FORCE; validar tráfego normal
- [ ] **Staging**: load test básico (verificar que pool não esgota)

### Fase 2: Produção — ENABLE (missão `fase1-b1b-rls-prod-activation`)
- [ ] Aplicar `rls_tenant_tables.sql` em produção com **ENABLE** (sem FORCE)
- [ ] Monitorar logs por 48h (nenhum impacto esperado — ENABLE sem FORCE não afeta owner)
- [ ] Validar que métricas (`redis_up`, `db_pool_waiting`) permanecem estáveis

### Fase 3: Produção — FORCE por tabela (missões futuras)
- [ ] Ativar `FORCE ROW LEVEL SECURITY` **uma tabela por vez**, começando pelas menos críticas
- [ ] Ordem sugerida: `barber_client_notes` → `barber_client_tags` → `barber_client_events` → ... → `barber_appointments` → `barber_services`
- [ ] Cada tabela: FORCE → monitorar 24h → validar → próxima
- [ ] Rollback imediato: `ALTER TABLE <tabela> NO FORCE ROW LEVEL SECURITY`

### Fase 4: Full FORCE
- [ ] Todas as tabelas com FORCE ativo
- [ ] Remover `company_id` redundante dos WHERE clauses nos repositórios (opcional — defesa em profundidade)
- [ ] Monitoramento contínuo

---

## 4. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Esgotamento de pool sob carga | `statement_timeout` (30s) + `idle_in_transaction_session_timeout` (60s) + release garantido em `finish`/`close`/erro |
| Vazamento de contexto entre requests | Encerramento idempotente e único (flag `released`); teste de release coberto |
| Queries fora do contexto ALS | Auditoria documentada (seção 2); todas as ocorrências são by-design |
| FORCE em produção antes da hora | **Nunca** ativar FORCE nesta missão; `fase1-b1b` é gated |

---

## 5. Rollback

- Rollback = `git revert` do commit B1.
- Se ENABLE em staging causar problema: `ALTER TABLE <tabela> DISABLE ROW LEVEL SECURITY` (reversível em segundos).
- Feature flag: reverter `requireCompany.js` para o comportamento anterior (SET LOCAL fire-and-forget) mantém o app funcional sem ALS.

---

## 6. Decisões de Design

### Transação por request vs client por request com SET de sessão

**Escolha: transação por request (BEGIN + SET LOCAL + COMMIT/ROLLBACK).**

Trade-offs:
- **Vantagem**: `SET LOCAL` reseta automaticamente no fim da transação — sem risco de vazamento de GUC para conexões reutilizadas.
- **Vantagem**: COMMIT atômico — todas as queries do request são parte da mesma transação.
- **Desvantagem**: cada request consome uma conexão do pool por toda a duração (mitigado por timeouts).
- **Desvantagem**: queries que fazem COMMIT interno (ex.: UnitOfWork) podem conflitar — o UnitOfWork já usa `pool.connect()` separado, então não conflita.
