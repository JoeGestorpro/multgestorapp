# Segurança — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[technical/rls]] · [[technical/rate-limit]] · [[constituicao#3. Regras críticas de segurança]] · [[maps/multgestor-core/seguranca/README]]

---

## Práticas de Segurança

### Implementadas
- [x] Multi-tenant por `company_id` (defesa em profundidade)
- [x] JWT em HttpOnly cookie (refresh)
- [x] Rate limit em rotas públicas
- [x] XSS hardening (portão de entrada fechado)
- [x] Helmet (CSP desligado)
- [x] Secrets em `.env` (não no git)
- [x] Token WhatsApp criptografado AES-256-GCM
- [x] Backup com cópia externa

### Pendentes
- [ ] RLS companies + users
- [ ] Role runtime sem BYPASSRLS
- [ ] CSP ativo no Helmet
- [ ] Brute-force protection no login
- [ ] Migration fail-fast
- [ ] Secrets rotation (deferred)

## Políticas

Ver [[constituicao#3. Regras críticas de segurança]] para regras invioláveis:
1. `company_id` é chave de isolamento
2. Master Admin isolado de tenants
3. Tokens criptografados
4. Secrets nunca no git
5. `FRONTEND_URL` nunca `localhost` em produção
6. Defesa em profundidade (app + banco)

## Incidentes

- **XSS Cycle** — Fechado 2026-06-14 (stored XSS sanitizado + portão fechado)
- **L-93** — Violação de migração manual em main (2026-06-23)
- **Exposição anon/PostgREST** — Fechado 2026-06-22 (P0)

## Referências

- [[technical/rls]] — RLS detalhado
- [[technical/rate-limit]] — Rate limit
- [[constituicao]] — Regras invioláveis
- [[licoes-aprendidas]] — Lições de incidentes
- [[incidents/README]] — Biblioteca de incidentes
- [[maps/multgestor-core/seguranca/README]] — Segurança detalhada
