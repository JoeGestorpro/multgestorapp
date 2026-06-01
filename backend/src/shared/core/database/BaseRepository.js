const pool = require('../../../config/database')

class BaseRepository {
  constructor(tableName, db = pool, { tenantScoped = false } = {}) {
    this.tableName = tableName
    this.db = db
    // tenantScoped: quando true, create() exige company_id no payload como
    // rede de segurança (defesa-em-profundidade) contra escrita sem tenant.
    // Repositórios que sobrescrevem create() com assinatura própria não dependem disto.
    this.tenantScoped = tenantScoped
  }

  async findById(id, companyId) {
    let query = `SELECT * FROM ${this.tableName} WHERE id = $1`
    const values = [id]

    if (companyId) {
      query += ` AND company_id = $2`
      values.push(companyId)
    }

    query += ` LIMIT 1`

    const result = await this.db.query(query, values)
    return result.rows[0] || null
  }

  async findAll(companyId, options = {}) {
    const {
      page = 1,
      limit = 50,
      orderBy = 'created_at',
      order = 'desc',
      filters = {},
    } = options

    const conditions = []
    const values = []
    let paramIndex = 1

    if (companyId) {
      conditions.push(`company_id = $${paramIndex}`)
      values.push(companyId)
      paramIndex++
    }

    if (filters.is_deleted !== undefined) {
      conditions.push(`is_deleted = $${paramIndex}`)
      values.push(filters.is_deleted)
      paramIndex++
    } else {
      conditions.push(`COALESCE(is_deleted, false) = false`)
    }

    if (filters.is_active !== undefined) {
      conditions.push(`is_active = $${paramIndex}`)
      values.push(filters.is_active)
      paramIndex++
    }

    if (filters.search) {
      values.push(`%${filters.search}%`)
      conditions.push(`(name ILIKE $${paramIndex} OR COALESCE(description, '') ILIKE $${paramIndex})`)
      paramIndex++
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM ${this.tableName} ${where}`,
      values
    )
    const total = countResult.rows[0].total

    const safeLimit = Math.min(Math.max(1, Number(limit)), 100)
    const safePage = Math.max(1, Number(page))
    const offset = (safePage - 1) * safeLimit

    const allowedOrderColumns = ['created_at', 'updated_at', 'name', 'id']
    const safeOrderBy = allowedOrderColumns.includes(orderBy) ? orderBy : 'created_at'
    const safeOrder = order === 'asc' ? 'ASC' : 'DESC'

    const dataResult = await this.db.query(
      `SELECT * FROM ${this.tableName}
       ${where}
       ORDER BY ${safeOrderBy} ${safeOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, safeLimit, offset]
    )

    return {
      data: dataResult.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    }
  }

  async create(data) {
    if (this.tenantScoped && (data == null || data.company_id == null)) {
      throw new Error(
        `BaseRepository.create: company_id é obrigatório para a tabela tenant-scoped "${this.tableName}"`
      )
    }

    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map((_, i) => `$${i + 1}`)

    const result = await this.db.query(
      `INSERT INTO ${this.tableName} (${keys.join(', ')})
       VALUES (${placeholders.join(', ')})
       RETURNING *`,
      values
    )

    return result.rows[0]
  }

  async update(id, companyId, data) {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`)

    let paramIndex = keys.length + 1
    const conditions = [`id = $${paramIndex}`]
    values.push(id)
    paramIndex++

    if (companyId) {
      conditions.push(`company_id = $${paramIndex}`)
      values.push(companyId)
      paramIndex++
    }

    if ('updated_at' in data === false) {
      setClauses.push(`updated_at = NOW()`)
    }

    const result = await this.db.query(
      `UPDATE ${this.tableName}
       SET ${setClauses.join(', ')}
       WHERE ${conditions.join(' AND ')}
       RETURNING *`,
      values
    )

    return result.rows[0] || null
  }

  async softDelete(id, companyId) {
    let query = `UPDATE ${this.tableName}
       SET is_deleted = true, updated_at = NOW()`
    const values = []
    let paramIndex = 1

    const conditions = [`id = $${paramIndex}`]
    values.push(id)
    paramIndex++

    if (companyId) {
      conditions.push(`company_id = $${paramIndex}`)
      values.push(companyId)
      paramIndex++
    }

    conditions.push(`COALESCE(is_deleted, false) = false`)

    const result = await this.db.query(
      `${query} WHERE ${conditions.join(' AND ')} RETURNING id`,
      values
    )

    return result.rows[0] || null
  }

  async hardDelete(id, companyId) {
    const values = [id]
    let paramIndex = 2
    const conditions = [`id = $1`]

    if (companyId) {
      conditions.push(`company_id = $${paramIndex}`)
      values.push(companyId)
      paramIndex++
    }

    const result = await this.db.query(
      `DELETE FROM ${this.tableName} WHERE ${conditions.join(' AND ')} RETURNING id`,
      values
    )

    return result.rows[0] || null
  }

  async count(companyId, filters = {}) {
    const conditions = []
    const values = []
    let paramIndex = 1

    if (companyId) {
      conditions.push(`company_id = $${paramIndex}`)
      values.push(companyId)
      paramIndex++
    }

    if (filters.is_deleted !== undefined) {
      conditions.push(`is_deleted = $${paramIndex}`)
      values.push(filters.is_deleted)
      paramIndex++
    } else {
      conditions.push(`COALESCE(is_deleted, false) = false`)
    }

    if (filters.is_active !== undefined) {
      conditions.push(`is_active = $${paramIndex}`)
      values.push(filters.is_active)
      paramIndex++
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM ${this.tableName} ${where}`,
      values
    )

    return result.rows[0].total
  }

  async exists(companyId, conditions = {}) {
    const keys = Object.keys(conditions)
    const values = Object.values(conditions)
    const whereClauses = keys.map((k, i) => `${k} = $${i + 1}`)

    let paramIndex = keys.length + 1
    if (companyId) {
      whereClauses.push(`company_id = $${paramIndex}`)
      values.push(companyId)
      paramIndex++
    }

    const result = await this.db.query(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE ${whereClauses.join(' AND ')}) AS exists`,
      values
    )

    return result.rows[0].exists
  }
}

module.exports = { BaseRepository }
