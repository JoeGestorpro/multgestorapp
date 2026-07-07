# Prompts de Deploy

> **Status:** VIVO
> **Relacionamentos:** [[prompts/README]] · [[technical/deploy]] · [[technical/ci-cd]]

---

## Prompt: Planejar Deploy

```
Planeje o deploy de [FEATURE/PR] no MultGestor.

Ambientes:
- Frontend: Vercel
- Backend: Render
- Database: Supabase (migrations manuais via MCP)

Checklist:
1. PR mergeado em main?
2. CI verde? (Unit + Integration + Frontend)
3. Migrations aplicadas? (MCP)
4. Health check pós-deploy?
5. Rollback planejado?

Contexto: [[technical/deploy]]
```

## Referências

- [[technical/deploy]] — Deploy
- [[technical/ci-cd]] — CI/CD
- [[runbooks/backup-restore-plan]] — Backup e restore
