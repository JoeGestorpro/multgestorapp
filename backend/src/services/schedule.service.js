const pool = require('../config/database');
const { appLogger } = require('../shared/core/logger');
const { AppError } = require('../shared');
const clientBookingService = require('./client-booking.service');
const CollaboratorService = require('./collaborator.service');
const CollaboratorRepository = require('../repositories/collaborator.repository');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureCompany(companyId) {
  if (!companyId) {
    throw createError('Usuario sem empresa vinculada', 403);
  }
}

function ensureCashManager(user, message = 'Apenas usuarios autorizados podem operar o caixa') {
  if (!['admin', 'master_admin', 'secretary'].includes(user?.role)) {
    throw createError(message, 403);
  }
}

function ensureAdmin(user, message = 'Apenas admin pode alterar o catalogo de servicos') {
  if (!['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)) {
    throw createError(message, 403);
  }
}

async function ensureWorkingHoursSchema(client = pool) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS barber_working_hours (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      collaborator_id UUID NULL REFERENCES barber_collaborators(id) ON DELETE CASCADE,
      weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
      opens_at TIME NOT NULL,
      closes_at TIME NOT NULL,
      is_closed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      CONSTRAINT uq_barber_working_hours_comp_coll_day UNIQUE (company_id, collaborator_id, weekday)
    )
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_barber_working_hours_company ON barber_working_hours(company_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_barber_working_hours_company_weekday ON barber_working_hours(company_id, weekday)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_barber_working_hours_collaborator ON barber_working_hours(collaborator_id)');
}

function computeWeeklyHoursJson(workingHours) {
  const weekly = { '0': null, '1': null, '2': null, '3': null, '4': null, '5': null, '6': null };
  const generalHours = workingHours.filter(w => !w.collaborator_id && !w.is_closed && w.opens_at && w.closes_at);
  for (const wh of generalHours) {
    const key = String(wh.weekday);
    if (!weekly[key]) {
      weekly[key] = { start: wh.opens_at.slice(0, 5), end: wh.closes_at.slice(0, 5) };
    }
  }
  return weekly;
}

class ScheduleService {
  constructor() {
    this.collaboratorService = new CollaboratorService(new CollaboratorRepository());
  }

  async listScheduleBlocks(companyId, user, query = {}) {
    ensureCompany(companyId);
    const result = await pool.query(
      `SELECT * FROM barber_booking_blocks
       WHERE company_id = $1
       ORDER BY starts_at DESC`,
      [companyId]
    );
    return result.rows;
  }

  async createScheduleBlock(companyId, user, data) {
    ensureCompany(companyId);
    ensureCashManager(user);

    const result = await pool.query(
      `INSERT INTO barber_booking_blocks (company_id, collaborator_id, starts_at, ends_at, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [companyId, data.collaboratorId || null, data.startsAt, data.endsAt, data.reason]
    );

    return result.rows[0];
  }

  async deleteScheduleBlock(companyId, user, blockId) {
    ensureCompany(companyId);
    ensureCashManager(user);

    const result = await pool.query(
      'DELETE FROM barber_booking_blocks WHERE id = $1 AND company_id = $2',
      [blockId, companyId]
    );

    if (result.rowCount === 0) {
      throw createError('Bloqueio nao encontrado', 404);
    }

    return true;
  }

  async listWorkingHours(companyId, user) {
    ensureCompany(companyId);

    try {
      await ensureWorkingHoursSchema();

      const result = await pool.query(
        `SELECT *
         FROM barber_working_hours
         WHERE company_id = $1
         ORDER BY weekday ASC, collaborator_id ASC NULLS FIRST`,
        [companyId]
      );

      return result.rows;
    } catch (error) {
      appLogger.error({ err: error }, '[BARBER WORKING HOURS] erro ao listar horarios');

      if (error.code === '42P01') {
        return [];
      }

      throw error;
    }
  }

  async updateWorkingHours(companyId, user, data) {
    ensureCompany(companyId);
    ensureAdmin(user);

    await ensureWorkingHoursSchema();

    const { weekday, opensAt, closesAt, isClosed, collaboratorId } = data;

    const result = await pool.query(
      `INSERT INTO barber_working_hours (company_id, collaborator_id, weekday, opens_at, closes_at, is_closed, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (company_id, collaborator_id, weekday)
       DO UPDATE SET opens_at = EXCLUDED.opens_at,
                     closes_at = EXCLUDED.closes_at,
                     is_closed = EXCLUDED.is_closed,
                     updated_at = NOW()
       RETURNING *`,
      [companyId, collaboratorId || null, weekday, opensAt, closesAt, isClosed]
    );

    return result.rows[0];
  }

  async getAvailability(companyId, user) {
    ensureCompany(companyId);

    const [collaborators, workingHours, settings] = await Promise.all([
      this.collaboratorService.list(companyId, user),
      this.listWorkingHours(companyId, user),
      clientBookingService.getBookingSettings(companyId)
    ]);

    const blocksResult = await pool.query(
      `SELECT b.*, COALESCE(u.name, c.nickname) AS collaborator_name
       FROM barber_booking_blocks b
       LEFT JOIN barber_collaborators c ON c.id = b.collaborator_id
       LEFT JOIN users u ON u.id = c.user_id
       WHERE b.company_id = $1
       ORDER BY b.starts_at DESC`,
      [companyId]
    );

    return {
      collaborators,
      working_hours: workingHours,
      blocks: blocksResult.rows,
      settings: {
        timezone: settings.timezone || 'America/Cuiaba',
        slot_interval_minutes: Number(settings.slot_interval_minutes || 30)
      }
    };
  }

  async updateAvailability(companyId, user, data) {
    ensureCompany(companyId);
    ensureAdmin(user, 'Apenas admin pode alterar a disponibilidade');

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await ensureWorkingHoursSchema(client);

      const currentRows = await client.query(
        `SELECT id FROM barber_working_hours WHERE company_id = $1`,
        [companyId]
      );
      for (const row of currentRows.rows) {
        await client.query('DELETE FROM barber_working_hours WHERE id = $1 AND company_id = $2', [row.id, companyId]);
      }

      const workingHours = data.working_hours || [];
      for (const wh of workingHours) {
        await client.query(
          `INSERT INTO barber_working_hours (company_id, collaborator_id, weekday, opens_at, closes_at, is_closed, pauses, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            companyId,
            wh.collaborator_id || null,
            wh.weekday,
            wh.opens_at || null,
            wh.closes_at || null,
            wh.is_closed === true,
            JSON.stringify(wh.pauses || [])
          ]
        );
      }

      const weeklyHoursJson = computeWeeklyHoursJson(workingHours);
      await client.query(
        `UPDATE barber_booking_settings SET weekly_hours = $1, updated_at = NOW() WHERE company_id = $2`,
        [JSON.stringify(weeklyHoursJson), companyId]
      );

      await client.query('COMMIT');

      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      appLogger.error({ err: error }, '[BARBER AVAILABILITY] erro ao atualizar disponibilidade');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = ScheduleService;
