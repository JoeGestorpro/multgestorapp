# 05 — Próxima Melhor Ação

> **Status:** VIVO · **Atualizado:** 2026-06-23
> **Propósito:** Responder qual missão gera mais valor agora, reduz mais risco, desbloqueia produção/venda e deve ser executada primeiro.

---

## Matriz de decisão

| Critério | Missão | Nota |
|---|---|---|
| **Mais valor agora** | **Cleanup de branches/worktrees (pós-Fase C FECHADA)** | Fase C encerrada (PRs #15/#16 mergeados, `main`=`af04618`). Higiene antes de retomar o agente |
| **Reduz mais risco** | `security/rls-companies-users-policy` | P1 de segurança multi-tenant ainda aberto |
| **Desbloqueia produção** | `security/rls-companies-users-policy` | Próximo da fundação segura após backup |
| **Desbloqueia venda** | `security/rls-companies-users-policy` | Segurança é pré-requisito para cliente pagante |
| **Menor esforço** | Monitorar backup diário | Só conferir `last-status.json` |

---

## ✅ `fase-c/redacao-opencodex` — CONCLUÍDO (2026-06-23)

9 arquivos redigidos, 20 substituições aplicadas. Valores reais sensíveis
removidos. Domínios frontend públicos preservados. Nenhuma publicação, commit,
push, branch, cleanup, deploy ou migration executada. Veredito: pronto para
revisão.

## ✅ `fase-c/decisao-opencodex` — CONCLUÍDO (2026-06-23)

Varredura PLAN_ONLY do `.opencodex/` concluída. Nenhum secret real encontrado.
Decisão D-014: publicar com ressalvas/redação. ~70% classificado como
potencialmente publicável; nenhuma publicação autorizada nesta missão.

## ✅ `fase-c/pr-2-backup-b2-checklist` — CONCLUÍDO (2026-06-23)

Checklist READ_ONLY do backup/B2 executado com veredito OK:
- Backup local: dump 648KB, APPROVED
- Scheduler: Ready, LastRun 02:00, exit 0, 0 missed
- B2 externo: backblaze-b2, verified=true, sha1 match
- Agente/fila: OK conforme inspeção READ_ONLY
PR-2 **não** resolveu R-002 (RLS/multi-tenant) — escopo exclusivo backup/B2.

## ✅ `fase-c/pr-1 (PR #13)` — CONCLUÍDO (2026-06-23)

JoeFelipe Agent safety tests mergeados em `origin/main` via PR #13 (`863d811`).
23/23 testes verdes. 4 arquivos de teste + 1 linha `package.json`. Fase C continua
como **resgate cirúrgico**, não merge.

## ✅ `ops/backup-external-copy` — CONCLUÍDO (2026-06-22)

Backup externo B2 validado e ligado (`verified=true`, `BRCHK_EXTERNAL_ENABLED=1`, conexão direta).
Ver [[../audits/AUDITORIA-BACKUP-GOVERNANCA-PROVA-VIVA-2026-06-22|prova viva]].

## ✅ Fase C — FECHADA (2026-06-23)

PR #16 (`bd13f69`) MERGED — deploy disparou e terminou **success**. PR #15 (`af04618`)
MERGED — **não** disparou deploy (`paths-ignore` funcionou). `origin/main` head = `af04618`.
state_version 17→18. Fase C encerrada oficialmente.

## Próxima missão: **`cleanup/fase-c-branches-worktrees` (HUMAN_APPROVAL_REQUIRED)**

Higiene dos branches/worktrees acumulados na Fase C; deleção só com lista explícita
aprovada item a item (preservar `backup/*`). Depois: `agent/joefelipe-consolidation`.

Em paralelo, manter:

1. **Monitoramento diário/semanal** do backup (`last-status.json` → `OK`/`verified=true`).
2. **Fila de fundação segura** quando retomada: `security/rls-companies-users-policy` (próximo P1).

---

## Próximas ações recomendadas (Fase C — resgate cirúrgico)

| Ordem | Missão | Prioridade | Modo |
|---|---|---|---|
| 1 | **`cleanup/fase-c-branches-worktrees`** | P2 | HUMAN_APPROVAL_REQUIRED — inventário + deleção com lista explícita |
| 2 | `agent/joefelipe-consolidation` | P2 | Próxima após o cleanup (retomar consolidação do agente) |
| — | `security/rls-companies-users-policy` | P1 | Após cleanup |
| — | `infra/redis-production-config` | P1 | Após cleanup (backbone do R-003) |

Após a Fase C, a fundação P1 estará fechada e o sistema estará pronto para:
- `cicd/migrations-fail-fast` (se OPS-SUPAVISOR resolvido)
- `e2e-public-booking-validation` (automatizado)
- Fluxo trial → pago (venda)

---

## Decisões que bloqueiam

| Decisão | Bloqueia | Recomendação |
|---|---|---|
| RLS: policies formais vs BYPASSRLS | `security/rls-companies-users-policy` | Criar policies formais (defesa em profundidade) |
| Redis: pagar vs aceitar in-memory | `infra/redis-production-config` | Pagar (~$15/mês no Render) — risco baixo, ganho alto |
| WhatsApp: real vs mock | Múltiplas missões | Ativar real — infra já existe, credenciais no .env |
| OutboxWorker: break vs continue | Fase-c | Continuar — melhor ter evento a mais que perder |

---

## Matriz completa

```
Missão                         Valor  Risco  Esforço  Prioridade
────────────────────────────────────────────────────────────────
backup-external-copy           Alto   ↓↓↓    Baixo    ✅ CONCLUÍDO 2026-06-22
fase-c/pr-1 (PR #13)          Alto   —      Baixo    ✅ CONCLUÍDO 2026-06-23
fase-c/pr-2-b2-checklist       Médio  ↓      Baixo    ✅ CONCLUÍDO 2026-06-23
decisao-opencodex              Alto   ↓↓     Baixo    ✅ CONCLUÍDO 2026-06-23
redacao-opencodex              Alto   ↓↓     Baixo    ✅ CONCLUÍDO 2026-06-23
fase-c (encerramento #15/#16)  Alto   ↓↓     Baixo    ✅ FECHADA 2026-06-23 (main=af04618)
cleanup-branch-worktree        Médio  —      Baixo    1º (HUMAN_APPROVAL_REQUIRED)
joefelipe-consolidation        Alto   —      Médio    2º (após cleanup)
rls-companies-users            Alto   ↓↓     Médio    Após Fase C
redis-production-config        Médio  ↓      Baixo    Após Fase C
cicd-migrations-fail-fast      Alto   ↓↓     Alto     ⏳ bloqueado
e2e-booking-automated          Médio  ↓      Médio    Após P1
fluxo-trial-pago               Alto   —      Alto     Após P1
```
