# 02 — Painel Executivo

> **Status:** VIVO · **Atualizado:** 2026-06-23
> **Propósito:** Responder onde estamos, o que mudou, o que está bloqueado, qual o maior risco, qual a próxima decisão.

---

## Onde estamos

| Indicador | Estado |
|---|---|
| **Fase** | Estabilização de produção + Endurecimento de segurança |
| **state_version** | 16 |
| **Produção** | 🟢 Online (barbergestor.com.br), health 200, DB conectado |
| **Backup** | 🟢 Diário local + **cópia externa B2 validada** (`verified=true`, 2026-06-22) |
| **Outbox** | 🟢 `failed=0` (data-fix concluído A-003) |
| **Missão atual** | ⏸️ idle |
| **Próxima missão** | 🔵 **Revisão publicação .opencodex** (Fase C, PLAN_ONLY — revisar e recomendar) |

---

## O que mudou (últimas missões)

- **2026-06-23:** **`fase-c/redacao-opencodex` concluída** — 9 arquivos redigidos,
  20 substituições aplicadas. Valores reais sensíveis removidos. Domínios frontend
  públicos preservados. Nenhuma publicação, commit, push, branch, cleanup, deploy
  ou migration executada. Próximo passo: revisão e recomendação de publicação.
- **2026-06-23:** **Decisão D-014 tomada** — publicar `.opencodex` com ressalvas/redação.
  Varredura PLAN_ONLY concluída sem secrets reais. ~70% classificado como potencialmente
  publicável; nenhuma publicação autorizada nesta missão. Próximo passo: redação
  dos arquivos amarelos.
- **2026-06-23:** **PR-2 da Fase C concluído** — backup/B2 checklist READ_ONLY com veredito OK em todos os itens (backup local ✅, scheduler ✅, B2 externo ✅, hash ✅, agente/fila OK conforme inspeção READ_ONLY). PR-2 não resolveu R-002 (RLS/multi-tenant) — escopo exclusivo backup/B2. Próximo passo: decisão sobre `.opencodex`.
- **2026-06-23:** **PR-1 da Fase C concluído** — JoeFelipe Agent safety tests mergeados em `origin/main` via PR #13 (`863d811`). 23/23 testes verdes. Fase C continua como resgate cirúrgico. agent/joefelipe-consolidation shelvado.
- **2026-06-22:** Backup externo B2 corrigido, validado e ligado (`BRCHK_EXTERNAL_ENABLED=1`, `verified=true`) — A-002 resolvido. Dump: pooler → conexão direta. Ver [[../audits/AUDITORIA-BACKUP-GOVERNANCA-PROVA-VIVA-2026-06-22|prova viva]].
- **2026-06-22:** P0 de segurança fechado (exposição `anon`/PostgREST via RLS + REVOKE) + booking público E2E validado em produção.
- **2026-06-19:** Auditoria roadmap completa (24 seções, divergências corrigidas no capabilities-map)
- **2026-06-19:** Production-readiness + commercial-readiness criados
- **2026-06-18:** Outbox orphaned reconciled (`failed=0`, A-003 resolvido)
- **2026-06-18:** E2E booking validation (GET OK, POST gated)
- **2026-06-18:** Backup scheduler registrado (`State=Ready`, 02:00 diário)
- **2026-06-18:** Backup-restore gate passou (dump + restore validados)
- **2026-06-15:** XSS hardening deployado (Bloco B+C, PR #6)

---

## O que está bloqueado

| Bloqueio | Severidade | Responsável |
|---|---|---|
| `fase-c/revisao-publicacao-opencodex` | P2 | 🔵 PLAN_ONLY — revisar, classificar, recomendar |
| `.opencodex` — publicação | — | 🔄 Continua travado até revisão, aprovação humana e autorização explícita de publicação |
| `cleanup branch/worktree` | — | 🚫 Travado até final da Fase C |
| `agent/joefelipe-consolidation` | — | 💤 Shelvado até Fase C terminar |
| `security/rls-companies-users-policy` | P1 | Aguarda decisão humana |
| `infra/redis-production-config` | P1 | Aguarda decisão humana (custo vs risco) |
| `cicd/migrations-fail-fast` | P1 | 🔴 OPS-SUPAVISOR + secrets rotation pausada |
| `whatsapp-official-decision` | P2 | Decisão: real vs mock documentado |

---

## Maior risco ativo

### 🔴 P0 — Nenhum

### 🟢 RESOLVIDO (2026-06-22) — Perda de todos os backups (era P1 catastrófico)

**Risco original:** Backup existia apenas no HD local. Perda do equipamento = perda de todos os backups.

**Mitigação aplicada:** `ops/backup-external-copy` concluída — cópia diária externa para Backblaze B2 (`verified=true`, `status=OK`). Risco rebaixado para **monitorado** (conferência diária/semanal).

### 🔴 P1 — Isolamento multi-tenant incompleto

**Risco:** `companies` e `users` sem RLS. Defesa em profundidade ausente nas tabelas-mãe.

**Mitigação:** `security/rls-companies-users-policy` — backlog, aguarda #1.

### 🔴 P1 — CI migrations com fail silencioso

**Risco:** `continue-on-error: true` — migration falhada não bloqueia deploy.

**Mitigação:** Bloqueado por OPS-SUPAVISOR + secrets rotation pausada.

---

## Próxima decisão executiva

### Imediata (bloqueia Camada 1)

1. **RLS companies/users:** criar policies formais ou documentar BYPASSRLS?
2. **Redis produção:** pagar no Render (≈ $15/mês) ou aceitar in-memory volátil?
3. **WhatsApp:** ativar Meta Cloud API real ou manter mock documentado?

### Em aberto (não bloqueante)

4. **OutboxWorker:** break ou continuar em `sale.created`?
5. **ClimaGestor:** investir como 2º vertical ou congelar?
