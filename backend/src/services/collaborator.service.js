const bcrypt = require('bcryptjs')
const fs = require('fs/promises')
const path = require('path')
const pool = require('../config/database')
const supabase = require('../config/supabase')
const { appLogger } = require('../shared/core/logger')
const CollaboratorRepository = require('../repositories/collaborator.repository')
const { ValidationError, NotFoundError, ForbiddenError, ConflictError, AppError } = require('../shared')
const { isValidEmail, isValidPassword, normalizeEmail, toNumber } = require('../utils/validators')
const {
  isSaleActiveSql,
  buildReportPeriod
} = require('../utils/barber-helpers')

const COLLABORATOR_AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024
const COLLABORATOR_AVATAR_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
}
const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', 'uploads')

const COMMISSION_TYPES = ['percentage', 'fixed']

function ensureCompany(companyId) {
  if (!companyId) {
    throw new ForbiddenError('Usuario sem empresa vinculada')
  }
}

function ensureAdmin(user, message) {
  if (!['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)) {
    throw new ForbiddenError(message || 'Apenas admin pode acessar colaboradores')
  }
}

function normalizeCollaboratorPayload(data = {}) {
  return {
    name: String(data.name || data.nickname || '').trim(),
    email: normalizeEmail(data.email),
    password: String(data.password || data.initialPassword || ''),
    phone: String(data.phone || '').trim() || null,
    commissionType: String(data.commission_type || data.commissionType || 'percentage').trim() || 'percentage',
    commissionRate: toNumber(data.commission_rate || data.commissionRate),
    isActive: data.is_active === undefined && data.isActive === undefined
      ? true
      : Boolean(data.is_active ?? data.isActive),
    canLaunchSales: data.can_launch_sales === undefined && data.canLaunchSales === undefined
      ? false
      : Boolean(data.can_launch_sales ?? data.canLaunchSales),
    canMakeBarter: data.can_make_barter === undefined && data.canMakeBarter === undefined
      ? false
      : Boolean(data.can_make_barter ?? data.canMakeBarter),
    availableForBooking: data.available_for_booking === undefined && data.availableForBooking === undefined
      ? false
      : Boolean(data.available_for_booking ?? data.availableForBooking),
    canViewOwnDashboard: data.can_view_own_dashboard === undefined && data.canViewOwnDashboard === undefined
      ? true
      : Boolean(data.can_view_own_dashboard ?? data.canViewOwnDashboard),
    canViewOwnReports: data.can_view_own_reports === undefined && data.canViewOwnReports === undefined
      ? true
      : Boolean(data.can_view_own_reports ?? data.canViewOwnReports)
  }
}

function validateCollaboratorPayload(payload, options = {}) {
  if (!payload.name) {
    throw new ValidationError('Nome do colaborador e obrigatorio')
  }

  if (!payload.email) {
    throw new ValidationError('Email do colaborador e obrigatorio')
  }

  if (!isValidEmail(payload.email)) {
    throw new ValidationError('Informe um e-mail valido para o colaborador.')
  }

  if (!options.allowMissingPassword && !isValidPassword(payload.password, 6)) {
    throw new ValidationError('A senha inicial deve ter pelo menos 6 caracteres')
  }

  if (payload.password && !isValidPassword(payload.password, 6)) {
    throw new ValidationError('A senha deve ter pelo menos 6 caracteres')
  }

  if (!COMMISSION_TYPES.includes(payload.commissionType)) {
    throw new ValidationError('Tipo de comissao invalido')
  }

  if (payload.commissionRate < 0) {
    throw new ValidationError('Comissao invalida')
  }
}

function mergeCollaboratorData(collaborator, user) {
  if (!collaborator) return null
  return {
    ...collaborator,
    name: user?.name || collaborator.nickname,
    email: user?.email || null,
    phone: user?.phone || null,
    role: user?.role || 'collaborator',
    can_launch_sales: user?.can_launch_sales ?? false,
    can_view_own_dashboard: user?.can_view_own_dashboard ?? true,
    can_view_own_reports: user?.can_view_own_reports ?? true,
    user_is_active: user?.is_active ?? true
  }
}

class CollaboratorService {
  constructor(repository, companyPlanService = null) {
    this.repository = repository
    this.companyPlanService = companyPlanService
  }

  async list(companyId, user) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode listar colaboradores')

    const collaborators = await this.repository.findAll(companyId)
    return collaborators.map(c => mergeCollaboratorData(c, c))
  }

  async getById(companyId, user, collaboratorId) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode visualizar colaboradores')

    const collaborator = await this.repository.findByIdWithUser(companyId, collaboratorId)

    if (!collaborator) {
      throw new NotFoundError('Colaborador')
    }

    return mergeCollaboratorData(collaborator, collaborator)
  }

  async getByUserId(companyId, userId) {
    const collaborator = await this.repository.findByUserId(companyId, userId)
    return collaborator || null
  }

  async create(companyId, user, data) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode cadastrar colaboradores')

    const payload = normalizeCollaboratorPayload(data)
    validateCollaboratorPayload(payload)

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1 LIMIT 1',
        [payload.email]
      )

      if (existingUser.rowCount > 0) {
        throw new ConflictError('Este e-mail ja possui acesso cadastrado')
      }

      const passwordHash = await bcrypt.hash(payload.password, 10)

      const userResult = await client.query(
        `INSERT INTO users (
           company_id, name, email, password_hash, phone, role,
           is_active, can_launch_sales, can_view_own_dashboard,
           can_view_own_reports, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, 'collaborator', $6, $7, $8, $9, NOW())
         RETURNING id, company_id, name, email, phone, role, is_active,
                   can_launch_sales, can_view_own_dashboard, can_view_own_reports,
                   created_at, updated_at`,
        [
          companyId, payload.name, payload.email, passwordHash,
          payload.phone, payload.isActive, payload.canLaunchSales,
          payload.canViewOwnDashboard, payload.canViewOwnReports
        ]
      )

      const collaboratorResult = await client.query(
        `INSERT INTO barber_collaborators (
           company_id, user_id, nickname, commission_type, commission_rate,
           can_make_barter, available_for_booking, avatar_url,
           is_active, is_deleted, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, false, NOW())
         RETURNING id, company_id, user_id, nickname, commission_type,
                   commission_rate, can_make_barter, available_for_booking,
                   avatar_url, is_active, is_deleted, created_at, updated_at`,
        [
          companyId, userResult.rows[0].id, payload.name || payload.name,
          payload.commissionType, payload.commissionRate,
          payload.canMakeBarter, payload.availableForBooking, payload.isActive
        ]
      )

      await client.query('COMMIT')

      return mergeCollaboratorData(collaboratorResult.rows[0], userResult.rows[0])
    } catch (error) {
      await client.query('ROLLBACK')

      if (error.code === '23505') {
        throw new ConflictError('Este e-mail ja possui acesso cadastrado')
      }

      throw error
    } finally {
      client.release()
    }
  }

  async update(companyId, user, collaboratorId, data) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode editar colaboradores')

    const existing = await this.repository.findByIdWithUser(companyId, collaboratorId)

    if (!existing) {
      throw new NotFoundError('Colaborador')
    }

    const payload = normalizeCollaboratorPayload(data)
    validateCollaboratorPayload(payload, { allowMissingPassword: true })

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const duplicateUser = await client.query(
        'SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1',
        [payload.email, existing.user_id]
      )

      if (duplicateUser.rowCount > 0) {
        throw new ConflictError('Este e-mail ja possui acesso cadastrado')
      }

      let passwordClause = ''
      const userValues = [
        existing.user_id, companyId, payload.name, payload.email,
        payload.phone, payload.isActive, payload.canLaunchSales,
        payload.canViewOwnDashboard, payload.canViewOwnReports
      ]

      if (payload.password) {
        const passwordHash = await bcrypt.hash(payload.password, 10)
        userValues.push(passwordHash)
        passwordClause = `, password_hash = $${userValues.length}`
      }

      await client.query(
        `UPDATE users
         SET company_id = $2, name = $3, email = $4, phone = $5,
             is_active = $6, can_launch_sales = $7,
             can_view_own_dashboard = $8, can_view_own_reports = $9
             ${passwordClause}, updated_at = NOW()
         WHERE id = $1 AND company_id = $2`,
        userValues
      )

      const collaboratorResult = await client.query(
        `UPDATE barber_collaborators
         SET nickname = $3, commission_type = $4, commission_rate = $5,
             can_make_barter = $6, available_for_booking = $7,
             is_active = $8, updated_at = NOW()
         WHERE id = $1 AND company_id = $2
           AND COALESCE(is_deleted, false) = false
         RETURNING id, company_id, user_id, nickname, commission_type,
                   commission_rate, can_make_barter, available_for_booking,
                   avatar_url, is_active, is_deleted, created_at, updated_at`,
        [
          collaboratorId, companyId, payload.name, payload.commissionType,
          payload.commissionRate, payload.canMakeBarter,
          payload.availableForBooking, payload.isActive
        ]
      )

      await client.query('COMMIT')

      return mergeCollaboratorData(collaboratorResult.rows[0], {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: existing.role,
        can_launch_sales: payload.canLaunchSales,
        can_view_own_dashboard: payload.canViewOwnDashboard,
        can_view_own_reports: payload.canViewOwnReports,
        is_active: payload.isActive
      })
    } catch (error) {
      await client.query('ROLLBACK')

      if (error.code === '23505') {
        throw new ConflictError('Este e-mail ja possui acesso cadastrado')
      }

      throw error
    } finally {
      client.release()
    }
  }

  async updateStatus(companyId, user, collaboratorId, data = {}) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode alterar status de colaborador')

    const existing = await this.repository.findById(companyId, collaboratorId)

    if (!existing) {
      throw new NotFoundError('Colaborador')
    }

    const isActive = data.is_active === undefined && data.isActive === undefined
      ? null
      : Boolean(data.is_active ?? data.isActive)

    if (isActive === null) {
      throw new ValidationError('Status do colaborador e obrigatorio')
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      await client.query(
        `UPDATE users SET is_active = $2, updated_at = NOW()
         WHERE id = $1 AND company_id = $3`,
        [existing.user_id, isActive, companyId]
      )

      const collaborator = await this.repository.updateStatus(companyId, collaboratorId, isActive)

      await client.query('COMMIT')

      return collaborator
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async updatePermissions(companyId, user, collaboratorId, data = {}) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode alterar permissoes de colaborador')

    const existing = await this.repository.findByIdWithUser(companyId, collaboratorId)

    if (!existing) {
      throw new NotFoundError('Colaborador')
    }

    const canLaunchSales = data.can_launch_sales === undefined && data.canLaunchSales === undefined
      ? existing.can_launch_sales
      : Boolean(data.can_launch_sales ?? data.canLaunchSales)
    const canViewOwnDashboard = data.can_view_own_dashboard === undefined && data.canViewOwnDashboard === undefined
      ? existing.can_view_own_dashboard
      : Boolean(data.can_view_own_dashboard ?? data.canViewOwnDashboard)
    const canViewOwnReports = data.can_view_own_reports === undefined && data.canViewOwnReports === undefined
      ? existing.can_view_own_reports
      : Boolean(data.can_view_own_reports ?? data.canViewOwnReports)

    await pool.query(
      `UPDATE users
       SET can_launch_sales = $3, can_view_own_dashboard = $4,
           can_view_own_reports = $5, updated_at = NOW()
       WHERE id = $1 AND company_id = $2`,
      [existing.user_id, companyId, canLaunchSales, canViewOwnDashboard, canViewOwnReports]
    )

    return {
      ...existing,
      can_launch_sales: canLaunchSales,
      can_view_own_dashboard: canViewOwnDashboard,
      can_view_own_reports: canViewOwnReports
    }
  }

  async updateAvatar(companyId, user, collaboratorId, avatarUrl) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode alterar a foto do colaborador')

    const existing = await this.repository.findById(companyId, collaboratorId)

    if (!existing) {
      throw new NotFoundError('Colaborador')
    }

    const collaborator = await this.repository.updateAvatar(companyId, collaboratorId, avatarUrl)
    return { ...existing, ...collaborator }
  }

  async delete(companyId, user, collaboratorId) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode excluir colaborador')

    const existing = await this.repository.findById(companyId, collaboratorId)

    if (!existing) {
      throw new NotFoundError('Colaborador')
    }

    await this.repository.softDelete(companyId, collaboratorId)
    return true
  }

  // --- listCollaboratorFinancialSummary ---
  async listCollaboratorFinancialSummary(companyId, user, query = {}) {
    ensureCompany(companyId)

    const requestedCollaboratorId = query.collaboratorId || query.collaborator_id || null
    const userCollaborator = user.role === 'collaborator'
      ? await this.repository.findByUserId(companyId, user.id)
      : null
    const collaboratorId = userCollaborator?.id || requestedCollaboratorId || null

    if (user.role === 'collaborator' && requestedCollaboratorId && requestedCollaboratorId !== userCollaborator?.id) {
      ensureAdmin(user, 'Apenas admin pode consultar resumo financeiro de outros colaboradores')
    }

    const { start, end } = buildReportPeriod(query.period, query.startDate || query.start_date, query.endDate || query.end_date)

    const result = await pool.query(
      `WITH filtered_collaborators AS (
         SELECT
           barber_collaborators.id,
           barber_collaborators.nickname,
           barber_collaborators.commission_type,
           barber_collaborators.commission_rate,
           barber_collaborators.can_make_barter,
           barber_collaborators.is_active,
           users.name
         FROM barber_collaborators
         LEFT JOIN users ON users.id = barber_collaborators.user_id
         WHERE barber_collaborators.company_id = $1
           AND COALESCE(barber_collaborators.is_deleted, false) = false
           AND ($4::uuid IS NULL OR barber_collaborators.id = $4::uuid)
       ),
       sale_item_agg AS (
         SELECT
           barber_sale_items.sale_id,
           COALESCE(SUM(barber_sale_items.total_price), 0)::numeric AS gross_total,
           COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN 0 ELSE barber_sale_items.commission_amount END), 0)::numeric AS normal_commission_total,
           COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sale_items.commission_amount ELSE 0 END), 0)::numeric AS barter_commission_total
         FROM barber_sale_items
         INNER JOIN barber_sales
           ON barber_sales.id = barber_sale_items.sale_id
          AND barber_sales.company_id = barber_sale_items.company_id
         WHERE barber_sales.company_id = $1
           AND barber_sales.sale_date_local BETWEEN $2::date AND $3::date
           AND ${isSaleActiveSql('barber_sales')}
         GROUP BY barber_sale_items.sale_id
       ),
       sale_agg AS (
         SELECT
           barber_sales.collaborator_id,
           COUNT(barber_sales.id)::integer AS sales_count,
           COALESCE(SUM(COALESCE(sale_item_agg.gross_total, barber_sales.total_amount)), 0)::numeric AS gross_revenue,
           COALESCE(SUM(
             CASE
               WHEN barber_sales.payment_method = 'permuta' THEN 0
               WHEN sale_item_agg.sale_id IS NOT NULL THEN COALESCE(sale_item_agg.normal_commission_total, 0)
               WHEN filtered_collaborators.commission_type = 'fixed' THEN COALESCE(filtered_collaborators.commission_rate, 0)
               ELSE COALESCE(barber_sales.total_amount, 0) * (COALESCE(filtered_collaborators.commission_rate, 0) / 100.0)
             END
           ), 0)::numeric AS normal_commission_total,
           COALESCE(SUM(
             CASE
               WHEN barber_sales.payment_method <> 'permuta' THEN 0
               WHEN sale_item_agg.sale_id IS NOT NULL THEN COALESCE(sale_item_agg.barter_commission_total, 0)
               WHEN filtered_collaborators.commission_type = 'fixed' THEN COALESCE(filtered_collaborators.commission_rate, 0)
               ELSE COALESCE(barber_sales.total_amount, 0) * (COALESCE(filtered_collaborators.commission_rate, 0) / 100.0)
             END
           ), 0)::numeric AS barter_commission_total,
           MAX(barber_sales.created_at) AS last_sale_at
         FROM barber_sales
         INNER JOIN filtered_collaborators ON filtered_collaborators.id = barber_sales.collaborator_id
         LEFT JOIN sale_item_agg ON sale_item_agg.sale_id = barber_sales.id
         WHERE barber_sales.company_id = $1
           AND barber_sales.sale_date_local BETWEEN $2::date AND $3::date
           AND ${isSaleActiveSql('barber_sales')}
         GROUP BY barber_sales.collaborator_id
       ),
       advance_agg AS (
         SELECT
           barber_advances.collaborator_id,
           COALESCE(SUM(barber_advances.amount), 0)::numeric AS advances_total
         FROM barber_advances
         WHERE barber_advances.company_id = $1
           AND barber_advances.created_at::date BETWEEN $2::date AND $3::date
           AND barber_advances.status IN ('approved', 'liquidated')
           AND ($4::uuid IS NULL OR barber_advances.collaborator_id = $4::uuid)
         GROUP BY barber_advances.collaborator_id
       )
       SELECT
         filtered_collaborators.id AS collaborator_id,
         COALESCE(filtered_collaborators.name, filtered_collaborators.nickname) AS collaborator_name,
         filtered_collaborators.nickname AS collaborator_nickname,
         filtered_collaborators.commission_type,
         COALESCE(filtered_collaborators.commission_rate, 0)::numeric AS commission_rate,
         COALESCE(sale_agg.gross_revenue, 0)::numeric AS gross_revenue,
         COALESCE(sale_agg.normal_commission_total, 0)::numeric AS commission_total,
         COALESCE(sale_agg.barter_commission_total, 0)::numeric AS barter_commission_total,
         COALESCE(advance_agg.advances_total, 0)::numeric AS advances_total,
         (COALESCE(sale_agg.normal_commission_total, 0) - COALESCE(sale_agg.barter_commission_total, 0) - COALESCE(advance_agg.advances_total, 0))::numeric AS net_to_receive,
         COALESCE(sale_agg.sales_count, 0)::integer AS sales_count,
         COALESCE(sale_agg.sales_count, 0)::integer AS attendances_count,
         sale_agg.last_sale_at,
         filtered_collaborators.is_active
       FROM filtered_collaborators
       LEFT JOIN sale_agg ON sale_agg.collaborator_id = filtered_collaborators.id
       LEFT JOIN advance_agg ON advance_agg.collaborator_id = filtered_collaborators.id
       ORDER BY COALESCE(sale_agg.gross_revenue, 0) DESC, collaborator_name ASC`,
      [companyId, start, end, collaboratorId]
    )

    return result.rows.map((row) => ({
      ...row,
      period_start: start,
      period_end: end
    }))
  }

  // --- saveCollaboratorAvatar ---
  async saveCollaboratorAvatar(companyId, user, collaboratorId, file) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode alterar a foto do colaborador')

    const collaborator = await this.repository.findByIdWithUser(companyId, collaboratorId)
    if (!collaborator) {
      throw new AppError('Colaborador nao encontrado', 404, 'NOT_FOUND')
    }

    if (!file) {
      throw new AppError('Envie uma imagem para o colaborador', 400, 'VALIDATION_ERROR')
    }

    const extension = COLLABORATOR_AVATAR_MIME_TYPES[file.mimetype]
    if (!extension) {
      throw new AppError('Formato de imagem nao suportado', 400, 'VALIDATION_ERROR')
    }

    const bucket = process.env.SUPABASE_BUCKET || 'barber-collaborators'
    const storagePath = `${companyId}/${collaboratorId}/avatar.${extension}`

    let avatarUrl

    if (supabase) {
      if (!process.env.SUPABASE_URL) throw new AppError('SUPABASE_URL ausente no ambiente', 500, 'INTERNAL_ERROR')
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('INSIRA_SUA')) {
        throw new AppError('SUPABASE_SERVICE_ROLE_KEY invalida ou nao configurada no .env', 500, 'INTERNAL_ERROR')
      }

      appLogger.info({ storagePath }, '[supabase-upload] Iniciando upload')
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        })

      if (error) {
        appLogger.error({ bucket, storagePath, mimetype: file?.mimetype, size: file?.size, err: error }, '[supabase-avatar-upload-error]')
        throw new Error(`Erro real do Supabase: ${error.message}`)
      }

      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(storagePath)
      avatarUrl = publicData.publicUrl
    } else {
      const avatarDirectory = path.join(UPLOADS_ROOT, 'barber-collaborators', String(companyId), String(collaboratorId))
      const relativePath = path.posix.join('barber-collaborators', String(companyId), String(collaboratorId), `avatar.${extension}`)
      const filePath = path.join(UPLOADS_ROOT, relativePath)

      await fs.mkdir(avatarDirectory, { recursive: true })

      const existingFiles = await fs.readdir(avatarDirectory).catch(() => [])
      await Promise.all(
        existingFiles
          .filter((fileName) => fileName.startsWith('avatar.'))
          .map((fileName) => fs.unlink(path.join(avatarDirectory, fileName)).catch(() => undefined))
      )

      await fs.writeFile(filePath, file.buffer)
      avatarUrl = `/${String(relativePath || '').replace(/\\/g, '/').replace(/^\/+/, '')}`
    }

    const result = await pool.query(
      `UPDATE barber_collaborators
       SET avatar_url = $3, updated_at = NOW()
       WHERE id = $1 AND company_id = $2 AND COALESCE(is_deleted, false) = false
       RETURNING id, company_id, user_id, nickname, commission_type, commission_rate, available_for_booking, avatar_url, is_active, is_deleted, created_at, updated_at`,
      [collaboratorId, companyId, avatarUrl]
    )

    return { ...collaborator, ...result.rows[0] }
  }

  // --- removeCollaboratorAvatar ---
  async removeCollaboratorAvatar(companyId, user, collaboratorId) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode remover a foto do colaborador')

    const collaborator = await this.repository.findByIdWithUser(companyId, collaboratorId)
    if (!collaborator) {
      throw new AppError('Colaborador nao encontrado', 404, 'NOT_FOUND')
    }

    const bucket = process.env.ICE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'barber-collaborators'

    if (supabase) {
      const { data: listData, error: listError } = await supabase.storage
        .from(bucket)
        .list(`${companyId}/${collaboratorId}`)

      if (!listError && listData) {
        const filesToDelete = listData
          .filter(file => file.name.startsWith('avatar.'))
          .map(file => `${companyId}/${collaboratorId}/${file.name}`)

        if (filesToDelete.length > 0) {
          await supabase.storage.from(bucket).remove(filesToDelete)
        }
      }
    } else {
      const avatarDirectory = path.join(UPLOADS_ROOT, 'barber-collaborators', String(companyId), String(collaboratorId))
      const existingFiles = await fs.readdir(avatarDirectory).catch(() => [])

      await Promise.all(
        existingFiles
          .filter((fileName) => fileName.startsWith('avatar.'))
          .map((fileName) => fs.unlink(path.join(avatarDirectory, fileName)).catch(() => undefined))
      )
    }

    const result = await pool.query(
      `UPDATE barber_collaborators
       SET avatar_url = NULL, updated_at = NOW()
       WHERE id = $1 AND company_id = $2 AND COALESCE(is_deleted, false) = false
       RETURNING id, company_id, user_id, nickname, commission_type, commission_rate, available_for_booking, avatar_url, is_active, is_deleted, created_at, updated_at`,
      [collaboratorId, companyId]
    )

    return { ...collaborator, ...result.rows[0] }
  }
}

module.exports = CollaboratorService
