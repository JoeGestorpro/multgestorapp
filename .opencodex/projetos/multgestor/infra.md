# Infraestrutura — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[technical/README]] · [[technical/deploy]] · [[technical/seguranca]] · [[maps/multgestor-core/infra/README]]

---

## Provedores

| Serviço | Provedor | Função |
|---|---|---|
| Backend | Render | API Express 5 |
| Frontend | Vercel | SPA React 19 |
| Database | Supabase | PostgreSQL 17 |
| Cache | Redis (Render) | Cache + Rate Limit (fallback in-memory) |
| Backup | Backblaze B2 | Cópia externa de backup |
| CI/CD | GitHub Actions | Pipeline |
| Monitoramento | Sentry | Error tracking |
| Email | Resend | Transacional |

## Ambiente de Produção

| Recurso | Configuração |
|---|---|
| Backend | Render Web Service |
| Frontend | Vercel SPA |
| Database | Supabase sa-east-1 |
| Cache | Redis 7 (planejado) |

## Pendências

- [ ] Redis em produção (hoje fallback in-memory)
- [ ] Homologação configurada
- [ ] CDN para assets estáticos
- [ ] Firewall de aplicação (WAF)

## Referências

- [[technical/deploy]] — Processo de deploy
- [[technical/seguranca]] — Segurança
- [[technical/performance]] — Performance
- [[maps/multgestor-core/infra/README]] — Infra detalhada
