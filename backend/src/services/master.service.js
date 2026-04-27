const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/database');
const emailService = require('./email/email.service');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeSlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeStatus(status, allowed, fallback) {
  const value = String(status || fallback || '').trim().toLowerCase();
  return allowed.includes(value) ? value : fallback;
}

function getPagination(query = {}) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

async function tableExists(tableName) {
  const result = await pool.query('SELECT to_regclass($1) AS table_name', [`public.${tableName}`]);
  return Boolean(result.rows[0].table_name);
}

async function audit(action, reqUser, entityType, entityId, metadata = {}) {
  await pool.query(
    `INSERT INTO audit_logs (action, actor_user_id, actor_role, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      action,
      reqUser?.id || null,
      reqUser?.role || null,
      entityType || null,
      entityId || null,
      JSON.stringify(metadata)
    ]
  );
}

async function countFromTable(tableName, whereClause = '') {
  const exists = await tableExists(tableName);

  if (!exists) {
    return 0;
  }

  const result = await pool.query(`SELECT COUNT(*)::int AS total FROM ${tableName} ${whereClause}`);
  return result.rows[0].total;
}

async function getDashboardData() {
  const [
    totalCompanies,
    totalModules,
    totalActiveModules,
    totalActiveSubscriptions,
    totalPendingActivations,
    recentCompanies,
    recentModules,
    subscriptionsByStatus,
    companiesByNiche
  ] = await Promise.all([
    countFromTable('companies', 'WHERE COALESCE(is_deleted, false) = false'),
    countFromTable('modules'),
    countFromTable('modules', 'WHERE is_active = true'),
    countFromTable('subscriptions', "WHERE status = 'active'"),
    countFromTable('company_modules', "WHERE status = 'pending'"),
    getRecentCompanies(),
    getRecentModules(),
    getSubscriptionsByStatus(),
    getCompaniesByNiche()
  ]);

  return {
    totalCompanies,
    totalModules,
    totalActiveModules,
    totalActiveSubscriptions,
    totalPendingActivations,
    recentCompanies,
    recentModules,
    subscriptionsByStatus,
    companiesByNiche,
    total_empresas: totalCompanies,
    total_modulos: totalModules,
    modulos_ativos: totalActiveModules,
    assinaturas_ativas: totalActiveSubscriptions,
    ativacoes_pendentes: totalPendingActivations,
    empresas_recentes: recentCompanies,
    modulos_recentes: recentModules,
    assinaturas_por_status: subscriptionsByStatus,
    empresas_por_nicho: companiesByNiche
  };
}

async function getRecentCompanies() {
  const result = await pool.query(
    `SELECT id, name, document, email, phone, COALESCE(niche, niche_type) AS niche, niche_type, status, created_at
     FROM companies
     WHERE COALESCE(is_deleted, false) = false
     ORDER BY created_at DESC
     LIMIT 5`
  );

  return result.rows;
}

async function getRecentModules() {
  const result = await pool.query(
    `SELECT id, name, slug, description, is_active, created_at
     FROM modules
     ORDER BY created_at DESC
     LIMIT 5`
  );

  return result.rows;
}

async function getSubscriptionsByStatus() {
  const result = await pool.query(
    `SELECT status, COUNT(*)::int AS total
     FROM subscriptions
     GROUP BY status
     ORDER BY status ASC`
  );

  return result.rows;
}

async function getCompaniesByNiche() {
  const result = await pool.query(
    `SELECT COALESCE(niche, niche_type, 'Sem nicho') AS niche, COUNT(*)::int AS total
     FROM companies
     WHERE COALESCE(is_deleted, false) = false
     GROUP BY COALESCE(niche, niche_type, 'Sem nicho')
     ORDER BY total DESC`
  );

  return result.rows;
}

async function listCompanies(query = {}) {
  const hasPagination = query.page !== undefined || query.limit !== undefined || query.q || query.status;
  const { page, limit, offset } = getPagination(query);
  const where = ['COALESCE(is_deleted, false) = false'];
  const values = [];

  if (query.status) {
    values.push(query.status);
    where.push(`status = $${values.length}`);
  }

  if (query.q) {
    values.push(`%${String(query.q).trim()}%`);
    where.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length} OR document ILIKE $${values.length} OR COALESCE(niche, niche_type) ILIKE $${values.length})`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;

  if (!hasPagination) {
    const result = await pool.query(
      `SELECT id, name, document, email, phone, COALESCE(niche, niche_type) AS niche, niche_type, status, owner_user_id, created_at, updated_at
       FROM companies
       ${whereSql}
       ORDER BY name ASC`,
      values
    );
    return result.rows;
  }

  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM companies ${whereSql}`, values);
  const result = await pool.query(
    `SELECT id, name, document, email, phone, COALESCE(niche, niche_type) AS niche, niche_type, status, owner_user_id, created_at, updated_at
     FROM companies
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  return {
    items: result.rows,
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    }
  };
}

async function getCompany(id) {
  const result = await pool.query(
    `SELECT id, name, document, email, phone, COALESCE(niche, niche_type) AS niche, niche_type, status, owner_user_id, created_at, updated_at
     FROM companies
     WHERE id = $1 AND COALESCE(is_deleted, false) = false
     LIMIT 1`,
    [id]
  );

  if (result.rowCount === 0) {
    throw createError('Empresa nao encontrada', 404);
  }

  return result.rows[0];
}

async function createCompany(data, reqUser) {
  const name = String(data.name || '').trim();
  const email = normalizeEmail(data.email);
  const document = String(data.document || '').trim() || null;
  const phone = String(data.phone || '').trim() || null;
  const niche = String(data.niche || data.niche_type || '').trim() || null;
  const status = normalizeStatus(data.status, ['active', 'inactive', 'suspended', 'pending'], 'pending');

  if (!name) {
    throw createError('Nome da empresa e obrigatorio', 400);
  }

  try {
    const result = await pool.query(
      `INSERT INTO companies (name, document, email, phone, niche, niche_type, status, owner_user_id, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5, $6, $7, NOW())
       RETURNING id, name, document, email, phone, niche, niche_type, status, owner_user_id, created_at, updated_at`,
      [name, document, email || null, phone, niche, status, data.owner_user_id || null]
    );

    await audit('company_created', reqUser, 'company', result.rows[0].id, { name });
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw createError('Email da empresa ja cadastrado', 409);
    }
    throw error;
  }
}

async function updateCompany(id, data, reqUser) {
  const fields = [];
  const values = [];

  if (data.name !== undefined) {
    fields.push(`name = $${fields.length + 1}`);
    values.push(String(data.name || '').trim());
  }

  if (data.document !== undefined) {
    fields.push(`document = $${fields.length + 1}`);
    values.push(String(data.document || '').trim() || null);
  }

  if (data.email !== undefined) {
    fields.push(`email = $${fields.length + 1}`);
    values.push(normalizeEmail(data.email) || null);
  }

  if (data.phone !== undefined) {
    fields.push(`phone = $${fields.length + 1}`);
    values.push(String(data.phone || '').trim() || null);
  }

  if (data.niche !== undefined || data.niche_type !== undefined) {
    fields.push(`niche = $${fields.length + 1}`, `niche_type = $${fields.length + 1}`);
    values.push(String(data.niche || data.niche_type || '').trim() || null);
  }

  if (data.status !== undefined) {
    fields.push(`status = $${fields.length + 1}`);
    values.push(normalizeStatus(data.status, ['active', 'inactive', 'suspended', 'pending'], 'pending'));
  }

  if (fields.length === 0) {
    throw createError('Nenhum campo enviado para atualizacao', 400);
  }

  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE companies
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} AND COALESCE(is_deleted, false) = false
       RETURNING id, name, document, email, phone, niche, niche_type, status, owner_user_id, created_at, updated_at`,
      values
    );

    if (result.rowCount === 0) {
      throw createError('Empresa nao encontrada', 404);
    }

    await audit('company_updated', reqUser, 'company', id, data);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw createError('Email da empresa ja cadastrado', 409);
    }
    throw error;
  }
}

async function deleteCompany(id, reqUser) {
  const result = await pool.query(
    `UPDATE companies
     SET is_deleted = true, status = 'inactive', updated_at = NOW()
     WHERE id = $1 AND COALESCE(is_deleted, false) = false
     RETURNING id`,
    [id]
  );

  if (result.rowCount === 0) {
    throw createError('Empresa nao encontrada', 404);
  }

  await audit('company_deleted', reqUser, 'company', id);
  return true;
}

async function updateCompanyStatus(id, status, reqUser) {
  const nextStatus = normalizeStatus(status, ['active', 'inactive', 'suspended', 'pending'], null);

  if (!nextStatus) {
    throw createError('Status invalido', 400);
  }

  const company = await updateCompany(id, { status: nextStatus }, reqUser);
  await audit('company_status_changed', reqUser, 'company', id, { status: nextStatus });
  return company;
}

async function listModules() {
  const result = await pool.query(
    `SELECT id, name, slug, description, is_active, created_at, updated_at
     FROM modules
     ORDER BY created_at DESC`
  );

  return result.rows;
}

async function getModule(id) {
  const result = await pool.query(
    `SELECT id, name, slug, description, is_active, created_at, updated_at
     FROM modules
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  if (result.rowCount === 0) {
    throw createError('Modulo nao encontrado', 404);
  }

  return result.rows[0];
}

async function createModule(data, reqUser) {
  const name = String(data.name || '').trim();
  const slug = normalizeSlug(data.slug || name);
  const description = String(data.description || '').trim() || null;
  const isActive = data.is_active === undefined ? true : Boolean(data.is_active);

  if (!name || !slug) {
    throw createError('Nome e slug sao obrigatorios', 400);
  }

  try {
    const result = await pool.query(
      `INSERT INTO modules (name, slug, description, is_active, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, slug, description, is_active, created_at, updated_at`,
      [name, slug, description, isActive]
    );

    await audit('module_created', reqUser, 'module', result.rows[0].id, { name, slug });
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw createError('Slug ja cadastrado', 409);
    }
    throw error;
  }
}

async function updateModule(id, data, reqUser) {
  const fields = [];
  const values = [];

  if (data.name !== undefined) {
    fields.push(`name = $${fields.length + 1}`);
    values.push(String(data.name).trim());
  }

  if (data.slug !== undefined) {
    fields.push(`slug = $${fields.length + 1}`);
    values.push(normalizeSlug(data.slug));
  }

  if (data.description !== undefined) {
    fields.push(`description = $${fields.length + 1}`);
    values.push(String(data.description || '').trim() || null);
  }

  if (data.is_active !== undefined) {
    fields.push(`is_active = $${fields.length + 1}`);
    values.push(Boolean(data.is_active));
  }

  if (fields.length === 0) {
    throw createError('Nenhum campo enviado para atualizacao', 400);
  }

  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE modules
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, name, slug, description, is_active, created_at, updated_at`,
      values
    );

    if (result.rowCount === 0) {
      throw createError('Modulo nao encontrado', 404);
    }

    await audit('module_updated', reqUser, 'module', id, data);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw createError('Slug ja cadastrado', 409);
    }
    throw error;
  }
}

async function updateModuleStatus(id, isActive, reqUser) {
  return updateModule(id, { is_active: Boolean(isActive) }, reqUser);
}

async function deleteModule(id, reqUser) {
  const linked = await pool.query('SELECT id FROM company_modules WHERE module_id = $1 LIMIT 1', [id]);

  if (linked.rowCount > 0) {
    const module = await updateModule(id, { is_active: false }, reqUser);
    await audit('module_deactivated_due_links', reqUser, 'module', id);
    return { deactivated: true, module };
  }

  const result = await pool.query('DELETE FROM modules WHERE id = $1 RETURNING id', [id]);

  if (result.rowCount === 0) {
    throw createError('Modulo nao encontrado', 404);
  }

  await audit('module_deleted', reqUser, 'module', id);
  return { deleted: true };
}

async function activateModuleForCompany(data, reqUser) {
  const companyId = data.company_id || data.companyId;
  const moduleId = data.module_id || data.moduleId;

  if (!companyId || !moduleId) {
    throw createError('Empresa e modulo sao obrigatorios', 400);
  }

  const moduleResult = await pool.query('SELECT id FROM modules WHERE id = $1 AND is_active = true LIMIT 1', [moduleId]);
  if (moduleResult.rowCount === 0) {
    throw createError('Modulo ativo nao encontrado', 404);
  }

  const companyResult = await pool.query(
    'SELECT id FROM companies WHERE id = $1 AND COALESCE(is_deleted, false) = false LIMIT 1',
    [companyId]
  );
  if (companyResult.rowCount === 0) {
    throw createError('Empresa nao encontrada', 404);
  }

  const existing = await pool.query(
    `SELECT id, status FROM company_modules WHERE company_id = $1 AND module_id = $2 LIMIT 1`,
    [companyId, moduleId]
  );

  let result;
  if (existing.rowCount > 0) {
    if (existing.rows[0].status === 'active') {
      throw createError('Modulo ja esta ativo para esta empresa', 409);
    }

    result = await pool.query(
      `UPDATE company_modules
       SET status = 'active', activated_at = NOW(), deactivated_at = NULL, updated_at = NOW(), activated_by = $3
       WHERE company_id = $1 AND module_id = $2
       RETURNING id, company_id, module_id, status, activated_at, deactivated_at, created_at, updated_at`,
      [companyId, moduleId, reqUser?.id || null]
    );
  } else {
    result = await pool.query(
      `INSERT INTO company_modules (company_id, module_id, status, activated_at, updated_at, activated_by)
       VALUES ($1, $2, 'active', NOW(), NOW(), $3)
       RETURNING id, company_id, module_id, status, activated_at, deactivated_at, created_at, updated_at`,
      [companyId, moduleId, reqUser?.id || null]
    );
  }

  await audit('company_module_activated', reqUser, 'company_module', result.rows[0].id, { companyId, moduleId });
  return result.rows[0];
}

async function deactivateModuleForCompany(data, reqUser) {
  const companyModuleId = data.id || data.company_module_id || data.companyModuleId;
  const companyId = data.company_id || data.companyId;
  const moduleId = data.module_id || data.moduleId;

  const values = [];
  const where = [];

  if (companyModuleId) {
    values.push(companyModuleId);
    where.push(`id = $${values.length}`);
  } else {
    if (!companyId || !moduleId) {
      throw createError('Vinculo, empresa e modulo sao obrigatorios', 400);
    }
    values.push(companyId);
    where.push(`company_id = $${values.length}`);
    values.push(moduleId);
    where.push(`module_id = $${values.length}`);
  }

  const result = await pool.query(
    `UPDATE company_modules
     SET status = 'inactive', deactivated_at = NOW(), updated_at = NOW()
     WHERE ${where.join(' AND ')}
     RETURNING id, company_id, module_id, status, activated_at, deactivated_at, created_at, updated_at`,
    values
  );

  if (result.rowCount === 0) {
    throw createError('Vinculo de modulo nao encontrado', 404);
  }

  await audit('company_module_deactivated', reqUser, 'company_module', result.rows[0].id);
  return result.rows[0];
}

async function listCompanyModules(query = {}) {
  const values = [];
  const where = ['COALESCE(companies.is_deleted, false) = false'];

  if (query.companyId || query.company_id) {
    values.push(query.companyId || query.company_id);
    where.push(`company_modules.company_id = $${values.length}`);
  }

  if (query.status) {
    values.push(query.status);
    where.push(`company_modules.status = $${values.length}`);
  }

  const result = await pool.query(
    `SELECT
       company_modules.id,
       company_modules.company_id,
       companies.name AS company_name,
       company_modules.module_id,
       modules.name AS module_name,
       modules.slug AS module_slug,
       company_modules.status,
       company_modules.activated_at,
       company_modules.deactivated_at,
       company_modules.created_at,
       company_modules.updated_at
     FROM company_modules
     INNER JOIN companies ON companies.id = company_modules.company_id
     INNER JOIN modules ON modules.id = company_modules.module_id
     WHERE ${where.join(' AND ')}
     ORDER BY company_modules.updated_at DESC`,
    values
  );

  return result.rows;
}

async function listSubscriptions(query = {}) {
  const { page, limit, offset } = getPagination(query);
  const where = ['COALESCE(companies.is_deleted, false) = false'];
  const values = [];

  if (query.status) {
    values.push(query.status);
    where.push(`subscriptions.status = $${values.length}`);
  }

  if (query.q) {
    values.push(`%${String(query.q).trim()}%`);
    where.push(`(companies.name ILIKE $${values.length} OR subscriptions.plan_name ILIKE $${values.length})`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM subscriptions
     INNER JOIN companies ON companies.id = subscriptions.company_id
     ${whereSql}`,
    values
  );

  const result = await pool.query(
    `SELECT subscriptions.*, companies.name AS company_name
     FROM subscriptions
     INNER JOIN companies ON companies.id = subscriptions.company_id
     ${whereSql}
     ORDER BY subscriptions.created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  return {
    items: result.rows,
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    }
  };
}

async function getSubscription(id) {
  const result = await pool.query(
    `SELECT subscriptions.*, companies.name AS company_name
     FROM subscriptions
     INNER JOIN companies ON companies.id = subscriptions.company_id
     WHERE subscriptions.id = $1
     LIMIT 1`,
    [id]
  );

  if (result.rowCount === 0) {
    throw createError('Assinatura nao encontrada', 404);
  }

  return result.rows[0];
}

async function createSubscription(data, reqUser) {
  const companyId = data.company_id || data.companyId;
  const planName = String(data.plan_name || data.planName || '').trim();
  const price = Number(data.price || 0);
  const status = normalizeStatus(data.status, ['active', 'pending', 'late', 'canceled', 'refunded', 'suspended'], 'pending');
  const billingCycle = data.billing_cycle || data.billingCycle || 'monthly';

  if (!companyId || !planName) {
    throw createError('Empresa e plano sao obrigatorios', 400);
  }

  const result = await pool.query(
    `INSERT INTO subscriptions (company_id, plan_name, price, status, billing_cycle, next_due_date, started_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()), NOW())
     RETURNING *`,
    [companyId, planName, price, status, billingCycle, data.next_due_date || data.nextDueDate || null, data.started_at || data.startedAt || null]
  );

  await audit('subscription_created', reqUser, 'subscription', result.rows[0].id, { companyId, planName });
  return result.rows[0];
}

async function updateSubscription(id, data, reqUser) {
  const fields = [];
  const values = [];
  const map = {
    company_id: data.company_id || data.companyId,
    plan_name: data.plan_name || data.planName,
    price: data.price,
    status: data.status,
    billing_cycle: data.billing_cycle || data.billingCycle,
    next_due_date: data.next_due_date || data.nextDueDate,
    canceled_at: data.canceled_at || data.canceledAt
  };

  Object.entries(map).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${fields.length + 1}`);
      values.push(value === '' ? null : value);
    }
  });

  if (fields.length === 0) {
    throw createError('Nenhum campo enviado para atualizacao', 400);
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE subscriptions
     SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  if (result.rowCount === 0) {
    throw createError('Assinatura nao encontrada', 404);
  }

  await audit('subscription_updated', reqUser, 'subscription', id, data);
  return result.rows[0];
}

async function updateSubscriptionStatus(id, status, reqUser) {
  const nextStatus = normalizeStatus(status, ['active', 'pending', 'late', 'canceled', 'refunded', 'suspended'], null);
  if (!nextStatus) {
    throw createError('Status invalido', 400);
  }

  const data = {
    status: nextStatus,
    canceled_at: nextStatus === 'canceled' ? new Date() : undefined
  };

  const subscription = await updateSubscription(id, data, reqUser);
  await audit('subscription_status_changed', reqUser, 'subscription', id, { status: nextStatus });
  return subscription;
}

async function listActivations(query = {}) {
  const values = [];
  const where = ['1=1'];
  const status = query.status;

  if (status === 'pending') {
    where.push('first_access_tokens.used_at IS NULL AND first_access_tokens.expires_at > NOW()');
  } else if (status === 'used') {
    where.push('first_access_tokens.used_at IS NOT NULL');
  } else if (status === 'expired') {
    where.push('first_access_tokens.used_at IS NULL AND first_access_tokens.expires_at <= NOW()');
  }

  const result = await pool.query(
    `SELECT
       first_access_tokens.id,
       first_access_tokens.company_id,
       companies.name AS company_name,
       COALESCE(first_access_tokens.user_name, users.name) AS user_name,
       COALESCE(first_access_tokens.user_email, users.email) AS user_email,
       COALESCE(first_access_tokens.profile, users.role) AS profile,
       first_access_tokens.expires_at,
       first_access_tokens.used_at,
       first_access_tokens.created_at,
       CASE
         WHEN first_access_tokens.used_at IS NOT NULL THEN 'used'
         WHEN first_access_tokens.expires_at <= NOW() THEN 'expired'
         ELSE 'pending'
       END AS status
     FROM first_access_tokens
     INNER JOIN companies ON companies.id = first_access_tokens.company_id
     INNER JOIN users ON users.id = first_access_tokens.user_id
     WHERE ${where.join(' AND ')}
     ORDER BY first_access_tokens.created_at DESC`,
    values
  );

  return result.rows;
}

async function resendActivation(id, reqUser) {
  const result = await pool.query(
    `SELECT
       first_access_tokens.token,
       first_access_tokens.expires_at,
       companies.name AS company_name,
       COALESCE(first_access_tokens.user_name, users.name) AS user_name,
       COALESCE(first_access_tokens.user_email, users.email) AS user_email
     FROM first_access_tokens
     INNER JOIN companies ON companies.id = first_access_tokens.company_id
     INNER JOIN users ON users.id = first_access_tokens.user_id
     WHERE first_access_tokens.id = $1
       AND first_access_tokens.used_at IS NULL
       AND first_access_tokens.expires_at > NOW()
     LIMIT 1`,
    [id]
  );

  if (result.rowCount === 0) {
    throw createError('Ativacao pendente nao encontrada', 404);
  }

  const activation = result.rows[0];
  await emailService.sendFirstAccessEmail({
    to: activation.user_email,
    name: activation.user_name,
    companyName: activation.company_name,
    token: activation.token,
    expiresAt: activation.expires_at
  });

  await audit('first_access_resent', reqUser, 'first_access_token', id);
  return true;
}

async function cancelActivation(id, reqUser) {
  const result = await pool.query(
    `UPDATE first_access_tokens
     SET used_at = NOW(), used = true
     WHERE id = $1 AND used_at IS NULL
     RETURNING id`,
    [id]
  );

  if (result.rowCount === 0) {
    throw createError('Ativacao nao encontrada', 404);
  }

  await audit('first_access_canceled', reqUser, 'first_access_token', id);
  return true;
}

async function getSettings() {
  const result = await pool.query('SELECT key, value, updated_at FROM settings ORDER BY key ASC');
  return result.rows.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}

async function updateSettings(data, reqUser) {
  const allowedKeys = [
    'platform_name',
    'sender_email',
    'main_domain',
    'token_expiration_hours',
    'maintenance_mode',
    'support_whatsapp',
    'support_email'
  ];

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        await client.query(
          `INSERT INTO settings (key, value, updated_at, updated_by)
           VALUES ($1, $2, NOW(), $3)
           ON CONFLICT (key)
           DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
          [key, String(data[key]), reqUser?.id || null]
        );
      }
    }

    await client.query('COMMIT');
    await audit('settings_updated', reqUser, 'settings', null, data);
    return getSettings();
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listAuditLogs(query = {}) {
  const { page, limit, offset } = getPagination(query);
  const values = [];
  const where = ['1=1'];

  if (query.action) {
    values.push(query.action);
    where.push(`audit_logs.action = $${values.length}`);
  }

  if (query.entity_type || query.entityType) {
    values.push(query.entity_type || query.entityType);
    where.push(`audit_logs.entity_type = $${values.length}`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM audit_logs ${whereSql}`, values);
  const result = await pool.query(
    `SELECT
       audit_logs.id,
       audit_logs.action,
       audit_logs.actor_user_id,
       audit_logs.actor_role,
       audit_logs.entity_type,
       audit_logs.entity_id,
       audit_logs.metadata,
       audit_logs.created_at,
       users.name AS actor_name,
       users.email AS actor_email
     FROM audit_logs
     LEFT JOIN users ON users.id = audit_logs.actor_user_id
     ${whereSql}
     ORDER BY audit_logs.created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  return {
    items: result.rows,
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    }
  };
}

async function generateFirstAccess(data, reqUser) {
  const companyId = data.company_id || data.companyId;
  const name = String(data.name || '').trim();
  const email = normalizeEmail(data.email);
  const role = data.role || data.profile || 'admin';
  const expiresInHours = Number(data.expiresInHours || data.expires_in_hours || 24);
  const generatedBy = data.generatedBy || data.generated_by || reqUser?.id || null;
  const allowedRoles = ['admin', 'collaborator'];

  if (!companyId || !name || !email) {
    throw createError('Empresa, nome e email sao obrigatorios', 400);
  }

  if (!allowedRoles.includes(role)) {
    throw createError('Perfil invalido para primeiro acesso', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const company = await client.query(
      `SELECT id FROM companies WHERE id = $1 AND COALESCE(is_deleted, false) = false LIMIT 1`,
      [companyId]
    );

    if (company.rowCount === 0) {
      throw createError('Empresa nao encontrada', 404);
    }

    const existingUser = await client.query(
      'SELECT id, name, email, role, company_id FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    let user;

    if (existingUser.rowCount > 0) {
      user = existingUser.rows[0];

      if (user.company_id !== companyId) {
        throw createError('Usuario pertence a outra empresa', 409);
      }
    } else {
      const temporaryPassword = crypto.randomBytes(24).toString('hex');
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);
      const userResult = await client.query(
        `INSERT INTO users (name, email, password_hash, role, company_id, is_active)
         VALUES ($1, $2, $3, $4, $5, false)
         RETURNING id, name, email, role, company_id`,
        [name, email, passwordHash, role, companyId]
      );
      user = userResult.rows[0];
    }

    await client.query(
      `UPDATE first_access_tokens SET used_at = NOW(), used = true WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );

    const token = crypto.randomBytes(32).toString('hex');
    const tokenResult = await client.query(
      `INSERT INTO first_access_tokens (company_id, user_id, user_email, user_name, profile, token, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + ($7 * INTERVAL '1 hour'), $8)
       RETURNING id, company_id, user_id, user_email, user_name, profile, token, expires_at, used_at, created_at`,
      [companyId, user.id, email, name, role, token, Math.max(expiresInHours, 1), generatedBy]
    );

    await client.query(
      `INSERT INTO auth_audit_logs (user_id, email, action, details)
       VALUES ($1, $2, 'master_first_access_generated', $3)`,
      [
        generatedBy,
        email,
        JSON.stringify({
          target_user_id: user.id,
          company_id: companyId,
          first_access_token_id: tokenResult.rows[0].id
        })
      ]
    );

    await client.query('COMMIT');
    await audit('first_access_generated', reqUser, 'first_access_token', tokenResult.rows[0].id, { companyId, email });

    return {
      user,
      firstAccess: tokenResult.rows[0]
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getDashboardData,
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  updateCompanyStatus,
  listModules,
  getModule,
  createModule,
  updateModule,
  updateModuleStatus,
  deleteModule,
  activateModuleForCompany,
  deactivateModuleForCompany,
  listCompanyModules,
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  updateSubscriptionStatus,
  listActivations,
  resendActivation,
  cancelActivation,
  getSettings,
  updateSettings,
  listAuditLogs,
  generateFirstAccess
};
