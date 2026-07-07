# CI/CD — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Stack:** GitHub Actions
> **Relacionamentos:** [[technical/deploy]] · [[technical/README]] · [[maps/multgestor-core/infra/ci-cd]]

---

## Pipeline

### CI (Integração Contínua)
```
Push / PR → Unit Tests → Integration Tests → Frontend Tests
```

### CD (Deploy Contínuo)
```
Merge em main → Deploy Backend (Render) → Deploy Frontend (Vercel)
```

## Status

| Etapa | Status |
|---|---|
| Unit Tests | 🟢 648+ testes |
| Integration Tests | 🟢 Com Postgres + Redis |
| Frontend Tests | 🟢 Ativos |
| Migrations Automáticas | 🔴 `continue-on-error: true` |
| Deploy Backend | 🟢 Automático |
| Deploy Frontend | 🟢 Automático |

## Problemas Conhecidos

1. **Migrations fail silencioso (A-005)** — `continue-on-error: true` não bloqueia deploy se migration falha
2. **Supavisor OPS** — Pooler sa-east-1 rejeita tenant em migrations automáticas
3. **Secrets rotation pausada** — SECURITY-SECRETS-ROTATION deferida

## Próximos Passos

- [ ] Fail-fast nas migrations
- [ ] E2E no CI
- [ ] Release Safety Gate
- [ ] Secrets rotation

## Referências

- [[technical/deploy]] — Deploy detalhado
- [[security-secrets-rotation]] — Rotação de segredos
- [[maps/multgestor-core/infra/ci-cd]] — CI/CD detalhado
