const pool = require('../../config/database')
const { appLogger } = require('../../shared/core/logger')

async function handleWalletTopup(eventPayload, context) {
  const {
    company_id,
    amount,
    gateway,
    gateway_transaction_id,
    topup_request_id,
    payment_gateway_event_id
  } = eventPayload

  if (!company_id || !amount) {
    appLogger.warn({ eventPayload }, '[WalletProvisioning] payload incompleto — ignorando')
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // idempotência incondicional: verificar se já foi creditado (por gateway_transaction_id OU topup_request_id)
    const conditions = []
    const params = []
    let idx = 1
    if (gateway_transaction_id) {
      conditions.push(`gateway_transaction_id = $${idx++}`)
      params.push(gateway_transaction_id)
    }
    if (topup_request_id) {
      conditions.push(`(reference_type = 'topup' AND reference_id = $${idx++})`)
      params.push(topup_request_id)
    }
    if (conditions.length > 0) {
      const existing = await client.query(
        `SELECT id FROM wallet_transactions
         WHERE type = 'credit' AND (${conditions.join(' OR ')})
         LIMIT 1`,
        params
      )
      if (existing.rowCount > 0) {
        await client.query('ROLLBACK')
        appLogger.info({ gateway_transaction_id, topup_request_id }, '[WalletProvisioning] já processado — idempotência')
        return
      }
    }

    // garantir que a wallet existe
    await client.query(
      `INSERT INTO company_wallets (company_id) VALUES ($1) ON CONFLICT (company_id) DO NOTHING`,
      [company_id]
    )

    // FOR UPDATE para evitar race condition
    const walletResult = await client.query(
      `SELECT id, balance FROM company_wallets WHERE company_id = $1 FOR UPDATE`,
      [company_id]
    )
    const wallet = walletResult.rows[0]
    const balanceBefore = Number(wallet.balance)
    const balanceAfter = balanceBefore + Number(amount)

    await client.query(
      `UPDATE company_wallets SET balance = $2, updated_at = NOW() WHERE id = $1`,
      [wallet.id, balanceAfter]
    )

    await client.query(
      `INSERT INTO wallet_transactions
         (company_id, wallet_id, type, amount, balance_before, balance_after,
          reference_type, reference_id, gateway, gateway_transaction_id, description)
       VALUES ($1, $2, 'credit', $3, $4, $5, 'topup', $6, $7, $8, 'Recarga aprovada')`,
      [
        company_id, wallet.id, amount, balanceBefore, balanceAfter,
        topup_request_id || null, gateway || null, gateway_transaction_id || null
      ]
    )

    // atualizar topup_request para completed
    if (topup_request_id) {
      await client.query(
        `UPDATE topup_requests
         SET status = 'completed', completed_at = NOW()
         WHERE id = $1 AND status = 'pending'`,
        [topup_request_id]
      )
    }

    // marcar payment_gateway_event como processado (se veio do billing manager)
    if (payment_gateway_event_id) {
      await client.query(
        `UPDATE payment_gateway_events
         SET processing_status = 'processed', company_id = $2, processed_at = NOW()
         WHERE id = $1`,
        [payment_gateway_event_id, company_id]
      )
    }

    await client.query('COMMIT')
    appLogger.info({ company_id, amount, balance_after: balanceAfter }, '[WalletProvisioning] wallet creditada')
  } catch (err) {
    await client.query('ROLLBACK')
    appLogger.error({ err, company_id, amount }, '[WalletProvisioning] falha ao creditar wallet')
    throw err
  } finally {
    client.release()
  }
}

async function handleWalletTopupFailed(eventPayload, context) {
  const {
    company_id,
    topup_request_id,
    payment_gateway_event_id,
    failure_reason
  } = eventPayload

  if (!topup_request_id && !payment_gateway_event_id) {
    appLogger.warn({ eventPayload }, '[WalletProvisioning] wallet.topup.failed sem topup_request_id nem payment_gateway_event_id — ignorando')
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (topup_request_id) {
      await client.query(
        `UPDATE topup_requests
         SET status = 'failed', failed_at = NOW(), failure_reason = $2
         WHERE id = $1 AND status = 'pending'`,
        [topup_request_id, failure_reason || null]
      )
    }

    if (payment_gateway_event_id) {
      await client.query(
        `UPDATE payment_gateway_events
         SET processing_status = 'processed', company_id = COALESCE($2, company_id), processed_at = NOW()
         WHERE id = $1`,
        [payment_gateway_event_id, company_id || null]
      )
    }

    await client.query('COMMIT')
    appLogger.info({ company_id, topup_request_id, failure_reason }, '[WalletProvisioning] topup marcado como failed')
  } catch (err) {
    await client.query('ROLLBACK')
    appLogger.error({ err, company_id, topup_request_id }, '[WalletProvisioning] falha ao marcar topup como failed')
    throw err
  } finally {
    client.release()
  }
}

module.exports = { handleWalletTopup, handleWalletTopupFailed }
