# Audit Report — Gate pool.connect + B4 consolidado (reconciliado por Claude Code)

---
status: decided
task_id: fase1-b1b-gate-poolconnect-tenant-context
title: Fase 1 / B1b-gate — wrap transparente pool.connect() + correção B4 (cache-manager)
audited_by: Claude Code (Opus 4.8) — verificação direta (gate implementado fora do fluxo formal)
audited_at: 2026-06-04
verdict: APPROVE
claude_decision: APPROVE
risk_level: Médio/Alto (camada de transação)
branch: fase1/b1b-gate-poolconnect
commits:
  - 36e1872 merge(b1): traz B1 ALS binding (+B2/B3/B4/frontend/billing) para a branch
  - c2f54ec feat(tenant): gate — wrap transparente de pool.connect()
  - 3b923a8 fix(cache): recuperar incr/_fbClear/_fbIncr (corrige regressão do B4)
---

## 1. Contexto
O gate `pool.connect` foi implementado **fora do fluxo formal** (current-task idle, completed/audit
desatualizados). Ao consolidar o funcional na branch, a suíte expôs uma **regressão do B4**. Claude Code
auditou diretamente, corrigiu o B4 e fechou.

## 2. Gate pool.connect (`c2f54ec`) — APPROVE
- `config/database.js`: wrap de `pool.connect()`; quando há `companyId` no ALS, intercepta o `BEGIN`
  (`BEGIN_RE`) e emite `SET LOCAL app.current_company_id` **uma vez** (`gucSet`). Sem ALS → client cru
  (workers/jobs intocados). Inerte enquanto RLS não estiver em FORCE.
- `requireCompany.js:75`: passa `tenant.companyId` ao `runWithTenantClient` (store `{ client, companyId }`).
- Testes próprios: `tenant-connect-wrap.test.js` **11/11**.
- Notas (baixo risco): wrap torna `client.query` sempre promise (callback-style quebraria, mas o código usa
  async/await — consistente com o wrap de `pool.query` do B1); SET LOCAL só na 1ª transação do client.

## 3. Regressão do B4 — encontrada e CORRIGIDA (`3b923a8`)
- **Defeito:** `cache-manager.js` não tinha `incr`/`_fbClear`/`_fbIncr`. O commit do B4 (`e532285`) versionou
  o **consumidor** (`rate-limit.middleware.js:28` usa `cacheManager.incr`) mas **não o produtor** — os métodos
  viviam no blob não-commitado (stash `fa6a57a`). Efeito: rate-limit **fail-open silencioso** em runtime + 13 testes falhando.
- **Correção:** recuperados do stash **apenas** os métodos faltantes (+ `MAX_FALLBACK_ENTRIES`/`_ensureFallbackSpace`).
- **Resultado:** B4 13/13; suíte completa **619/619, 0 falhas**.

## 4. Veredito
**APPROVE** — gate correto + B4 restaurado. Suíte verde (619/619), quarentena Fase C intacta, RLS sem FORCE.

## 5. Lição (para lessons-learned)
Commit deve versionar **produtor + consumidor juntos**. O B4 "passou" antes sobre dependência não-commitada
(working-tree). Mesma família do incidente do blob/git clean. Reforça a disciplina de **staging seletivo COMPLETO**.

## 6. Pós-auditoria — `9aaf3e8` fix(tenant): remove invalid tenantContext reassignment
- **Auditado por:** Claude Code (Big Pickle) — 2026-06-05
- **Veredito:** ✅ APPROVE
- **Risco:** Muito Baixo (1 linha removida, 635 testes verdes, 0 falhas, sem alteração fora do escopo)
- **Causa:** `requireCompany.js` tentava `req.tenantContext = tenant`; `req.tenantContext` era getter
  read-only sem setter (definido por `tenantContext` middleware via `Object.defineProperty`). TypeError
  resultava em 500 em todas as rotas barber. A linha era redundante — o getter de `tenantContext` já
  extrai o mesmo valor de `req.user` dinamicamente.
- **Impacto arquitetural:** Reforça que `req.tenantContext` é **somente leitura** no Shared Kernel.
  Consumidores devem apenas ler o valor; a origem deve ser `req.user`.
- **Proteção futura sugerida:** Teste unitário `tenant-context-readonly.test.js` validando que
  `req.tenantContext = {}` lança TypeError.

## 7. Próximo passo
Reconciliação para `main` **liberada do ponto de vista de testes** (635 verde). Falta apenas o **lembrete**
(`545282d`) na branch + o **FF de `main`** — ambos com confirmação humana (ver `next-task.md`).
