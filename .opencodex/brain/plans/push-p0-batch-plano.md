# PLANO: Push + Pós-Push (2026-07-10)

**Status**: Autorizado pelo humano. Pendente de execução.

---

## FASE 1 — Push (imediato)

```powershell
git push origin main
```

**Conteúdo**: 5 commits (governance + joefelipe-agent + context pack)
**Risco**: Baixo — apenas documentação, nenhum código de produção
**Pré-requisito**: Nenhum

---

## FASE 2 — Fix Lint (commit separado)

**Arquivo**: `frontend/vite.config.js`
**Erro**: `'process' is not defined` (2 ocorrências, linha 8)
**Fix**: Adicionar `/* eslint-env node */` no topo do arquivo
**Commit**: `fix(frontend): corrigir ambiente Node no vite.config.js`

---

## FASE 3 — Limpeza de Scripts Temporários

**Arquivos a remover** (da raiz e backend/):
- `_audit.js`, `_audit2.js`, `_audit3.js`
- `_fix.js`
- `check-rls.js`, `check-rls2.js`
- `inspect-columns.js`
- `query-outbox.js`
- `scripts/_audit.js`

**Commit**: `chore: remover scripts temporarios de auditoria`

---

## FASE 4 — Auditoria da Feature AI

**Arquivos para revisar** (untracked, NÃO commitados ainda):
- `backend/src/controllers/barber/ai-insights.js`
- `backend/src/database/20260708_031_ai_suggestions.sql`
- `backend/src/routes/barber-ai.routes.js`
- `backend/src/services/llm/`
- `frontend/src/features/barber/dashboard/components/AiInsightsCard.jsx`
- `backend/tests/unit/ai-insights-controller.test.js`
- `backend/tests/unit/llm-service.test.js`

**Gate**: Revisão humana antes de commitar

---

## FASE 5 — Deploy (após validação)

**Pré-requisitos**:
- Lint zerado
- Banco real rodando (local ou Supabase)
- 81 testes de integração rodando (não skipped)
- Smoke test pós-deploy

**Gate**: Aprovação humana explícita

---

## Checklist

- [ ] Push dos 5 commits → `git push origin main`
- [ ] Fix lint → commit separado
- [ ] Limpar scripts temporários → commit separado
- [ ] Auditar feature AI → decisão humana
- [ ] Rodar integrações com DB real
- [ ] Deploy → aprovação humana
- [ ] Smoke pós-deploy
