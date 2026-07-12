const pool = require('../config/database')
const { appLogger } = require('../shared/core/logger')
const { ValidationError } = require('../shared/core/errors')
const { createUnitOfWork } = require('../shared')

class PackageService {
  async listPackages(companyId) {
    const result = await pool.query(
      `SELECT id, company_id, name, description, total_credits, price,
              validity_days, applicable_service_ids, is_active, created_at, updated_at
       FROM service_packages
       WHERE company_id = $1
         AND is_deleted = false
       ORDER BY created_at DESC`,
      [companyId]
    )
    return result.rows
  }

  async createPackage(companyId, data) {
    const { name, description, total_credits, price, validity_days, applicable_service_ids } = data
    if (!name || !String(name).trim()) throw new ValidationError('Nome do pacote é obrigatório')
    if (!total_credits || total_credits < 1) throw new ValidationError('total_credits deve ser > 0')

    const result = await pool.query(
      `INSERT INTO service_packages
         (company_id, name, description, total_credits, price, validity_days, applicable_service_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [companyId, name.trim(), description || null, total_credits, price || 0, validity_days || null, applicable_service_ids || []]
    )
    return result.rows[0]
  }

  async updatePackage(companyId, id, data) {
    const existing = await pool.query(
      `SELECT id FROM service_packages WHERE id = $1 AND company_id = $2 AND is_deleted = false`,
      [id, companyId]
    )
    if (existing.rowCount === 0) throw new ValidationError('Pacote não encontrado')

    const { name, description, total_credits, price, validity_days, applicable_service_ids, is_active } = data
    const result = await pool.query(
      `UPDATE service_packages
        SET name = COALESCE($3, name),
            description = COALESCE($4, description),
            total_credits = COALESCE($5, total_credits),
            price = COALESCE($6, price),
            validity_days = COALESCE($7, validity_days),
            applicable_service_ids = COALESCE($8, applicable_service_ids),
            is_active = COALESCE($9, is_active),
            updated_at = NOW()
        WHERE id = $1 AND company_id = $2
        RETURNING *`,
      [id, companyId, name, description, total_credits, price, validity_days, applicable_service_ids, is_active]
    )
    return result.rows[0]
  }

  async deletePackage(companyId, id) {
    const result = await pool.query(
      `UPDATE service_packages SET is_deleted = true, updated_at = NOW()
       WHERE id = $1 AND company_id = $2
       RETURNING id`,
      [id, companyId]
    )
    if (result.rowCount === 0) throw new ValidationError('Pacote não encontrado')
  }

  async purchasePackage(companyId, customerId, packageId, options = {}) {
    const pkg = await pool.query(
      `SELECT id, total_credits, price, validity_days FROM service_packages
       WHERE id = $1 AND company_id = $2 AND is_active = true AND is_deleted = false`,
      [packageId, companyId]
    )
    if (pkg.rowCount === 0) throw new ValidationError('Pacote não encontrado ou inativo')

    const p = pkg.rows[0]
    let expiresAt = null
    if (p.validity_days) {
      expiresAt = new Date(Date.now() + p.validity_days * 86400000).toISOString()
    }

    const uow = createUnitOfWork()
    try {
      await uow.begin()

      const result = await uow.client.query(
        `INSERT INTO customer_packages
           (company_id, package_id, customer_id, credits_remaining, purchase_amount, payment_method, gateway_transaction_id, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [companyId, p.id, customerId, p.total_credits, p.price, options.paymentMethod || null, options.gatewayTransactionId || null, expiresAt]
      )

      uow.addEvent('package.purchased', {
        company_id: companyId,
        customer_id: customerId,
        package_id: p.id,
        customer_package_id: result.rows[0].id,
        amount: p.price,
        credits: p.total_credits
      }, { aggregateType: 'package', aggregateId: result.rows[0].id })

      await uow.commit()
      return result.rows[0]
    } catch (err) {
      await uow.rollback()
      throw err
    }
  }

  async getCustomerPackages(companyId, customerId) {
    const result = await pool.query(
      `SELECT cp.id, cp.package_id, sp.name AS package_name, sp.description,
              cp.credits_remaining, cp.credits_used, cp.status, cp.purchased_at, cp.expires_at
       FROM customer_packages cp
       JOIN service_packages sp ON sp.id = cp.package_id
       WHERE cp.company_id = $1 AND cp.customer_id = $2
       ORDER BY cp.created_at DESC`,
      [companyId, customerId]
    )
    return result.rows
  }

  async redeemCredit(companyId, customerId, serviceId, options = {}) {
    const uow = createUnitOfWork()
    try {
      await uow.begin()

      const activePkg = await uow.client.query(
        `SELECT id, package_id, credits_remaining
         FROM customer_packages
         WHERE company_id = $1 AND customer_id = $2 AND status = 'active'
           AND credits_remaining > 0
           AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY created_at ASC
         LIMIT 1
         FOR UPDATE`,
        [companyId, customerId]
      )
      if (activePkg.rowCount === 0) {
        throw new ValidationError('Cliente não possui pacote com créditos disponíveis')
      }

      const pkg = activePkg.rows[0]
      const creditsAfter = pkg.credits_remaining - 1

      await uow.client.query(
        `UPDATE customer_packages
         SET credits_remaining = credits_remaining - 1,
             credits_used = credits_used + 1,
             status = CASE WHEN credits_remaining - 1 = 0 THEN 'exhausted' ELSE status END,
             exhausted_at = CASE WHEN credits_remaining - 1 = 0 THEN NOW() ELSE exhausted_at END,
             updated_at = NOW()
         WHERE id = $1`,
        [pkg.id]
      )

      await uow.client.query(
        `INSERT INTO package_redemptions
           (company_id, customer_package_id, appointment_id, sale_id, service_id, redeemed_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [companyId, pkg.id, options.appointmentId || null, options.saleId || null, serviceId, options.redeemedBy || null]
      )

      uow.addEvent('package.credit.redeemed', {
        company_id: companyId,
        customer_id: customerId,
        customer_package_id: pkg.id,
        service_id: serviceId,
        credits_remaining: creditsAfter
      }, { aggregateType: 'package', aggregateId: pkg.id })

      await uow.commit()
      return { package_id: pkg.package_id, credits_remaining: creditsAfter }
    } catch (err) {
      await uow.rollback()
      throw err
    }
  }
}

module.exports = PackageService
