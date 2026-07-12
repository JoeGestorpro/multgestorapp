const pool = require('../config/database')

class FinancialReportService {
  async getSummary(companyId, { from, to }) {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total_sales,
        COALESCE(SUM(total_amount), 0) AS gross_revenue,
        COALESCE(SUM(commission_amount), 0) AS total_commission,
        COALESCE(SUM(shop_net_amount), 0) AS net_revenue,
        COALESCE(SUM(discount), 0) AS total_discounts,
        COALESCE(SUM(amount_received), 0) AS total_received
      FROM barber_sales
      WHERE company_id = $1
        AND sale_date_local BETWEEN $2 AND $3
        AND status IN ('active', 'completed', 'paid', 'finalized')
        AND COALESCE(is_deleted, false) = false
    `, [companyId, from, to])

    const cashResult = await pool.query(`
      SELECT COALESCE(SUM(closed_total), 0) AS cash_total
      FROM barber_cash_sessions
      WHERE company_id = $1
        AND closed_at BETWEEN $2 AND $3
        AND status = 'closed'
    `, [companyId, from, to])

    return {
      period: { from, to },
      ...result.rows[0],
      cash_total: cashResult.rows[0].cash_total,
      by_payment_method: await this._byPaymentMethod(companyId, from, to),
      by_collaborator: await this._byCollaborator(companyId, from, to),
    }
  }

  async _byPaymentMethod(companyId, from, to) {
    const result = await pool.query(`
      SELECT
        COALESCE(payment_method, 'unknown') AS payment_method,
        COUNT(*)::int AS total,
        COALESCE(SUM(total_amount), 0) AS total_amount
      FROM barber_sales
      WHERE company_id = $1
        AND sale_date_local BETWEEN $2 AND $3
        AND status IN ('active', 'completed', 'paid', 'finalized')
        AND COALESCE(is_deleted, false) = false
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `, [companyId, from, to])
    return result.rows
  }

  async _byCollaborator(companyId, from, to) {
    const result = await pool.query(`
      SELECT
        s.collaborator_id,
        c.name AS collaborator_name,
        COUNT(*)::int AS total_sales,
        COALESCE(SUM(s.total_amount), 0) AS total_amount,
        COALESCE(SUM(s.commission_amount), 0) AS total_commission
      FROM barber_sales s
      LEFT JOIN barber_collaborators c ON c.id = s.collaborator_id AND c.company_id = $1
      WHERE s.company_id = $1
        AND s.sale_date_local BETWEEN $2 AND $3
        AND s.status IN ('active', 'completed', 'paid', 'finalized')
        AND COALESCE(s.is_deleted, false) = false
      GROUP BY s.collaborator_id, c.name
      ORDER BY total_amount DESC
    `, [companyId, from, to])
    return result.rows
  }

  async getDre(companyId, { from, to }) {
    const sales = await pool.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS gross_revenue,
        COALESCE(SUM(discount), 0) AS discounts,
        COALESCE(SUM(commission_amount), 0) AS commissions,
        COALESCE(SUM(shop_net_amount), 0) AS net_revenue
      FROM barber_sales
      WHERE company_id = $1
        AND sale_date_local BETWEEN $2 AND $3
        AND status IN ('active', 'completed', 'paid', 'finalized')
        AND COALESCE(is_deleted, false) = false
    `, [companyId, from, to])

    const advances = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_advances
      FROM barber_advances
      WHERE company_id = $1
        AND created_at BETWEEN $2 AND $3
        AND status = 'approved'
    `, [companyId, from, to])

    return {
      period: { from, to },
      gross_revenue: sales.rows[0].gross_revenue,
      discounts: sales.rows[0].discounts,
      net_revenue_ex_commissions: (
        Number(sales.rows[0].gross_revenue) - Number(sales.rows[0].discounts)
      ),
      commissions: sales.rows[0].commissions,
      advances: advances.rows[0].total_advances,
      net_revenue: sales.rows[0].net_revenue,
    }
  }
}

module.exports = FinancialReportService
