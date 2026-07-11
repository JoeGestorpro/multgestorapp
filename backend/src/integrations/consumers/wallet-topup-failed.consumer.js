const pool = require('../../config/database')
const { appLogger } = require('../../shared/core/logger')

async function handleWalletTopupFailed(eventPayload, context) {
  const { company_id, topup_request_id, gateway_transaction_id } = eventPayload

  if (!topup_request_id) {
    appLogger.warn({ gateway_transaction_id }, '[WalletTopupFailed] sem topup_request_id — não é possível marcar falha')
    return
  }

  const result = await pool.query(
    `UPDATE topup_requests
     SET status = 'failed', completed_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING id`,
    [topup_request_id]
  )

  if (result.rowCount > 0) {
    appLogger.info({ topup_request_id, company_id }, '[WalletTopupFailed] topup marcado como failed')
  } else {
    appLogger.warn({ topup_request_id }, '[WalletTopupFailed] topup_request não encontrado ou já processado')
  }
}

module.exports = { handleWalletTopupFailed }
