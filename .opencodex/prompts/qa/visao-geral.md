# Prompts de QA

> **Status:** VIVO
> **Relacionamentos:** [[prompts/visao-geral]] · [[agents/qa]]

---

## Prompt: Revisar PR

```
Revise o PR #[NUMERO] — [TITULO] para o MultGestor.

Checklist:
1. O código segue os padrões do projeto? (CommonJS, async/await)
2. Tem testes adequados? (unit + integração)
3. Os eventos usam EVENT CONTRACTS?
4. Rotas novas têm rate limit?
5. Consultas filtram company_id?
6. A migration é idempotente?
7. RLS policy cobre a nova tabela?
8. Sem secrets hardcoded?
9. Logs sem dados sensíveis?
10. Atualizou o Second Brain?

Contexto: [[technical/README]]
```

## Prompt: Planejar Testes

```
Planeje os testes para a feature [FEATURE] no MultGestor.

Stack de teste: Jest + Supertest
Tipos necessários:
1. Unit tests (services, regras de negócio)
2. Integration tests (com banco real)
3. E2E (fluxo completo)

Contexto: [[product/prds/PRD-XXX]]
```

## Referências

- [[technical/ci-cd]] — CI/CD e testes
- [[agents/qa]] — QA agent
- [[licoes-aprendidas#L-09]] — Lição: mocks escondiam bug
