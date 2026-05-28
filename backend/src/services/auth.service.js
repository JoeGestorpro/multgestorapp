const { appLogger } = require('../shared/core/logger');
const {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  AppError,
} = require('../shared/core/errors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const emailService = require('./email/email.service');
const { sendTrialEmail } = require('./email/trial-emails.service');
const { getCompanyPlanSnapshot, getCompanyPlanSchemaConfig } = require('./company-plan.service');
const { normalizeFeaturePlanType } = require('../utils/planFeatures');
const {
  BARBER_ADMIN_ROLES,
  BOOKING_CUSTOMER_ROLES,
  MASTER_ROLES,
  inferAuthScope
} = require('../shared/core/auth/roles');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function logAuthDebug(label, details = {}) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  appLogger.debug({ details }, `[AUTH DEBUG] ${label}`);
}

// Usa getCompanyPlanSchemaConfig() de company-plan.service.js — cacheada com TTL de 5min.
// Evita 3 queries information_schema por login/refresh (eliminado hot path não-cacheado).
async function getCompanyPlanQueryConfig() {
  const config = await getCompanyPlanSchemaConfig();
  return {
    selectPlanType:    config.hasPlanType    ? 'companies.plan_type'    : "'trial'::text AS plan_type",
    selectPlanStatus:  config.hasPlanStatus  ? 'companies.plan_status'  : "'active'::text AS plan_status",
    selectTrialEndsAt: config.hasTrialEndsAt ? 'companies.trial_ends_at': 'NULL::timestamp AS trial_ends_at',
  };
}

function getPositiveIntEnv(name, fallback) {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function signToken(user, authScope = inferAuthScope(user.role)) {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET nao configurado', 500, 'CONFIGURATION_ERROR');
  }

  const isBookingCustomer = authScope === 'booking_customer';
  const entityId = user.customer_id || user.id;

  return jwt.sign(
    {
      id: entityId,
      user_id: isBookingCustomer ? null : entityId,
      customer_id: isBookingCustomer ? entityId : null,
      email: user.email,
      role: user.role,
      auth_scope: authScope,
      company_id: user.company_id,
      can_launch_sales: Boolean(user.can_launch_sales),
      can_view_own_dashboard: user.can_view_own_dashboard !== false,
      can_view_own_reports: user.can_view_own_reports !== false
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

function generateRefreshToken(userId, role, companyId, authScope) {
  return jwt.sign(
    {
      id: userId,
      role,
      company_id: companyId,
      auth_scope: authScope,
      token_type: 'refresh'
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitizeUser(row) {
  const authScope = row.auth_scope || inferAuthScope(row.role);
  const normalizedPlanType = normalizeFeaturePlanType(row.plan_type);

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    auth_scope: authScope,
    company_id: row.company_id,
    company_name: row.company_name,
    company_public_booking_slug: row.company_public_booking_slug || null,
    niche_type: row.niche_type,
    plan_type: normalizedPlanType,
    plan_status: row.plan_status || 'active',
    trial_ends_at: row.trial_ends_at || null,
    current_period_end: row.current_period_end || row.next_due_date || null,
    next_due_date: row.next_due_date || null,
    max_collaborators: row.max_collaborators ?? null,
    plan_source: row.plan_source || row.source || null,
    plan_is_active: row.plan_is_active ?? null,
    is_active: row.is_active,
    email_verified: row.email_verified !== false,
    status: row.status || 'active',
    phone: row.phone || null,
    can_launch_sales: Boolean(row.can_launch_sales),
    can_view_own_dashboard: row.can_view_own_dashboard !== false,
    can_view_own_reports: row.can_view_own_reports !== false,
    created_at: row.created_at
  };
}

async function resolveUserPlan(row) {
  if (!row?.company_id) {
    return row;
  }

  const companyPlan = await getCompanyPlanSnapshot(row.company_id);

  if (!companyPlan) {
    return row;
  }

  return {
    ...row,
    plan_type: companyPlan.plan_type || row.plan_type,
    plan_status: companyPlan.plan_status || row.plan_status,
    trial_ends_at: companyPlan.trial_ends_at || row.trial_ends_at || null,
    current_period_end: companyPlan.current_period_end || companyPlan.next_due_date || null,
    next_due_date: companyPlan.next_due_date || null,
    max_collaborators: companyPlan.max_collaborators ?? row.max_collaborators ?? null,
    plan_source: companyPlan.source || row.plan_source || null,
    plan_is_active: companyPlan.is_active
  };
}

function sanitizeBookingCustomer(row) {
  return {
    id: row.id,
    customer_id: row.id,
    name: row.name,
    email: row.email,
    role: 'booking_customer',
    auth_scope: 'booking_customer',
    company_id: row.company_id,
    company_name: row.company_name,
    company_public_booking_slug: row.company_public_booking_slug || null,
    niche_type: row.niche_type,
    is_active: row.is_active !== false,
    email_verified: row.email_verified === true,
    status: row.status || 'pending',
    phone: row.phone || null,
    source: row.source || 'agendamento_online',
    last_login_at: row.last_login_at || null,
    created_at: row.created_at
  };
}

async function writeAuthAudit(action, options = {}) {
  await pool.query(
    `INSERT INTO auth_audit_logs (user_id, email, action, ip_address, user_agent, details)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      options.userId || null,
      options.email || null,
      action,
      options.ipAddress || null,
      options.userAgent || null,
      options.details ? JSON.stringify(options.details) : null
    ]
  );
}

async function getCompanyModules(companyId) {
  if (!companyId) {
    return [];
  }

  const result = await pool.query(
    `SELECT modules.id, modules.name, modules.slug
     FROM company_modules
     INNER JOIN modules ON modules.id = company_modules.module_id
     WHERE company_modules.company_id = $1
       AND company_modules.status = 'active'
       AND modules.is_active = true
     ORDER BY modules.name ASC`,
    [companyId]
  );

  return result.rows;
}

async function findUserWithCompanyByEmail(email) {
  const queryConfig = await getCompanyPlanQueryConfig();
  const result = await pool.query(
    `SELECT
       users.id,
       users.name,
       users.email,
       users.password_hash,
       users.role,
       users.company_id,
       users.phone,
       users.is_active,
       users.can_launch_sales,
       users.can_view_own_dashboard,
       users.can_view_own_reports,
       users.email_verified,
       users.status,
       users.created_at,
       companies.name AS company_name,
       companies.niche_type,
       ${queryConfig.selectPlanType},
       ${queryConfig.selectPlanStatus},
       ${queryConfig.selectTrialEndsAt},
       companies.public_booking_slug AS company_public_booking_slug
     FROM users
     LEFT JOIN companies ON companies.id = users.company_id
     WHERE users.email = $1
     LIMIT 1`,
    [email]
  );

  if (result.rowCount === 0) {
    logAuthDebug('login_lookup', {
      email,
      userFound: false
    });
    throw new UnauthorizedError('Credenciais invalidas');
  }

  logAuthDebug('login_lookup', {
    email,
    userFound: true,
    hasPasswordHash: Boolean(result.rows[0].password_hash),
    role: result.rows[0].role,
    companyId: result.rows[0].company_id || null
  });

  return resolveUserPlan(result.rows[0]);
}

async function findBookingCustomerByEmail(email, companySlug = null) {
  const params = [email];
  let companyFilter = '';

  if (companySlug) {
    params.push(companySlug);
    companyFilter = 'AND companies.public_booking_slug = $2';
  }

  const result = await pool.query(
    `SELECT
       booking_customers.id,
       booking_customers.company_id,
       booking_customers.name,
       booking_customers.phone,
       booking_customers.email,
       booking_customers.password_hash,
       booking_customers.email_verified,
       booking_customers.status,
       booking_customers.source,
       booking_customers.last_login_at,
       booking_customers.created_at,
       companies.name AS company_name,
       companies.niche_type,
       companies.public_booking_slug AS company_public_booking_slug
     FROM booking_customers
     INNER JOIN companies ON companies.id = booking_customers.company_id
     WHERE booking_customers.email = $1
       ${companyFilter}
     LIMIT 1`,
    params
  );

  if (result.rowCount === 0) {
    throw new UnauthorizedError('Credenciais invalidas');
  }

  return {
    ...result.rows[0],
    role: 'booking_customer',
    is_active: result.rows[0].status !== 'blocked'
  };
}

function ensureActiveUser(user, options = {}) {
  if (!user.is_active) {
    throw new ForbiddenError('Usuario inativo');
  }

  if (options.requireVerifiedEmail && (!user.email_verified || user.status !== 'active')) {
    throw new ForbiddenError('Confirme seu e-mail para continuar');
  }
}

function assertScopeCompatibility(user, authScope) {
  if (authScope === 'booking_customer') {
    if (!BOOKING_CUSTOMER_ROLES.includes(user.role)) {
      throw new ForbiddenError('Este login e exclusivo para clientes finais do agendamento');
    }

    return;
  }

  if (authScope === 'barber_admin') {
    if (!BARBER_ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenError('Este login e exclusivo para dono, admin ou colaborador da barbearia');
    }

    return;
  }

  if (authScope === 'master') {
    if (!MASTER_ROLES.includes(user.role)) {
      throw new ForbiddenError('Este login e exclusivo para administradores master');
    }
  }
}

function buildSession(user, modules, authScope) {
  return {
    token: signToken(user, authScope),
    user: sanitizeUser({
      ...user,
      auth_scope: authScope
    }),
    modules
  };
}

function buildBookingCustomerSession(customer) {
  return {
    token: signToken(customer, 'booking_customer'),
    user: sanitizeBookingCustomer(customer),
    modules: []
  };
}

async function register(data) {
  const name = String(data.name || '').trim();
  const email = normalizeEmail(data.email);
  const password = String(data.password || '');
  const companyName = String(data.company_name || data.companyName || `Empresa de ${name}`).trim();
  const nicheType = data.niche_type || data.nicheType || null;

  if (!name || !email || !password) {
    throw new ValidationError('Nome, email e senha sao obrigatorios');
  }

  if (password.length < 6) {
    throw new ValidationError('A senha deve ter pelo menos 6 caracteres');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (existingUser.rowCount > 0) {
      throw new ConflictError('Email ja cadastrado');
    }

    const companyResult = await client.query(
      `INSERT INTO companies (name, niche_type)
       VALUES ($1, $2)
       RETURNING id, name, niche_type, status, created_at`,
      [companyName, nicheType]
    );

    const company = companyResult.rows[0];
    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role, company_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, company_id, is_active, created_at`,
      [name, email, passwordHash, 'admin', company.id]
    );

    // Ativar modulo correspondente ao nicho da empresa, se existir no catalogo
    if (nicheType) {
      await client.query(
        `INSERT INTO company_modules (company_id, module_id, status, activated_at)
         SELECT $1, modules.id, 'active', NOW()
         FROM modules
         WHERE modules.slug = $2
           AND modules.is_active = true
         ON CONFLICT (company_id, module_id) DO NOTHING`,
        [company.id, nicheType]
      );
    }

    await client.query('COMMIT');

    // Enviar email de boas-vindas (nao bloqueia o registro)
    try {
      await sendTrialEmail('welcome', { ...company, email });
    } catch (err) {
      appLogger.warn({ err, companyId: company.id }, '[TrialEmail] Falha ao enviar welcome email');
    }

    const user = {
      ...userResult.rows[0],
      company_name: company.name,
      niche_type: company.niche_type
    };

    const modules = await getCompanyModules(company.id);

    return {
      token: signToken(user, 'barber_admin'),
      user: sanitizeUser({
        ...user,
        auth_scope: 'barber_admin'
      }),
      modules,
      company
    };
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      throw new ConflictError('Email ja cadastrado');
    }

    throw error;
  } finally {
    client.release();
  }
}

async function login(data, options = {}) {
  const email = normalizeEmail(data.email);
  const password = String(data.password || '');
  const requestedAuthScope = options.authScope || null;

  if (!email || !password) {
    throw new ValidationError('Email e senha sao obrigatorios');
  }

  const user = await findUserWithCompanyByEmail(email);
  const authScope = requestedAuthScope || inferAuthScope(user.role);
  assertScopeCompatibility(user, authScope);
  ensureActiveUser(user, {
    requireVerifiedEmail: authScope === 'booking_customer'
  });

  logAuthDebug('login_password_check', {
    email,
    userFound: true,
    hasPasswordHash: Boolean(user.password_hash)
  });

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  logAuthDebug('login_password_result', {
    email,
    passwordMatches
  });

  if (!passwordMatches) {
    throw new UnauthorizedError('Credenciais invalidas');
  }

  const modules = await getCompanyModules(user.company_id);

  if (requestedAuthScope === 'barber_admin' && !modules.some((module) => module.slug === 'barber')) {
    throw new ForbiddenError('Modulo BarberGestor nao liberado para esta empresa');
  }

  return buildSession(user, modules, authScope);
}

async function loginBookingCustomer(data) {
  const email = normalizeEmail(data.email);
  const password = String(data.password || '');
  const requestedCompanySlug = String(data.companySlug || data.company_slug || '').trim().toLowerCase();

  if (!email || !password || !requestedCompanySlug) {
    throw new ValidationError('Email, senha e companySlug sao obrigatorios');
  }

  const customer = await findBookingCustomerByEmail(email, requestedCompanySlug);

  if (!customer.email_verified || customer.status !== 'active') {
    throw new ForbiddenError('Confirme seu e-mail para continuar');
  }

  if (customer.status === 'blocked') {
    throw new ForbiddenError('Cliente bloqueado para este agendamento');
  }

  const passwordMatches = await bcrypt.compare(password, customer.password_hash);

  if (!passwordMatches) {
    throw new UnauthorizedError('Credenciais invalidas');
  }

  await pool.query(
    `UPDATE booking_customers
     SET last_login_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [customer.id]
  );

  return buildBookingCustomerSession({
    ...customer,
    last_login_at: new Date().toISOString()
  });
}

async function getAuthenticatedUser(userId, options = {}) {
  const authScope = options.authScope || null;

  if (authScope === 'booking_customer') {
    const customerId = options.customerId || userId;
    const result = await pool.query(
      `SELECT
         booking_customers.id,
         booking_customers.company_id,
         booking_customers.name,
         booking_customers.phone,
         booking_customers.email,
         booking_customers.email_verified,
         booking_customers.status,
         booking_customers.source,
         booking_customers.last_login_at,
         booking_customers.created_at,
         companies.name AS company_name,
         companies.niche_type,
         companies.public_booking_slug AS company_public_booking_slug
       FROM booking_customers
       INNER JOIN companies ON companies.id = booking_customers.company_id
       WHERE booking_customers.id = $1
       LIMIT 1`,
      [customerId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Cliente nao encontrado');
    }

    const customer = result.rows[0];

    if (customer.status === 'blocked') {
      throw new ForbiddenError('Cliente bloqueado para este agendamento');
    }

    if (!customer.email_verified || customer.status !== 'active') {
      throw new ForbiddenError('Confirme seu e-mail para continuar');
    }

    return {
      user: sanitizeBookingCustomer(customer),
      modules: []
    };
  }

  const queryConfig = await getCompanyPlanQueryConfig();
  const result = await pool.query(
    `SELECT
       users.id,
       users.name,
       users.email,
       users.role,
       users.company_id,
       users.phone,
       users.is_active,
       users.can_launch_sales,
       users.can_view_own_dashboard,
       users.can_view_own_reports,
       users.email_verified,
       users.status,
       users.created_at,
       companies.name AS company_name,
       companies.niche_type,
       ${queryConfig.selectPlanType},
       ${queryConfig.selectPlanStatus},
       ${queryConfig.selectTrialEndsAt},
       companies.public_booking_slug AS company_public_booking_slug
     FROM users
     LEFT JOIN companies ON companies.id = users.company_id
     WHERE users.id = $1
     LIMIT 1`,
    [userId]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Usuario nao encontrado');
  }

  const user = await resolveUserPlan(result.rows[0]);
  const resolvedScope = authScope || inferAuthScope(user.role);

  assertScopeCompatibility(user, resolvedScope);
  ensureActiveUser(user, {
    requireVerifiedEmail: resolvedScope === 'booking_customer'
  });

  const modules = await getCompanyModules(user.company_id);

  return {
    user: sanitizeUser({
      ...user,
      auth_scope: resolvedScope
    }),
    modules
  };
}

async function validateFirstAccessToken(token) {
  const accessToken = String(token || '').trim();

  if (!accessToken) {
    throw new ValidationError('Token e obrigatorio');
  }

  const result = await pool.query(
    `SELECT
       first_access_tokens.id,
       first_access_tokens.company_id,
       first_access_tokens.user_id,
       first_access_tokens.expires_at,
       first_access_tokens.used_at,
       first_access_tokens.expires_at <= NOW() AS is_expired,
       users.name AS user_name,
       users.email,
       users.role,
       companies.name AS company_name
     FROM first_access_tokens
     INNER JOIN users ON users.id = first_access_tokens.user_id
     INNER JOIN companies ON companies.id = first_access_tokens.company_id
     WHERE first_access_tokens.token = $1
     LIMIT 1`,
    [accessToken]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Token invalido');
  }

  const row = result.rows[0];

  if (row.used_at) {
    throw new AppError('Token ja utilizado', 410, 'TOKEN_USED');
  }

  if (row.is_expired) {
    throw new AppError('Token expirado', 410, 'TOKEN_EXPIRED');
  }

  return {
    company: {
      id: row.company_id,
      name: row.company_name
    },
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.email,
      role: row.role
    },
    expires_at: row.expires_at
  };
}

async function requestFirstAccess(data, meta = {}) {
  const email = normalizeEmail(data.email);
  const expiresInHours = getPositiveIntEnv('FIRST_ACCESS_TOKEN_HOURS', 48);

  if (!email) {
    throw new ValidationError('Email e obrigatorio');
  }

  const userResult = await pool.query(
    `SELECT
       users.id,
       users.name,
       users.email,
       users.company_id,
       users.is_active,
       companies.name AS company_name
     FROM users
     INNER JOIN companies ON companies.id = users.company_id
     WHERE users.email = $1
     LIMIT 1`,
    [email]
  );

  if (userResult.rowCount === 0) {
    await writeAuthAudit('first_access_requested_unknown_email', {
      email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });
    return null;
  }

  const user = userResult.rows[0];

  if (!user.company_id) {
    await writeAuthAudit('first_access_requested_without_company', {
      userId: user.id,
      email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });
    return null;
  }

  const token = crypto.randomBytes(32).toString('hex');

  await pool.query(
    `UPDATE first_access_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [user.id]
  );

  const tokenResult = await pool.query(
    `INSERT INTO first_access_tokens (company_id, user_id, token, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 * INTERVAL '1 hour'))
     RETURNING token, expires_at`,
    [user.company_id, user.id, token, expiresInHours]
  );

  await writeAuthAudit('first_access_requested', {
    userId: user.id,
    email,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent
  });

  let emailSent = false;

  try {
    const emailResult = await emailService.sendFirstAccessEmail({
      to: user.email,
      name: user.name,
      companyName: user.company_name,
      token: tokenResult.rows[0].token,
      expiresAt: tokenResult.rows[0].expires_at
    });
    emailSent = true;

    await writeAuthAudit('first_access_email_sent', {
      userId: user.id,
      email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        provider: emailResult.provider,
        message_id: emailResult.messageId
      }
    });
  } catch (error) {
    await writeAuthAudit('first_access_email_failed', {
      userId: user.id,
      email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        error: error.message
      }
    });
  }

  return {
    ...tokenResult.rows[0],
    emailSent
  };
}

async function setFirstAccessPassword(data) {
  const token = String(data.token || '').trim();
  const password = String(data.password || '');

  if (!token || !password) {
    throw new ValidationError('Token e senha sao obrigatorios');
  }

  if (password.length < 6) {
    throw new ValidationError('A senha deve ter pelo menos 6 caracteres');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const tokenResult = await client.query(
      `SELECT id, user_id, expires_at, used_at, expires_at <= NOW() AS is_expired
       FROM first_access_tokens
       WHERE token = $1
       FOR UPDATE`,
      [token]
    );

    if (tokenResult.rowCount === 0) {
      throw new NotFoundError('Token invalido');
    }

    const access = tokenResult.rows[0];

    if (access.used_at) {
      throw new AppError('Token ja utilizado', 410, 'TOKEN_USED');
    }

    if (access.is_expired) {
      throw new AppError('Token expirado', 410, 'TOKEN_EXPIRED');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query(
      `UPDATE users
       SET password_hash = $1,
           is_active = true
       WHERE id = $2`,
      [passwordHash, access.user_id]
    );

    await client.query(
      `UPDATE first_access_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [access.id]
    );

    await client.query(
      `INSERT INTO auth_audit_logs (user_id, action, details)
       VALUES ($1, 'first_access_password_set', $2)`,
      [access.user_id, JSON.stringify({ token_id: access.id })]
    );

    logAuthDebug('first_access_password_set', {
      userId: access.user_id,
      tokenId: access.id
    });

    await client.query('COMMIT');

    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function requestPasswordReset(data, meta = {}) {
  const email = normalizeEmail(data.email);
  const expiresInMinutes = getPositiveIntEnv('PASSWORD_RESET_TOKEN_MINUTES', 60);

  if (!email) {
    throw new ValidationError('Email e obrigatorio');
  }

  const userResult = await pool.query(
    `SELECT id, name, email
     FROM users
     WHERE email = $1 AND is_active = true
     LIMIT 1`,
    [email]
  );

  if (userResult.rowCount === 0) {
    await writeAuthAudit('password_reset_requested_unknown_email', {
      email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });
    return null;
  }

  const user = userResult.rows[0];
  const token = crypto.randomBytes(32).toString('hex');

  await pool.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [user.id]
  );

  const tokenResult = await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 minute'))
     RETURNING token, expires_at`,
    [user.id, token, expiresInMinutes]
  );

  await writeAuthAudit('password_reset_requested', {
    userId: user.id,
    email,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent
  });

  let emailSent = false;

  try {
    const emailResult = await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: tokenResult.rows[0].token,
      expiresAt: tokenResult.rows[0].expires_at
    });
    emailSent = true;

    await writeAuthAudit('password_reset_email_sent', {
      userId: user.id,
      email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        provider: emailResult.provider,
        message_id: emailResult.messageId
      }
    });
  } catch (error) {
    await writeAuthAudit('password_reset_email_failed', {
      userId: user.id,
      email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        error: error.message
      }
    });
  }

  return {
    ...tokenResult.rows[0],
    emailSent
  };
}

async function resetPassword(data) {
  const token = String(data.token || '').trim();
  const password = String(data.password || '');

  if (!token || !password) {
    throw new ValidationError('Token e senha sao obrigatorios');
  }

  if (password.length < 6) {
    throw new ValidationError('A senha deve ter pelo menos 6 caracteres');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const tokenResult = await client.query(
      `SELECT id, user_id, expires_at, used_at, expires_at <= NOW() AS is_expired
       FROM password_reset_tokens
       WHERE token = $1
       FOR UPDATE`,
      [token]
    );

    if (tokenResult.rowCount === 0) {
      throw new NotFoundError('Token invalido');
    }

    const resetToken = tokenResult.rows[0];

    if (resetToken.used_at) {
      throw new AppError('Token ja utilizado', 410, 'TOKEN_USED');
    }

    if (resetToken.is_expired) {
      throw new AppError('Token expirado', 410, 'TOKEN_EXPIRED');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query(
      `UPDATE users
       SET password_hash = $1,
           is_active = true
       WHERE id = $2`,
      [passwordHash, resetToken.user_id]
    );

    await client.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [resetToken.id]
    );

    await client.query(
      `INSERT INTO auth_audit_logs (user_id, action, details)
       VALUES ($1, 'password_reset_completed', $2)`,
      [resetToken.user_id, JSON.stringify({ token_id: resetToken.id })]
    );

    logAuthDebug('password_reset_completed', {
      userId: resetToken.user_id,
      tokenId: resetToken.id
    });

    await client.query('COMMIT');

    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  register,
  login,
  loginBookingCustomer,
  getAuthenticatedUser,
  requestFirstAccess,
  validateFirstAccessToken,
  setFirstAccessPassword,
  requestPasswordReset,
  resetPassword,
  generateRefreshToken,
  REFRESH_COOKIE_OPTIONS,
  sanitizeUser,
  sanitizeBookingCustomer
};
