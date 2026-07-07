# Observabilidade — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Stack:** Sentry + Pino
> **Relacionamentos:** [[technical/README]] · [[technical/performance]] · [[technical/workers]]

---

## Stack Atual

| Ferramenta | Função | Status |
|---|---|---|
| Sentry | Error tracking | 🟢 Ativo |
| Pino | Logger estruturado | 🟢 Ativo |
| Correlation ID | Logs por request | 🟢 Ativo |
| Health check | `/api/health/deep` | 🟢 Ativo |
| Métricas personalizadas | — | ⚪ Não implementado |
| Dashboard | — | ⚪ Não implementado |

## Health Check Profundo

```
GET /api/health/deep → DB, Redis, Outbox, Backup
```

## Pendências

- [ ] Alerta se outbox > 100 pending (A-018)
- [ ] Alerta se backup falhar (A-018)
- [ ] Dashboard de métricas
- [ ] Tracing distribuído
- [ ] Métricas de performance

## Referências

- [[technical/performance]] — Performance
- [[technical/workers]] — Workers monitoring
- [[painel-executivo]] — Dashboard executivo
