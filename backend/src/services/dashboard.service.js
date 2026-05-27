const pool = require('../config/database');
const { appLogger } = require('../shared/core/logger');
const CollaboratorRepository = require('../repositories/collaborator.repository');
const CashSessionRepository = require('../repositories/cash-session.repository');
const {
  createError,
  toNumber,
  ensureCompany,
  isSaleActiveSql,
  getBusinessDateString,
  normalizeDateInput,
  getMonthRange,
  getWeekRange,
  addDateDays,
  buildBusinessTimestampRange,
  buildReportPeriod,
  isBarterPayment
} = require('../utils/barber-helpers');

async function getCollaboratorForUser(companyId, userId) {
  const repo = new CollaboratorRepository();
  const collaborator = await repo.findByUserId(companyId, userId);
  if (!collaborator) {
    throw createError('Colaborador nao vinculado ao usuario', 403);
  }
  return collaborator;
}

function ensureCollaboratorRole(user) {
  if (user?.role !== 'collaborator') {
    throw createError('Acesso permitido apenas para colaborador', 403);
  }
}

function requireCollaboratorPermission(user, permission, message) {
  if (user?.role !== 'collaborator') return;
  if (!user?.[permission]) throw createError(message, 403);
}

async function getPersonalCommissionSummary(companyId, collaboratorId, startDate, endDate) {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN 0 ELSE barber_sale_items.commission_amount END), 0)::numeric AS commission,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sale_items.commission_amount ELSE 0 END), 0)::numeric AS barter_commission,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sale_items.total_price ELSE 0 END), 0)::numeric AS barter_total,
       COUNT(DISTINCT barber_sales.id)::integer AS sales
     FROM barber_sales
     LEFT JOIN barber_sale_items
       ON barber_sale_items.sale_id = barber_sales.id
      AND barber_sale_items.company_id = barber_sales.company_id
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2
       AND COALESCE(barber_sales.sale_date_local, barber_sales.created_at::date) BETWEEN $3::date AND $4::date
       AND ${isSaleActiveSql('barber_sales')}`,
    [companyId, collaboratorId, startDate, endDate]
  );
  const sales = Number(result.rows[0]?.sales || 0);
  return {
    commission: toNumber(result.rows[0]?.commission),
    barterCommission: toNumber(result.rows[0]?.barter_commission),
    barterTotal: toNumber(result.rows[0]?.barter_total),
    netCommission: toNumber(result.rows[0]?.commission) - toNumber(result.rows[0]?.barter_commission),
    appointments: sales,
    sales
  };
}

class DashboardService {
  async getDashboard(companyId, user) {
    ensureCompany(companyId);
    if (user?.role === 'client') {
      throw createError('Clientes finais nao podem acessar o dashboard administrativo', 403);
    }
    if (user?.role === 'collaborator') {
      return this.getMyDashboard(companyId, user);
    }

    const csRepo = new CashSessionRepository();
    const todayCash = await csRepo.getCashDailyDetails(companyId, getBusinessDateString(), { createIfMissing: true, userId: user.id });
    const today = getBusinessDateString();
    const revenueStartDate = addDateDays(today, -6);

    const commissionsResult = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN 0 ELSE barber_sale_items.commission_amount END), 0)::numeric AS total_commissions,
         COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sale_items.commission_amount ELSE 0 END), 0)::numeric AS barter_commissions
       FROM barber_sale_items
       INNER JOIN barber_sales
         ON barber_sales.id = barber_sale_items.sale_id
        AND barber_sales.company_id = barber_sale_items.company_id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local = $2::date
         AND ${isSaleActiveSql('barber_sales')}`,
      [companyId, getBusinessDateString()]
    );

    const recentSalesResult = await pool.query(
      `SELECT
         barber_sales.id,
         barber_collaborators.nickname AS collaborator_name,
         barber_sales.payment_method,
         barber_sales.total_amount,
         barber_sales.sale_date_local,
         barber_sales.created_at
       FROM barber_sales
       LEFT JOIN barber_collaborators
         ON barber_collaborators.id = barber_sales.collaborator_id
        AND barber_collaborators.company_id = barber_sales.company_id
       WHERE barber_sales.company_id = $1
         AND ${isSaleActiveSql('barber_sales')}
       ORDER BY barber_sales.created_at DESC
       LIMIT 10`,
      [companyId]
    );

    const dailyRevenueResult = await pool.query(
      `SELECT
         TO_CHAR(barber_sales.sale_date_local::date, 'YYYY-MM-DD') AS date,
         COALESCE(SUM(COALESCE(item_totals.gross_total, barber_sales.total_amount)), 0)::numeric AS revenue,
         COUNT(barber_sales.id)::integer AS total_sales
       FROM barber_sales
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(total_price), 0)::numeric AS gross_total
         FROM barber_sale_items
         WHERE barber_sale_items.sale_id = barber_sales.id
           AND barber_sale_items.company_id = barber_sales.company_id
       ) item_totals ON true
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local::date BETWEEN $2::date AND $3::date
         AND ${isSaleActiveSql('barber_sales')}
       GROUP BY barber_sales.sale_date_local::date
       ORDER BY barber_sales.sale_date_local::date ASC`,
      [companyId, revenueStartDate, today]
    );

    const collaboratorSummaryResult = await pool.query(
      `SELECT
         barber_collaborators.id AS collaborator_id,
         barber_collaborators.nickname AS collaborator_name,
         COALESCE(sale_totals.total_sales, 0)::numeric AS total_sales,
         COALESCE(sale_totals.normal_commission, 0)::numeric AS total_commission,
         COALESCE(sale_totals.barter_commission, 0)::numeric AS barter_commission,
         COALESCE(approved_advances.total_advances, 0)::numeric AS total_advances,
         (COALESCE(sale_totals.normal_commission, 0) - COALESCE(sale_totals.barter_commission, 0) - COALESCE(approved_advances.total_advances, 0))::numeric AS net_commission
       FROM barber_collaborators
       LEFT JOIN (
         SELECT
           barber_sales.collaborator_id,
           SUM(COALESCE(sale_commissions.gross_total, barber_sales.total_amount)) AS total_sales,
           SUM(COALESCE(sale_commissions.normal_commission, 0)) AS normal_commission,
           SUM(COALESCE(sale_commissions.barter_commission, 0)) AS barter_commission
         FROM barber_sales
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
         GROUP BY barber_sales.collaborator_id
       ) sale_totals ON sale_totals.collaborator_id = barber_collaborators.id
       LEFT JOIN (
         SELECT collaborator_id, SUM(amount) AS total_advances
         FROM barber_advances
         WHERE company_id = $1 AND status = 'approved'
         GROUP BY collaborator_id
       ) approved_advances ON approved_advances.collaborator_id = barber_collaborators.id
       WHERE barber_collaborators.company_id = $1
         AND COALESCE(barber_collaborators.is_deleted, false) = false
       ORDER BY total_sales DESC`,
      [companyId, getBusinessDateString()]
    );

    const session = todayCash.session;
    return {
      totalDaySales: session.gross_total,
      totalPix: session.pix_total,
      totalCash: session.cash_total,
      totalCredit: session.credit_total,
      totalDebit: session.debit_total,
      totalPermuta: session.trade_total,
      totalCommissions: commissionsResult.rows[0].total_commissions,
      barterCommissions: commissionsResult.rows[0].barter_commissions,
      totalBarterCommissions: commissionsResult.rows[0].barter_commissions,
      dailyRevenue: dailyRevenueResult.rows,
      recentSales: recentSalesResult.rows,
      collaboratorSummary: collaboratorSummaryResult.rows,
      cashSession: session,
      viewMode: 'admin'
    };
  }

  async getMyDashboard(companyId, user) {
    ensureCompany(companyId);
    ensureCollaboratorRole(user);
    requireCollaboratorPermission(user, 'can_view_own_dashboard', 'Seu acesso ao dashboard proprio esta desativado');

    const collaborator = await getCollaboratorForUser(companyId, user.id);
    const today = getBusinessDateString();
    const weekRange = getWeekRange(today);
    const monthRange = getMonthRange(today);

    const commissionsResult = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN 0 ELSE barber_sale_items.commission_amount END), 0)::numeric AS total_commission,
         COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sale_items.commission_amount ELSE 0 END), 0)::numeric AS barter_commission,
         COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sale_items.total_price ELSE 0 END), 0)::numeric AS barter_total
       FROM barber_sale_items
       INNER JOIN barber_sales
         ON barber_sales.id = barber_sale_items.sale_id
        AND barber_sales.company_id = barber_sale_items.company_id
       WHERE barber_sales.company_id = $1
         AND barber_sales.collaborator_id = $2
         AND ${isSaleActiveSql('barber_sales')}`,
      [companyId, collaborator.id]
    );

    const advancesResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total_advances
       FROM barber_advances
       WHERE company_id = $1
         AND collaborator_id = $2
         AND status IN ('approved', 'liquidated')`,
      [companyId, collaborator.id]
    );

    const [todaySummary, weekSummary, monthSummary] = await Promise.all([
      getPersonalCommissionSummary(companyId, collaborator.id, today, today),
      getPersonalCommissionSummary(companyId, collaborator.id, weekRange.start, weekRange.end),
      getPersonalCommissionSummary(companyId, collaborator.id, monthRange.start, monthRange.end)
    ]);

    const recentSalesResult = await pool.query(
      `SELECT
         barber_sales.id,
         barber_sales.created_at,
         barber_sales.sale_date_local,
         COALESCE(barber_sales.status, 'active') AS status,
         COALESCE(barber_sales.customer_name, barber_sales.client_name) AS customer_name,
         sale_item.item_summary AS service_name,
         barber_sales.payment_method,
         barber_sales.total_amount,
         COALESCE(sale_item.total_commission, 0)::numeric AS commission_amount,
         CASE WHEN barber_sales.payment_method = 'permuta' THEN 'debit' ELSE 'credit' END AS commission_effect
       FROM barber_sales
       LEFT JOIN LATERAL (
         SELECT
           STRING_AGG(description, ' + ' ORDER BY created_at ASC) AS item_summary,
           COALESCE(SUM(commission_amount), 0)::numeric AS total_commission
         FROM barber_sale_items
         WHERE barber_sale_items.sale_id = barber_sales.id
       ) sale_item ON true
       WHERE barber_sales.company_id = $1
         AND barber_sales.collaborator_id = $2
         AND ${isSaleActiveSql('barber_sales')}
       ORDER BY barber_sales.created_at DESC
       LIMIT 8`,
      [companyId, collaborator.id]
    );

    const totalCommission = toNumber(commissionsResult.rows[0].total_commission);
    const barterCommission = toNumber(commissionsResult.rows[0].barter_commission);
    const barterTotal = toNumber(commissionsResult.rows[0].barter_total);
    const totalAdvances = toNumber(advancesResult.rows[0].total_advances);
    const netCommission = totalCommission - barterCommission - totalAdvances;

    return {
      collaborator: {
        id: collaborator.id,
        nickname: collaborator.nickname,
        commission_type: collaborator.commission_type,
        commission_rate: collaborator.commission_rate,
        can_make_barter: collaborator.can_make_barter
      },
      ownMetrics: {
        totalAttendances: todaySummary.appointments,
        myCommissionTotal: totalCommission,
        myCommissionAccumulated: totalCommission,
        myAdvances: totalAdvances,
        mySettlementBalance: netCommission,
        todayCommission: todaySummary.commission,
        todayBarterTotal: todaySummary.barterTotal,
        todayBarterCommission: todaySummary.barterCommission,
        todayNetCommission: todaySummary.netCommission,
        todayAttendances: todaySummary.appointments,
        totalCommission,
        barterCommission,
        barterTotal,
        netCommission,
        weekCommission: weekSummary.commission,
        weekBarterTotal: weekSummary.barterTotal,
        weekBarterCommission: weekSummary.barterCommission,
        weekNetCommission: weekSummary.netCommission,
        weekAttendances: weekSummary.appointments,
        monthCommission: monthSummary.commission,
        monthBarterTotal: monthSummary.barterTotal,
        monthBarterCommission: monthSummary.barterCommission,
        monthNetCommission: monthSummary.netCommission,
        monthAttendances: monthSummary.appointments,
        totalAdvances,
        today: todaySummary,
        week: weekSummary,
        month: monthSummary
      },
      recentSales: recentSalesResult.rows,
      viewMode: 'collaborator'
    };
  }

  async getMySales(companyId, user) {
    ensureCompany(companyId);
    ensureCollaboratorRole(user);
    requireCollaboratorPermission(user, 'can_view_own_reports', 'Seu acesso ao historico pessoal esta desativado');

    const collaborator = await getCollaboratorForUser(companyId, user.id);

    const result = await pool.query(
      `SELECT
         barber_sales.id,
         barber_sales.created_at,
         barber_sales.sale_date_local,
         COALESCE(barber_sales.status, 'active') AS status,
         COALESCE(barber_sales.customer_name, barber_sales.client_name) AS customer_name,
         barber_sales.payment_method,
         barber_sales.total_amount,
         sale_item.item_summary AS service_name,
         COALESCE(sale_item.total_commission, 0)::numeric AS commission_amount,
         CASE WHEN barber_sales.payment_method = 'permuta' THEN 'debit' ELSE 'credit' END AS commission_effect
       FROM barber_sales
       LEFT JOIN LATERAL (
         SELECT
           STRING_AGG(description, ' + ' ORDER BY created_at ASC) AS item_summary,
           COALESCE(SUM(commission_amount), 0)::numeric AS total_commission
         FROM barber_sale_items
         WHERE barber_sale_items.sale_id = barber_sales.id
           AND barber_sale_items.company_id = barber_sales.company_id
       ) sale_item ON true
       WHERE barber_sales.company_id = $1
         AND barber_sales.collaborator_id = $2
         AND ${isSaleActiveSql('barber_sales')}
       ORDER BY barber_sales.created_at DESC
       LIMIT 50`,
      [companyId, collaborator.id]
    );

    return result.rows;
  }

  async getMyReport(companyId, user, query = {}) {
    ensureCompany(companyId);
    ensureCollaboratorRole(user);
    requireCollaboratorPermission(user, 'can_view_own_reports', 'Seu acesso ao relatorio pessoal esta desativado');

    const collaborator = await getCollaboratorForUser(companyId, user.id);
    const { start, end } = buildReportPeriod(query.period, query.startDate || query.start_date, query.endDate || query.end_date);
    const todayDate = getBusinessDateString();
    const weekRange = getWeekRange(todayDate);
    const monthRange = getMonthRange(todayDate);

    const salesResult = await pool.query(
      `SELECT
         barber_sales.id,
         barber_sales.created_at,
         barber_sales.sale_date_local,
         COALESCE(barber_sales.status, 'active') AS status,
         COALESCE(barber_sales.customer_name, barber_sales.client_name) AS customer_name,
         barber_sales.payment_method,
         barber_sales.total_amount,
         sale_item.item_summary AS service_name,
         sale_item.total_commission AS commission_amount,
         CASE WHEN barber_sales.payment_method = 'permuta' THEN 'debit' ELSE 'credit' END AS commission_effect
       FROM barber_sales
       LEFT JOIN LATERAL (
         SELECT
           STRING_AGG(description, ' + ' ORDER BY created_at ASC) AS item_summary,
           COALESCE(SUM(commission_amount), 0)::numeric AS total_commission
         FROM barber_sale_items
         WHERE barber_sale_items.sale_id = barber_sales.id
           AND barber_sale_items.company_id = barber_sales.company_id
       ) sale_item ON true
       WHERE barber_sales.company_id = $1
         AND barber_sales.collaborator_id = $2
         AND COALESCE(barber_sales.sale_date_local, barber_sales.created_at::date) BETWEEN $3::date AND $4::date
         AND ${isSaleActiveSql('barber_sales')}
       ORDER BY barber_sales.created_at DESC`,
      [companyId, collaborator.id, start, end]
    );

    const totals = salesResult.rows.reduce((accumulator, sale) => {
      accumulator.totalCommission += toNumber(sale.commission_amount);
      if (isBarterPayment(sale.payment_method)) {
        accumulator.barterCommission += toNumber(sale.commission_amount);
        accumulator.barterTotal += toNumber(sale.total_amount);
      } else {
        accumulator.normalCommission += toNumber(sale.commission_amount);
      }
      accumulator.attendances += 1;
      return accumulator;
    }, {
      totalCommission: 0,
      normalCommission: 0,
      barterCommission: 0,
      barterTotal: 0,
      attendances: 0
    });

    const advancesResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS total_advances
       FROM barber_advances
       WHERE company_id = $1
         AND collaborator_id = $2
         AND created_at::date BETWEEN $3::date AND $4::date
         AND status IN ('approved', 'liquidated')`,
      [companyId, collaborator.id, start, end]
    );

    const totalAdvances = toNumber(advancesResult.rows[0].total_advances);
    const [today, week, month] = await Promise.all([
      getPersonalCommissionSummary(companyId, collaborator.id, todayDate, todayDate),
      getPersonalCommissionSummary(companyId, collaborator.id, weekRange.start, weekRange.end),
      getPersonalCommissionSummary(companyId, collaborator.id, monthRange.start, monthRange.end)
    ]);

    return {
      collaborator: {
        id: collaborator.id,
        nickname: collaborator.nickname,
        commission_type: collaborator.commission_type,
        commission_rate: collaborator.commission_rate,
        can_make_barter: collaborator.can_make_barter
      },
      period: {
        start,
        end,
        filter: query.period || 'today'
      },
      totals: {
        totalCommission: totals.totalCommission,
        normalCommission: totals.normalCommission,
        barterCommission: totals.barterCommission,
        barterTotal: totals.barterTotal,
        totalAdvances,
        netCommission: totals.normalCommission - totals.barterCommission - totalAdvances,
        attendances: totals.attendances
      },
      today,
      week,
      month,
      recentSales: salesResult.rows.slice(0, 8),
      sales: salesResult.rows
    };
  }

  async getServicesAnalytics(companyId, query = {}) {
    ensureCompany(companyId);

    const period = query.period || 'month';
    let dateFrom;
    const now = new Date();

    if (period === 'month') {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (period === 'last_month') {
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    } else if (period === 'year') {
      dateFrom = new Date(now.getFullYear(), 0, 1).toISOString();
    } else {
      dateFrom = null;
    }

    const maisVendidosResult = await pool.query(`
      SELECT
        COALESCE(si.description, 'Sem nome') as service_name,
        COUNT(*) as quantidade_execucoes,
        SUM(si.quantity) as total_quantidade,
        SUM(si.total_price) as receita_total,
        AVG(si.unit_price) as ticket_medio,
        ROUND(SUM(si.total_price) * 100.0 / NULLIF(SUM(SUM(si.total_price)) OVER (), 0), 1) as participacao_percentual
      FROM barber_sale_items si
      JOIN barber_sales s ON s.id = si.sale_id
      WHERE s.company_id = $1
        AND s.deleted_at IS NULL
        AND ($2::timestamptz IS NULL OR s.created_at >= $2)
      GROUP BY si.description
      ORDER BY receita_total DESC
      LIMIT 30
    `, [companyId, dateFrom]);

    const favoritosResult = await pool.query(`
      SELECT
        COALESCE(si.description, 'Sem nome') as service_name,
        COUNT(DISTINCT si.sale_id) as total_vendas,
        COUNT(DISTINCT s.customer_id) as total_clientes,
        SUM(si.quantity) as total_quantidade,
        MAX(s.created_at) as ultima_execucao
      FROM barber_sale_items si
      JOIN barber_sales s ON s.id = si.sale_id
      WHERE s.company_id = $1
        AND s.deleted_at IS NULL
        AND s.customer_id IS NOT NULL
        AND ($2::timestamptz IS NULL OR s.created_at >= $2)
      GROUP BY si.description
      ORDER BY total_clientes DESC, total_quantidade DESC
      LIMIT 30
    `, [companyId, dateFrom]);

    const comissoesResult = await pool.query(`
      SELECT
        bs.id as service_id,
        bs.name as service_name,
        bs.commission_type,
        bs.commission_value,
        COUNT(si.id) FILTER (WHERE s.deleted_at IS NULL) as total_vendas_periodo,
        COALESCE(SUM(si.total_price) FILTER (WHERE s.deleted_at IS NULL), 0) as receita_periodo,
        CASE
          WHEN bs.commission_type = 'percentage' AND bs.commission_value IS NOT NULL
            THEN ROUND(COALESCE(SUM(si.total_price) FILTER (WHERE s.deleted_at IS NULL), 0) * bs.commission_value / 100, 2)
          WHEN bs.commission_type = 'fixed' AND bs.commission_value IS NOT NULL
            THEN ROUND(COUNT(si.id) FILTER (WHERE s.deleted_at IS NULL) * bs.commission_value, 2)
          ELSE 0
        END as total_comissao_estimada
      FROM barber_services bs
      LEFT JOIN barber_sale_items si ON si.service_id = bs.id AND si.company_id = bs.company_id
      LEFT JOIN barber_sales s ON s.id = si.sale_id AND s.company_id = $1
      WHERE bs.company_id = $1
        AND bs.deleted_at IS NULL
        AND ($2::timestamptz IS NULL OR s.created_at >= $2)
      GROUP BY bs.id, bs.name, bs.commission_type, bs.commission_value
      ORDER BY total_comissao_estimada DESC
      LIMIT 30
    `, [companyId, dateFrom]);

    return {
      mais_vendidos: maisVendidosResult.rows.map(r => ({
        service_name: r.service_name,
        quantidade_execucoes: Number(r.quantidade_execucoes),
        total_quantidade: Number(r.total_quantidade),
        receita_total: String(r.receita_total || '0'),
        ticket_medio: String(r.ticket_medio || '0'),
        participacao_percentual: Number(r.participacao_percentual) || 0
      })),
      favoritos: favoritosResult.rows.map(r => ({
        service_name: r.service_name,
        total_vendas: Number(r.total_vendas),
        total_clientes: Number(r.total_clientes),
        total_quantidade: Number(r.total_quantidade),
        ultima_execucao: r.ultima_execucao
      })),
      comissoes: comissoesResult.rows.map(r => ({
        service_id: r.service_id,
        service_name: r.service_name,
        commission_type: r.commission_type,
        commission_value: r.commission_value ? Number(r.commission_value) : null,
        total_vendas_periodo: Number(r.total_vendas_periodo),
        receita_periodo: String(r.receita_periodo || '0'),
        total_comissao_estimada: String(r.total_comissao_estimada || '0')
      }))
    };
  }
}

module.exports = DashboardService;
