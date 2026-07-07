# Backend — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Stack:** Node 18 + Express 5 (CommonJS)
> **Deploy:** Render
> **Relacionamentos:** [[technical/README]] · [[technical/infra]] · [[maps/multgestor-core/core/backend]]

---

## Stack

| Tecnologia | Versão | Função |
|---|---|---|
| Node.js | 18 | Runtime |
| Express | 5 | Framework HTTP |
| pg (node-postgres) | — | Database driver |
| Redis | 7 | Cache + Rate Limit |
| Pino | — | Logger |
| Sentry | — | Error tracking |
| Zod | — | Validação |

## Status

| Indicador | Status |
|---|---|
| **Controllers** | 16 (BarberGestor) |
| **Services** | 30 |
| **Testes Unit** | 648+ |
| **Testes Integração** | ✅ Com Postgres + Redis |
| **Health Check** | 🟢 `/api/health/deep` |
| **Performance** | 🟡 Sem monitoramento |

## Estrutura

```
backend/src/
├── controllers/     → 16 controllers
├── services/        → 30 services
├── middlewares/     → Auth, rate-limit, validation
├── routes/          → Definições de rotas
├── jobs/            → Background jobs
└── shared/core/     → Core shared (cache, events, db, logger)
```

## Dependências

- PostgreSQL (Supabase)
- Redis (fallback in-memory)
- Integrações: WhatsApp, Billing, Email

## Referências

- [[maps/multgestor-core/core/backend]] — Detalhamento no mapa vivo
- [[technical/DEPENDENCY-MAP]] — Mapa de dependências
- [[technical/workers]] — Jobs e workers
- [[technical/integracoes]] — Integrações externas
