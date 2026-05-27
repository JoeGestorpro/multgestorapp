# CI/CD — MultGestor

## Pipelines

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `ci.yml` | Todo push/PR | unit-tests, integration-tests, frontend |
| `deploy.yml` | Push em `main` | ci → deploy-backend (Render) → deploy-frontend (Vercel) |
| `security-audit.yml` | Segunda 09h BRT | audit-backend, audit-frontend |

## Segredos necessários (GitHub → Settings → Secrets)

| Secret | Onde obter |
|--------|-----------|
| `RENDER_DEPLOY_HOOK_URL` | Render Dashboard → Service → Settings → Deploy Hook |
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel env ls` ou `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `vercel env ls` ou `.vercel/project.json` |

## Como obter os IDs do Vercel (se não souber)

```bash
cd frontend
npx vercel link  # faz login e vincula o projeto
cat .vercel/project.json  # mostra orgId e projectId
```

## Proteção de branch (configurar no GitHub)

1. GitHub → Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Marcar: ✅ Require status checks to pass before merging
4. Status checks obrigatórios: `Unit Tests`, `Integration Tests`, `Frontend Lint + Build`
5. Marcar: ✅ Require branches to be up to date before merging

## Variáveis de ambiente no CI

O CI **não usa `.env`**. As variáveis mínimas para os testes estão embutidas no workflow:
- `JWT_SECRET`: valor temporário apenas para CI
- `TEST_DATABASE_URL`: aponta para o Postgres de CI

Para adicionar novas variáveis necessárias nos testes, editar `.github/workflows/ci.yml` e adicionar em `env:` do job correspondente.
