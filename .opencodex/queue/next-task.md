# 📥 NEXT TASK — Fila de Execução OpenCode

> Escrito pelo **Claude Code**. Lido e executado pelo **OpenCode Executor** via `/next-task`.
> Fluxo oficial: `docs/runbooks/prompt-orchestration-flow.md`.

---
status: pending
task_id: fase1-b1b-gate-poolconnect-tenant-context
title: Fase 1 / B1b-gate — Estender contexto tenant (GUC) às conexões pool.connect() (UoW + services)
created_by: Claude Code
created_at: 2026-06-04
origin_audit: .opencodex/audits/latest-audit.md   # achado da auditoria B1 + auditoria executiva 2026-06-04
roadmap: Pré-requisito do B1b (RLS FORCE em produção)
---

## MODEL CAPABILITY ASSESSMENT
- Executor recomendado: Big Pickle com **revisão obrigatória** + validação em STAGING.
- Nível de risco: **Alto em teoria, baixo na prática** — toca a camada de transação usada por TODAS as
  escritas, MAS a mudança é **inerte em produção** enquanto o RLS não estiver em FORCE (um `SET LOCAL` de
  um GUC que ninguém lê é no-op). Ativa-se só quando o B1b ligar o FORCE.
- Regra de escalonamento: por tocar o caminho de transação de todos os writes, **auditoria final por
  Claude obrigatória** + validação em staging.
- Modo de execução: **EXECUTE_WITH_REVIEW**

## Contexto / problema (achado da auditoria)
O B1 (binding ALS) cobriu `pool.query`, mas **não** `pool.connect()`. `UnitOfWork.begin()`
([unit-of-work.js:20](backend/src/shared/core/database/unit-of-work.js)) e **~11 services** abrem suas
próprias conexões via `pool.connect()` + `BEGIN` (sale, wallet, cash-flow, schedule, collaborator,
company, advance-settlement, master, booking-appointments, booking-customer-auth, auth). Essas conexões
**não recebem** `SET LOCAL app.current_company_id`. Logo, quando o B1b ativar FORCE RLS, **todos os
caminhos de escrita quebram** (queries sem o GUC → 0 linhas / erro). Esta missão fecha esse gate.

## Objetivo
Garantir que **toda transação aberta no caminho HTTP** — inclusive via `pool.connect()` (UoW + services) —
carregue o GUC `app.current_company_id`, **de forma transparente** (sem alterar os ~11 services nem o UoW),
e **inerte** até o RLS entrar em FORCE. Conexões de workers/jobs/Outbox (fora do contexto ALS) permanecem
intocadas.

## Abordagem recomendada (seguir; alternativa só com STOP+report)
1. **ALS carrega `companyId`:** estender o store do B1 para `{ client, companyId }`
   (`requireCompany.js` + `runWithTenantClient`/helper em `config/database.js`).
2. **Wrap de `pool.connect()`** em `config/database.js`:
   - Se chamado **dentro** de um contexto ALS com `companyId`: retornar um client cuja `query` intercepta
     o `BEGIN` (case-insensitive: `BEGIN` / `START TRANSACTION`) e, **logo após** o BEGIN ser executado,
     emite `SET LOCAL app.current_company_id = <companyId>`. Idempotente (não emitir 2x na mesma txn).
   - Se chamado **fora** de contexto ALS (workers/jobs/Outbox): retornar o client **cru** (sem mudança).
   - Não tocar `pool.query` (já tratado no B1).
3. **Auditar** conexões que fazem `pool.connect()` e rodam queries **sem** `BEGIN` (se houver) → documentar;
   essas não recebem GUC por esta via (reportar, não forçar).
4. **Shadow (staging):** com RLS ENABLEd (sem FORCE) em staging, provar que um write via UoW e via um
   service (ex.: sale) agora carregam o GUC e respeitam isolamento.

> Se a interceptação de `BEGIN` se mostrar frágil/insegura, **PARE e reporte** com a alternativa proposta
> (ex.: helper aplicado no `UnitOfWork.begin()` + wrap mínimo nos services) antes de implementar.

## ✅ ALLOWLIST — ÚNICOS arquivos que podem ser alterados/criados
- `backend/src/config/database.js`                          → wrap de `pool.connect()` + ALS `companyId`
- `backend/src/middlewares/requireCompany.js`               → guardar `companyId` no store ALS
- `backend/tests/unit/tenant-connect-wrap.test.js`          → **novo** unit (wrap BEGIN→SET LOCAL)
- `backend/tests/integration/tenant-isolation-rls.test.js`  → estender (write via UoW/service isolado)
- `docs/SECURITY-TENANT-ISOLATION.md`                       → documentar cobertura de `pool.connect()`

Qualquer arquivo fora desta lista = **violação de escopo → PARE**.

## ❌ ESCOPO PROIBIDO
- ❌ **NÃO** alterar os ~11 services nem o `unit-of-work.js` (a cobertura deve ser transparente; se exigir,
  PARE e reporte).
- ❌ **NÃO** ativar FORCE RLS em nenhum ambiente (isso é o B1b propriamente dito).
- ❌ **NÃO** tornar workers/jobs/Outbox tenant-scoped (continuam usando conexão crua).
- ❌ **NÃO** tocar `server.js`, billing, wallet (lógica), rate-limit, metrics, outbox-worker, frontend.
- ❌ **NÃO** reativar Fase C / `sale.created`.
- ❌ **NÃO** mudar `pool.query` (já é do B1).

## 🛑 HARD STOP RULES
1. **Staging seletivo**: `git add` só da allowlist; `git diff --cached --name-only` 1:1 antes do commit.
2. Se a cobertura exigir editar qualquer service ou o UoW → **PARE** e reporte (a meta é transparência).
3. Se a interceptação de `BEGIN` não puder ser garantida idempotente/correta → **PARE** e reporte alternativa.
4. **NUNCA** ativar FORCE nesta missão. Sem teste verde = não concluído. Sem `completed-task.md` = não concluído.

## Critérios de aceite
- [ ] `pool.connect()` em contexto ALS → após `BEGIN`, GUC `app.current_company_id` setado (SET LOCAL).
- [ ] `pool.connect()` fora de contexto (worker/job) → client cru, sem GUC (comportamento inalterado).
- [ ] UoW e ao menos 1 service (ex.: sale) cobertos **sem alterá-los** (transparente).
- [ ] **Inércia em produção:** sem RLS FORCE, comportamento funcional inalterado (SET LOCAL é no-op).
- [ ] Teste de isolamento (staging/CI com RLS ENABLEd): write via UoW de tenant A não afeta/lê B.
- [ ] Auditoria de `connect()`-sem-`BEGIN` documentada.
- [ ] **Nenhum** arquivo fora da allowlist alterado; `npm test` verde.

## Testes obrigatórios
```bash
cd backend && npx jest tests/unit/tenant-connect-wrap.test.js --no-coverage --silent
cd backend && npx jest tests/integration/tenant-isolation-rls.test.js --no-coverage   # requer TEST_DATABASE_URL
cd backend && npx jest --no-coverage --silent
```
Cobrir:
- (a) connect em contexto + BEGIN → SET LOCAL emitido com o companyId do ALS (1x, idempotente).
- (b) connect fora de contexto → nenhum SET LOCAL; client cru.
- (c) connect em contexto SEM BEGIN → nenhum SET LOCAL (sem erro).
- (d) integração: write via UoW com RLS ENABLEd respeita isolamento A↔B.

## Estratégia de rollback
- **Inerte sem FORCE** → produção não muda. Rollback = `git revert` do commit.
- Sem migration, sem DDL. O wrap pode ser desativado por reversão do `config/database.js`.

## Confirmação de não-impacto (produção, RLS ainda sem FORCE)
- Funcionalmente inerte: o `SET LOCAL` extra é ignorado enquanto nenhuma policy o lê em FORCE.
- **Billing/Wallet/BarberGestor:** comportamento inalterado.
- **Workers/Outbox/Jobs:** intocados (conexão crua).

## Condições de parada (PARE e reporte no completed-task.md)
- Necessidade de alterar services/UoW ou qualquer arquivo fora da allowlist.
- Interceptação de `BEGIN` não confiável.
- Qualquer teste existente quebrar.

## Instruções para o OpenCode Executor
1. Ler este `next-task.md` na íntegra + `docs/SECURITY-TENANT-ISOLATION.md` (contexto do B1).
2. Espelhar para `current-task.md` (`status: running`), criar branch `fase1/b1b-gate-poolconnect`.
3. Implementar: ALS companyId → wrap connect → testes → shadow staging → docs, validando a cada passo.
4. **Stage seletivo** (allowlist 1:1), commitar isolado.
5. Modo **EXECUTE_WITH_REVIEW**: `/complete-task` + `/audit-task` e devolver `completed-task.md` +
   `latest-audit.md` ao Claude Code para **decisão final** (foco: cobertura transparente + inércia sem FORCE).
