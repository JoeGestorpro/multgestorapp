# 03 — Produção Segura

> **Status:** VIVO · **Atualizado:** 2026-06-19
> **Propósito:** Responder se o sistema pode ir para produção, quais gates faltam e quais riscos técnicos impedem.

---

## O sistema pode ir para produção?

### Resposta curta

**Sim, para operação atual (piloto controlado).** O backend está online, health check 200, banco conectado, backup diário ativo, outbox com `failed=0`. Clientes reais já agendam.

**Não, para venda para cliente pagante.** Após 2026-06-22, **7 dos 14** critérios estão atendidos (backup externo entrou); restam 5 não atendidos + 2 parciais. A Camada 1 (Fundação Segura) ainda precisa ser fechada — mas o maior risco catastrófico (backup) caiu.

### Veredito detalhado

```
PRODUÇÃO: 🟡 SEGURA PARA OPERAÇÃO ATUAL
VENDA:    🔴 NÃO SEGURA PARA CLIENTE PAGANTE
```

---

## Gates da produção segura

### 🟢 Atendidos (7/14)

- [x] Backup diário local ativo (RPO ~24h)
- [x] **Backup com cópia externa B2 validada (`verified=true`, 2026-06-22)** — A-002 resolvido
- [x] Restore documentado e validado (MCP)
- [x] CI roda testes a cada push
- [x] Health check profundo (DB, Redis, outbox, backup)
- [x] Sentry capturando erros de produção
- [x] Logs com correlation ID por request

### 🟡 Parciais (2/14)

- [~] Testes de integração com banco rodam em CI (Postgres + Redis configurados)
- [~] POST de agendamento testado (manual, não automatizado)

### ❌ Não atendidos (5/14)

- [ ] RLS em todas as tabelas (companies + users) — **A-001**
- [ ] Redis em produção (rate limit persistente) — **A-004**
- [ ] Migration falhada bloqueia deploy — **A-005**
- [ ] Alerta se backup ou outbox falhar — **A-018**
- [ ] E2E automatizado do fluxo público — **A-008/A-009**

---

## Riscos técnicos que impedem produção segura

| ID | Risco | Impacto | Gate |
|---|---|---|---|
| A-001 | companies/users sem RLS | Violação multi-tenant | `security/rls-companies-users-policy` |
| ~~A-002~~ | ~~Backup sem cópia externa~~ | ✅ **Resolvido 2026-06-22** (B2 validado) | ~~`ops/backup-external-copy`~~ |
| A-004 | Redis ausente em produção | Rate limit volátil, cache não-persistente | `infra/redis-production-config` |
| A-005 | Migration fail silencioso | Schema drift não detectado | `cicd/migrations-fail-fast` |
| A-008 | Sem E2E automatizado | Regressão não detectada | `e2e-public-booking-validation` |
| A-018 | Sem alerta de falha | Operação cega | Observability |

---

## Caminho crítico para produção segura

```
✅ ops/backup-external-copy (P1) — CONCLUÍDO 2026-06-22
  → security/rls-companies-users-policy (P1)  ← próximo da fundação segura
    → infra/redis-production-config (P1)
      → cicd/migrations-fail-fast (P1) [bloqueado]
        → e2e-public-booking-validation + alertas
```

Cada passo depende do anterior. Nenhum pode ser pulado.
