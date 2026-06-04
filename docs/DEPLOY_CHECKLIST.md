# Deploy Checklist — Produção MultGestor

> Última atualização: 02/06/2026
> Revisar antes de cada deploy para produção.
> ⚠️ Nenhum valor real deve ser inserido neste arquivo.

---

## 0. Fluxo de Release (`principal → main`)

```
push em main
  → job ci       (unit-tests + integration-tests + frontend lint/build)
  → run-migrations  (aplica migrations no Supabase de produção)
  → deploy-backend  (Render — via Deploy Hook)
  → deploy-frontend (Vercel — via CLI)
```

> ⚠️ Merge `principal → main` **dispara deploy E migrations em produção** automaticamente.

### Passo a passo de release
1. Confirmar CI verde na branch `principal`
2. Revisar migrations novas (idempotência obrigatória)
3. Cumprir o Pré-deploy Checklist (seção 7)
4. Abrir PR `principal → main` e aguardar aprovação
5. Após merge, acompanhar workflow **Deploy** no GitHub Actions
6. Executar Pós-deploy Verification (seção 8)

---

## 1. GitHub Secrets — CI/CD

**Onde configurar:**
```
GitHub → Settings → Secrets and variables → Actions → New repository secret
```

| Secret | Onde obter | Workflow |
|---|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (pooler) | `deploy.yml` → run-migrations |
| `RENDER_DEPLOY_HOOK_URL` | Render → Service → Settings → **Deploy Hook** → copiar URL | `deploy.yml` → deploy-backend |
| `VERCEL_TOKEN` | Vercel → Account Settings → **Tokens** → Create | `deploy.yml` → deploy-frontend |
| `VERCEL_ORG_ID` | `npx vercel link` → `.vercel/project.json` → `orgId` | `deploy.yml` → deploy-frontend |
| `VERCEL_PROJECT_ID` | `npx vercel link` → `.vercel/project.json` → `projectId` | `deploy.yml` → deploy-frontend |

**Status:**
- [ ] `DATABASE_URL`
- [ ] `RENDER_DEPLOY_HOOK_URL`
- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID`

---

## 2. Render — Backend produção

**Onde configurar:**
```
Render Dashboard → seu serviço backend → Environment → Environment Variables
```

> ⚠️ Não cadastre `PORT` — o Render injeta automaticamente via `$PORT`.

### Grupo 1 — Banco de dados ✅ pronto

| Variável | Valor | Status |
|---|---|---|
| `DATABASE_URL` | Connection string Supabase (Transaction pooler) | - [ ] |
| `SUPABASE_URL` | `https://mfayajizbkqkcbhqmean.supabase.co` | - [ ] |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_…` (copiar do `backend/.env`) | - [ ] |
| `ICE_BUCKET` | `barber-collaborators` | - [ ] |

### Grupo 2 — Autenticação ⚠️ gerar novos valores para prod

| Variável | Como gerar | Status |
|---|---|---|
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | - [ ] |
| `JWT_REFRESH_SECRET` | mesmo comando acima | - [ ] |
| `COOKIE_SECRET` | mesmo comando acima | - [ ] |

> ⚠️ **Nunca reutilize os valores do `backend/.env` local em produção.**

### Grupo 3 — WhatsApp / Meta ✅ pronto

| Variável | Valor | Status |
|---|---|---|
| `WHATSAPP_PROVIDER` | `meta_cloud_api` ← **diferente do local (`mock`)** | - [ ] |
| `WHATSAPP_API_VERSION` | `v20.0` | - [ ] |
| `WHATSAPP_TOKEN_ENCRYPTION_KEY` | hex 64 chars (copiar do `backend/.env`) | - [ ] |
| `WHATSAPP_VERIFY_TOKEN` | copiar do `backend/.env` | - [ ] |
| `WHATSAPP_PHONE_NUMBER_ID` | `1145695401958993` | - [ ] |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | `27299667263004028` | - [ ] |
| `META_ACCESS_TOKEN` | `EAA2…` (copiar do `backend/.env`) | - [ ] |
| `META_APP_SECRET` | hex 32 chars (copiar do `backend/.env`) | - [ ] |

### Grupo 4 — Email ✅ pronto

| Variável | Valor | Status |
|---|---|---|
| `EMAIL_PROVIDER` | `resend` ← **diferente do local (`mock`)** | - [ ] |
| `EMAIL_FROM` | `no-reply@mail.multgestorapp.com.br` | - [ ] |
| `EMAIL_NAME` | `MultGestor` | - [ ] |
| `RESEND_API_KEY` | `re_…` (copiar do `backend/.env`) | - [ ] |
| `RESEND_TEST_MODE` | `false` | - [ ] |

### Grupo 5 — Billing / Webhooks ✅ pronto

| Variável | Valor | Status |
|---|---|---|
| `KIWIFY_WEBHOOK_SECRET` | hex 64 chars (copiar do `backend/.env`) | - [ ] |
| `ABACATEPAY_WEBHOOK_SECRET` | vazio por enquanto | - [ ] |

### Grupo 6 — URLs ⚠️ preencher após ter a URL da Vercel

| Variável | Valor | Status |
|---|---|---|
| `APP_BASE_URL` | `https://SEU-PROJETO.vercel.app` | - [ ] |
| `FRONTEND_URL` | `https://SEU-PROJETO.vercel.app` | - [ ] |
| `CORS_ORIGIN` | `https://SEU-PROJETO.vercel.app` | - [ ] |
| `BACKEND_URL` | `https://SEU-SERVICO.onrender.com` | - [ ] |

### Grupo 7 — Runtime ✅ pronto

| Variável | Valor | Status |
|---|---|---|
| `NODE_ENV` | `production` | - [ ] |
| `LOG_LEVEL` | `warn` | - [ ] |
| `SENTRY_ENVIRONMENT` | `production` | - [ ] |
| `TRIAL_EMAILS_ENABLED` | `true` | - [ ] |
| `OUTBOX_POLL_INTERVAL_MS` | `5000` | - [ ] |
| `OUTBOX_BATCH_SIZE` | `50` | - [ ] |
| `SERVICE_NAME` | `multgestor-backend` | - [ ] |

### Grupo 8 — Admin master ⚠️ obrigatório no primeiro deploy

| Variável | Valor | Status |
|---|---|---|
| `MASTER_ADMIN_EMAIL` | email do administrador principal | - [ ] |
| `MASTER_ADMIN_PASSWORD` | senha forte (mínimo 16 chars) | - [ ] |
| `MASTER_ADMIN_NAME` | `Master Admin` | - [ ] |

> ℹ️ Podem ser removidas do Render após o primeiro deploy + seed executado.

### Grupo 9 — Opcionais / futuras

| Variável | Quando adicionar |
|---|---|
| `REDIS_URL` | Ao contratar Redis (Upstash, Railway…) |
| `SENTRY_DSN` | Ao configurar projeto no Sentry |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Se migrar para SMTP próprio |

---

## 3. Vercel — Frontend produção

**Onde configurar:**
```
Vercel Dashboard → seu projeto → Settings → Environment Variables
→ Selecionar: Production + Preview + Development
```

### Grupo 1 — Obrigatórias agora

| Variável | Valor | Status |
|---|---|---|
| `VITE_API_URL` | `https://SEU-SERVICO.onrender.com` | - [ ] |
| `VITE_APP_NAME` | `MultGestor` | - [ ] |
| `VITE_ENVIRONMENT` | `production` | - [ ] |
| `VITE_SUPABASE_URL` | `https://mfayajizbkqkcbhqmean.supabase.co` | - [ ] |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_…` (copiar do `frontend/.env`) | - [ ] |

### Grupo 2 — Quando os planos Kiwify estiverem ativos

| Variável | Onde obter | Status |
|---|---|---|
| `VITE_KIWIFY_URL_STARTER` | Kiwify → produto Starter → link de checkout | - [ ] |
| `VITE_KIWIFY_URL_PRO` | Kiwify → produto Pro → link de checkout | - [ ] |
| `VITE_KIWIFY_URL_PREMIUM` | Kiwify → produto Premium → link de checkout | - [ ] |

### Grupo 3 — Futuras / opcionais

| Variável | Quando adicionar |
|---|---|
| `VITE_META_APP_ID` | Quando frontend precisar inicializar o Meta SDK |
| `VITE_SENTRY_DSN` | Ao configurar Sentry para o frontend |

### 🚫 NUNCA adicionar na Vercel

```
❌ JWT_SECRET                    ← backend only
❌ DATABASE_URL                  ← backend only
❌ SUPABASE_SERVICE_ROLE_KEY     ← backend only
❌ META_APP_SECRET               ← backend only
❌ META_ACCESS_TOKEN             ← backend only
❌ WHATSAPP_TOKEN_ENCRYPTION_KEY ← backend only
❌ RESEND_API_KEY                ← backend only
❌ KIWIFY_WEBHOOK_SECRET         ← backend only
❌ COOKIE_SECRET                 ← backend only
```

---

## 4. Supabase — Configurações de produção

- [ ] Connection pooling ativado (Transaction mode — porta 6543)
- [ ] SSL obrigatório nas conexões (já configurado em `database.js`)
- [ ] Backups automáticos ativados
- [ ] Row Level Security ativado (ver `rls_tenant_tables.sql`)
- [ ] IP allowlist configurada (se necessário)

### Migrations (aplicar nesta ordem)

**1. `trial_email_log.sql`** — seguro, só cria tabela:
```
backend/src/database/trial_email_log.sql
```

**2. `rls_tenant_tables.sql`** — ⚠️ aplicar primeiro em staging:
```
backend/src/database/rls_tenant_tables.sql
```
> A policy `tenant_isolation` exige `SET LOCAL app.current_company_id` em todas as queries.
> Verificar cobertura de `withTenantContext` antes de aplicar em produção.

---

## 5. Render — Evitar spin-down do OutboxWorker

| Plano | Comportamento | Recomendação |
|---|---|---|
| Free | Spin-down após 15 min sem request | ⚠️ usar UptimeRobot |
| Starter ($7/mês) | Sempre ativo | ✅ recomendado para produção |

**UptimeRobot (gratuito):**
1. Criar conta em uptimerobot.com
2. New Monitor → HTTP(s) → URL: `https://SEU_BACKEND.onrender.com/api/health`
3. Interval: 5 minutes
4. Alertas: email / Telegram

---

## 6. Ordem de execução recomendada

```
1. Cadastrar os 5 GitHub Secrets
2. Configurar Render (grupos 1–8) — sem FRONTEND_URL por enquanto
3. Fazer primeiro deploy do backend (push em main ou manual)
4. Anotar a URL gerada: https://SEU-SERVICO.onrender.com
5. Configurar Vercel (grupos 1–2) com a URL do Render
6. Fazer primeiro deploy do frontend
7. Anotar a URL gerada: https://SEU-PROJETO.vercel.app
8. Voltar ao Render → preencher APP_BASE_URL, FRONTEND_URL, CORS_ORIGIN
9. Validar /api/health/deep no backend de produção
10. Configurar UptimeRobot
```

---

## 7. Pré-deploy Checklist

Antes de cada merge `principal → main`:

- [ ] Todos os testes passando: `cd backend && npm test`
- [ ] Build do frontend sem erros: `cd frontend && npm run build`
- [ ] Nenhum `localhost` hardcoded no código
- [ ] Migrations novas testadas em staging
- [ ] Migrations são idempotentes (`IF NOT EXISTS`, `ON CONFLICT`)
- [ ] `backend/.env` e `frontend/.env` não aparecem no `git status`
- [ ] Nenhum segredo real em arquivos rastreados pelo git

---

## 8. Pós-deploy Verification

```bash
# Health check básico
curl https://SEU_BACKEND.onrender.com/api/health

# Health check detalhado
curl https://SEU_BACKEND.onrender.com/api/health/deep | jq .
```

Resposta esperada:
```json
{
  "status": "healthy",
  "checks": {
    "database":          { "status": "ok" },
    "redis":             { "status": "ok" },
    "outbox":            { "status": "ok", "pending_messages": 0 },
    "whatsapp_provider": {
      "status": "ok",
      "provider": "meta_cloud_api",
      "is_mock": false,
      "app_secret_configured": true,
      "access_token_configured": true,
      "verify_token_configured": true
    }
  }
}
```

> Se `redis.status = "degraded"`: Redis não configurado — cache in-memory ativo (aceitável).
> Se `whatsapp_provider.is_mock = true`: `WHATSAPP_PROVIDER` ainda está como `mock` no Render.

---

## 9. Monitoramento

### Sentry (opcional)
- Backend: `SENTRY_DSN` no Render
- Frontend: `VITE_SENTRY_DSN` na Vercel
- Sentry → Projects → Create → Node.js / React → copiar DSN

### UptimeRobot (recomendado)
- Monitor: `https://SEU_BACKEND.onrender.com/api/health`
- Interval: 5 minutos
- Previne spin-down no Render Free tier

---

## 10. Observability / Alertas (Prometheus)

O backend expõe métricas Prometheus em `GET /metrics` (protegido por `METRICS_TOKEN` quando configurado).

### Configuração no Render

| Variável | Valor | Descrição |
|---|---|---|
| `METRICS_TOKEN` | token seguro (gerar com `openssl rand -hex 32`) | Bearer auth para `/metrics` |
| `METRICS_REFRESH_MS` | `15000` | Intervalo de refresh das gauges (ms) |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` (staging) / `0.01` (prod) | Taxa de amostragem de tracing |

### Regras de alerta recomendadas

Configurar no Prometheus/Grafana/Alertmanager:

| Métrica | Condição | Severidade | Ação |
|---|---|---|---|
| `outbox_messages_count{status="failed"} > 0` | por 5 minutos | **Critical** | Investigar dead-letter queue imediatamente |
| `outbox_messages_count{status="pending"} > 100` | por 10 minutos | **Warning** | OutboxWorker pode estar lento ou travado |
| `rate(http_requests_total{status_class="5xx"}[5m]) > 0.1` | sustentado | **Critical** | Erros 5xx elevados — verificar logs |
| `redis_up == 0` | por 2 minutos | **Warning** | Redis indisponível — fallback in-memory ativo |
| `db_pool_waiting > 0` | por 5 minutos | **Warning** | Pool saturado — considerar aumentar conexões |

### Exemplo de scrape config (Prometheus)

```yaml
scrape_configs:
  - job_name: 'multgestor-backend'
    scrape_interval: 15s
    metrics_path: '/metrics'
    bearer_token: 'SEU_METRICS_TOKEN'
    static_configs:
      - targets: ['SEU_BACKEND.onrender.com']
```
