# Deploy — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[technical/ci-cd]] · [[technical/infra]] · [[ops/playbooks/README]]

---

## Estratégia

- **Frontend:** Deploy automático via Vercel (merge em main)
- **Backend:** Deploy automático via Render (merge em main)
- **Database:** Migrations manuais via MCP (não automáticas no CI)

## Processo

```
1. PR mergeado em main
2. CI roda testes (Unit + Integration + Frontend)
3. Se verde → Deploy:
   a. Render: build + deploy backend
   b. Vercel: build + deploy frontend
4. Pós-deploy:
   a. Verificar health check (/api/health/deep)
   b. Validar booking público
```

## Ambientes

| Ambiente | Backend | Frontend | Database |
|---|---|---|---|
| Produção | Render | Vercel | Supabase |
| Homologação | — | — | — |
| Desenvolvimento | Local | Local | Local |

## Bloqueadores

1. **OPS-SUPAVISOR** — Pooler rejeita tenant; migrations manuais
2. **Secrets rotation** — Deferida; DATABASE_URL pode vazar em logs
3. **`continue-on-error`** — Migration falha não bloqueia deploy

## Runbooks

- [[runbooks/backup-restore-plan]] — Backup e restore
- [[runbooks/runbook-integration-branch]] — Merge de branches de integração
- [[runbooks/reconciliation-plan]] — Plano de reconciliação
