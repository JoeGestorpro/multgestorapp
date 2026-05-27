const pool = require('../config/database')

class CRMRepository {
  constructor(db = pool) {
    this.db = db
  }

  async getCustomer(companyId, customerId) {
    const result = await this.db.query(
      `SELECT id, company_id, name, phone, email, email_verified,
              status, source, created_at, updated_at, last_login_at
       FROM booking_customers
       WHERE company_id = $1 AND id = $2
       LIMIT 1`,
      [companyId, customerId]
    )

    return result.rows[0] || null
  }

  async updateCustomerStatus(companyId, customerId, status) {
    const result = await this.db.query(
      `UPDATE booking_customers
       SET status = $3, updated_at = NOW()
       WHERE company_id = $1 AND id = $2
       RETURNING id, company_id, name, phone, email, email_verified,
                 status, source, created_at, updated_at, last_login_at`,
      [companyId, customerId, status]
    )

    return result.rows[0] || null
  }

  async getCustomerNotes(companyId, customerId) {
    const result = await this.db.query(
      `SELECT id, company_id, customer_id, user_id, note, created_at
       FROM barber_client_notes
       WHERE company_id = $1 AND customer_id = $2
       ORDER BY created_at DESC`,
      [companyId, customerId]
    )

    return result.rows
  }

  async createCustomerNote(companyId, customerId, userId, note) {
    const result = await this.db.query(
      `INSERT INTO barber_client_notes (company_id, customer_id, user_id, note, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, company_id, customer_id, user_id, note, created_at`,
      [companyId, customerId, userId, note]
    )

    return result.rows[0]
  }

  async getCustomerAppointments(companyId, customerId) {
    const result = await this.db.query(
      `SELECT ba.id, ba.starts_at, ba.ends_at, ba.status, ba.notes,
              bs.name AS service_name,
              COALESCE(u.name, bc.nickname) AS collaborator_name
       FROM barber_appointments ba
       INNER JOIN barber_services bs ON bs.id = ba.service_id AND bs.company_id = ba.company_id
       LEFT JOIN barber_collaborators bc ON bc.id = ba.collaborator_id
       LEFT JOIN users u ON u.id = bc.user_id
       WHERE ba.company_id = $1 AND ba.customer_id = $2
       ORDER BY ba.starts_at DESC
       LIMIT 50`,
      [companyId, customerId]
    )

    return result.rows
  }

  async getCrmSummary(companyId, dateFrom, dateTo) {
    const customerResult = await this.db.query(`
      WITH customer_stats AS (
        SELECT
          bc.id, bc.status, bc.created_at,
          COUNT(ba.id) FILTER (WHERE ba.status = 'completed') as completed_visits,
          MAX(ba.starts_at) FILTER (WHERE ba.status = 'completed') as last_visit
        FROM booking_customers bc
        LEFT JOIN barber_appointments ba ON ba.customer_id = bc.id
        WHERE bc.company_id = $1
        GROUP BY bc.id
      )
      SELECT
        COUNT(*) as total_clientes,
        COUNT(*) FILTER (WHERE status = 'active') as clientes_ativos,
        COUNT(*) FILTER (WHERE status = 'pending') as clientes_pendentes,
        COUNT(*) FILTER (WHERE status = 'blocked') as clientes_bloqueados,
        COUNT(*) FILTER (WHERE created_at >= $2 AND created_at < $3) as clientes_novos_mes,
        COUNT(*) FILTER (WHERE completed_visits = 0 OR last_visit IS NULL OR last_visit < CURRENT_DATE - INTERVAL '90 days') as clientes_inativos,
        COUNT(*) FILTER (WHERE completed_visits >= 20) as clientes_vip,
        COUNT(*) FILTER (WHERE completed_visits >= 10 AND completed_visits < 20) as clientes_fieis,
        CASE WHEN COUNT(*) > 0
          THEN ROUND(COUNT(*) FILTER (WHERE completed_visits > 1) * 100.0 / COUNT(*), 1)
          ELSE 0
        END as taxa_retorno
      FROM customer_stats
    `, [companyId, dateFrom, dateTo])

    const periodResult = await this.db.query(`
      SELECT
        (SELECT COUNT(*) FROM barber_appointments
         WHERE company_id = $1 AND status = 'completed'
         AND starts_at >= $2 AND starts_at < $3) as atendimentos_no_mes,
        (SELECT COALESCE(SUM(total_amount), 0) FROM barber_sales
         WHERE company_id = $1 AND deleted_at IS NULL
         AND created_at >= $2 AND created_at < $3) as receita_no_mes,
        (SELECT COALESCE(AVG(total_amount), 0) FROM barber_sales
         WHERE company_id = $1 AND deleted_at IS NULL) as ticket_medio
    `, [companyId, dateFrom, dateTo])

    return {
      ...(customerResult.rows[0] || {}),
      ...(periodResult.rows[0] || {})
    }
  }

  async getAgendaCrm(companyId, thirtyDaysAgo) {
    const upcomingResult = await this.db.query(`
      SELECT bc.id, bc.name, bc.phone, bc.email, bc.status as customer_status,
             ba.id as appointment_id, ba.starts_at, ba.status as appointment_status,
             COALESCE(bs.name, 'Sem servico') as service_name,
             COALESCE(u.name, 'Sem profissional') as collaborator_name
      FROM booking_customers bc
      JOIN barber_appointments ba ON ba.customer_id = bc.id
      LEFT JOIN barber_services bs ON ba.service_id = bs.id
      LEFT JOIN barber_collaborators bcol ON ba.collaborator_id = bcol.id
      LEFT JOIN users u ON u.id = bcol.user_id
      WHERE bc.company_id = $1
        AND ba.starts_at >= CURRENT_DATE
        AND ba.status IN ('scheduled', 'confirmed')
      ORDER BY ba.starts_at ASC
      LIMIT 20
    `, [companyId])

    const cancellationsResult = await this.db.query(`
      SELECT bc.id, bc.name, bc.phone,
             COUNT(*) as canceled_count,
             MAX(ba.starts_at) as last_canceled
      FROM booking_customers bc
      JOIN barber_appointments ba ON ba.customer_id = bc.id
      WHERE bc.company_id = $1
        AND ba.status = 'canceled'
        AND ba.starts_at >= $2
      GROUP BY bc.id, bc.name, bc.phone
      ORDER BY last_canceled DESC
      LIMIT 15
    `, [companyId, thirtyDaysAgo])

    const noShowResult = await this.db.query(`
      SELECT bc.id, bc.name, bc.phone,
             COUNT(*) as no_show_count,
             MAX(ba.starts_at) as last_no_show
      FROM booking_customers bc
      JOIN barber_appointments ba ON ba.customer_id = bc.id
      WHERE bc.company_id = $1
        AND ba.status = 'no_show'
      GROUP BY bc.id, bc.name, bc.phone
      ORDER BY no_show_count DESC
      LIMIT 15
    `, [companyId])

    return {
      upcoming: upcomingResult.rows,
      cancellations: cancellationsResult.rows,
      no_shows: noShowResult.rows
    }
  }
}

module.exports = CRMRepository
