const pool = require('../config/database');
const { appLogger } = require('../shared/core/logger');
const { createUnitOfWork, AppError } = require('../shared');
const CashSessionRepository = require('../repositories/cash-session.repository');

const BUSINESS_TIMEZONE = 'America/Cuiaba';

function ensureCompany(companyId) {
  if (!companyId) throw new AppError('Usuario sem empresa vinculada', 403, 'FORBIDDEN');
}

function ensureCashManager(user, message = 'Apenas usuarios autorizados podem operar o caixa') {
  if (!['admin', 'master_admin', 'secretary'].includes(user?.role)) {
    throw new AppError(message, 403, 'FORBIDDEN');
  }
}

function ensureAdmin(user, message = 'Apenas admin pode alterar o catalogo de servicos') {
  if (!['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)) {
    throw new AppError(message, 403, 'FORBIDDEN');
  }
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getBusinessDateParts(input = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const values = Object.fromEntries(
    formatter
      .formatToParts(input)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeDateInput(value, fallback = null) {
  const normalized = String(value || '').trim();
  if (!normalized) return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError('Data invalida. Use o formato YYYY-MM-DD', 400, 'VALIDATION_ERROR');
  }
  return normalized;
}

function getMonthRange(dateInput = getBusinessDateParts()) {
  const [year, month] = normalizeDateInput(dateInput).split('-').map(Number);
  const start = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(Date.UTC(year, month, 0));
  const end = `${String(endDate.getUTCFullYear()).padStart(4, '0')}-${String(endDate.getUTCMonth() + 1).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`;
  return { start, end };
}

function getWeekRange(dateInput = getBusinessDateParts()) {
  const [year, month, day] = normalizeDateInput(dateInput).split('-').map(Number);
  const reference = new Date(Date.UTC(year, month - 1, day));
  const weekDay = reference.getUTCDay();
  const diff = weekDay === 0 ? 6 : weekDay - 1;
  reference.setUTCDate(reference.getUTCDate() - diff);
  const start = `${String(reference.getUTCFullYear()).padStart(4, '0')}-${String(reference.getUTCMonth() + 1).padStart(2, '0')}-${String(reference.getUTCDate()).padStart(2, '0')}`;
  const endDate = new Date(reference);
  endDate.setUTCDate(reference.getUTCDate() + 6);
  const end = `${String(endDate.getUTCFullYear()).padStart(4, '0')}-${String(endDate.getUTCMonth() + 1).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`;
  return { start, end };
}

function addDateDays(dateInput, days) {
  const [year, month, day] = normalizeDateInput(dateInput).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function buildBusinessTimestampRange(startDate, endDate) {
  const start = normalizeDateInput(startDate);
  const endExclusive = addDateDays(normalizeDateInput(endDate), 1);
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = endExclusive.split('-').map(Number);
  const startUTC = new Date(Date.UTC(startYear, startMonth - 1, startDay, 4, 0, 0, 0));
  const endUTC = new Date(Date.UTC(endYear, endMonth - 1, endDay, 4, 0, 0, 0));
  return { startAt: startUTC.toISOString(), endAt: endUTC.toISOString() };
}

function buildReportPeriod(filter = 'today', startDate, endDate) {
  const period = String(filter || 'today').trim();
  const today = getBusinessDateParts();
  if (period === 'week') return getWeekRange(today);
  if (period === 'month') return getMonthRange(today);
  if (period === 'custom' && startDate && endDate) {
    const start = normalizeDateInput(startDate);
    const end = normalizeDateInput(endDate);
    if (start > end) throw new AppError('Periodo personalizado invalido', 400, 'VALIDATION_ERROR');
    return { start, end };
  }
  return { start: today, end: today };
}

const CASH_STATUS = ['open', 'pre_closed', 'closed'];

class CashFlowService {
  constructor(repository) {
    this.repository = repository || new CashSessionRepository();
  }

  async openCash(companyId, user, data = {}, meta = {}) {
    ensureCompany(companyId);
    ensureCashManager(user);

    const cashDate = normalizeDateInput(data.cash_date || data.cashDate, getBusinessDateParts());
    const openingBalance = toNumber(data.opening_balance ?? data.openingBalance);
    const notes = String(data.notes || '').trim() || null;

    if (openingBalance < 0) {
      throw new AppError('Saldo inicial invalido', 400, 'VALIDATION_ERROR');
    }

    const uow = createUnitOfWork();
    try {
      await uow.begin();
      const repo = uow.repository(CashSessionRepository);
      await repo.ensureExists(companyId, cashDate, user.id, openingBalance, notes);
      const existing = await repo.findByCompanyAndDate(companyId, cashDate);
      if (existing?.status === 'closed') {
        throw new AppError('Este caixa ja foi fechado e nao pode ser alterado', 409, 'CONFLICT');
      }
      await repo.open(companyId, cashDate, openingBalance, user.id, notes);
      const session = await repo.recalculate(companyId, cashDate);
      await repo.appendAuditLog(companyId, user.id, 'open_cash', session.id, {
        cash_date: cashDate, opening_balance: openingBalance, notes
      });
      uow.addEvent('cash_session.opened', {
        session_id: session.id, company_id: companyId, cash_date: cashDate,
        opening_balance: openingBalance, opened_by: user.id, notes
      }, {
        traceId: meta?.traceId || require('crypto').randomUUID(),
        companyId, aggregateType: 'cash_session', aggregateId: session.id
      });
      await uow.commit();
      return session;
    } catch (err) {
      await uow.rollback();
      throw err;
    }
  }

  async closeCash(companyId, user, data = {}, meta = {}) {
    ensureCompany(companyId);
    ensureCashManager(user);

    const cashDate = normalizeDateInput(data.cash_date || data.cashDate, getBusinessDateParts());
    const notes = String(data.notes || '').trim() || null;

    const uow = createUnitOfWork();
    try {
      await uow.begin();
      const repo = uow.repository(CashSessionRepository);
      await repo.ensureExists(companyId, cashDate, user.id, 0, notes);
      const existing = await repo.findByCompanyAndDate(companyId, cashDate);
      if (existing?.status === 'closed') {
        throw new AppError('Este caixa ja foi fechado e nao pode ser alterado', 409, 'CONFLICT');
      }
      await repo.recalculate(companyId, cashDate);
      const session = await repo.close(companyId, cashDate, user.id, notes);
      await repo.appendAuditLog(companyId, user.id, 'close_cash', session.id, {
        cash_date: cashDate, notes
      });
      uow.addEvent('cash_session.closed', {
        session_id: session.id, company_id: companyId, cash_date: cashDate,
        opening_balance: session.opening_balance, gross_total: session.gross_total,
        net_total: session.net_total, pix_total: session.pix_total,
        cash_total: session.cash_total, credit_total: session.credit_total,
        debit_total: session.debit_total, trade_total: session.trade_total,
        change_total: session.change_total, discount_total: session.discount_total,
        total_sales: session.total_sales, total_services: session.total_services,
        closed_by: user.id, notes
      }, {
        traceId: meta?.traceId || require('crypto').randomUUID(),
        companyId, aggregateType: 'cash_session', aggregateId: session.id
      });
      await uow.commit();
      return session;
    } catch (err) {
      await uow.rollback();
      throw err;
    }
  }

  async getTodayCash(companyId, user) {
    ensureCompany(companyId);
    ensureCashManager(user);
    return this.repository.getCashDailyDetails(companyId, getBusinessDateParts(), {
      createIfMissing: true, userId: user.id
    });
  }

  async getDailyCash(companyId, user, cashDate) {
    ensureCompany(companyId);
    ensureCashManager(user);
    return this.repository.getCashDailyDetails(companyId, cashDate, {
      createIfMissing: normalizeDateInput(cashDate, getBusinessDateParts()) === getBusinessDateParts(),
      userId: user.id
    });
  }

  async listCashHistory(companyId, user, query = {}) {
    ensureCompany(companyId);
    ensureCashManager(user);

    const status = String(query.status || 'all').trim();
    const startDate = normalizeDateInput(query.startDate || query.start_date, null);
    const endDate = normalizeDateInput(query.endDate || query.end_date, null);
    const limit = Math.min(Math.max(Number(query.limit || 45), 1), 180);
    const values = [companyId];
    const where = ['company_id = $1'];

    if (status !== 'all') {
      if (!CASH_STATUS.includes(status)) {
        throw new AppError('Status do caixa invalido', 400, 'VALIDATION_ERROR');
      }
      values.push(status);
      where.push(`status = $${values.length}`);
    }
    if (startDate) { values.push(startDate); where.push(`cash_date >= $${values.length}::date`); }
    if (endDate) { values.push(endDate); where.push(`cash_date <= $${values.length}::date`); }
    values.push(limit);

    const result = await pool.query(
      `SELECT id, company_id, cash_date, status, opened_at, closed_at, opening_balance,
              gross_total, net_total, pix_total, cash_total, credit_total, debit_total,
              trade_total, discount_total, change_total, total_sales, total_services,
              opened_by, closed_by, notes, created_at, updated_at
       FROM barber_cash_sessions
       WHERE ${where.join(' AND ')}
       ORDER BY cash_date DESC
       LIMIT $${values.length}`,
      values
    );
    return result.rows;
  }

  async getWeeklyCash(companyId, user, query = {}) {
    const range = getWeekRange(normalizeDateInput(query.date || query.startDate || query.start_date, getBusinessDateParts()));
    return this.repository.getCashRangeSummary(companyId, user, range);
  }

  async getMonthlyCash(companyId, user, query = {}) {
    const monthReference = String(query.month || '').trim()
      ? `${String(query.month).trim()}-01`
      : normalizeDateInput(query.date, getBusinessDateParts());
    const range = getMonthRange(monthReference);
    const summary = await this.repository.getCashRangeSummary(companyId, user, range);
    const ordered = [...summary.days].sort((first, second) => toNumber(first.gross_total) - toNumber(second.gross_total));
    const totalDays = summary.days.length || 0;
    return {
      ...summary,
      average_daily_gross: totalDays > 0 ? summary.totals.gross_total / totalDays : 0,
      best_day: ordered[ordered.length - 1] || null,
      worst_day: ordered[0] || null
    };
  }

  async preCloseCash(companyId, user, data = {}) {
    ensureCompany(companyId);
    ensureCashManager(user);

    const cashDate = normalizeDateInput(data.cash_date || data.cashDate, getBusinessDateParts());
    const notes = String(data.notes || '').trim() || null;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const session = await this.repository.ensureCashSession(companyId, cashDate, user.id, client);
      this.repository.ensureCashSessionEditable(session);
      await this.repository.recalculateCashSession(companyId, cashDate, client);
      const result = await client.query(
        `UPDATE barber_cash_sessions SET status = 'pre_closed', notes = COALESCE($3, notes), updated_at = NOW()
         WHERE company_id = $1 AND cash_date = $2::date RETURNING id`,
        [companyId, cashDate, notes]
      );
      await this.repository.appendCashAuditLog(companyId, user.id, 'pre_close_cash', result.rows[0]?.id || session.id, { cash_date: cashDate, notes }, client);
      await client.query('COMMIT');
      return this.repository.getCashDailyDetails(companyId, cashDate, pool);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async reopenCash(companyId, user, data = {}) {
    ensureCompany(companyId);
    ensureAdmin(user, 'Apenas admin pode reabrir caixa fechado');

    const cashDate = normalizeDateInput(data.cash_date || data.cashDate, getBusinessDateParts());
    const notes = String(data.notes || '').trim() || null;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const session = await this.repository.getCashSessionRow(companyId, cashDate, client);
      if (!session) throw new AppError('Caixa diario nao encontrado', 404, 'NOT_FOUND');
      const result = await client.query(
        `UPDATE barber_cash_sessions SET status = 'open', closed_at = NULL, closed_by = NULL, notes = COALESCE($3, notes), updated_at = NOW()
         WHERE company_id = $1 AND cash_date = $2::date RETURNING id`,
        [companyId, cashDate, notes]
      );
      await this.repository.recalculateCashSession(companyId, cashDate, client);
      await this.repository.appendCashAuditLog(companyId, user.id, 'reopen_cash', result.rows[0]?.id || session.id, { cash_date: cashDate, notes }, client);
      await client.query('COMMIT');
      return this.repository.getCashDailyDetails(companyId, cashDate, pool);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = CashFlowService;
