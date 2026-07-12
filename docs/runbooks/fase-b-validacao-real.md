# VALIDAÇÃO REAL — FASE B (Wallet/AbacatePay sandbox/devMode) — MultGestor v2

Você é o agente de validação executando a Fase B.
Esta NÃO é uma tarefa de implementação. NÃO alterar código de aplicação. NÃO usar
mocks/testes sintéticos. NÃO usar produção. NÃO movimentar dinheiro real.
Objetivo: provar, com transação real em devMode, que o fluxo Wallet funciona ponta-a-ponta
e capturar o payload BRUTO do webhook.

Raiz backend: `C:\MultGestor.v2\backend`.
Banco real (Supabase): `project_id = mfayajizbkqkcbhqmean`.
Editar `backend/.env` (config, não código) É permitido para inserir credenciais.

## CONTEXTO DO FLUXO (já implementado, NÃO mexer)
1. `POST /barber/wallet/topup` (auth de empresa, feature `financial_dashboard`) →
   `WalletService.createTopupRequest(companyId, { amount, purpose, customerId })`.
2. createTopupRequest insere em `topup_requests` e chama AbacatePay `POST /v1/billing/create`
   com `metadata: { topup_request_id, company_id, purpose }`, retornando `gateway_checkout_url`.
3. Cliente paga o PIX (em devMode, "pagar" pelo dashboard AbacatePay).
4. AbacatePay chama `POST /webhooks/abacatepay` → `billing-manager.handleWebhook('abacatepay', req)`:
   - grava bruto em `payment_gateway_events` (colunas `raw_body` e `payload`);
   - se `wallet_meta.topup_request_id` existe E `event_type` ∈ {checkout-completed,
     transparent-completed, purchase-approved, ...} → emite `wallet.topup.approved` no
     Outbox `outbox_messages`.
5. `outboxWorker` → `handleWalletTopup` credita `company_wallets`, insere `wallet_transactions`
   (type=credit) e marca `topup_requests.status='completed'`.

## REQUISITOS DE AUTENTICAÇÃO DO WEBHOOK (do código — críticos)
O webhook é REJEITADO se qualquer um falhar (`abacatepay.provider.js::verifySignature`):
- `ABACATEPAY_WEBHOOK_SECRET` deve estar PREENCHIDO no `.env` (hoje vazio → lança erro 500).
- A URL configurada no painel AbacatePay deve conter `?webhookSecret=<ESSE_MESMO_SECRET>`.
- Deve vir header `x-webhook-signature` = base64(HMAC-SHA256(corpo_cru, ABACATEPAY_PUBLIC_KEY)),
  com a chave pública hardcoded no provider. Se o devMode da AbacatePay não assinar assim, o
  webhook cai em 401 — REPORTAR como achado, não contornar.

## PRÉ-REQUISITOS (humano fornece — PARE e peça se faltar)
- [ ] `ABACATEPAY_API_TOKEN` de sandbox/devMode.
- [ ] Valor para `ABACATEPAY_WEBHOOK_SECRET` (definido pelo usuário).
- [ ] Endpoint público apontando para o backend local (túnel ngrok/cloudflared) OU ambiente
      deployado que use o MESMO banco.
- [ ] Webhook configurado no painel AbacatePay como:
      `https://<PUBLICO>/webhooks/abacatepay?webhookSecret=<SECRET>`.
- [ ] Empresa de teste com login válido (para obter o JWT) e feature `financial_dashboard`.

## PASSO 0 — Baseline (antes de tudo)
```sql
SELECT 'topup_requests' t, count(*) n FROM topup_requests
UNION ALL SELECT 'payment_gateway_events', count(*) FROM payment_gateway_events
UNION ALL SELECT 'wallet_transactions', count(*) FROM wallet_transactions
UNION ALL SELECT 'company_wallets', count(*) FROM company_wallets
UNION ALL SELECT 'outbox_messages', count(*) FROM outbox_messages;
```
Registrar os números e anotar o `company_id` de teste.

## PASSO 1 — Subir ambiente
- Inserir `ABACATEPAY_API_TOKEN` e `ABACATEPAY_WEBHOOK_SECRET` em `backend/.env`.
- `npm start` (porta 3000). Confirmar nos logs que outboxWorker + consumers registraram.
- Garantir túnel ativo e URL pública alcançando `/webhooks/abacatepay`.

## PASSO 2 — Criar topup real
- Autenticar como a empresa de teste, obter JWT.
- `POST /barber/wallet/topup` com `{ "amount": 5.00, "purpose": "general" }`.
- Capturar a resposta: deve conter `gateway_checkout_url` (se vier null → token ausente/inválido;
  PARAR e reportar).
```sql
SELECT id, company_id, amount, status, gateway_checkout_url, created_at
FROM topup_requests ORDER BY created_at DESC LIMIT 1;
```
Anotar o `topup_request_id`.

## PASSO 3 — Pagar/simular (HUMANO)
PARE e instrua o usuário a abrir o checkout e "pagar" o PIX no devMode da AbacatePay.
Aguardar confirmação antes de seguir.

## PASSO 4 — Capturar payload bruto do webhook
```sql
SELECT id, gateway, event_id, event_type, processing_status, created_at, processed_at, raw_body
FROM payment_gateway_events ORDER BY created_at DESC LIMIT 1;
```
- Exibir o `raw_body` COMPLETO (JSON do webhook real).
- Conferir onde está o metadata (`data.checkout.metadata` / `data.subscription.metadata` / topo).

## PASSO 5 — Confirmar emissão e Outbox
```sql
SELECT id, event_type, status, attempts, created_at, processed_at, payload
FROM outbox_messages
WHERE event_type IN ('wallet.topup.approved','wallet.topup.failed')
ORDER BY created_at DESC LIMIT 5;
```

## PASSO 6 — Confirmar crédito de saldo
```sql
SELECT cw.company_id, cw.balance, cw.updated_at
FROM company_wallets cw ORDER BY cw.updated_at DESC LIMIT 1;

SELECT id, type, amount, balance_before, balance_after, reference_type, reference_id,
       gateway, gateway_transaction_id, created_at
FROM wallet_transactions ORDER BY created_at DESC LIMIT 1;

SELECT id, status, completed_at FROM topup_requests ORDER BY created_at DESC LIMIT 1;
```

## RELATÓRIO FINAL (responder objetivamente, com evidência SQL/JSON)
1. metadata retornou no webhook? (sim/não + trecho do raw_body)
2. topup_request_id retornou? (valor)
3. company_id retornou? (valor)
4. event_type recebido? (valor normalizado e o "event" cru)
5. `wallet.topup.approved` foi emitido? (linha do outbox_messages)
6. Outbox executou? (`processed_at` preenchido, attempts)
7. Saldo foi creditado? (balance_before → balance_after; topup status='completed')

## SE FALHAR EM QUALQUER PONTO — diagnosticar SEM alterar código
- Webhook não chegou → checar túnel/URL/`?webhookSecret`.
- 401/500 no webhook → requisito de assinatura (secret/HMAC/ABACATEPAY_PUBLIC_KEY) — reportar qual.
- Evento virou `payment.approved` em vez de `wallet.topup.approved` → metadata NÃO ecoou OU
  `event_type` fora da lista WALLET_APPROVED_EVENTS — reportar o `event` cru recebido.
- Saldo não creditou mas evento emitido → erro no consumer/outbox; colar log e
  `outbox_messages.attempts`/erro.

## RESTRIÇÕES
- NÃO alterar código de aplicação. NÃO mockar. NÃO produção. NÃO dinheiro real.
- Registrar tudo em `docs/FASE_B_VALIDATION_REPORT.md` com timestamps, SQL e JSON brutos.
