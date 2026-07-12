const pool = require('../config/database')
const { appLogger } = require('../shared/core/logger')
const { AppError, NotFoundError, ValidationError } = require('../shared/core/errors')

class WalletService {
  async getOrCreateWallet(companyId) {
    await pool.query(
      `INSERT INTO company_wallets (company_id) VALUES ($1) ON CONFLICT (company_id) DO NOTHING`,
      [companyId]
    )
    const result = await pool.query(
      `SELECT id, company_id, balance, currency, updated_at FROM company_wallets WHERE company_id = $1`,
      [companyId]
    )
    return result.rows[0]
  }

  async getBalance(companyId) {
    const wallet = await this.getOrCreateWallet(companyId)
    return {
      balance: Number(wallet.balance),
      currency: wallet.currency,
      updated_at: wallet.updated_at
    }
  }

  async getTransactions(companyId, { page = 1, limit = 20 } = {}) {
    const safeLimit = Math.min(Math.max(1, Number(limit)), 100)
    const safePage = Math.max(1, Number(page))
    const offset = (safePage - 1) * safeLimit

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM wallet_transactions WHERE company_id = $1`,
      [companyId]
    )
    const total = countResult.rows[0].total

    const result = await pool.query(
      `SELECT id, type, amount, balance_before, balance_after, reference_type,
              reference_id, description, status, created_at
       FROM wallet_transactions
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [companyId, safeLimit, offset]
    )

    return {
      data: result.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    }
  }

  async credit(companyId, { amount, referenceType, referenceId, description, gateway, gatewayTransactionId } = {}) {
    if (!amount || Number(amount) <= 0) {
      throw new ValidationError('Valor do crédito deve ser maior que zero')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      await client.query(
        `INSERT INTO company_wallets (company_id) VALUES ($1) ON CONFLICT (company_id) DO NOTHING`,
        [companyId]
      )

      const walletResult = await client.query(
        `SELECT id, balance FROM company_wallets WHERE company_id = $1 FOR UPDATE`,
        [companyId]
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
         VALUES ($1, $2, 'credit', $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          companyId, wallet.id, amount, balanceBefore, balanceAfter,
          referenceType || 'topup', referenceId || null,
          gateway || null, gatewayTransactionId || null,
          description || 'Crédito adicionado'
        ]
      )

      await client.query('COMMIT')
      return { balance_before: balanceBefore, balance_after: balanceAfter, amount: Number(amount) }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async debit(companyId, { amount, referenceType, referenceId, description } = {}) {
    if (!amount || Number(amount) <= 0) {
      throw new ValidationError('Valor do débito deve ser maior que zero')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const walletResult = await client.query(
        `SELECT id, balance FROM company_wallets WHERE company_id = $1 FOR UPDATE`,
        [companyId]
      )

      if (walletResult.rowCount === 0) {
        throw new AppError('Carteira não encontrada', 404, 'WALLET_NOT_FOUND')
      }

      const wallet = walletResult.rows[0]
      const balanceBefore = Number(wallet.balance)

      if (balanceBefore < Number(amount)) {
        throw new AppError('Saldo insuficiente', 402, 'INSUFFICIENT_BALANCE')
      }

      const balanceAfter = balanceBefore - Number(amount)

      await client.query(
        `UPDATE company_wallets SET balance = $2, updated_at = NOW() WHERE id = $1`,
        [wallet.id, balanceAfter]
      )

      await client.query(
        `INSERT INTO wallet_transactions
           (company_id, wallet_id, type, amount, balance_before, balance_after,
            reference_type, reference_id, description)
         VALUES ($1, $2, 'debit', $3, $4, $5, $6, $7, $8)`,
        [
          companyId, wallet.id, amount, balanceBefore, balanceAfter,
          referenceType || 'appointment', referenceId || null,
          description || 'Débito'
        ]
      )

      await client.query('COMMIT')
      return { balance_before: balanceBefore, balance_after: balanceAfter, amount: Number(amount) }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async createTopupRequest(companyId, { amount, purpose = 'deposit', customerId, referenceType, referenceId }) {
    if (!amount || Number(amount) <= 0) {
      throw new ValidationError('Valor deve ser maior que zero')
    }

    const result = await pool.query(
      `INSERT INTO topup_requests
         (company_id, customer_id, amount, purpose, reference_type, reference_id, gateway)
       VALUES ($1, $2, $3, $4, $5, $6, 'abacatepay')
       RETURNING id, amount, status, expires_at, created_at`,
      [companyId, customerId || null, amount, purpose, referenceType || null, referenceId || null]
    )

    const request = result.rows[0]
    let checkoutUrl = null

    const apiToken = process.env.ABACATEPAY_API_TOKEN
    if (apiToken) {
      try {
        const https = require('https')
        const body = JSON.stringify({
          amount: Math.round(Number(amount) * 100), // centavos
          expiresIn: 30,
          description: `Recarga MultGestor - ${purpose}`,
          methods: ['PIX'],
          customer: customerId ? { id: String(customerId) } : undefined,
          metadata: {
            topup_request_id: request.id,
            company_id: companyId,
            purpose
          }
        })

        checkoutUrl = await new Promise((resolve, reject) => {
          const req = https.request({
            hostname: 'api.abacatepay.com',
            path: '/v1/billing/create',
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body)
            }
          }, (res) => {
            let data = ''
            res.on('data', chunk => { data += chunk })
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data)
                resolve(parsed?.data?.url || parsed?.url || null)
              } catch {
                resolve(null)
              }
            })
          })
          req.on('error', reject)
          req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')) })
          req.write(body)
          req.end()
        })

        if (checkoutUrl) {
          await pool.query(
            `UPDATE topup_requests SET gateway_checkout_url = $2 WHERE id = $1`,
            [request.id, checkoutUrl]
          )
        }
      } catch (err) {
        appLogger.warn({ err: err.message, topup_id: request.id }, '[Wallet] AbacatePay checkout falhou — retornando sem URL')
      }
    } else {
      appLogger.warn({ topup_id: request.id }, '[Wallet] ABACATEPAY_API_TOKEN nao configurado — checkout_url sera null')
    }

    appLogger.info({ company_id: companyId, topup_id: request.id, amount }, '[Wallet] TopupRequest criado')

    return {
      id: request.id,
      amount: Number(request.amount),
      status: request.status,
      expires_at: request.expires_at,
      checkout_url: checkoutUrl
    }
  }

  async getDepositConfig(companyId) {
    const result = await pool.query(
      `SELECT * FROM deposit_configs WHERE company_id = $1`,
      [companyId]
    )

    if (result.rowCount === 0) {
      return {
        company_id: companyId,
        deposit_enabled: false,
        deposit_type: 'percentage',
        deposit_value: 0,
        cancel_fee_enabled: false,
        cancel_fee_percentage: 0,
        cancel_fee_window_hours: 6,
        auto_confirm_deposit: true
      }
    }

    return result.rows[0]
  }

  async upsertDepositConfig(companyId, data) {
    const {
      deposit_enabled = false,
      deposit_type = 'percentage',
      deposit_value = 0,
      cancel_fee_enabled = false,
      cancel_fee_percentage = 0,
      cancel_fee_window_hours = 6,
      auto_confirm_deposit = true
    } = data

    const result = await pool.query(
      `INSERT INTO deposit_configs
         (company_id, deposit_enabled, deposit_type, deposit_value,
          cancel_fee_enabled, cancel_fee_percentage, cancel_fee_window_hours,
          auto_confirm_deposit, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (company_id) DO UPDATE
         SET deposit_enabled = EXCLUDED.deposit_enabled,
             deposit_type = EXCLUDED.deposit_type,
             deposit_value = EXCLUDED.deposit_value,
             cancel_fee_enabled = EXCLUDED.cancel_fee_enabled,
             cancel_fee_percentage = EXCLUDED.cancel_fee_percentage,
             cancel_fee_window_hours = EXCLUDED.cancel_fee_window_hours,
             auto_confirm_deposit = EXCLUDED.auto_confirm_deposit,
             updated_at = NOW()
       RETURNING *`,
      [companyId, deposit_enabled, deposit_type, deposit_value,
       cancel_fee_enabled, cancel_fee_percentage, cancel_fee_window_hours,
       auto_confirm_deposit]
    )

    return result.rows[0]
  }
}

module.exports = WalletService
