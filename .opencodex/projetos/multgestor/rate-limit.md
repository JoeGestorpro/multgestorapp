# Rate Limit — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[technical/README]] · [[technical/seguranca]] · [[architecture-decisions#ADR-09]] · [[constituicao#7. Proteção de rotas]]

---

## Implementação Atual

| Aspecto | Status |
|---|---|
| Rate limit por IP | 🟢 Ativo |
| Rate limit por tenant | 🟢 Ativo |
| Redis como store | 🟡 Fallback in-memory |
| Fail-open | 🟢 Ativo |
| Rotas públicas | 🟢 Protegidas |
| Rotas privadas | 🟢 Protegidas |

## Limites Atuais

| Rota | Leitura | Escrita |
|---|---|---|
| /public/:slug | 60/15min | 10/15min IP + 30/60min tenant |
| /auth/* | — | Rate limit por IP |

## Regra Obrigatória

Toda nova rota/funcionalidade exposta precisa responder:
1. Pode gerar abuso?
2. Gera custo?
3. Precisa de rate limit?
4. Precisa de limite por tenant ou usuário?

Ver [[constituicao#7. Proteção de rotas e controle de abuso]]

## Pendências

- [ ] Redis em produção (rate limit persistente)
- [ ] Quota mensal por tenant
- [ ] Kill-switch por abuso

## Referências

- [[constituicao#7. Proteção de rotas e controle de abuso]] — Regra vinculante
- [[architecture-decisions#ADR-09]] — ADR controle de abuso
- [[technical/seguranca]] — Segurança
