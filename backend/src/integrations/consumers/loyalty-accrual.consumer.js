const pool = require('../../config/database')
const { appLogger } = require('../../shared/core/logger')

async function handleSaleLoyaltyAccrual(eventPayload, context) {
  const { company_id, customer_id, id: sale_id, total_amount } = eventPayload

  if (!customer_id) {
    appLogger.debug({ sale_id }, '[LoyaltyAccrual] sem customer_id — ignorando')
    return
  }

  const existing = await pool.query(
    `SELECT id FROM loyalty_transactions
     WHERE reference_type = 'sale' AND reference_id = $1
     LIMIT 1`,
    [sale_id]
  )
  if (existing.rowCount > 0) {
    appLogger.info({ sale_id }, '[LoyaltyAccrual] já processado — idempotência')
    return
  }

  const LoyaltyService = require('../../services/loyalty.service')
  const loyaltyService = new LoyaltyService()

  const result = await loyaltyService.earnPoints(company_id, customer_id, {
    amount: total_amount,
    referenceType: 'sale',
    referenceId: sale_id,
    createdBy: context?.traceId || 'outbox-worker'
  })

  appLogger.info({ sale_id, points_earned: result.points_earned, balance: result.balance }, '[LoyaltyAccrual] pontos acumulados')
}

module.exports = { handleSaleLoyaltyAccrual }
