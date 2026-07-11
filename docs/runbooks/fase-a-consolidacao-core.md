# EXECUÇÃO REAL — FASE A (Consolidação Imediata do Core) — MultGestor v2

Você é o agente executando a Fase A da consolidação pré-homologação.
Este é um runbook de EXECUÇÃO: você vai LER, ALTERAR código, RODAR testes e COMMITAR.
NÃO fará push nem merge sem confirmação explícita do usuário.

Contexto: SaaS multi-tenant, capability/event-driven. Backend Node.js + Express
(CommonJS) em `backend/`. Padrão Outbox + Unit of Work. Diretório raiz: `C:\MultGestor.v2`.
Banco: PostgreSQL (Supabase). Shell: bash ou PowerShell.

## REGRAS (valem para todo o runbook)

1. Mudança cirúrgica. Se algo exigir refatoração além do previsto, PARE e reporte
   a proposta antes de implementar.
2. NÃO habilitar `FORCE ROW LEVEL SECURITY`, NÃO trocar a role de conexão do banco,
   NÃO rodar migrations destrutivas (risco de quebrar produção).
3. NÃO criar frontend. NÃO tocar capabilities fora do escopo abaixo.
4. Não duplicar — verifique se já existe equivalente antes de criar qualquer arquivo.
5. Cada tarefa termina com teste unitário (padrão `backend/tests/unit/*`, com
   `jest.mock('../../src/config/database', ...)`) e um commit atômico (Conventional Commits).
6. Reporte resultado REAL de cada comando (cole a saída relevante). Sem "deve passar".
7. Não fazer push nem merge. Não tocar em `.github/workflows/`.

## ETAPA 0 — PREFLIGHT (não alterar nada ainda)

```
git status
git branch --show-current
git log --oneline -3
```
Criar branch de trabalho: `git checkout -b fase-a/consolidacao-core`.
Instalar deps (idempotente) e rodar a suíte para baseline verde:
```
cd backend && npm ci && npm test
```
CHECKPOINT: baseline de testes verde antes de qualquer alteração.

---

## TAREFA A1 — Consumer para `wallet.topup.failed`

PROBLEMA: `backend/src/shared/capabilities/billing/billing-manager.js` (~linha 108) já
emite `wallet.topup.failed` em reembolso/chargeback, mas NENHUM consumer está registrado
→ o `topup_requests` correspondente fica `status='pending'` para sempre.

Registro atual de consumers (`backend/src/server.js`, ~linha 387):
```js
const { handleBillingProvisioning, handleWalletTopup } = require('./integrations/consumers');
outboxWorker.register('payment.approved', handleBillingProvisioning);
// ... outros ...
outboxWorker.register('wallet.topup.approved', handleWalletTopup);
appLogger.info('[OutboxWorker] Wallet provisioning consumer registered');
```

FAZER:
1. Em `backend/src/integrations/consumers/wallet-provisioning.consumer.js`, criar
   `handleWalletTopupFailed(eventPayload)`:
```js
async function handleWalletTopupFailed(eventPayload) {
  const { topup_request_id, company_id, failure_reason, payment_gateway_event_id } = eventPayload
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (topup_request_id) {
      await client.query(
        `UPDATE topup_requests
         SET status = 'failed', failed_at = NOW(), failure_reason = $2
         WHERE id = $1 AND status = 'pending'`,
        [topup_request_id, failure_reason || 'gateway_failure']
      )
    }
    if (payment_gateway_event_id) {
      await client.query(
        `UPDATE payment_gateway_events
         SET processing_status = 'processed', company_id = $2, processed_at = NOW()
         WHERE id = $1`,
        [payment_gateway_event_id, company_id || null]
      )
    }
    await client.query('COMMIT')
    appLogger.info({ topup_request_id, failure_reason }, '[WalletProvisioning] topup marcado como failed')
  } catch (err) {
    await client.query('ROLLBACK')
    appLogger.error({ err, topup_request_id }, '[WalletProvisioning] falha ao marcar topup failed')
    throw err
  } finally {
    client.release()
  }
}
module.exports = { handleWalletTopup, handleWalletTopupFailed }
```
2. Reexportar em `backend/src/integrations/consumers/index.js` (incluir
   `handleWalletTopupFailed` no require e no `module.exports`).
3. Em `server.js`, após o register de `wallet.topup.approved`:
   `outboxWorker.register('wallet.topup.failed', handleWalletTopupFailed);`
4. Teste unitário: pending→failed; idempotência (status já 'failed' → UPDATE sem efeito, sem erro).

CHECKPOINT: teste de A1 verde. Commit: `feat(wallet): consumer para wallet.topup.failed`.

---

## TAREFA A2 — Idempotência incondicional do crédito de saldo

PROBLEMA: em `handleWalletTopup` (`wallet-provisioning.consumer.js`, ~linha 22) a guarda de
duplicata só roda `if (gateway_transaction_id)`. Sem ele, reentrega do Outbox pode creditar 2x.

Trecho atual:
```js
if (gateway_transaction_id) {
  const existing = await client.query(
    `SELECT id FROM wallet_transactions
     WHERE gateway_transaction_id = $1 AND type = 'credit'
     LIMIT 1`,
    [gateway_transaction_id]
  )
  if (existing.rowCount > 0) { await client.query('ROLLBACK'); /* idempotência */ return }
}
```

FAZER: adicionar fallback por `topup_request_id` (a inserção do crédito grava
`reference_type='topup', reference_id=topup_request_id`). Substituir a guarda por:
```js
const dupCheck = await client.query(
  `SELECT id FROM wallet_transactions
   WHERE type = 'credit'
     AND (
       ($1::text IS NOT NULL AND gateway_transaction_id = $1)
       OR ($2::uuid IS NOT NULL AND reference_type = 'topup' AND reference_id = $2)
     )
   LIMIT 1`,
  [gateway_transaction_id || null, topup_request_id || null]
)
if (dupCheck.rowCount > 0) {
  await client.query('ROLLBACK')
  appLogger.info({ gateway_transaction_id, topup_request_id }, '[WalletProvisioning] já processado — idempotência')
  return
}
```
Teste: 2ª execução com mesmo `topup_request_id` e `gateway_transaction_id` ausente NÃO credita de novo.

CHECKPOINT: teste de A2 verde. Commit: `fix(wallet): idempotência incondicional no crédito de saldo`.

---

## TAREFA A3 — LGPD: expor anonimização + gravar IP de consentimento

PROBLEMA 1: `AnamnesisService.requestDelete` (`backend/src/services/anamnesis.service.js`)
existe mas não há rota/controller → direito ao esquecimento inacessível.
PROBLEMA 2: coluna `anamnesis_responses.consent_ip` existe mas `upsertResponse` nunca a grava.

Notas:
- `backend/src/controllers/barber/index.js` faz `...require('./anamnesis')` por último →
  novos exports do controller anamnesis viram `barberController.<nome>` automaticamente.
- `upsertResponse` atual NÃO recebe nem grava `consent_ip`.

FAZER:
1. Controller `backend/src/controllers/barber/anamnesis.js`: adicionar e exportar:
```js
const requestDelete = asyncHandler(async (req, res) => {
  const result = await anamnesisService.requestDelete(req.user.company_id, req.params.id)
  return success(res, result)
}, 'Erro ao anonimizar dados de anamnese')
// incluir requestDelete no module.exports
```
   E em `updateResponse`, passar o IP:
```js
const response = await anamnesisService.upsertResponse(
  req.user.company_id, req.params.id, { ...req.body, consent_ip: req.ip }
)
```
2. Rota em `backend/src/routes/barber.routes.js` (junto ao bloco anamnesis ~linha 180-186):
```js
router.delete('/customers/:id/anamnesis', requirePlanFeature('advanced_reports'), barberController.requestDelete);
```
3. Service `upsertResponse`: aceitar `consent_ip` no destructuring e gravá-lo no INSERT e no
   ON CONFLICT UPDATE apenas quando `consent_granted` true (caso contrário NULL). Manter a
   lógica atual de `consent_granted_at`.
4. Testes: rota delete chama `requestDelete`; upsert persiste `consent_ip` quando consent=true
   e mantém NULL quando false.

CHECKPOINT: teste de A3 verde. Commit: `feat(anamnesis): rota LGPD de anonimização + consent_ip`.

---

## FORA DE ESCOPO — apenas documentar em `docs/FASE_A_FINDINGS.md` (NÃO implementar)

- **RLS inerte**: a role `postgres` do app tem `rolbypassrls=true` e FORCE não está ativo →
  as policies `tenant_isolation` não protegem o caminho do app; o isolamento real é só
  `WHERE company_id` na aplicação. `companies` tem RLS on com 0 policies. Descreva opções
  (role dedicada + cobertura total de `withTenantContext` + FORCE) SEM aplicar.
- **XSS**: existem nomes de empresa com `<script>`/`<img onerror>` persistidos no banco.
  Aponte onde falta sanitização de input / escape de output. NÃO refatorar.

## CONDIÇÕES DE PARADA (pare e reporte, não improvise)
- Qualquer teste existente quebra após uma alteração.
- Uma tarefa exigiria mudar schema/migration ou tocar RLS para passar.
- Colisão de nome ao adicionar export no controller agregado.

## ENTREGA FINAL
- `npm test` verde; nenhum teste existente quebrado.
- 3 commits atômicos (A1, A2, A3) + `docs/FASE_A_FINDINGS.md`.
- Relatório em tabela (tarefa | arquivos | teste | status) e pergunta se pode dar push da branch.

## CRITÉRIOS DE ACEITE
- [ ] `wallet.topup.failed` registrado e marcando topup como 'failed' (idempotente).
- [ ] Crédito de saldo idempotente mesmo sem `gateway_transaction_id`.
- [ ] DELETE de anamnese funcional + `consent_ip` gravado no consentimento.
- [ ] `docs/FASE_A_FINDINGS.md` criado (RLS + XSS).
- [ ] Sem FORCE RLS, sem troca de role, sem frontend, sem push.
