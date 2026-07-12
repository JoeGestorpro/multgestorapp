const pool = require('../config/database')

const SALE_COLS = `
  id, company_id, collaborator_id, customer_id, customer_name, customer_phone,
  payment_method, subtotal, discount, total_amount, commission_amount,
  amount_received, change_amount, sale_date_local, client_name,
  appointment_id, status, notes, created_by, created_at, updated_at
`

const ITEM_COLS = `
  id, sale_id, item_type, item_id, company_id, collaborator_id,
  service_id, product_id, description, item_name_snapshot,
  commission_type_snapshot, commission_rate_snapshot,
  commission_type, commission_rate, payment_method, commission_effect,
  quantity, unit_price, total_price, commission_amount, shop_net_amount,
  created_at
`

const COLLAB_COLS = `
  id, nickname, commission_type, commission_rate, can_make_barter,
  is_active, is_deleted
`

class SaleRepository {
  constructor(db = pool) {
    this.db = db
  }

  async findCollaboratorByUserId(companyId, userId) {
    const result = await this.db.query(
      `SELECT ${COLLAB_COLS}
       FROM barber_collaborators
       WHERE company_id = $1 AND user_id = $2
         AND COALESCE(is_deleted, false) = false
       LIMIT 1`,
      [companyId, userId]
    )
    if (result.rowCount === 0) {
      return null
    }
    return result.rows[0]
  }

  async findCollaboratorById(companyId, collaboratorId) {
    const result = await this.db.query(
      `SELECT ${COLLAB_COLS}
       FROM barber_collaborators
       WHERE id = $1 AND company_id = $2
         AND is_active = true
         AND COALESCE(is_deleted, false) = false
       LIMIT 1`,
      [collaboratorId, companyId]
    )
    return result.rows[0] || null
  }

  async findServicesByIds(companyId, ids) {
    if (ids.length === 0) return []
    const result = await this.db.query(
      `SELECT id, name, description, price, service_type,
              commission_type, commission_value
       FROM barber_services
       WHERE company_id = $1
         AND id = ANY($2::uuid[])
         AND is_active = true
         AND COALESCE(is_deleted, false) = false`,
      [companyId, ids]
    )
    return result.rows
  }

  async findProductsByIds(companyId, ids) {
    if (ids.length === 0) return []
    const result = await this.db.query(
      `SELECT id, name, description, category, sale_price,
              commission_type, commission_value
       FROM barber_products
       WHERE company_id = $1
         AND id = ANY($2::uuid[])
         AND is_active = true
         AND COALESCE(is_deleted, false) = false`,
      [companyId, ids]
    )
    return result.rows
  }

  async findCustomerById(companyId, customerId) {
    const result = await this.db.query(
      `SELECT id FROM booking_customers
       WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [customerId, companyId]
    )
    return result.rows[0] || null
  }

  async findAppointmentById(companyId, appointmentId) {
    const result = await this.db.query(
      `SELECT id FROM barber_appointments
       WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [appointmentId, companyId]
    )
    return result.rows[0] || null
  }

  async insertSale(companyId, values) {
    if (!companyId) {
      throw new Error('companyId é obrigatório para criar venda')
    }
    const result = await this.db.query(
      `INSERT INTO barber_sales (
         company_id, collaborator_id, customer_id, customer_name,
         customer_phone, payment_method, subtotal, discount,
         total_amount, commission_amount, amount_received,
         change_amount, sale_date_local, client_name,
         appointment_id, status, notes, created_by, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active', $16, $17, NOW())
       RETURNING ${SALE_COLS}`,
      [
        companyId, values.collaboratorId, values.customerId,
        values.clientName, values.customerPhone, values.paymentMethod,
        values.subtotal, values.discount, values.totalAmount,
        values.totalCommission, values.amountReceived, values.changeAmount,
        values.saleDateLocal, values.clientName, values.appointmentId,
        values.notes, values.userId
      ]
    )
    return result.rows[0]
  }

  async insertSaleItem(companyId, values) {
    if (!companyId) {
      throw new Error('companyId é obrigatório para criar item de venda')
    }
    const result = await this.db.query(
      `INSERT INTO barber_sale_items (
         sale_id, item_type, item_id, company_id, collaborator_id,
         service_id, product_id, description, item_name_snapshot,
         commission_type_snapshot, commission_rate_snapshot,
         commission_type, commission_rate, payment_method,
         commission_effect, quantity, unit_price, total_price,
         commission_amount, shop_net_amount
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING ${ITEM_COLS}`,
      [
        values.saleId, values.itemType, values.itemId, companyId,
        values.collaboratorId, values.serviceId, values.productId,
        values.description, values.itemNameSnapshot,
        values.commissionTypeSnapshot, values.commissionRateSnapshot,
        values.paymentMethod, values.commissionEffect,
        values.quantity, values.unitPrice, values.totalPrice,
        values.commissionAmount, values.shopNetAmount
      ]
    )
    return result.rows[0]
  }
}

module.exports = SaleRepository
