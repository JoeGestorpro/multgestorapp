# 05 — Próxima Melhor Ação

> **Status:** VIVO · **Atualizado:** 2026-06-23
> **Propósito:** Responder qual missão gera mais valor agora, reduz mais risco, desbloqueia produção/venda e deve ser executada primeiro.

---

## Matriz de decisão

| Critério | Missão | Nota |
|---|---|---|
| **Mais valor agora** | **Fase C — Revisão publicação .opencodex (PLAN_ONLY)** | Redação concluída. Próximo passo: revisar, classificar e recomendar |
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

## Próxima missão: **Fase C — Revisão publicação .opencodex (PLAN_ONLY)**

`fase-c/redacao-opencodex` concluída. O próximo passo é revisar o `.opencodex`
redigido, classificar arquivos como publicáveis, privados ou com ressalvas, e
gerar recomendação final ao humano. **PLAN_ONLY** — não publicar ainda.

Em paralelo, manter:

1. **Monitoramento diário/semanal** do backup (`last-status.json` → `OK`/`verified=true`).
2. **Fila de fundação segura** quando retomada: `security/rls-companies-users-policy` (próximo P1).

---

## Próximas ações recomendadas (Fase C — resgate cirúrgico)

| Ordem | Missão | Prioridade | Modo |
|---|---|---|---|
| 1 | **`fase-c/revisao-publicacao-opencodex`** | P2 | PLAN_ONLY — revisar, classificar, recomendar |
| 2 | Publicação do `.opencodex` | P2 | Somente após revisão + autorização humana |
| 3 | Cleanup de branch/worktree (somente no final) | P2 | Autorização explícita |
| 3 | `agent/joefelipe-consolidation` | SHELVADO | Retomar após Fase C |
| — | `security/rls-companies-users-policy` | P1 | Após Fase C |
| — | `infra/redis-production-config` | P1 | Após Fase C |

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
revisao-publicacao-opencodex   Alto   ↓↓     Baixo    1º (PLAN_ONLY)
publicacao-opencodex           Alto   ↓↓     Baixo    2º (pós-revisão)
cleanup-branch-worktree        Médio  —      Baixo    3º (final)
joefelipe-consolidation        Alto   —      Médio    SHELVADO
rls-companies-users            Alto   ↓↓     Médio    Após Fase C
redis-production-config        Médio  ↓      Baixo    Após Fase C
cicd-migrations-fail-fast      Alto   ↓↓     Alto     ⏳ bloqueado
e2e-booking-automated          Médio  ↓      Médio    Após P1
fluxo-trial-pago               Alto   —      Alto     Após P1
```
