# Scorecard: Risco

> **Atualizado:** 2026-06-19 · **Tendência:** 🟡 Estável (sem novos riscos catastróficos identificados)
> **Fonte:** [[../riscos/riscos-ativos|Riscos Ativos]]

---

## Riscos ativos

| ID | Risco | Severidade | Probabilidade | Impacto | Tendência |
|---|---|---|---|---|---|
| A-002 | Perda de todos os backups (SPOF local) | P1 | Média | Catastrófico | 🟡 Estável (próxima na fila) |
| A-001 | Violação multi-tenant (companies/users sem RLS) | P1 | Baixa | Alto | 🟡 Estável |
| A-004 | Rate limit + cache volátil (sem Redis) | P1 | Média | Médio | 🟡 Estável |
| A-005 | Migration silenciosa falha (continue-on-error) | P1 | Alta | Alto | 🔴 Piorou |
| A-008 | Regressão não detectada (sem E2E) | P2 | Média | Médio | 🟢 Melhorou (manual OK) |
| A-018 | Operação cega (sem alerta falha) | P2 | Alta | Médio | 🟡 Estável |
| A-010 | WhatsApp mock = cliente não notificado | P2 | Alta | Médio | 🟡 Estável |
| A-021 | POST booking não testado E2E | P2 | Baixa | Médio | 🟡 Estável |
| A-023 | Sem política de privacidade/LGPD | P2 | Baixa | Médio | 🟡 Estável |

---

## Matriz de calor

```
Probabilidade ↑
      Alta   │ A-005          │ A-018, A-010
             │                │
      Média  │ A-002, A-004   │ A-008
             │                │
      Baixa  │ A-001, A-021   │ A-023
             │                │
             │    Médio       │    Alto
             │    Impacto ──────────────────►
```

## Riscos resolvidos recentemente

| ID | Risco | Resolvido em |
|---|---|---|
| A-003 | Outbox orphaned (cash_session.* failed) | 2026-06-18 |
| A-006 | Stored XSS em companies.name + users.name | 2026-06-15 |
| — | Drift reminder_sent_at (023) | 2026-06-14 |
| — | Drift outbox_message_handlers (022) | 2026-06-14 |
| — | DATABASE_URL inválida no CI | 2026-06-15 |

---

## Piores cenários ativos

1. **Disco rígido morre hoje** → perda de todos os backups (A-002). RPO salta de 24h para ∞. Banco Supabase intacto, mas sem ponto de restauração externo.
2. **Bug em rota multi-tenant** → sem RLS em companies/users, um tenant pode teoricamente acessar dados de outro (A-001). Baixa probabilidade (filtros `company_id` na app), mas consequência alta.
3. **Migration quebra em produção** → CI não bloqueia (continue-on-error). Drift acumula. Schema da produção diverge do repositório (A-005). Já aconteceu antes (022, 023).
