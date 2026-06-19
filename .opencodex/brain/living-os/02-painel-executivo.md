# 02 — Painel Executivo

> **Status:** VIVO · **Atualizado:** 2026-06-19
> **Propósito:** Responder onde estamos, o que mudou, o que está bloqueado, qual o maior risco, qual a próxima decisão.

---

## Onde estamos

| Indicador | Estado |
|---|---|
| **Fase** | Estabilização de produção + Endurecimento de segurança |
| **state_version** | 13 |
| **Produção** | 🟢 Online (barbergestor.com.br), health 200, DB conectado |
| **Backup** | 🟢 Diário local ativo (RPO ~24h), restore validado |
| **Outbox** | 🟢 `failed=0` (data-fix concluído A-003) |
| **Missão atual** | ⏸️ idle |
| **Próxima missão** | 🔵 `ops/backup-external-copy` (pending, aguarda ação humana) |

---

## O que mudou (últimas missões)

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
| `security/rls-companies-users-policy` | P1 | Aguarda decisão humana |
| `infra/redis-production-config` | P1 | Aguarda decisão humana (custo vs risco) |
| `cicd/migrations-fail-fast` | P1 | 🔴 OPS-SUPAVISOR + secrets rotation pausada |
| `whatsapp-official-decision` | P2 | Decisão: real vs mock documentado |
| `outbox-worker break vs continue` | P2 | Decisão pendente (fase-c) |

---

## Maior risco ativo

### 🔴 P0 — Nenhum

### 🔴 P1 — Perda de todos os backups (catastrófico)

**Risco:** Backup existe apenas no HD local. Perda do equipamento = perda de todos os backups.

**Mitigação:** `ops/backup-external-copy` — já planejada, próxima na fila.

**Status:** Aguardando ação humana criar bucket B2 + app key.

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
