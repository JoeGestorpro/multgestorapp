# WhatsApp / Meta Cloud API — Runbook de Integração

> Documento vivo. Versão: 1.0 — Junho 2026

---

## Sumário

1. [Onde colocar as variáveis de ambiente](#1-onde-colocar-as-variáveis-de-ambiente)
2. [Como configurar URL de callback na Meta](#2-como-configurar-url-de-callback-na-meta)
3. [Como criar WHATSAPP_VERIFY_TOKEN](#3-como-criar-whatsapp_verify_token)
4. [Token temporário vs token permanente](#4-token-temporário-vs-token-permanente)
5. [Cuidados com APP_SECRET e META_ACCESS_TOKEN](#5-cuidados-com-app_secret-e-meta_access_token)
6. [Arquitetura da integração](#6-arquitetura-da-integração)
7. [Testando a integração](#7-testando-a-integração)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Onde colocar as variáveis de ambiente

Todas as variáveis são lidas de `process.env` via `dotenv` no startup do backend.

### Arquivos de ambiente

| Arquivo | Finalidade |
|---------|------------|
| `backend/.env` | Desenvolvimento local **(NUNCA commitar)** |
| `backend/.env.example` | Template público com valores vazios **(seguro para commit)** |
| `backend/.env.test` | Testes automatizados **(seguro para commit)** |
| `backend/.env.production` | Deploy em produção via Render/Vercel |

### Variáveis obrigatórias em produção

```bash
# Provider: mock | meta_cloud_api
WHATSAPP_PROVIDER=meta_cloud_api

# ID do App criado no Meta for Developers
META_APP_ID=1234567890123456

# App Secret (NUNCA compartilhar, NUNCA commitar)
META_APP_SECRET=abc123def456...

# Token de acesso (long-lived ou permanente)
META_ACCESS_TOKEN=EAAT...

# Token de verificação do webhook (string qualquer, você escolhe)
WHATSAPP_VERIFY_TOKEN=minha-string-secreta

# IDs da conta WhatsApp Business
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345

# Chave AES-256-GCM para criptografar tokens no banco (64 chars hex)
WHATSAPP_TOKEN_ENCRYPTION_KEY=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

### Em produção (Render)

Configurar no dashboard do Render como **Environment Variables** — nunca no `backend/.env.production`.

---

## 2. Como configurar URL de callback na Meta

### Passo a passo no Meta for Developers

1. Acesse [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Selecione o app **MultGestor**
3. Vá em **WhatsApp** > **Configuration** (ou **API Setup**)
4. Na seção **Webhook**, clique em **Edit** ao lado de **Callback URL**

### Configurar URL

```
https://seu-dominio.com/api/webhooks/whatsapp
```

**Ambientes:**
- Produção: `https://multgestor-backend.onrender.com/api/webhooks/whatsapp`
- Desenvolvimento: usar `ngrok` ou `cloudflared tunnel` para expor localhost

### Verify Token

Digite exatamente o valor de `WHATSAPP_VERIFY_TOKEN` que você configurou no backend.

### Inscrições (Webhook Fields)

Marcar obrigatoriamente:
- ✅ **messages** — para receber mensagens e confirmações de entrega

---

## 3. Como criar WHATSAPP_VERIFY_TOKEN

O `WHATSAPP_VERIFY_TOKEN` é uma string arbitrária que **você escolhe**. A Meta envia esse token no GET de verificação, e o backend compara com o valor configurado.

**Regras:**
- Pode ser qualquer string (letras, números, símbolos)
- Quanto mais longa e aleatória, melhor
- Anote em um cofre de senhas

**Exemplo:**
```bash
WHATSAPP_VERIFY_TOKEN=mg-wa-vt-a8f3c2e1b7d9
```

> ⚠️ Se perder esse token, você precisa gerar outro e atualizar TANTO no `.env` QUANTO na configuração do webhook no Meta for Developers.

---

## 4. Token temporário vs token permanente

### Token Temporário

- Gerado no **Graph API Explorer** do Meta for Developers
- **Válido por 24 horas**
- Útil apenas para testes rápidos
- **Não usar em produção**

### Token Permanente (Long-Lived)

Fluxo recomendado:

1. Gerar um **token temporário** no Graph API Explorer (24h)
2. Trocar por um **token de acesso de longo prazo** (60 dias):
   ```
   GET /oauth/access_token?
     grant_type=fb_exchange_token&
     client_id={META_APP_ID}&
     client_secret={META_APP_SECRET}&
     fb_exchange_token={SHORT_LIVED_TOKEN}
   ```
3. Opcionalmente, trocar por um **token permanente** (não expira) via **WhatsApp Business Management API** — requer configuração adicional e aprovação da Meta.

**Token never expira (permanente):**
- Disponível apenas para contas Business verificadas
- Requer permissão `whatsapp_business_messaging` e `whatsapp_business_management`
- Fluxo: `Token Temporário → Token 60 dias → Token Permanente`

### Recomendação

Para produção, solicite um **token permanente** à Meta. Enquanto isso, renove o token de 60 dias automaticamente com um job agendado.

---

## 5. Cuidados com APP_SECRET e META_ACCESS_TOKEN

### ❌ NUNCA FAZER

```javascript
// NUNCA — hardcoded no código
const SECRET = 'a1b2c3d4e5f6...' // ❌ Vazamento garantido
```

```bash
# NUNCA — valores reais no .env.example
META_APP_SECRET=valor_real_aqui  # ❌ Se commitar, está exposto
```

```javascript
// NUNCA — logar valores sensíveis
appLogger.info({ secret: process.env.META_APP_SECRET }) // ❌
```

### ✅ FAZER

```javascript
// ✅ Logar apenas se está configurado, nunca o valor
appLogger.info({ hasSecret: !!process.env.META_APP_SECRET })

// ✅ Usar variável de ambiente em produção
const secret = process.env.META_APP_SECRET

// ✅ Comparação segura com timingSafeEqual (já implementado no webhook)
crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
```

### GitGuardian / Segurança

- O repositório já tem `.env` no `.gitignore`
- `.env.example` NUNCA contém valores reais
- `.env.test` só contém valores fictícios

---

## 6. Arquitetura da integração

```
Meta Cloud API
      ↕ HTTPS
┌──────────────────┐
│ WhatsAppWebhook  │ ← Valida x-hub-signature-256 + hub.verify_token
│ (webhook)        │
└────────┬─────────┘
         ↕ EventBus (in-memory)
┌────────┴─────────┐
│ Integration      │ ← Escuta eventos de domínio
│ Consumers        │   (appointment.confirmed, etc.)
└────────┬─────────┘
         ↕
┌────────┴─────────┐
│ WhatsAppResolver │ ← Provider per-company + cache 5min
└────────┬─────────┘
         ↕
┌────────┴─────────┐
│ WhatsAppProvider │ ← Real (Meta Cloud API)
│ MockProvider     │ ← Mock (desenvolvimento/teste)
└──────────────────┘
```

### Fluxo de mensagem recebida

1. Meta envia POST para `/api/webhooks/whatsapp`
2. `WhatsAppWebhook.handleIncoming()` valida `x-hub-signature-256`
3. Se inválido → `403 Invalid signature`
4. Se válido → processa mensagens/status
5. Publica eventos `integration.whatsapp.message_received` no EventBus
6. Consumidores (futuros) processam a mensagem

### Fluxo de envio de mensagem

1. Serviço de domínio publica `appointment.confirmed`
2. `AppointmentIntegrationConsumer` recebe o evento
3. Usa `WhatsAppResolver` para obter provider da empresa
4. Chama `provider.send()` → `WhatsAppProvider._sendMetaCloud()`
5. Envia POST para `https://graph.facebook.com/v19.0/{PHONE_ID}/messages`
6. Retorna `{ success, message_id, status }`

---

## 7. Testando a integração

### Testes unitários (Jest)

```bash
cd backend
npx jest tests/unit/whatsapp-webhook.test.js     # Webhook + signature
npx jest tests/unit/whatsapp-provider.test.js     # Provider Meta Cloud API
npx jest tests/unit/whatsapp-resolver.test.js     # Resolver per-company
```

### Teste manual do webhook com ngrok

```bash
# Terminal 1: expor localhost
ngrok http 5000

# Terminal 2: configurar WHATSAPP_PROVIDER=mock .env
# Acessar Meta for Developers → Webhook → Configurar URL do ngrok

# Testar GET de verificação manualmente
curl "https://seu-ngrok.ngrok.io/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=seu-token&hub.challenge=123"

# Testar POST com assinatura válida
META_SECRET=$(grep META_APP_SECRET .env | cut -d= -f2)
BODY='{"object":"whatsapp_business_account","entry":[]}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$META_SECRET" | cut -d' ' -f2)

curl -X POST "https://seu-ngrok.ngrok.io/api/webhooks/whatsapp" \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=$SIGNATURE" \
  -d "$BODY"
```

### Teste de envio via API interna

```bash
curl -X POST http://localhost:5000/api/integrations/whatsapp/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"to":"5511999999999","text":"Teste de envio WhatsApp"}'
```

---

## 8. Troubleshooting

### Webhook retornando 403

| Causa | Solução |
|-------|---------|
| `x-hub-signature-256` ausente | Verificar se `META_APP_SECRET` está configurado |
| Assinatura inválida | `META_APP_SECRET` no backend difere do App Secret no Meta for Developers |
| `hub.verify_token` incorreto | Verificar `WHATSAPP_VERIFY_TOKEN` |
| Token de verificação expirado | Regenerar e atualizar nos dois lugares |

### Mensagens não estão sendo enviadas

| Causa | Solução |
|-------|---------|
| `META_ACCESS_TOKEN` expirado | Renovar token (temporário: 24h, long-lived: 60 dias) |
| `WHATSAPP_PHONE_NUMBER_ID` incorreto | Verificar no painel Meta > WhatsApp > API Setup |
| Número de destino não optou-in | Números de teste na Meta precisam estar na conta |
| Template não aprovado | Templates de mensagem precisam ser aprovados pela Meta |

### Logger não mostra erros

```bash
# Aumentar nível de log para debug
LOG_LEVEL=debug npx nodemon src/server.js
```

### Rate limiting da Meta

A Meta Cloud API tem limites de:
- **250 mensagens por número de telefone por 24h** (qualidade mais alta)
- Limits menores para números com qualidade baixa

Verificar status no [WhatsApp Manager](https://business.facebook.com/wa/manage/).

---

## Histórico

| Data | Versão | Descrição |
|------|--------|-----------|
| Jun/2026 | 1.0 | Runbook inicial da integração WhatsApp Cloud API |
