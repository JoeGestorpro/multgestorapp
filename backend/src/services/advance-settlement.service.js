const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const CollaboratorRepository = require('../repositories/collaborator.repository');
const {
  createError,
  toNumber,
  ensureCompany,
  ensureAdmin,
  isSaleActiveSql,
  normalizeDateInput
} = require('../utils/barber-helpers');

const ADVANCE_STATUS = ['pending', 'approved', 'rejected', 'liquidated'];

async function getCollaboratorForUser(companyId, userId) {
  const repo = new CollaboratorRepository();
  const collaborator = await repo.findByUserId(companyId, userId);
  if (!collaborator) {
    throw createError('Colaborador nao vinculado ao usuario', 403);
  }
  return collaborator;
}

async function getCollaboratorRecord(companyId, collaboratorId, client = pool) {
  const result = await client.query(
    `SELECT
       barber_collaborators.id, barber_collaborators.company_id, barber_collaborators.user_id,
       barber_collaborators.nickname, barber_collaborators.commission_type, barber_collaborators.commission_rate,
       barber_collaborators.can_make_barter, barber_collaborators.available_for_booking,
       barber_collaborators.avatar_url, barber_collaborators.is_active, barber_collaborators.is_deleted,
       barber_collaborators.created_at, barber_collaborators.updated_at,
       users.name, users.email, users.phone, users.role,
       users.can_launch_sales, users.can_view_own_dashboard, users.can_view_own_reports, users.is_active AS user_is_active
     FROM barber_collaborators
     LEFT JOIN users ON users.id = barber_collaborators.user_id
     WHERE barber_collaborators.id = $1 AND barber_collaborators.company_id = $2
       AND COALESCE(barber_collaborators.is_deleted, false) = false
     LIMIT 1`,
    [collaboratorId, companyId]
  );
  if (result.rowCount === 0) {
    throw createError('Colaborador nao encontrado', 404);
  }
  return result.rows[0];
}

async function getLastSettlement(companyId, collaboratorId, client = pool) {
  const result = await client.query(
    `SELECT id, period_end FROM barber_settlements WHERE company_id = $1 AND collaborator_id = $2 ORDER BY period_end DESC LIMIT 1`,
    [companyId, collaboratorId]
  );
  return result.rows[0] || null;
}

async function calculateSettlement(companyId, collaboratorId, client = pool, options = {}) {
  ensureCompany(companyId);
  const collaborator = await getCollaboratorRecord(companyId, collaboratorId, client);
  const lastSettlement = await getLastSettlement(companyId, collaboratorId, client);
  const requestedStartDate = options.startDate || options.start_date || null;
  const requestedEndDate = options.endDate || options.end_date || null;
  const periodStart = requestedStartDate ? normalizeDateInput(requestedStartDate) : (lastSettlement?.period_end || null);
  const periodEnd = requestedEndDate ? normalizeDateInput(requestedEndDate) : null;

  const salesResult = await client.query(
    `SELECT
       COUNT(barber_sales.id)::integer AS total_attendances,
       COALESCE(SUM(COALESCE(sale_commissions.gross_total, barber_sales.total_amount)), 0)::numeric AS total_sales,
       COALESCE(SUM(COALESCE(sale_commissions.normal_commission, 0)), 0)::numeric AS total_commission,
       COALESCE(SUM(COALESCE(sale_commissions.barter_commission, 0)), 0)::numeric AS barter_commission
     FROM barber_sales
     LEFT JOIN (
       SELECT
         sale_id, company_id,
         SUM(total_price) AS gross_total,
         SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN 0 ELSE commission_amount END) AS normal_commission,
         SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN commission_amount ELSE 0 END) AS barter_commission
       FROM barber_sale_items
       GROUP BY sale_id, company_id
     ) sale_commissions
       ON sale_commissions.sale_id = barber_sales.id
      AND sale_commissions.company_id = barber_sales.company_id
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2
       AND (
         ($4::date IS NOT NULL AND barber_sales.sale_date_local::date BETWEEN $3::date AND $4::date)
         OR ($4::date IS NULL AND $3::date IS NOT NULL AND barber_sales.sale_date_local::date >= $3::date)
         OR ($3::date IS NULL AND $5::timestamp IS NULL)
         OR ($3::date IS NULL AND $5::timestamp IS NOT NULL AND barber_sales.created_at > $5::timestamp)
       )
       AND ${isSaleActiveSql('barber_sales')}`,
    [companyId, collaboratorId, requestedStartDate ? periodStart : null, periodEnd, requestedStartDate ? null : periodStart]
  );

  const advancesResult = await client.query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total_advances
     FROM barber_advances
     WHERE company_id = $1 AND collaborator_id = $2 AND status = 'approved'
       AND ($3::date IS NULL OR created_at::date >= $3::date)
       AND ($4::date IS NULL OR created_at::date <= $4::date)`,
    [companyId, collaboratorId, requestedStartDate ? periodStart : null, periodEnd]
  );

  const totalAttendances = Number(salesResult.rows[0].total_attendances || 0);
  const totalSales = toNumber(salesResult.rows[0].total_sales);
  const totalCommission = toNumber(salesResult.rows[0].total_commission);
  const barterCommission = toNumber(salesResult.rows[0].barter_commission);
  const totalAdvances = toNumber(advancesResult.rows[0].total_advances);
  const netAmount = totalCommission - barterCommission - totalAdvances;

  return {
    collaborator_id: collaborator.id,
    collaborator_name: collaborator.nickname,
    total_attendances: totalAttendances,
    total_sales: totalSales.toFixed(2),
    total_commission: totalCommission.toFixed(2),
    barter_commission: barterCommission.toFixed(2),
    total_advances: totalAdvances.toFixed(2),
    net_amount: netAmount.toFixed(2),
    period_start: periodStart,
    period_end: periodEnd || new Date().toISOString().slice(0, 10)
  };
}

class AdvanceSettlementService {
  async listAdvances(companyId, user) {
    ensureCompany(companyId);
    const collaborator = user?.role === 'collaborator'
      ? await getCollaboratorForUser(companyId, user.id)
      : null;
    const values = collaborator ? [companyId, collaborator.id] : [companyId];

    const result = await pool.query(
      `SELECT
         barber_advances.id, barber_advances.company_id, barber_advances.collaborator_id,
         barber_collaborators.nickname AS collaborator_name,
         barber_advances.amount, barber_advances.reason, barber_advances.status,
         barber_advances.approved_by, barber_advances.approved_at, barber_advances.created_at
       FROM barber_advances
       INNER JOIN barber_collaborators
         ON barber_collaborators.id = barber_advances.collaborator_id
        AND barber_collaborators.company_id = barber_advances.company_id
       WHERE barber_advances.company_id = $1
         ${collaborator ? 'AND barber_advances.collaborator_id = $2' : ''}
       ORDER BY barber_advances.created_at DESC`,
      values
    );
    return result.rows;
  }

  async createAdvance(companyId, data, user) {
    ensureCompany(companyId);

    const userCollaborator = user?.role === 'collaborator'
      ? await getCollaboratorForUser(companyId, user.id)
      : null;
    const collaboratorId = userCollaborator?.id || data.collaborator_id || data.collaboratorId;
    const amount = toNumber(data.amount);
    const reason = String(data.reason || '').trim() || null;

    if (!collaboratorId) {
      throw createError('Colaborador e obrigatorio', 400);
    }
    if (amount <= 0) {
      throw createError('Valor do vale invalido', 400);
    }

    const collaborator = await pool.query(
      `SELECT id FROM barber_collaborators WHERE id = $1 AND company_id = $2 AND is_active = true AND COALESCE(is_deleted, false) = false`,
      [collaboratorId, companyId]
    );
    if (collaborator.rowCount === 0) {
      throw createError('Colaborador nao encontrado', 404);
    }

    const result = await pool.query(
      `INSERT INTO barber_advances (company_id, collaborator_id, amount, reason, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id, company_id, collaborator_id, amount, reason, status, approved_by, approved_at, created_at`,
      [companyId, collaboratorId, amount, reason]
    );
    return result.rows[0];
  }

  async updateAdvanceStatus(companyId, userId, advanceId, status, data = {}) {
    ensureCompany(companyId);

    if (!ADVANCE_STATUS.includes(status) || status === 'pending') {
      throw createError('Status de vale invalido', 400);
    }

    const CompanyService = require('./company.service');
    const companyService = new CompanyService();
    await companyService.validateApprovalCredential(companyId, userId, data);

    const result = await pool.query(
      `UPDATE barber_advances
       SET status = $1, approved_by = $2, approved_at = NOW()
       WHERE id = $3 AND company_id = $4 AND status = 'pending'
       RETURNING id, company_id, collaborator_id, amount, reason, status, approved_by, approved_at, created_at`,
      [status, userId, advanceId, companyId]
    );

    if (result.rowCount === 0) {
      throw createError('Vale pendente nao encontrado', 404);
    }
    return result.rows[0];
  }

  async listSettlements(companyId, collaboratorId, user, options = {}) {
    ensureCompany(companyId);
    const userCollaborator = user?.role === 'collaborator'
      ? await getCollaboratorForUser(companyId, user.id)
      : null;

    if (user?.role === 'collaborator' && collaboratorId && collaboratorId !== userCollaborator?.id) {
      ensureAdmin(user, 'Apenas admin pode consultar fechamentos de outros colaboradores');
    }

    const effectiveCollaboratorId = userCollaborator?.id || collaboratorId;
    const values = [companyId];
    let filter = 'WHERE barber_settlements.company_id = $1';

    if (effectiveCollaboratorId) {
      values.push(effectiveCollaboratorId);
      filter += ` AND barber_settlements.collaborator_id = $${values.length}`;
    }

    const settlementsResult = await pool.query(
      `SELECT
         barber_settlements.id, barber_settlements.company_id, barber_settlements.collaborator_id,
         barber_collaborators.nickname AS collaborator_name,
         barber_settlements.total_sales, barber_settlements.total_commission,
         barber_settlements.total_advances, barber_settlements.net_amount,
         barber_settlements.period_start, barber_settlements.period_end,
         barber_settlements.closed_by, barber_settlements.created_at
       FROM barber_settlements
       INNER JOIN barber_collaborators
         ON barber_collaborators.id = barber_settlements.collaborator_id
        AND barber_collaborators.company_id = barber_settlements.company_id
       ${filter}
       ORDER BY barber_settlements.created_at DESC`,
      values
    );

    const response = { settlements: settlementsResult.rows };
    if (effectiveCollaboratorId) {
      response.preview = await calculateSettlement(companyId, effectiveCollaboratorId, pool, options);
    }
    return response;
  }

  async createSettlement(companyId, user, data) {
    ensureCompany(companyId);
    ensureAdmin(user, 'Apenas admin pode realizar fechamento');

    const collaboratorId = data.collaborator_id || data.collaboratorId;
    if (!collaboratorId) {
      throw createError('Colaborador e obrigatorio', 400);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const preview = await calculateSettlement(companyId, collaboratorId, client, {
        startDate: data.startDate || data.start_date,
        endDate: data.endDate || data.end_date
      });
      const periodEnd = data.endDate || data.end_date ? normalizeDateInput(data.endDate || data.end_date) : new Date();

      const result = await client.query(
        `INSERT INTO barber_settlements (company_id, collaborator_id, total_sales, total_commission, total_advances, net_amount, period_start, period_end, closed_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, company_id, collaborator_id, total_sales, total_commission, total_advances, net_amount, period_start, period_end, closed_by, created_at`,
        [companyId, collaboratorId, preview.total_sales, preview.total_commission, preview.total_advances, preview.net_amount, preview.period_start, periodEnd, user.id]
      );

      await client.query(
        `UPDATE barber_advances
         SET status = 'liquidated', liquidated_at = NOW(), settlement_id = $3
         WHERE company_id = $1 AND collaborator_id = $2 AND status = 'approved'
           AND ($4::date IS NULL OR created_at::date >= $4::date)
           AND ($5::date IS NULL OR created_at::date <= $5::date)`,
        [companyId, collaboratorId, result.rows[0].id, data.startDate || data.start_date || null, data.endDate || data.end_date || null]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = AdvanceSettlementService;
