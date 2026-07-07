# Scorecard: Prioridade

> **Atualizado:** 2026-06-19 · **Critério:** Valor × Risco reduzido × Esforço
> **Fonte:** [[../05-proxima-melhor-acao|05 — Próxima Melhor Ação]]

---

## Matriz de prioridade

| Prioridade | Missão | Valor | Risco↓ | Esforço | Camada |
|---|---|---|---|---|---|
| **1º** | `ops/backup-external-copy` | Alto | Catastrófico | Baixo | 1 — Fundação |
| **2º** | `security/rls-companies-users-policy` | Alto | Alto | Médio | 1 — Fundação |
| **3º** | `infra/redis-production-config` | Médio | Médio | Baixo | 1 — Fundação |
| **4º** | `cicd/migrations-fail-fast` | Alto | Alto | Alto | ⏳ Bloqueado |
| **5º** | `e2e-public-booking-validation` (auto) | Médio | Médio | Médio | 2 — Produto |
| **6º** | `owner-dashboard-minimum` | Alto | — | Médio | 2 — Produto |
| **7º** | `email-real-production` | Alto | — | Baixo | 2 — Produto |
| **8º** | `whatsapp-official-decision` | Médio | Médio | Baixo | 2 — Produto |
| **9º** | `billing-trial-to-paid-flow` | Alto | — | Alto | 2 — Produto |
| **10º** | `core-vs-vertical-boundary-map` | Médio | — | Baixo | 3 — Estratégia |

---

## Eixos de decisão

```
Valor
  ↑
  Alto   │ backup-ext  │ rls-users    │ billing-flow
         │ email-real  │              │ owner-dashboard
         │             │              │
  Médio  │ redis-prod  │ e2e-auto     │ migrations-fail
         │ whatsapp    │              │ boundary-map
         │             │              │
  Baixo  │ (nada)      │ (nada)       │ (nada)
         │
         └──────────────┴──────────────┴──────────────► Esforço
              Baixo          Médio           Alto
```

---

## Dependências entre missões

```
backup-external-copy (1º)
  └── rls-companies-users (2º) [segurança depende de backup seguro]
       └── redis-production (3º) [pode ser paralelo ao RLS]
            └── migrations-fail-fast (4º) ⏳
                 └── e2e-auto (5º) + dashboard (6º) [podem ser paralelos]
                      └── billing-flow (9º) [depende de fundação segura]
```

---

## Estado da fila

| Status | Missão |
|---|---|
| 🔵 next-task | `ops/backup-external-copy` — P1, pending |
| ⏳ backlog | `security/rls-companies-users-policy` — P1 |
| ⏳ backlog | `fase-c-integracao-e-testes` — P2, aguarda decisão |
| ⏳ backlog | `infra/redis-production-config` — P1 |
| ⏳ backlog | `infra/multgestor-autopilot-runner` — P3 |
| 🔴 blocked | `cicd/migrations-fail-fast` — OPS-SUPAVISOR |
