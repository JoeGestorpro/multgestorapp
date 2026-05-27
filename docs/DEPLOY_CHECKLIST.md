# Deploy Checklist — Produção MultGestor

> Última atualização: 26/05/2026
> Revisar antes de cada deploy para produção.

---

## 1. GitHub Secrets (obrigatório para CI/CD automático)

Acessar: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Onde obter | Usado em |
|--------|-----------|----------|
| `RENDER_DEPLOY_HOOK_URL` | Render → Service → Settings → Deploy Hook | `deploy.yml` — deploy backend |
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create Token | `deploy.yml` — deploy frontend |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Team ID | `deploy.yml` — deploy frontend |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General → Project ID | `deploy.yml` — deploy frontend |

**Sem esses 4 segredos, o workflow `deploy.yml` falha silenciosamente no step de deploy.**
Os jobs de CI (unit-tests, integration-tests, frontend) funcionam sem eles.

---

## 2. Render — Evitar spin-down do OutboxWorker

### Problema
O Render **Free tier** faz spin-down após 15 minutos sem requests HTTP.
Quando isso ocorre, o `OutboxWorker` para de processar a fila de mensagens.
Ao voltar, pode haver delay de 30-60s e mensagens acumuladas.

### Solução imediata (obrigatória)
**Fazer upgrade para Render Starter ($7/mês):**
1. Render Dashboard → Service → Settings → Plan
2. Selecionar "Starter" ($7/mês)
3. O serviço fica sempre ativo (no spin-down)

### Alternativa de baixo custo (free tier)
Configurar um serviço externo de health check para manter o processo vivo:

**UptimeRobot (gratuito):**
1. Criar conta em uptimerobot.com
2. New Monitor → HTTP(s)
3. URL: `https://SEU_BACKEND.onrender.com/api/health`
4. Monitoring Interval: 5 minutes
5. Alertas: email/Telegram quando status mudar

**Importante:** health check a cada 5min previne spin-down.
Porém, não garante que o OutboxWorker recomece imediatamente após crash.
Para produção real, usar Render Starter é a solução correta.

---

## 3. Variáveis de Ambiente — Backend (Render)

Verificar que todas as variáveis estão configuradas no Render:

| Variável | Obrigatória | Observação |
|----------|-------------|------------|
| `DATABASE_URL` | ✅ | Connection string do Supabase (com SSL) |
| `JWT_SECRET` | ✅ | Min 32 chars, nunca expor |
| `NODE_ENV` | ✅ | `production` |
| `PORT` | ✅ | Render usa automaticamente |
| `APP_BASE_URL` | ✅ | URL do frontend (ex: `https://barbergestor.com.br`) |
| `FRONTEND_URL` | ✅ | Igual ao APP_BASE_URL (links de email) |
| `RESEND_API_KEY` | ✅ | Chave da API do Resend |
| `RESEND_FROM_EMAIL` | ✅ | Ex: `noreply@barbergestor.com.br` |
| `EMAIL_FROM` | ✅ | Igual ao RESEND_FROM_EMAIL |
| `REDIS_URL` | Recomendado | Redis no Render (+$7/mês) ou Upstash (free 10K req/dia) |
| `KIWIFY_WEBHOOK_SECRET` | ✅ | Secret para validar webhooks Kiwify |
| `WHATSAPP_PROVIDER` | | `mock` por enquanto (WhatsApp real não implementado) |
| `WHATSAPP_TOKEN_ENCRYPTION_KEY` | | 64 chars hex. Necessário se WhatsApp real |

### Variáveis que NÃO devem estar em produção
- `TEST_EMAIL_TO` — apenas para dev
- `RESEND_TEST_EMAIL` — apenas para dev

---

## 4. Variáveis de Ambiente — Frontend (Vercel)

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | URL do backend no Render (ex: `https://api.multgestor.com.br`) |

---

## 5. Supabase — Configurações de Produção

- [ ] SSL obrigatório nas conexões (já configurado no `database.js`)
- [ ] IP allowlist configurada (se aplicável)
- [ ] Connection pooling ativado (Transaction mode para scalability)
- [ ] Backups automáticos ativados
- [ ] Row Level Security: **migration gerada** — ver instruções abaixo antes de aplicar

### 5.1 Migrations pendentes (aplicar nesta ordem no SQL Editor do Supabase)

**Passo 1 — `trial_email_log.sql`** (seguro, só cria tabela):
```
backend/src/database/trial_email_log.sql
```
Cole e execute no Supabase → SQL Editor. Idempotente (`CREATE TABLE IF NOT EXISTS`).

**Passo 2 — `rls_tenant_tables.sql`** (⚠️ ler aviso antes):
```
backend/src/database/rls_tenant_tables.sql
```

> ⚠️ **AVISO IMPORTANTE sobre RLS:**
> A policy `tenant_isolation` bloqueia qualquer query que não tenha `SET LOCAL app.current_company_id` ativa na transação.
> O helper `withTenantContext` (Sprint 17) cobre os services críticos, mas pode não cobrir todos os services.
> **Aplique primeiro em staging, rode o frontend completo e verifique se há dados ausentes antes de aplicar em produção.**
> Se algum dado sumir na UI após aplicar, o service correspondente precisa de `withTenantContext`.

---

## 6. Pré-deploy Checklist

Antes de cada push para `main`:

- [ ] Todos os testes passando: `npm test` no backend
- [ ] Build do frontend sem erros: `npm run build` no frontend
- [ ] Nenhuma variável `localhost` hardcoded no código
- [ ] `WHATSAPP_PROVIDER=mock` (WhatsApp real não implementado)
- [ ] Logs de debug desativados em produção (pino level `info`)
- [ ] Migrations novas testadas em banco de staging antes de produção

---

## 7. Pós-deploy Verification

Após deploy bem-sucedido:

```bash
# Verificar health check
curl https://SEU_BACKEND.onrender.com/api/health

# Verificar health check detalhado
curl https://SEU_BACKEND.onrender.com/api/health/deep

# Checar se OutboxWorker está rodando (outbox.pending_messages deve ser 0 ou baixo)
```

Resposta esperada de `/health/deep`:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok" },
    "redis": { "status": "ok" },
    "outbox": { "status": "ok", "pending_messages": 0 }
  }
}
```

Se `redis.status = "degraded"`: Redis não configurado — cache in-memory ativo.
Se `whatsapp_provider.is_mock = true`: normal (WhatsApp real não implementado ainda).

---

## 8. Monitoramento

### 8.1 Sentry — Rastreamento de erros

Sentry é **100% opcional** — sem DSN configurado, o sistema funciona identicamente ao atual.

**Backend:**
1. Criar projeto em [sentry.io](https://sentry.io) → Projects → Create Project → Node.js
2. Copiar o DSN (ex: `https://xxx@o123.ingest.sentry.io/456`)
3. Adicionar ao Render: `SENTRY_DSN=<copiar DSN>`
4. Opcional: `SENTRY_ENVIRONMENT=production`

**Frontend:**
1. No mesmo projeto do Sentry (ou um separado)
2. Copiar o DSN do frontend
3. Adicionar ao Vercel: `VITE_SENTRY_DSN=<copiar DSN>`

**O que é capturado:**
- Erros 5xx no backend (com correlationId como tag)
- Erros não tratados no React (via ErrorBoundary)
- **NÃO captura:** erros 4xx, dados PII, senhas, tokens

### 8.2 UptimeRobot — Monitoramento de uptime + prevenção de spin-down

O UptimeRobot a cada 5 minutos previne o spin-down do Render Free tier e alerta quando o serviço cai.

**Passo a passo:**
1. Criar conta gratuita em [uptimerobot.com](https://uptimerobot.com)
2. Dashboard → "Add New Monitor"
3. Tipo: **HTTP(s)**
4. URL: `https://SEU_BACKEND.onrender.com/api/health`
5. Monitoring Interval: **5 minutes**
6. Alert Contacts: email e/ou Telegram
7. Repetir os passos 2-6 para `/api/health/deep` (health check detalhado)

**Importante:**
- Monitorar `/api/health` (leve, responde rapidamente) + `/api/health/deep` (verifica DB, Redis, outbox)
- O ping a cada 5 minutos mantém o Render Free tier ativo
- Alertas por email/Telegram quando o status mudar para "down"

---

## 9. Variáveis de Ambiente — Resumo Completo

### Backend (Render)

| Variável | Obrigatória | Observação |
|----------|-------------|------------|
| `DATABASE_URL` | ✅ | Connection string do Supabase (com SSL) |
| `JWT_SECRET` | ✅ | Min 32 chars, nunca expor |
| `NODE_ENV` | ✅ | `production` |
| `APP_BASE_URL` | ✅ | URL do frontend |
| `RESEND_API_KEY` | ✅ | Chave da API do Resend |
| `REDIS_URL` | Recomendado | Redis no Render ou Upstash |
| `TRIAL_EMAILS_ENABLED` | | `true` para ativar sequencia de emails de trial |
| `SENTRY_DSN` | | Opcional — Sentry project DSN para backend |
| `SENTRY_ENVIRONMENT` | | Opcional — default: `NODE_ENV` |

### Frontend (Vercel)

| Variável | Obrigatória | Observação |
|----------|-------------|------------|
| `VITE_API_URL` | ✅ | URL do backend |
| `VITE_KIWIFY_URL_STARTER` | | Link checkout Kiwify plano Essencial |
| `VITE_KIWIFY_URL_PRO` | | Link checkout Kiwify plano Profissional |
| `VITE_KIWIFY_URL_PREMIUM` | | Link checkout Kiwify plano Premium |
| `VITE_SENTRY_DSN` | | Opcional — Sentry project DSN para frontend |
