const pool = require('../config/database')
const { isSaleActiveSql } = require('../utils/barber-helpers')

const SELECT_COLS = `
  id, company_id, cash_date, status, opened_at, closed_at,
  opening_balance, gross_total, net_total, pix_total, cash_total,
  credit_total, debit_total, trade_total, discount_total, change_total,
  total_sales, total_services, opened_by, closed_by, notes,
  created_at, updated_at
`

const SALE_ACTIVE_COND = `
  LOWER(TRIM(COALESCE(barber_sales.status, 'active'))) NOT IN ('deleted', 'cancelled', 'canceled', 'removed')
  AND LOWER(TRIM(COALESCE(barber_sales.status, 'active'))) IN ('active', 'completed', 'paid', 'finalized')
  AND barber_sales.canceled_at IS NULL
`

class CashSessionRepository {
  constructor(db = pool) {
    this.db = db
  }

  async findByCompanyAndDate(companyId, cashDate) {
    const result = await this.db.query(
      `SELECT ${SELECT_COLS}
       FROM barber_cash_sessions
       WHERE company_id = $1 AND cash_date = $2::date
       LIMIT 1`,
      [companyId, cashDate]
    )
    return result.rows[0] || null
  }

  async ensureExists(companyId, cashDate, openedBy, openingBalance, notes) {
    await this.db.query(
      `INSERT INTO barber_cash_sessions
         (company_id, cash_date, status, opened_at, opening_balance, opened_by, notes, updated_at)
       VALUES ($1, $2::date, 'open', NOW(), $3, $4, $5, NOW())
       ON CONFLICT (company_id, cash_date) DO NOTHING`,
      [companyId, cashDate, openingBalance, openedBy || null, notes]
    )
  }

  async open(companyId, cashDate, openingBalance, openedBy, notes) {
    const result = await this.db.query(
      `UPDATE barber_cash_sessions
       SET status = 'open',
           opened_at = COALESCE(opened_at, NOW()),
           opening_balance = $3,
           opened_by = COALESCE(opened_by, $4),
           notes = COALESCE($5, notes),
           updated_at = NOW()
       WHERE company_id = $1 AND cash_date = $2::date
       RETURNING ${SELECT_COLS}`,
      [companyId, cashDate, openingBalance, openedBy, notes]
    )
    return result.rows[0]
  }

  async recalculate(companyId, cashDate) {
    const totalsResult = await this.db.query(
      `SELECT
         COALESCE(SUM(COALESCE(item_totals.gross_total, barber_sales.total_amount)), 0)::numeric AS gross_total,
         COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'pix' THEN COALESCE(item_totals.gross_total, barber_sales.total_amount) ELSE 0 END), 0)::numeric AS pix_total,
         COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'dinheiro' THEN COALESCE(item_totals.gross_total, barber_sales.total_amount) ELSE 0 END), 0)::numeric AS cash_total,
         COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'credito' THEN COALESCE(item_totals.gross_total, barber_sales.total_amount) ELSE 0 END), 0)::numeric AS credit_total,
         COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'debito' THEN COALESCE(item_totals.gross_total, barber_sales.total_amount) ELSE 0 END), 0)::numeric AS debit_total,
         COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN COALESCE(item_totals.gross_total, barber_sales.total_amount) ELSE 0 END), 0)::numeric AS trade_total,
         COALESCE(SUM(barber_sales.change_amount), 0)::numeric AS change_total,
         COUNT(*)::integer AS total_sales
       FROM barber_sales
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(total_price), 0)::numeric AS gross_total
         FROM barber_sale_items
         WHERE barber_sale_items.sale_id = barber_sales.id
           AND barber_sale_items.company_id = barber_sales.company_id
       ) item_totals ON true
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local = $2::date
         AND ${SALE_ACTIVE_COND}`,
      [companyId, cashDate]
    )

    const servicesResult = await this.db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN barber_sale_items.item_type = 'service' THEN barber_sale_items.quantity ELSE 0 END), 0)::numeric AS total_services
       FROM barber_sale_items
       INNER JOIN barber_sales
         ON barber_sales.id = barber_sale_items.sale_id
        AND barber_sales.company_id = barber_sale_items.company_id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local = $2::date
         AND ${SALE_ACTIVE_COND}`,
      [companyId, cashDate]
    )

    const totals = totalsResult.rows[0]
    const totalServices = Number(servicesResult.rows[0].total_services)
    const grossTotal = Number(totals.gross_total)
    const tradeTotal = Number(totals.trade_total)
    const changeTotal = Number(totals.change_total)
    const discountTotal = 0

    const session = await this.findByCompanyAndDate(companyId, cashDate)
    const netTotal = Math.max(0, Number(session?.opening_balance || 0) + grossTotal - tradeTotal - changeTotal - discountTotal)

    const result = await this.db.query(
      `UPDATE barber_cash_sessions
       SET gross_total = $3, net_total = $4, pix_total = $5,
           cash_total = $6, credit_total = $7, debit_total = $8,
           trade_total = $9, discount_total = $10, change_total = $11,
           total_sales = $12, total_services = $13, updated_at = NOW()
       WHERE company_id = $1 AND cash_date = $2::date
       RETURNING ${SELECT_COLS}`,
      [
        companyId, cashDate,
        grossTotal, netTotal,
        Number(totals.pix_total), Number(totals.cash_total),
        Number(totals.credit_total), Number(totals.debit_total),
        tradeTotal, discountTotal, changeTotal,
        Number(totals.total_sales || 0),
        totalServices
      ]
    )

    return result.rows[0]
  }

  async close(companyId, cashDate, closedBy, notes) {
    const result = await this.db.query(
      `UPDATE barber_cash_sessions
       SET status = 'closed',
           closed_at = NOW(),
           closed_by = $3,
           notes = COALESCE($4, notes),
           updated_at = NOW()
       WHERE company_id = $1 AND cash_date = $2::date
       RETURNING ${SELECT_COLS}`,
      [companyId, cashDate, closedBy, notes]
    )
    return result.rows[0] || null
  }

  async appendAuditLog(companyId, userId, action, entityId, details) {
    await this.db.query(
      `INSERT INTO barber_audit_logs (company_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, 'barber_cash_session', $4, $5)`,
      [companyId, userId, action, entityId || null, JSON.stringify(details || {})]
    )
  }

  async getCashDailyDetails(companyId, cashDate, options = {}) {
    const normalizedDate = String(cashDate || '').trim();
    let session = await this.findByCompanyAndDate(companyId, normalizedDate);

    if (!session && options.createIfMissing) {
      await this.ensureExists(companyId, normalizedDate, options.userId, 0, null);
      session = await this.recalculate(companyId, normalizedDate);
    }

    const fallbackSession = session || {
      company_id: companyId,
      cash_date: normalizedDate,
      status: 'open',
      opened_at: null,
      closed_at: null,
      opening_balance: 0,
      gross_total: 0,
      net_total: 0,
      pix_total: 0,
      cash_total: 0,
      credit_total: 0,
      debit_total: 0,
      trade_total: 0,
      discount_total: 0,
      change_total: 0,
      total_sales: 0,
      total_services: 0,
      opened_by: null,
      closed_by: null,
      notes: null,
      created_at: null,
      updated_at: null
    };

    const [salesResult, collaboratorTotalsResult, serviceTotalsResult] = await Promise.all([
      this.db.query(
        `SELECT
           barber_sales.id,
           barber_sales.company_id,
           barber_sales.collaborator_id,
           barber_sales.payment_method,
           barber_sales.total_amount,
           barber_sales.amount_received,
           barber_sales.change_amount,
           barber_sales.client_name,
           barber_sales.notes,
           barber_sales.created_by,
           barber_sales.created_at,
           barber_sales.sale_date_local,
           barber_collaborators.nickname AS collaborator_name,
           sale_item.item_summary AS service_name
         FROM barber_sales
         LEFT JOIN barber_collaborators
           ON barber_collaborators.id = barber_sales.collaborator_id
          AND barber_collaborators.company_id = barber_sales.company_id
         LEFT JOIN LATERAL (
           SELECT STRING_AGG(description, ' + ' ORDER BY created_at ASC) AS item_summary
           FROM barber_sale_items
           WHERE barber_sale_items.sale_id = barber_sales.id
         ) sale_item ON true
         WHERE barber_sales.company_id = $1
           AND barber_sales.sale_date_local = $2::date
           AND ${isSaleActiveSql('barber_sales')}
         ORDER BY barber_sales.created_at DESC`,
        [companyId, normalizedDate]
      ),
      this.db.query(
        `SELECT
           barber_collaborators.id AS collaborator_id,
           barber_collaborators.nickname AS collaborator_name,
           COUNT(barber_sales.id)::integer AS total_sales,
           COALESCE(SUM(COALESCE(sale_commissions.gross_total, barber_sales.total_amount)), 0)::numeric AS gross_total,
           COALESCE(SUM(COALESCE(sale_commissions.normal_commission, 0)), 0)::numeric AS total_commission,
           COALESCE(SUM(COALESCE(sale_commissions.barter_commission, 0)), 0)::numeric AS barter_commission,
           (COALESCE(SUM(COALESCE(sale_commissions.normal_commission, 0)), 0) - COALESCE(SUM(COALESCE(sale_commissions.barter_commission, 0)), 0))::numeric AS net_commission
         FROM barber_sales
         LEFT JOIN barber_collaborators
           ON barber_collaborators.id = barber_sales.collaborator_id
          AND barber_collaborators.company_id = barber_sales.company_id
         LEFT JOIN (
           SELECT
             sale_id,
             company_id,
             SUM(total_price) AS gross_total,
             SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN 0 ELSE commission_amount END) AS normal_commission,
             SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN commission_amount ELSE 0 END) AS barter_commission
           FROM barber_sale_items
           GROUP BY sale_id, company_id
         ) sale_commissions
           ON sale_commissions.sale_id = barber_sales.id
          AND sale_commissions.company_id = barber_sales.company_id
         WHERE barber_sales.company_id = $1
           AND barber_sales.sale_date_local = $2::date
           AND ${isSaleActiveSql('barber_sales')}
         GROUP BY barber_collaborators.id, barber_collaborators.nickname
         ORDER BY gross_total DESC, collaborator_name ASC`,
        [companyId, normalizedDate]
      ),
      this.db.query(
        `SELECT
           barber_sale_items.description AS service_name,
           COALESCE(SUM(barber_sale_items.quantity), 0)::numeric AS total_services,
           COALESCE(SUM(barber_sale_items.total_price), 0)::numeric AS gross_total
         FROM barber_sale_items
         INNER JOIN barber_sales
           ON barber_sales.id = barber_sale_items.sale_id
          AND barber_sales.company_id = barber_sale_items.company_id
         WHERE barber_sales.company_id = $1
           AND barber_sales.sale_date_local = $2::date
           AND ${isSaleActiveSql('barber_sales')}
         GROUP BY barber_sale_items.description
         ORDER BY gross_total DESC, service_name ASC`,
        [companyId, normalizedDate]
      )
    ]);

    return {
      session: fallbackSession,
      sales: salesResult.rows,
      collaboratorTotals: collaboratorTotalsResult.rows,
      serviceTotals: serviceTotalsResult.rows
    };
  }
}

module.exports = CashSessionRepository
