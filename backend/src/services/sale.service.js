const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const pool = require('../config/database')
const { createUnitOfWork, AppError } = require('../shared')
const { appLogger } = require('../shared/core/logger')
const SaleRepository = require('../repositories/sale.repository')
const CashSessionRepository = require('../repositories/cash-session.repository')
const CollaboratorRepository = require('../repositories/collaborator.repository')
const {
  createError,
  toNumber,
  ensureCompany,
  ensureAdmin,
  isSaleActiveSql,
  normalizePaymentMethod,
  isBarterPayment,
  getBusinessDateParts,
  getBusinessDateString,
  normalizeDateInput,
  getMonthRange,
  getWeekRange,
  buildBusinessTimestampRange,
  buildReportPeriod,
  normalizeCashDateFromSale
} = require('../utils/barber-helpers')

const BUSINESS_TIMEZONE = 'America/Cuiaba'

const PAYMENT_METHODS = ['dinheiro', 'pix', 'credito', 'debito', 'permuta']

const COMMISSION_TYPES = ['percentage', 'fixed']

function getSaleItemType(item = {}) {
  return String(
    item.item_type || item.itemType ||
    (item.product_id || item.productId ? 'product' : 'service')
  ).trim().toLowerCase()
}

function getSaleItemId(item = {}, itemType = getSaleItemType(item)) {
  if (itemType === 'product') {
    return item.product_id || item.productId || item.item_id || item.itemId || null
  }
  return item.service_id || item.serviceId || item.item_id || item.itemId || null
}

function calculateCommission(item, service, collaborator) {
  if (!service) return 0

  const collaboratorCommissionType = collaborator?.commission_type || collaborator?.commissionType
  const collaboratorCommissionRate = toNumber(collaborator?.commission_rate ?? collaborator?.commissionRate)

  if (item?.item_type === 'service' && COMMISSION_TYPES.includes(collaboratorCommissionType)) {
    if (collaboratorCommissionType === 'fixed') {
      return collaboratorCommissionRate * toNumber(item.quantity)
    }
    return toNumber(item.total_price) * (collaboratorCommissionRate / 100)
  }

  if (service.commission_enabled === false) return 0

  if (service.commission_type === 'fixed') {
    return toNumber(service.commission_value) * toNumber(item.quantity)
  }

  return toNumber(item.total_price) * (toNumber(service.commission_value) / 100)
}

class SaleService {
  async createSale(companyId, user, data = {}, meta = {}) {
    ensureCompany(companyId)

    const userCollaborator = user?.role === 'collaborator'
      ? null
      : null

    let userCollaboratorRecord = null
    if (user?.role === 'collaborator') {
      if (!user.can_launch_sales) {
        throw new AppError('Seu acesso ao lancamento de vendas esta desativado', 403, 'FORBIDDEN')
      }
    }

    const paymentMethod = normalizePaymentMethod(data.payment_method || data.paymentMethod)
    const clientName = String(data.client_name || data.clientName || data.customer_name || data.customerName || '').trim() || null
    const customerPhone = String(data.customer_phone || data.customerPhone || '').trim() || null
    const customerId = data.customer_id || data.customerId || null
    const appointmentId = data.appointment_id || data.appointmentId || null
    const requestedChangeAmount = toNumber(data.change_amount || data.changeAmount)
    const amountReceived = toNumber(data.amount_received || data.amountReceived)
    const saleDateLocal = normalizeDateInput(data.sale_date_local || data.saleDateLocal, getBusinessDateParts())
    const notes = String(data.notes || '').trim() || null
    const discount = Math.max(0, toNumber(data.discount))
    const items = Array.isArray(data.items) ? data.items : []
    const collaboratorId = userCollaboratorRecord?.id || data.collaborator_id || data.collaboratorId || null

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      throw new AppError('Forma de pagamento invalida', 400, 'VALIDATION_ERROR')
    }

    if (!collaboratorId) {
      throw new AppError('Colaborador e obrigatorio', 400, 'VALIDATION_ERROR')
    }

    if (items.length === 0) {
      throw new AppError('Informe ao menos um item na venda', 400, 'VALIDATION_ERROR')
    }

    const uow = createUnitOfWork()
    try {
      await uow.begin()

      const repo = uow.repository(SaleRepository)
      const csRepo = uow.repository(CashSessionRepository)

      const cashSession = await csRepo.findByCompanyAndDate(companyId, saleDateLocal)
      if (cashSession?.status === 'closed') {
        throw new AppError('Este caixa ja foi fechado e nao pode ser alterado', 409, 'CONFLICT')
      }

      const collaboratorRecord = await repo.findCollaboratorById(companyId, collaboratorId)
      if (!collaboratorRecord) {
        throw new AppError('Colaborador nao encontrado', 404, 'NOT_FOUND')
      }

      if (isBarterPayment(paymentMethod) && !collaboratorRecord.can_make_barter) {
        throw new AppError('Este colaborador nao esta autorizado a lancar permuta.', 403, 'FORBIDDEN')
      }

      if (customerId) {
        const customer = await repo.findCustomerById(companyId, customerId)
        if (!customer) {
          throw new AppError('Cliente nao encontrado para esta empresa', 404, 'NOT_FOUND')
        }
      }

      if (appointmentId) {
        const appointment = await repo.findAppointmentById(companyId, appointmentId)
        if (!appointment) {
          throw new AppError('Agendamento nao encontrado para esta empresa', 404, 'NOT_FOUND')
        }
      }

      const normalizedItems = items.map((item) => {
        const itemType = getSaleItemType(item)
        const itemId = getSaleItemId(item, itemType)

        if (!['service', 'product'].includes(itemType)) {
          throw new AppError('Tipo de item invalido', 400, 'VALIDATION_ERROR')
        }

        if (!itemId) {
          throw new AppError(
            itemType === 'product' ? 'Produto e obrigatorio' : 'Servico e obrigatorio',
            400, 'VALIDATION_ERROR'
          )
        }

        return { ...item, itemType, itemId }
      })

      const serviceIds = normalizedItems
        .filter((item) => item.itemType === 'service')
        .map((item) => item.itemId)
      const productIds = normalizedItems
        .filter((item) => item.itemType === 'product')
        .map((item) => item.itemId)

      const serviceRows = serviceIds.length > 0
        ? await repo.findServicesByIds(companyId, serviceIds)
        : []
      const productRows = productIds.length > 0
        ? await repo.findProductsByIds(companyId, productIds)
        : []

      const serviceMap = new Map(serviceRows.map((s) => [s.id, s]))
      const productMap = new Map(productRows.map((p) => [p.id, p]))

      const preparedItems = normalizedItems.map((item) => {
        const itemType = item.itemType
        const itemId = item.itemId
        const service = itemType === 'service' ? serviceMap.get(itemId) : null
        const product = itemType === 'product' ? productMap.get(itemId) : null
        const sourceItem = service || product
        const description = String(item.description || sourceItem?.name || '').trim()
        const quantity = toNumber(item.quantity || 1)
        const unitPrice = toNumber(service?.price ?? product?.sale_price)

        if (!description) {
          throw new AppError('Descricao do item e obrigatoria', 400, 'VALIDATION_ERROR')
        }

        if (quantity <= 0 || unitPrice < 0) {
          throw new AppError('Quantidade ou valor invalido', 400, 'VALIDATION_ERROR')
        }

        if (itemType === 'service' && itemId && !service) {
          throw new AppError('Servico nao encontrado para esta empresa', 404, 'NOT_FOUND')
        }

        if (itemType === 'product' && itemId && !product) {
          throw new AppError('Produto nao encontrado para esta empresa', 404, 'NOT_FOUND')
        }

        const totalPrice = quantity * unitPrice

        const preparedItem = {
          item_type: itemType,
          item_id: itemId,
          service_id: itemType === 'service' ? itemId : null,
          product_id: itemType === 'product' ? itemId : null,
          description,
          item_name_snapshot: description,
          commission_type_snapshot: sourceItem?.commission_type || 'fixed',
          commission_rate_snapshot: toNumber(sourceItem?.commission_value),
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice
        }

        preparedItem.commission_amount = calculateCommission(preparedItem, sourceItem, collaboratorRecord)
        preparedItem.shop_net_amount = Math.max(0, totalPrice - preparedItem.commission_amount)

        return preparedItem
      })

      const subtotal = preparedItems.reduce((sum, item) => sum + item.total_price, 0)
      const totalAmount = Math.max(0, subtotal - discount)
      const totalCommission = preparedItems.reduce((sum, item) => sum + item.commission_amount, 0)
      let changeAmount = requestedChangeAmount

      if (paymentMethod === 'dinheiro') {
        if (amountReceived < totalAmount) {
          throw new AppError('Valor recebido menor que o valor do servico', 400, 'VALIDATION_ERROR')
        }
        changeAmount = Math.max(0, amountReceived - totalAmount)
      } else {
        changeAmount = 0
      }

      const amountReceivedFinal = paymentMethod === 'dinheiro'
        ? amountReceived
        : (isBarterPayment(paymentMethod) ? 0 : totalAmount)

      const sale = await repo.insertSale({
        companyId,
        collaboratorId,
        customerId,
        clientName,
        customerPhone,
        paymentMethod,
        subtotal,
        discount,
        totalAmount,
        totalCommission,
        amountReceived: amountReceivedFinal,
        changeAmount,
        saleDateLocal,
        appointmentId,
        notes,
        userId: user.id
      })

      const savedItems = []
      for (const item of preparedItems) {
        const savedItem = await repo.insertSaleItem({
          saleId: sale.id,
          itemType: item.item_type,
          itemId: item.item_id,
          companyId,
          collaboratorId,
          serviceId: item.service_id,
          productId: item.product_id,
          description: item.description,
          itemNameSnapshot: item.item_name_snapshot,
          commissionTypeSnapshot: item.commission_type_snapshot,
          commissionRateSnapshot: item.commission_rate_snapshot,
          paymentMethod,
          commissionEffect: isBarterPayment(paymentMethod) ? 'debit' : 'credit',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          commissionAmount: item.commission_amount,
          shopNetAmount: item.shop_net_amount
        })
        savedItems.push(savedItem)
      }

      await csRepo.ensureExists(companyId, saleDateLocal, user.id, 0, null)
      await csRepo.recalculate(companyId, saleDateLocal)

      uow.addEvent('sale.created', {
        sale_id: sale.id,
        company_id: companyId,
        collaborator_id: collaboratorId,
        customer_id: customerId,
        payment_method: paymentMethod,
        subtotal,
        discount,
        total_amount: totalAmount,
        commission_amount: totalCommission,
        amount_received: amountReceivedFinal,
        change_amount: changeAmount,
        sale_date_local: saleDateLocal,
        items: preparedItems.map((i) => ({
          item_type: i.item_type,
          item_id: i.item_id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price,
          commission_amount: i.commission_amount
        }))
      }, {
        traceId: meta?.traceId || crypto.randomUUID(),
        companyId,
        aggregateType: 'sale',
        aggregateId: sale.id
      })

      await uow.commit()

      return { ...sale, items: savedItems }
    } catch (err) {
      await uow.rollback()
      throw err
    }
  }

  // --- listSales ---
  async listSales(companyId, user, query = {}) {
    ensureCompany(companyId);

    const collaboratorRepo = new CollaboratorRepository();
    const userCollaborator = user?.role === 'collaborator'
      ? await collaboratorRepo.findByUserId(companyId, user.id)
      : null;
    if (user?.role === 'collaborator' && !userCollaborator) {
      throw createError('Colaborador nao vinculado ao usuario', 403);
    }

    const requestedCollaboratorId = query.collaborator_id || query.collaboratorId || null;
    const collaboratorId = userCollaborator?.id || requestedCollaboratorId || null;
    const { start, end } = buildReportPeriod(query.period, query.startDate || query.start_date, query.endDate || query.end_date);
    const values = [companyId, start, end, collaboratorId];
    const filters = [
      'barber_sales.company_id = $1',
      'barber_sales.sale_date_local BETWEEN $2::date AND $3::date',
      '($4::uuid IS NULL OR barber_sales.collaborator_id = $4::uuid)',
      isSaleActiveSql('barber_sales')
    ];

    const result = await pool.query(
      `SELECT
         barber_sales.id,
         barber_sales.company_id,
         barber_sales.collaborator_id,
         barber_collaborators.nickname AS collaborator_name,
         barber_sales.payment_method,
         barber_sales.subtotal,
         barber_sales.discount,
         barber_sales.total_amount,
         barber_sales.commission_amount,
         barber_sales.amount_received,
         barber_sales.change_amount,
         COALESCE(barber_sales.customer_name, barber_sales.client_name) AS customer_name,
         barber_sales.customer_phone,
         barber_sales.client_name,
         barber_sales.status,
         barber_sales.canceled_at,
         barber_sales.canceled_reason,
         barber_sales.notes,
         barber_sales.created_by,
         barber_sales.created_at,
         barber_sales.updated_at,
         barber_sales.sale_date_local,
         sale_item.item_summary AS service_name,
         sale_item.total_commission AS item_commission_amount,
         CASE WHEN barber_sales.payment_method = 'permuta' THEN 'debit' ELSE 'credit' END AS commission_effect
       FROM barber_sales
       LEFT JOIN barber_collaborators
         ON barber_collaborators.id = barber_sales.collaborator_id
        AND barber_collaborators.company_id = barber_sales.company_id
       LEFT JOIN LATERAL (
         SELECT
           STRING_AGG(description, ' + ' ORDER BY created_at ASC) AS item_summary,
           COALESCE(SUM(commission_amount), 0)::numeric AS total_commission
         FROM barber_sale_items
         WHERE barber_sale_items.sale_id = barber_sales.id
           AND barber_sale_items.company_id = barber_sales.company_id
       ) sale_item ON true
       WHERE ${filters.join(' AND ')}
       ORDER BY barber_sales.created_at DESC
       LIMIT 50`,
      values
    );

    return result.rows;
  }

  // --- getSalesSummary ---
  async getSalesSummary(companyId, user, query = {}) {
    ensureCompany(companyId);

    const collaboratorRepo = new CollaboratorRepository();
    const collaborator = user?.role === 'collaborator'
      ? await collaboratorRepo.findByUserId(companyId, user.id)
      : null;
    const collaboratorId = collaborator?.id || query.collaborator_id || query.collaboratorId || null;
    const period = String(query.period || 'today').trim() || 'today';
    const { start, end } = buildReportPeriod(period, query.startDate || query.start_date, query.endDate || query.end_date);
    const today = getBusinessDateString();
    const weekRange = getWeekRange();
    const monthRange = getMonthRange();
    const periodTimestampRange = buildBusinessTimestampRange(start, end);
    const dayTimestampRange = buildBusinessTimestampRange(today, today);
    const weekTimestampRange = buildBusinessTimestampRange(weekRange.start, weekRange.end);
    const monthTimestampRange = buildBusinessTimestampRange(monthRange.start, monthRange.end);
    const periodValues = [companyId, periodTimestampRange.startAt, periodTimestampRange.endAt, collaboratorId];

    appLogger.debug({ companyId, period, startDate: periodTimestampRange.startAt, endDate: periodTimestampRange.endAt, collaboratorId }, '[getSalesSummary params]');

    const baseWhere = `
      barber_sales.company_id = $1
      AND ($2::timestamptz IS NULL OR barber_sales.created_at >= ($2::timestamptz AT TIME ZONE 'UTC'))
      AND ($3::timestamptz IS NULL OR barber_sales.created_at < ($3::timestamptz AT TIME ZONE 'UTC'))
      AND ($4::uuid IS NULL OR barber_sales.collaborator_id = $4::uuid)
      AND ${isSaleActiveSql('barber_sales')}
    `;

    const [totalsResult, paymentResult, collaboratorResult, dayResult, weekResult, monthResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(barber_sales.id)::integer AS total_sales,
           COALESCE(SUM(COALESCE(item_commissions.gross_total, barber_sales.total_amount)), 0)::numeric AS total_amount,
           COALESCE(SUM(barber_sales.commission_amount), 0)::numeric AS sale_commission_amount,
           COALESCE(SUM(item_commissions.normal_commission), 0)::numeric AS item_commission_amount,
           COALESCE(SUM(item_commissions.barter_commission), 0)::numeric AS barter_commission_amount,
           COALESCE(SUM(barber_sales.discount), 0)::numeric AS total_discount
         FROM barber_sales
         LEFT JOIN LATERAL (
           SELECT
             COALESCE(SUM(total_price), 0)::numeric AS gross_total,
             COALESCE(SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN 0 ELSE commission_amount END), 0)::numeric AS normal_commission,
             COALESCE(SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN commission_amount ELSE 0 END), 0)::numeric AS barter_commission
           FROM barber_sale_items
           WHERE barber_sale_items.sale_id = barber_sales.id
             AND barber_sale_items.company_id = barber_sales.company_id
         ) item_commissions ON true
         WHERE ${baseWhere}`,
        periodValues
      ),
      pool.query(
        `SELECT barber_sales.payment_method,
                COALESCE(SUM(COALESCE(item_totals.gross_total, barber_sales.total_amount)), 0)::numeric AS total_amount,
                COUNT(barber_sales.id)::integer AS total_sales
         FROM barber_sales
         LEFT JOIN LATERAL (
           SELECT COALESCE(SUM(total_price), 0)::numeric AS gross_total
           FROM barber_sale_items
           WHERE barber_sale_items.sale_id = barber_sales.id
             AND barber_sale_items.company_id = barber_sales.company_id
         ) item_totals ON true
         WHERE ${baseWhere}
         GROUP BY barber_sales.payment_method
         ORDER BY total_amount DESC`,
        periodValues
      ),
      pool.query(
        `SELECT barber_sales.collaborator_id,
                COALESCE(users.name, barber_collaborators.nickname, 'Sem colaborador') AS collaborator_name,
                COUNT(barber_sales.id)::integer AS total_sales,
                COALESCE(SUM(COALESCE(item_commissions.gross_total, barber_sales.total_amount)), 0)::numeric AS total_amount,
                COALESCE(SUM(item_commissions.normal_commission), 0)::numeric AS total_commission,
                COALESCE(SUM(item_commissions.barter_commission), 0)::numeric AS barter_commission,
                (COALESCE(SUM(item_commissions.normal_commission), 0) - COALESCE(SUM(item_commissions.barter_commission), 0))::numeric AS net_commission
         FROM barber_sales
         LEFT JOIN barber_collaborators
           ON barber_collaborators.id = barber_sales.collaborator_id
          AND barber_collaborators.company_id = barber_sales.company_id
         LEFT JOIN users ON users.id = barber_collaborators.user_id
         LEFT JOIN LATERAL (
           SELECT
             COALESCE(SUM(total_price), 0)::numeric AS gross_total,
             COALESCE(SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN 0 ELSE commission_amount END), 0)::numeric AS normal_commission,
             COALESCE(SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN commission_amount ELSE 0 END), 0)::numeric AS barter_commission
           FROM barber_sale_items
           WHERE barber_sale_items.sale_id = barber_sales.id
             AND barber_sale_items.company_id = barber_sales.company_id
         ) item_commissions ON true
         WHERE ${baseWhere}
         GROUP BY barber_sales.collaborator_id, users.name, barber_collaborators.nickname
         ORDER BY total_amount DESC`,
        periodValues
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(COALESCE(item_totals.gross_total, barber_sales.total_amount)), 0)::numeric AS total_amount,
           COUNT(barber_sales.id)::integer AS total_sales
         FROM barber_sales
         LEFT JOIN LATERAL (
           SELECT COALESCE(SUM(total_price), 0)::numeric AS gross_total
           FROM barber_sale_items
           WHERE barber_sale_items.sale_id = barber_sales.id
             AND barber_sale_items.company_id = barber_sales.company_id
         ) item_totals ON true
         WHERE barber_sales.company_id = $1
           AND ($2::timestamptz IS NULL OR barber_sales.created_at >= ($2::timestamptz AT TIME ZONE 'UTC'))
           AND ($3::timestamptz IS NULL OR barber_sales.created_at < ($3::timestamptz AT TIME ZONE 'UTC'))
           AND ($4::uuid IS NULL OR barber_sales.collaborator_id = $4::uuid)
           AND ${isSaleActiveSql('barber_sales')}`,
        [companyId, dayTimestampRange.startAt, dayTimestampRange.endAt, collaboratorId]
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(COALESCE(item_totals.gross_total, barber_sales.total_amount)), 0)::numeric AS total_amount,
           COUNT(barber_sales.id)::integer AS total_sales
         FROM barber_sales
         LEFT JOIN LATERAL (
           SELECT COALESCE(SUM(total_price), 0)::numeric AS gross_total
           FROM barber_sale_items
           WHERE barber_sale_items.sale_id = barber_sales.id
             AND barber_sale_items.company_id = barber_sales.company_id
         ) item_totals ON true
         WHERE barber_sales.company_id = $1
           AND ($2::timestamptz IS NULL OR barber_sales.created_at >= ($2::timestamptz AT TIME ZONE 'UTC'))
           AND ($3::timestamptz IS NULL OR barber_sales.created_at < ($3::timestamptz AT TIME ZONE 'UTC'))
           AND ($4::uuid IS NULL OR barber_sales.collaborator_id = $4::uuid)
           AND ${isSaleActiveSql('barber_sales')}`,
        [companyId, weekTimestampRange.startAt, weekTimestampRange.endAt, collaboratorId]
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(COALESCE(item_totals.gross_total, barber_sales.total_amount)), 0)::numeric AS total_amount,
           COUNT(barber_sales.id)::integer AS total_sales
         FROM barber_sales
         LEFT JOIN LATERAL (
           SELECT COALESCE(SUM(total_price), 0)::numeric AS gross_total
           FROM barber_sale_items
           WHERE barber_sale_items.sale_id = barber_sales.id
             AND barber_sale_items.company_id = barber_sales.company_id
         ) item_totals ON true
         WHERE barber_sales.company_id = $1
           AND ($2::timestamptz IS NULL OR barber_sales.created_at >= ($2::timestamptz AT TIME ZONE 'UTC'))
           AND ($3::timestamptz IS NULL OR barber_sales.created_at < ($3::timestamptz AT TIME ZONE 'UTC'))
           AND ($4::uuid IS NULL OR barber_sales.collaborator_id = $4::uuid)
           AND ${isSaleActiveSql('barber_sales')}`,
        [companyId, monthTimestampRange.startAt, monthTimestampRange.endAt, collaboratorId]
      )
    ]);

    const totals = totalsResult.rows[0] || {};

    return {
      period: { start, end, filter: period },
      total_sales: Number(totals.total_sales || 0),
      total_amount: toNumber(totals.total_amount),
      total_commission: toNumber(totals.item_commission_amount || totals.sale_commission_amount),
      barter_commission: toNumber(totals.barter_commission_amount),
      net_commission: toNumber(totals.item_commission_amount || totals.sale_commission_amount) - toNumber(totals.barter_commission_amount),
      total_discount: toNumber(totals.total_discount),
      total_by_payment_method: paymentResult.rows,
      total_by_collaborator: collaboratorResult.rows,
      totals_day: dayResult.rows[0],
      totals_week: weekResult.rows[0],
      totals_month: monthResult.rows[0]
    };
  }

  // --- cancelSale ---
  async cancelSale(companyId, user, saleId, data = {}) {
    ensureCompany(companyId);
    ensureAdmin(user, 'Apenas admin pode cancelar vendas');

    const reason = String(data.reason || '').trim();
    if (!reason) {
      throw createError('Motivo do cancelamento e obrigatorio', 400);
    }

    await this._validateApprovalPin(companyId, user, data.pin);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const saleResult = await client.query(
        `SELECT id, company_id, collaborator_id, payment_method, total_amount, amount_received, change_amount, client_name, customer_name, customer_phone, notes, created_by, created_at, sale_date_local, status, canceled_at
         FROM barber_sales
         WHERE id = $1 AND company_id = $2
         LIMIT 1`,
        [saleId, companyId]
      );

      if (saleResult.rowCount === 0) {
        throw createError('Venda nao encontrada', 404);
      }

      const sale = saleResult.rows[0];
      const cashDate = normalizeCashDateFromSale(sale);

      if (sale.canceled_at || ['canceled', 'cancelled', 'deleted', 'removed'].includes(String(sale.status || '').trim().toLowerCase())) {
        throw createError('Venda ja esta cancelada', 409);
      }

      const csRepo = new CashSessionRepository(client);
      const saleCashSession = await csRepo.findByCompanyAndDate(companyId, cashDate);
      if (saleCashSession) {
        if (saleCashSession.status === 'closed') {
          throw createError('Este caixa ja foi fechado e nao pode ser alterado', 409);
        }
      }

      const itemsResult = await client.query(
        `SELECT id, sale_id, item_type, item_id, company_id, description, quantity, unit_price, total_price, commission_amount, created_at
         FROM barber_sale_items
         WHERE sale_id = $1 AND company_id = $2`,
        [saleId, companyId]
      );

      const canceledResult = await client.query(
        `UPDATE barber_sales
         SET status = 'canceled', canceled_by = $3, canceled_at = NOW(), canceled_reason = $4, updated_at = NOW()
         WHERE id = $1 AND company_id = $2
         RETURNING id, company_id, collaborator_id, payment_method, subtotal, discount, total_amount, commission_amount, amount_received, change_amount, customer_name, customer_phone, client_name, status, canceled_by, canceled_at, canceled_reason, notes, created_by, created_at, updated_at, sale_date_local`,
        [saleId, companyId, user.id, reason]
      );

      // Recalculate cash session via repository
      await csRepo.ensureExists(companyId, cashDate, user.id, 0, null);
      await csRepo.recalculate(companyId, cashDate);

      await client.query(
        `INSERT INTO barber_audit_logs (company_id, user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, 'cancel_sale', 'barber_sale', $3, $4)`,
        [companyId, user.id, saleId, JSON.stringify({ reason, sale: saleResult.rows[0], items: itemsResult.rows })]
      );

      await client.query('COMMIT');
      return { ...canceledResult.rows[0], items: itemsResult.rows };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // --- deleteSale ---
  async deleteSale(companyId, user, saleId, data = {}) {
    return this.cancelSale(companyId, user, saleId, data);
  }

  // --- internal helper ---
  async _validateApprovalPin(companyId, user, pinValue) {
    ensureCompany(companyId);
    ensureAdmin(user, 'Apenas dono ou admin pode cancelar vendas');

    const pin = String(pinValue || '').replace(/\D/g, '');
    if (!pin || pin.length < 4) {
      throw createError('Informe o PIN admin com pelo menos 4 digitos', 401);
    }

    const { isValidPin } = require('../utils/validators');
    if (!isValidPin(pin, 4)) {
      throw createError('Informe o PIN admin com pelo menos 4 digitos', 401);
    }

    const hasPinHashResult = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'pin_hash' LIMIT 1`
    );
    const hasPinHash = hasPinHashResult.rowCount > 0;

    if (!hasPinHash) {
      throw createError('PIN admin ainda nao esta configurado no banco', 503);
    }

    const result = await pool.query(
      `SELECT pin_hash FROM users WHERE id = $1 AND company_id = $2 AND role IN ('admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin') AND COALESCE(is_active, true) = true LIMIT 1`,
      [user.id, companyId]
    );

    if (result.rowCount === 0) {
      throw createError('Usuario admin nao encontrado para validar PIN', 404);
    }
    if (!result.rows[0].pin_hash) {
      throw createError('Configure um PIN admin antes de cancelar vendas', 409);
    }

    const pinMatches = await bcrypt.compare(pin, result.rows[0].pin_hash);
    if (!pinMatches) {
      throw createError('PIN admin invalido', 401);
    }
    return true;
  }
}

module.exports = SaleService
