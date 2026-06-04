# Runbook — AbacatePay Provider (validação da arquitetura vendor-agnostic)

> **Propósito:** Teste de validação da arquitetura — se o billing está realmente
> vendor-agnostic, adicionar AbacatePay como segundo provider é trivial.
> Se precisar tocar `billing-manager.js`, `billing-provisioning.consumer.js`
> ou regra de negócio, é sinal de gap arquitetural — **PARE**.
>
> **Sprint:** 19 (pós Sprint 18 — Billing Capability)

---

## MISSÃO

Adicionar **AbacatePay** como segundo PaymentProvider da Billing Capability.
Este sprint é o **teste de validação da arquitetura vendor-agnostic**.

## CONTEXTO

Projeto: MultGestor v2 (SaaS multi-tenant, capability/event-driven).
Backend Node.js + Express 5 (CommonJS) em `backend/`. Raiz: `C:\MultGestor.v2`.
Branch de trabalho: `principal`. Branch de deploy: `main` (NÃO tocar).

Estado atual (Sprint 18 já mergeada):
- Billing Capability operacional em `src/shared/capabilities/billing/` com:
  - `contracts.js` — 9 contratos de evento de domínio + `normalizeBillingStatus` + `eventTypeToDomainEvent`
  - `payment-provider.js` — classe base `PaymentProvider` (getProviderName/verifySignature/parse/normalize)
  - `provider-registry.js` — `BillingProviderRegistry` keyed por gateway name
  - `billing-manager.js` — `handleWebhook(providerName, req, rawPayload?)`: verify→parse→normalize→persist em `payment_gateway_events`→publica evento via Outbox
  - `providers/kiwify.provider.js` — KiwifyProvider (auto-registrado em `index.js`)
- Consumer: `src/integrations/consumers/billing-provisioning.consumer.js`
- `webhooks.controller.js` chama `billingManager.handleWebhook('kiwify', req)`
- 497/497 testes verdes (32 suítes)

## CRITÉRIO DE SUCESSO DA ARQUITETURA (regra de ouro)

Se a arquitetura está correta, este sprint exige **ZERO mudança** em:
- `src/shared/capabilities/billing/billing-manager.js`
- `src/shared/capabilities/billing/payment-provider.js`
- `src/shared/capabilities/billing/provider-registry.js`
- `src/integrations/consumers/billing-provisioning.consumer.js`
- `src/services/company-plan.service.js`, `src/utils/planFeatures.js`, `src/services/master-finance.service.js`
- `src/shared/capabilities/billing/providers/kiwify.provider.js`
- `src/services/webhooks/kiwify.service.js`

**Se algum desses arquivos PRECISAR mudar, PARE imediatamente e reporte** —
é sinal de que a abstração tem gap e precisa redesenho antes de seguir.

`contracts.js` pode ter cases ADICIONADOS (nunca removidos/alterados) em
`eventTypeToDomainEvent` e `normalizeBillingStatus` para os event types da AbacatePay.

## OBJETIVO

1. Criar `AbacatePayProvider` stateless (verify/parse/normalize) seguindo o padrão do `KiwifyProvider`
2. Adicionar rota `POST /api/webhooks/abacatepay` e controller
3. Auto-registrar o provider em `billing/index.js`
4. Documentar `ABACATEPAY_WEBHOOK_SECRET` em `.env.example` e `docker-compose.yml`
5. Testes unitários completos do provider (mirrored do KiwifyProvider)
6. Provar end-to-end que `billingManager.handleWebhook('abacatepay', req)` publica o evento de domínio correto

## REGRAS

- Mudança cirúrgica, **aditivo apenas**. Sem refatoração.
- Reutilizar TUDO da capability existente (BillingManager, registry, consumer, contracts).
- Não tocar Kiwify, nem read-model, nem `processKiwifyWebhook`.
- Branch `feat/billing-abacatepay-provider` a partir de `principal`.
- Commits atômicos por fase. Conventional Commits. Não dar `git push` nem merge sem confirmação.
- Responder em PT-BR.

## TAREFAS

### FASE 0 — Preflight + research da AbacatePay (BLOCKER)

- `git checkout principal && git pull origin principal`
- `git checkout -b feat/billing-abacatepay-provider`
- `cd backend && npm ci`
- baseline `npm run test:unit` (esperado 497/497)
- **PESQUISAR** a documentação oficial em https://docs.abacatepay.com (já feito na Sprint 18,
  relatório completo em `docs/runbooks/abacatepay-provider.md` seção "Relatório Fase 0").
  Confirmar se a doc pública ainda é a mesma.
  - HMAC: **SHA-256, header `X-Webhook-Signature`, encoding BASE64** (difere da Kiwify que usa hex)
  - **Duas camadas de segurança:**
    1. URL secret: `req.query.webhookSecret` — comparação direta com `ABACATEPAY_WEBHOOK_SECRET` do env
    2. HMAC body: usa **PUBLIC KEY hardcoded** (NÃO shared secret), calculado sobre raw body, comparado com `X-Webhook-Signature` via `crypto.timingSafeEqual`
  - Chave pública HMAC (constante fixa):
    ```
    t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9
    ```
  - Estrutura do payload: `{ id (event_log), event, apiVersion, devMode, data: { ... } }`
  - `data.checkout`: `{ id, externalId, amount, paidAmount, status, frequency, items, customerId, ... }`
  - `data.subscription`: `{ id, amount, status, frequency, method, ... }`
  - `data.customer`: `{ id, name, email, taxId }`
  - Mapeamento completo:
    | Event AbacatePay | Domain event interno |
    |--|--|
    | checkout.completed | payment.approved |
    | checkout.refunded | subscription.refunded |
    | checkout.disputed | subscription.chargeback |
    | transparent.completed | payment.approved |
    | transparent.refunded | subscription.refunded |
    | transparent.disputed | subscription.chargeback |
    | subscription.completed | payment.approved |
    | subscription.cancelled | subscription.canceled |
    | subscription.renewed | subscription.renewed |
    | subscription.trial_started | ⚠️ **decidir**: mapear para `subscription.created` (que tem `trial_end` opcional) ou ignorar |
- Se `subscription.trial_started` não tiver mapeamento aprovado, **PARE e reporte**.

### FASE A — AbacatePayProvider + tests (aditivo puro)

- Criar `src/shared/capabilities/billing/providers/abacatepay.provider.js`
  estendendo `PaymentProvider`. Stateless, sem DB, sem side-effects.
  - `getProviderName()` → `'abacatepay'`
  - `verifySignature(req)` → **duas camadas de verificação:**
    1. **URL secret**: `req.query.webhookSecret === process.env.ABACATEPAY_WEBHOOK_SECRET`
       (se o env ou query estiver ausente, retorna false ou throw Error)
    2. **HMAC body**: lê `req.rawBody` (Buffer), computa HMAC-SHA256 com a **PUBLIC KEY hardcoded**
       (constante no provider), digest **base64**, compara com `req.headers['x-webhook-signature']`
       via `crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(headerSig))`
    Lança `Error` se `ABACATEPAY_WEBHOOK_SECRET` não estiver configurado no env.
    ⚠️ NÃO usar `ABACATEPAY_WEBHOOK_SECRET` como chave HMAC — o HMAC usa PUBLIC key fixa.
    O webhookSecret é token de URL, validado por comparação direta de string.
  - `parse(req)` → retorna `req.body || {}`
  - `normalize(rawPayload)` → retorna `NormalizedBillingEvent` no MESMO formato do KiwifyProvider:
    `{ provider, event_id, event_type, status, company, customer, finance, raw }`
    - `event_id` → `rawPayload.id` (ex: `"log_abc123xyz"`)
    - `event_type` → `rawPayload.event` (ex: `"checkout.completed"`)
    - `company` → extrair de `rawPayload.data.customer` + fallbacks
    - `customer` → `rawPayload.data.customer`
    - `finance` → extrair de `rawPayload.data.checkout` ou `rawPayload.data.subscription` ou `rawPayload.data.transparent`
    - `status` → via `normalizeBillingStatus()` com os novos cases AbacatePay
- Adicionar cases em `contracts.js`:
  - `normalizeBillingStatus()` — adicionar cases p/ os event types da AbacatePay
  - `eventTypeToDomainEvent()` — mapear p/ os domain events existentes (`payment.approved`, etc.)
  - **Não remover nenhum case existente. Não alterar a estrutura das funções.**
- Capturar **raw body** para a rota `/api/webhooks/abacatepay` (HMAC precisa do corpo cru):
  - Opção recomendada: callback `verify` do `express.json()` SÓ nessa rota → guarda `req.rawBody`
  - Provider lê `req.rawBody` no `verifySignature`. NÃO alterar parsing global.
- Criar `tests/unit/abacatepay-provider.test.js` espelhando `kiwify-provider.test.js`:
  - `getProviderName`, `verifySignature` (válido/inválido/env ausente/HMAC errado/constant-time),
    `parse`, `normalize` (cobrindo TODOS os event types da AbacatePay)
- RODAR `npm run test:unit` — esperado verde (497 + N novos)
- COMMIT: `feat(billing): scaffold AbacatePayProvider adapter (verify/parse/normalize)`

### FASE B — Wiring: rota + controller + registry + env

- `src/shared/capabilities/billing/index.js`: registrar AbacatePayProvider
  ```js
  const { AbacatePayProvider } = require('./providers/abacatepay.provider')
  billingProviderRegistry.register('abacatepay', AbacatePayProvider)
  ```
- `src/controllers/webhooks.controller.js`: adicionar `receiveAbacatePayWebhook`
  (3-4 linhas, espelho do `receiveKiwifyWebhook`)
- `src/routes/webhooks.routes.js`: `POST /abacatepay` com middleware de raw body
  (express.json com verify callback APENAS nessa rota)
- Documentar em `backend/.env.example` (seção billing/webhooks):
  ```
  ABACATEPAY_WEBHOOK_SECRET=          # URL secret do webhook (query param ?webhookSecret=...). NÃO é HMAC key.
  ```
  e em `docker-compose.yml` (valor de dev `dev_abacatepay_secret_local`)
- ⚠️ A chave do HMAC é **pública e hardcoded** no provider (não vai no .env)
- RODAR `npm run test:unit` — verde
- COMMIT: `feat(billing): wire AbacatePay webhook route + registry + env`

### FASE C — Smoke test integrado

- Adicionar 3-4 testes em `tests/unit/abacatepay-webhook.smoke.test.js`
  (estilo characterization, mockando pool/database):
  - Webhook com HMAC inválido → 401
  - Webhook com URL secret inválido → 401
  - Webhook sem `ABACATEPAY_WEBHOOK_SECRET` no env → 500
  - Webhook válido (URL secret OK + HMAC OK) → retorna `{processed: true, eventId, eventType, duplicate: false}`
    e o INSERT em `payment_gateway_events` foi chamado com `gateway='abacatepay'`
  - Evento duplicado (rowCount=0) → retorna `{duplicate: true, ...}`
- RODAR `npm run test:unit` — todos verdes
- COMMIT: `test(billing): integration smoke tests for AbacatePay webhook`

## VALIDAÇÕES

- `npm run test:unit` — 100% verde em cada checkpoint (497 baseline + novos)
- `npm run test:integration` — não regredir
- `npm run build` (frontend) — sem erros
- **Grep de sanidade**: `grep -r abacatepay backend/src/ --include=*.js` deve aparecer **APENAS** em:
  - `src/shared/capabilities/billing/providers/abacatepay.provider.js`
  - `src/shared/capabilities/billing/index.js` (1-2 linhas de registro)
  - `src/shared/capabilities/billing/contracts.js` (cases adicionados)
  - `src/controllers/webhooks.controller.js` (1 handler curto)
  - `src/routes/webhooks.routes.js` (1 rota)
- **Diff zero** em: `billing-manager.js`, `billing-provisioning.consumer.js`,
  `payment-provider.js`, `provider-registry.js`, `kiwify.provider.js`,
  `kiwify.service.js`, `company-plan.service.js`, `planFeatures.js`,
  `master-finance.service.js`
- `git diff principal..feat/billing-abacatepay-provider --stat` — apenas arquivos novos
  e os 4-5 wiring points acima

## CRITÉRIOS DE ACEITAÇÃO

- [ ] `AbacatePayProvider` existe, estende `PaymentProvider`, é stateless
- [ ] `POST /api/webhooks/abacatepay` funcional com raw body capture
- [ ] AbacatePayProvider auto-registrado em `billing/index.js`
- [ ] `ABACATEPAY_WEBHOOK_SECRET` documentado em `.env.example` e `docker-compose.yml`
- [ ] Testes unit do provider verdes (TODOS os event types cobertos)
- [ ] Smoke tests do webhook verdes (401, 500, sucesso, duplicate)
- [ ] **Zero mudança** em billing-manager, consumer, payment-provider, registry, kiwify, read-model
- [ ] `contracts.js` apenas com cases ADICIONADOS (diff é pura adição)
- [ ] Grep de "abacatepay" só nos 5 pontos esperados
- [ ] Resultado da pesquisa (Fase 0) incluído no relatório final

## RESULTADO ESPERADO

Com este sprint mergeado, adicionar o **terceiro provider** (Mercado Pago / Stripe / qualquer outro)
segue o mesmo padrão de ~5 arquivos: novo `providers/<x>.provider.js` + 1 linha no registry +
1 handler no controller + 1 rota + cases em `contracts.js` + tests. **Sem tocar regra de negócio.**

Entregar relatório final em tabela: fase | status | arquivos | testes (n/n) | risco residual,
+ a conclusão da Fase 0 (esquema real da assinatura/payload da AbacatePay),
+ lista de commits da branch, + pergunta:
"Posso fazer push da branch `feat/billing-abacatepay-provider` e abrir PR para `principal`?"

## CONDIÇÕES DE PARADA (PARE e reporte; não improvise)

- Doc oficial da AbacatePay inacessível e sem payload de exemplo
- Estrutura do webhook da AbacatePay não cabe no `NormalizedBillingEvent` atual
  (precisa de campo novo na estrutura — vira refatoração de contrato)
- Algum event type da AbacatePay sem equivalente nos domain events existentes
  (criar evento novo é decisão de design — não tomar sozinho)
- Necessidade de modificar `billing-manager.js`, consumer, registry, payment-provider,
  kiwify ou read-model
- Qualquer teste existente vermelho após mudança
- Necessidade de criar tabela nova no banco

---

## Relatório Fase 0 — Pesquisa AbacatePay (31/05/2026)

> Fontes consultadas: https://docs.abacatepay.com/llms.txt, /pages/webhooks, /pages/webhooks/security,
> /pages/webhooks/events/checkout, /pages/webhooks/events/subscriptions, /pages/webhooks/events/transparent

### Decisões técnicas confirmadas

| Item | Valor |
|------|-------|
| Algoritmo HMAC | SHA-256 |
| Header da assinatura | `X-Webhook-Signature` |
| Encoding | **BASE64** (`.digest('base64')`) |
| Chave HMAC | **Pública e hardcoded** (constante fixa, não shared secret) |
| Camada 1 (auth) | URL secret: `?webhookSecret=` no query string, comparado diretamente com `ABACATEPAY_WEBHOOK_SECRET` do env |
| Camada 2 (integridade) | HMAC-SHA256 do raw body com chave pública, comparado via `crypto.timingSafeEqual` |
| event_id | `payload.id` (prefixo `log_*`) |
| event_type | `payload.event` (ex: `checkout.completed`) |
| customer | `payload.data.customer: { id, name, email, taxId }` |
| checkout | `payload.data.checkout: { id, externalId, amount, paidAmount, status, frequency, items, ... }` |
| subscription | `payload.data.subscription: { id, amount, status, frequency, method, ... }` |
| payment | `payload.data.payment: { id, amount, paidAmount, status, ... }` (em subscription.* events) |
| transparent | `payload.data.transparent: { id, amount, paidAmount, status, ... }` |
| Valores em centavos | `amount`, `paidAmount`, `platformFee` — inteiros (mesma unidade que Kiwify) |
| Dev mode (sandbox) | `payload.devMode: true/false` — conta já começa em dev mode |
| Idempotência | Recomendam usar `payload.id` — compatível com UNIQUE(gateway, event_id) em `payment_gateway_events` |

### Mapeamento event types → domain events

| Event AbacatePay | `eventTypeToDomainEvent` | `normalizeBillingStatus` |
|---|---|---|
| `checkout.completed` | `payment.approved` | `{ active, paid }` |
| `checkout.refunded` | `subscription.refunded` | `{ refunded, refunded }` |
| `checkout.disputed` | `subscription.chargeback` | `{ suspended, chargeback }` |
| `transparent.completed` | `payment.approved` | `{ active, paid }` |
| `transparent.refunded` | `subscription.refunded` | `{ refunded, refunded }` |
| `transparent.disputed` | `subscription.chargeback` | `{ suspended, chargeback }` |
| `subscription.completed` | `payment.approved` | `{ active, paid }` |
| `subscription.cancelled` | `subscription.canceled` | `{ canceled, canceled }` |
| `subscription.renewed` | `subscription.renewed` | `{ active, paid }` |
| `subscription.trial_started` | ⚠️ **decidir** (→ `subscription.created`) | ⚠️ **decidir** (→ `{ trial, pending }`) |

### Riscos corrigidos do runbook original

| # | Risco original | Correção |
|---|----------------|----------|
| 1 | Assumia `hex` | HMAC é **base64** — `Buffer.from(expectedSig, 'base64')` não funciona; usar `.digest('base64')` |
| 2 | `ABACATEPAY_WEBHOOK_SECRET` tratado como HMAC key | HMAC usa **chave pública hardcoded**; webhookSecret é token de URL (comparação direta) |
| 3 | Única camada de segurança | **Duas camadas**: URL secret (auth) + HMAC (integridade), ambas em `verifySignature()` |
