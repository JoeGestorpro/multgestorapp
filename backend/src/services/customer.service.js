const pool = require('../config/database');
const { createError, ensureCompany } = require('../utils/barber-helpers');

class CustomerService {
  async listCustomers(companyId, user, query = {}) {
    ensureCompany(companyId);

    const search = String(query.search || query.q || '').trim().toLowerCase();
    const status = String(query.status || '').trim().toLowerCase();
    const params = [companyId];
    const filters = ['booking_customers.company_id = $1'];

    if (search) {
      const phoneDigits = String(search).replace(/\D/g, '');
      params.push(`%${search}%`);
      params.push(phoneDigits ? `%${phoneDigits}%` : '');
      filters.push(`(
        lower(booking_customers.name) LIKE $${params.length - 1}
        OR lower(booking_customers.email) LIKE $${params.length - 1}
        OR regexp_replace(COALESCE(booking_customers.phone, ''), '\\D', '', 'g') LIKE $${params.length}
      )`);
    }

    if (status && ['pending', 'active', 'blocked'].includes(status)) {
      params.push(status);
      filters.push(`booking_customers.status = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT
         booking_customers.id, booking_customers.company_id, booking_customers.name,
         booking_customers.phone, booking_customers.email, booking_customers.email_verified,
         booking_customers.status, booking_customers.source,
         booking_customers.created_at, booking_customers.updated_at, booking_customers.last_login_at,
         COUNT(*) OVER() AS total_count
       FROM booking_customers
       WHERE ${filters.join(' AND ')}
       ORDER BY booking_customers.created_at DESC`,
      params
    );

    return {
      total: Number(result.rows[0]?.total_count || 0),
      items: result.rows.map((row) => ({
        ...row,
        origin: row.source || 'agendamento_online'
      }))
    };
  }

  async getCustomerById(companyId, customerId) {
    ensureCompany(companyId);

    const result = await pool.query(
      `SELECT
         id, company_id, name, phone, email, email_verified, status, source,
         created_at, updated_at, last_login_at
       FROM booking_customers
       WHERE company_id = $1 AND id = $2
       LIMIT 1`,
      [companyId, customerId]
    );

    if (result.rowCount === 0) {
      throw createError('Cliente nao encontrado', 404);
    }

    return {
      ...result.rows[0],
      origin: result.rows[0].source || 'agendamento_online'
    };
  }
}

module.exports = CustomerService;
