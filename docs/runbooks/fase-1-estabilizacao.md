# EXECUÇÃO REAL — FASE 1 (Estabilização / pré-piloto) — MultGestor v2

Você é o agente executando a Fase 1 da auditoria de prontidão para produção.
Este é um runbook de EXECUÇÃO: você vai LER, ALTERAR código, RODAR testes e COMMITAR.
NÃO fará push nem merge sem confirmação explícita do usuário.

Contexto: SaaS multi-tenant, capability/event-driven. Backend Node.js + Express 5
(CommonJS) em `backend/`. Frontend React 19 + Vite 8 em `frontend/`. Diretório raiz:
`C:\MultGestor.v2`. Sem package.json na raiz. Branch de trabalho: `principal`.
Branch de deploy: `main` (NÃO tocar). Shell: bash ou PowerShell.

## REGRAS (valem para todo o runbook)

1. Mudança cirúrgica. Se algo exigir refatoração além do previsto, PARE e reporte
   a proposta antes de implementar.
2. Não criar módulos/capabilities/workflows novos. Não duplicar — verifique se já
   existe equivalente antes de criar qualquer arquivo.
3. Não fazer push nem merge `principal->main`. Não tocar em `.github/workflows/`.
4. Não expor valores de secrets — só nomes de variáveis.
5. Cada tarefa termina com testes verdes e um commit atômico (Conventional Commits).
6. Reporte resultado REAL de cada comando (cole a saída relevante). Sem "deve passar".

## ETAPA 0 — PREFLIGHT (não alterar nada ainda)

0.1 Confirmar estado do repo:
```
git status
git branch --show-current        # esperado: principal
git log --oneline -3
```
0.2 Criar branch de trabalho a partir de principal (NÃO trabalhar direto em principal):
```
git checkout -b fase-1/estabilizacao
```
0.3 Instalar deps (idempotente):
```
cd backend && npm ci
cd ../frontend && npm ci && cd ..
```
> se `npm ci` falhar por lockfile fora de sync com package.json, rodar `npm install`
> UMA vez no diretório afetado e reportar (lockfile dessincronizado é dívida a registrar).

0.4 Baseline de testes ANTES de qualquer mudança (registrar números):
```
cd backend && npm run test:unit          # esperado: 392/392 verde
```
0.5 Subir Postgres + Redis e AGUARDAR o banco ficar pronto (não só "up"):
```
docker compose up -d postgres redis      # (ou podman-compose)
```
> aguardar readiness real (`docker compose wait` NÃO serve — ele espera o container PARAR):
> - bash:  `until docker compose exec -T postgres pg_isready -U multgestor 2>/dev/null; do sleep 1; done`
> - pwsh:  `do { docker compose exec -T postgres pg_isready -U multgestor 2>$null } until ($LASTEXITCODE -eq 0)`
> ajuste o `-U <user>` conforme o serviço postgres do docker-compose.yml

**CHECKPOINT 0:** só prosseguir se unit baseline = verde e containers up/healthy.
Se o baseline já estiver vermelho, PARE e reporte (problema pré-existente).

## TAREFA P0-1 — Hardening do isolamento aplicacional de tenant

**DECISÃO FIXA:** NÃO ativar `FORCE ROW LEVEL SECURITY` nesta fase (as queries usam
`pool.query` direto, sem transação; FORCE sem `SET LOCAL` por request bloquearia
produção). Ativação real de RLS é Fase 3.

1. LER `src/shared/core/database/BaseRepository.js` (confirmar estado atual).
2. Em BaseRepository: adicionar flag opt-in no construtor
   `constructor(tableName, { tenantScoped = false } = {})` e, em `create(data)`,
   lançar erro claro se `tenantScoped === true` e `data.company_id` ausente/null.
   - Manter 100% de compatibilidade: default `tenantScoped=false` não muda nada
     para repos existentes/globais.
3. Teste em `backend/tests/unit/base-repository.test.js` (criar se não existir):
   - repo tenantScoped: create sem company_id -> lança;
   - repo tenantScoped: create com company_id -> insere normal (mock db);
   - repo global (default): create sem company_id -> funciona.
4. Criar `docs/SECURITY-TENANT-ISOLATION.md` (verificar antes se já existe doc
   equivalente em docs/ para não duplicar) documentando: isolamento é aplicacional
   (WHERE company_id); RLS dormente como defesa-em-profundidade; plano de ativação
   na Fase 3; checklist para novos repositories/rotas (sempre filtrar por company_id).
5. RODAR: `cd backend && npm run test:unit` -> verde.
6. COMMIT:
```
git add -A && git commit -m "fix(repository): enforce company_id on tenant-scoped create"
```
   (o doc pode ir junto OU em commit separado:
   `chore(security): document application-level tenant isolation strategy`)

**CHECKPOINT P0-1:** unit verde + 1–2 commits. Não prosseguir se vermelho.

## TAREFA P0-3 — Documentar KIWIFY_WEBHOOK_SECRET (feita antes da P0-2 por ser rápida)

1. LER `backend/src/services/webhooks/kiwify.service.js` (confirmar que já lança
   AppError 500 quando KIWIFY_WEBHOOK_SECRET ausente — NÃO duplicar essa lógica).
2. Adicionar `KIWIFY_WEBHOOK_SECRET=` em `backend/.env.example` (seção billing/webhooks,
   com comentário) e em `.env.docker` (valor de dev, ex.: `dev_kiwify_secret_local`).
3. COMMIT:
```
git add -A && git commit -m "chore(billing): document KIWIFY_WEBHOOK_SECRET env var"
```

## TAREFA P0-2 — Processo de release principal -> main (docs, sem código)

1. LER `.github/workflows/deploy.yml` e `ci.yml` (confirmar gating: deploy needs ci;
   run-migrations antes de deploy-backend). NÃO editar os workflows.
2. Confirmar idempotência das migrations (amostragem em `src/database/*.sql`:
   CREATE TABLE IF NOT EXISTS / DROP POLICY IF EXISTS / ON CONFLICT) e revisar
   `scripts/run-migrations.js`.
3. Criar `docs/RELEASE.md` (verificar se já existe; se sim, atualizar) com:
   - checklist pré-merge (unit+integration verdes, build frontend, migrations
     revisadas, secrets provisionados);
   - AVISO: merge para main dispara deploy + migrations em produção;
   - passo a passo do PR principal->main;
   - lista de secrets OBRIGATÓRIOS de prod (apenas NOMES): DATABASE_URL, JWT_SECRET,
     WHATSAPP_TOKEN_ENCRYPTION_KEY, KIWIFY_WEBHOOK_SECRET, RESEND_API_KEY ou SMTP_*,
     SENTRY_DSN, APP_BASE_URL, FRONTEND_URL, REDIS_URL.
4. Gerar (no relatório final, não executar) o texto do PR principal->main:
   título + corpo + saída de `git log origin/main..principal --oneline`.
5. COMMIT:
```
git add -A && git commit -m "docs(release): add release checklist and required prod secrets"
```

## TAREFA P0-4 — Integração de tenant-isolation VERDE localmente

1. Exportar DATABASE_URL para o Postgres do compose. Conferir credenciais reais em
   `docker-compose.yml` (serviço postgres). Exemplo (ajuste user/senha/db conforme o arquivo):
   - bash:
     ```
     export DATABASE_URL="postgresql://multgestor:multgestor_dev_pass@localhost:5432/multgestor_dev"
     export NODE_ENV=test; export JWT_SECRET=ci-test-secret
     ```
   - pwsh:
     ```
     $env:DATABASE_URL="postgresql://multgestor:multgestor_dev_pass@localhost:5432/multgestor_dev"
     $env:NODE_ENV="test"; $env:JWT_SECRET="ci-test-secret"
     ```
2. Rodar migrations contra o banco local:
```
cd backend && npm run migrate        # deve aplicar até rls_tenant_tables.sql
```
3. Rodar a suíte de integração:
```
npm run test:integration             # alvo: 19/19 verde (tenant-isolation)
```
4. Se algum caso falhar: investigar causa raiz e CORRIGIR o CÓDIGO (não o teste,
   salvo se o teste estiver factualmente errado — nesse caso PARE e reporte antes).
   Se houver correção de código, adicionar/ajustar teste e commitar:
```
git add -A && git commit -m "fix(tenant): <descrição da correção de isolamento>"
```

**CHECKPOINT P0-4:** integration 19/19 verde.

## VERIFICAÇÕES DE GO-LIVE (checar e reportar; sem alterar infra)

A. Build frontend: `cd frontend && npm run build` -> sem erros.

B. Subir backend local e checar saúde (sem cross-env — não está instalado):
   > garanta DATABASE_URL exportada (mesma da P0-4) antes de subir
   - bash:  `cd backend && NODE_ENV=test node src/server.js & sleep 3`
   - pwsh:  `cd backend; $env:NODE_ENV="test"; Start-Process node "src/server.js"; Start-Sleep 3`
   ```
   curl -s http://localhost:5000/api/health
   curl -s http://localhost:5000/api/health/deep   # database ok; redis ok (containers up)
   ```
   > encerrar o server ao terminar (bash: `kill %1` / pwsh: Stop-Process do node)

C. Confirmar que nenhum .env real está rastreado:
```
git ls-files | grep -E "\.env" | grep -v example | grep -v docker
```
   (frontend/.env.production aparece hoje; apenas REGISTRAR — tratamento é Fase 2.)

D. `npm audit --audit-level=high` no backend -> 0 high/critical (6 moderate aceitável; registrar).

## ENTREGA FINAL

- Relatório em tabela: tarefa | status | arquivos tocados | testes (n/n) | risco residual.
- Saídas reais de: test:unit, test:integration (19/19), build frontend, health, audit.
- Texto do PR principal->main pronto (NÃO executado).
- Lista de commits criados (`git log` da branch fase-1/estabilizacao).
- Pergunta final ao usuário: "Posso fazer push da branch fase-1/estabilizacao e abrir o PR?"
  (NÃO fazer push até o usuário confirmar.)

## CONDIÇÕES DE PARADA (pare e reporte, não improvise)

- baseline unit vermelho na Etapa 0;
- docker/postgres não sobe ou migrate falha;
- integração tenant-isolation vermelha após investigação;
- qualquer tarefa exigindo refatoração maior que a descrita.
