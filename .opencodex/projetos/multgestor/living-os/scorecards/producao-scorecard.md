# Scorecard: Produção Segura

> **Atualizado:** 2026-06-19 · **Tendência:** 🟡 Melhorando (últimas: backup scheduler, outbox fix)
> **Fonte:** [[../03-producao|03 — Produção Segura]]

---

## 14 critérios de produção segura

| # | Critério | Status | Responsável | Gate |
|---|---|---|---|---|
| 1 | Backup diário local ativo | 🟢 OK | Scheduler | — |
| 2 | Restore documentado e validado | 🟢 OK | MCP evidência | backup-restore-check |
| 3 | CI roda testes a cada push | 🟢 OK | CI workflow | — |
| 4 | Health check profundo | 🟢 OK | `/api/health/deep` | — |
| 5 | Sentry capturando erros | 🟢 OK | Configurado | — |
| 6 | Logs com correlation ID | 🟢 OK | Pino logger | — |
| 7 | Backup cópia externa | ❌ | `ops/backup-external-copy` | A-002 |
| 8 | RLS todas tabelas | ❌ | `security/rls-companies-users-policy` | A-001 |
| 9 | Redis em produção | ❌ | `infra/redis-production-config` | A-004 |
| 10 | Migration falhada bloqueia deploy | ❌ | `cicd/migrations-fail-fast` | A-005 |
| 11 | Alerta backup/outbox falha | ❌ | Observability | A-018 |
| 12 | E2E automatizado fluxo público | ❌ | `e2e-public-booking-validation` | A-008 |
| 13 | Testes integração com banco | 🟡 Parcial | CI roda, sem cobertura total | — |
| 14 | POST agendamento testado | 🟡 Parcial | Manual apenas | A-021 |

---

## Contagem

| Status | Total |
|---|---|
| 🟢 OK | 6 |
| 🟡 Parcial | 2 |
| ❌ Não atendido | 6 |
| **Total** | **14** |

## Tendência

| Mês | OK | Parcial | ❌ |
|---|---|---|---|
| 2026-06-15 | 4 | 2 | 8 |
| 2026-06-19 | 6 | 2 | 6 |

**Tendência:** 🟡 Melhorando — critérios OK subiram de 4 para 6 (backup scheduler + outbox fix). Ainda longe do alvo (14/14).

---

## Próximo marco

Fechar **6 ❌** exige concluir as 4 missões P1 da Camada 1 + alertas + E2E.
