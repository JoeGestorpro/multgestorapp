const pool = require('../config/database')
const { ValidationError } = require('../shared/core/errors')
const { createUnitOfWork } = require('../shared')

class LoyaltyService {
  async getProgram(companyId) {
    const result = await pool.query(
      `SELECT company_id, type, points_per_currency, min_redeem_points,
              points_per_real, points_expire_days, is_active, updated_at
       FROM loyalty_programs WHERE company_id = $1`,
      [companyId]
    )
    if (result.rowCount === 0) {
      return {
        company_id: companyId,
        type: 'points',
        is_active: false,
        points_per_real: 1,
        min_redeem_points: 10,
        points_expire_days: null,
        updated_at: null
      }
    }
    return result.rows[0]
  }

  async upsertProgram(companyId, data) {
    const { type, points_per_currency, min_redeem_points, points_per_real, points_expire_days, is_active } = data
    const result = await pool.query(
      `INSERT INTO loyalty_programs
         (company_id, type, points_per_currency, min_redeem_points, points_per_real, points_expire_days, is_active, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (company_id) DO UPDATE
         SET type = EXCLUDED.type,
             points_per_currency = EXCLUDED.points_per_currency,
             min_redeem_points = EXCLUDED.min_redeem_points,
             points_per_real = EXCLUDED.points_per_real,
             points_expire_days = EXCLUDED.points_expire_days,
             is_active = EXCLUDED.is_active,
             updated_at = NOW()
       RETURNING *`,
      [companyId, type || 'points', points_per_currency || 1, min_redeem_points || 10, points_per_real || 1, points_expire_days || null, is_active !== undefined ? is_active : false]
    )
    return result.rows[0]
  }

  async getCustomerLoyalty(companyId, customerId) {
    await pool.query(
      `INSERT INTO customer_loyalty (company_id, customer_id)
       VALUES ($1, $2) ON CONFLICT (company_id, customer_id) DO NOTHING`,
      [companyId, customerId]
    )
    const result = await pool.query(
      `SELECT cl.id, cl.company_id, cl.customer_id, cl.points_balance, cl.lifetime_points,
              cl.lifetime_redeemed, cl.points_expire_at, cl.created_at, cl.updated_at,
              COALESCE(lp.is_active, false) AS program_active,
              COALESCE(lp.min_redeem_points, 10) AS min_redeem_points
       FROM customer_loyalty cl
       LEFT JOIN loyalty_programs lp ON lp.company_id = cl.company_id
       WHERE cl.company_id = $1 AND cl.customer_id = $2`,
      [companyId, customerId]
    )
    return result.rows[0]
  }

  async earnPoints(companyId, customerId, { amount, referenceType, referenceId, createdBy } = {}) {
    if (!amount || amount <= 0) throw new ValidationError('Valor deve ser maior que zero')

    const program = await this.getProgram(companyId)
    if (!program.is_active) return { points_earned: 0, message: 'Programa de fidelidade inativo' }

    const points = Math.floor(Number(amount) * Number(program.points_per_real))

    const uow = createUnitOfWork()
    try {
      await uow.begin()

      await uow.client.query(
        `INSERT INTO customer_loyalty (company_id, customer_id) VALUES ($1, $2) ON CONFLICT (company_id, customer_id) DO NOTHING`,
        [companyId, customerId]
      )

      const loyalty = await uow.client.query(
        `SELECT id, points_balance FROM customer_loyalty WHERE company_id = $1 AND customer_id = $2 FOR UPDATE`,
        [companyId, customerId]
      )
      const bal = Number(loyalty.rows[0].points_balance)

      await uow.client.query(
        `UPDATE customer_loyalty
         SET points_balance = points_balance + $3, lifetime_points = lifetime_points + $3, updated_at = NOW()
         WHERE company_id = $1 AND customer_id = $2`,
        [companyId, customerId, points]
      )

      await uow.client.query(
        `INSERT INTO loyalty_transactions
           (company_id, customer_id, loyalty_id, type, points, balance_before, balance_after, reference_type, reference_id, created_by)
         VALUES ($1, $2, $3, 'earn', $4, $5, $6, $7, $8, $9)`,
        [companyId, customerId, loyalty.rows[0].id, points, bal, bal + points, referenceType || 'sale', referenceId || null, createdBy || null]
      )

      uow.addEvent('loyalty.points.earned', {
        company_id: companyId,
        customer_id: customerId,
        points,
        balance: bal + points,
        reference_type: referenceType || 'sale'
      }, { aggregateType: 'loyalty', aggregateId: loyalty.rows[0].id })

      await uow.commit()
      return { points_earned: points, balance: bal + points }
    } catch (err) {
      await uow.rollback()
      throw err
    }
  }

  async redeemPoints(companyId, customerId, points, { description, createdBy } = {}) {
    const uow = createUnitOfWork()
    try {
      await uow.begin()

      const program = await this.getProgram(companyId)
      if (points < program.min_redeem_points) {
        throw new ValidationError(`Mínimo para resgate é ${program.min_redeem_points} pontos`)
      }

      const loyalty = await uow.client.query(
        `SELECT id, points_balance FROM customer_loyalty WHERE company_id = $1 AND customer_id = $2 FOR UPDATE`,
        [companyId, customerId]
      )
      if (loyalty.rowCount === 0) throw new ValidationError('Cliente não possui programa de fidelidade')

      const bal = Number(loyalty.rows[0].points_balance)
      if (bal < points) throw new ValidationError(`Pontos insuficientes. Saldo: ${bal}, solicitado: ${points}`)

      await uow.client.query(
        `UPDATE customer_loyalty
         SET points_balance = points_balance - $3, lifetime_redeemed = lifetime_redeemed + $3, updated_at = NOW()
         WHERE company_id = $1 AND customer_id = $2`,
        [companyId, customerId, points]
      )

      await uow.client.query(
        `INSERT INTO loyalty_transactions
           (company_id, customer_id, loyalty_id, type, points, balance_before, balance_after, description, created_by)
         VALUES ($1, $2, $3, 'redeem', $4, $5, $6, $7, $8)`,
        [companyId, customerId, loyalty.rows[0].id, points, bal, bal - points, description || null, createdBy || null]
      )

      uow.addEvent('loyalty.points.redeemed', {
        company_id: companyId,
        customer_id: customerId,
        points,
        balance: bal - points
      }, { aggregateType: 'loyalty', aggregateId: loyalty.rows[0].id })

      await uow.commit()
      return { points_redeemed: points, balance: bal - points }
    } catch (err) {
      await uow.rollback()
      throw err
    }
  }

  async listTransactions(companyId, customerId) {
    const result = await pool.query(
      `SELECT id, type, points, balance_before, balance_after, reference_type, reference_id, description, created_at
       FROM loyalty_transactions
       WHERE company_id = $1 AND customer_id = $2
       ORDER BY created_at DESC
       LIMIT 50`,
      [companyId, customerId]
    )
    return result.rows
  }
}

module.exports = LoyaltyService
