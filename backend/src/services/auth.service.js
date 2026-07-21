const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { runPublicTenantOperation } = require('../config/database');
const emailService = require('./email/email.service');
const { inferAuthScope } = require('../shared/core/auth/roles');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getPositiveIntEnv(name, fallback) {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function signToken(user, authScope) {
  if (!process.env.JWT_SECRET) {
    throw createError('JWT_SECRET nao configurado', 500);
  }

  const resolvedScope = authScope || inferAuthScope(user.role);
  const isBookingCustomer = resolvedScope === 'booking_customer';
  const entityId = user.customer_id || user.id;

  return jwt.sign(
    {
      id: entityId,
      user_id: isBookingCustomer ? null : entityId,
      customer_id: isBookingCustomer ? entityId : null,
      email: user.email,
      role: user.role,
      auth_scope: resolvedScope,
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

const REFRESH_TOKEN_TTL = '7d';

function generateRefreshToken(userId, role, companyId, authScope, jti = null) {
  return jwt.sign(
    {
      id: userId,
      role,
      company_id: companyId,
      auth_scope: authScope,
      token_type: 'refresh',
      ...(jti ? { jti } : {})
    },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
}

// Emissão com sessão server-side: persiste o jti em refresh_tokens para
// permitir rotação e revogação no logout. Sempre chamado fora de contexto
// tenant (rotas /auth não passam por requireCompany) — usa o pool privilegiado.
async function issueRefreshToken(userId, role, companyId, authScope, { replacesJti = null } = {}) {
  const jti = crypto.randomUUID();
  await pool.query(
    `INSERT INTO refresh_tokens (jti, subject_id, auth_scope, expires_at)
     VALUES ($1, $2, $3, NOW() + interval '7 days')`,
    [jti, userId, authScope]
  );
  if (replacesJti) {
    await revokeRefreshToken(replacesJti, jti);
  }
  return generateRefreshToken(userId, role, companyId, authScope, jti);
}

async function revokeRefreshToken(jti, replacedBy = null) {
  await pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW(), replaced_by = COALESCE($2, replaced_by)
     WHERE jti = $1 AND revoked_at IS NULL`,
    [jti, replacedBy]
  );
}

async function isRefreshTokenActive(jti) {
  const result = await pool.query(
    `SELECT 1 FROM refresh_tokens
     WHERE jti = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [jti]
  );
  return result.rowCount > 0;
}

function sanitizeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    company_id: row.company_id,
    owner_id: row.owner_id || row.company_id,
    company_name: row.company_name,
    niche_type: row.niche_type,
    is_active: row.is_active,
    phone: row.phone || null,
    can_launch_sales: Boolean(row.can_launch_sales),
    can_view_own_dashboard: row.can_view_own_dashboard !== false,
    can_view_own_reports: row.can_view_own_reports !== false,
    created_at: row.created_at
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

async function register(data) {
  const name = String(data.name || '').trim();
  const email = normalizeEmail(data.email);
  const password = String(data.password || '');
  const companyName = String(data.company_name || data.companyName || `Empresa de ${name}`).trim();
  const nicheType = data.niche_type || data.nicheType || null;

  if (!name || !email || !password) {
    throw createError('Nome, email e senha sao obrigatorios', 400);
  }

  if (password.length < 6) {
    throw createError('A senha deve ter pelo menos 6 caracteres', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (existingUser.rowCount > 0) {
      throw createError('Email ja cadastrado', 409);
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

    await client.query('COMMIT');

    const user = {
      ...userResult.rows[0],
      company_name: company.name,
      niche_type: company.niche_type
    };

    return {
      token: signToken(user),
      user: sanitizeUser(user),
      modules: [],
      company
    };
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      throw createError('Email ja cadastrado', 409);
    }

    throw error;
  } finally {
    client.release();
  }
}

async function login(data, options = {}) {
  const email = normalizeEmail(data.email);
  const password = String(data.password || '');
  const authScope = options.authScope || null;

  if (!email || !password) {
    throw createError('Email e senha sao obrigatorios', 400);
  }

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
       users.created_at,
       companies.name AS company_name,
       companies.niche_type
     FROM users
     LEFT JOIN companies ON companies.id = users.company_id
     WHERE users.email = $1
     LIMIT 1`,
    [email]
  );

  if (result.rowCount === 0) {
    throw createError('Credenciais invalidas', 401);
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw createError('Usuario inativo', 403);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw createError('Credenciais invalidas', 401);
  }

  const modules = await getCompanyModules(user.company_id);

  return {
    token: signToken(user, authScope),
    user: sanitizeUser(user),
    modules
  };
}

async function loginBookingCustomer(data) {
  const email = normalizeEmail(data.email);
  const password = String(data.password || '');
  const companySlug = String(data.companySlug || data.company_slug || '').trim().toLowerCase();

  if (!email || !password || !companySlug) {
    throw createError('Email, senha e companySlug sao obrigatorios', 400);
  }

  const result = await pool.query(
    `SELECT
       bc.id,
       bc.company_id,
       bc.name,
       bc.phone,
       bc.email,
       bc.password_hash,
       bc.email_verified,
       bc.status,
       bc.source,
       bc.last_login_at,
       bc.created_at,
       c.name AS company_name,
       c.niche_type,
       c.public_booking_slug AS company_public_booking_slug
     FROM booking_customers bc
     INNER JOIN companies c ON c.id = bc.company_id
     WHERE bc.email = $1
       AND c.public_booking_slug = $2
     LIMIT 1`,
    [email, companySlug]
  );

  if (result.rowCount === 0) {
    throw createError('Credenciais invalidas', 401);
  }

  const customer = result.rows[0];

  if (customer.status === 'blocked') {
    throw createError('Cliente bloqueado para este agendamento', 403);
  }

  if (!customer.email_verified || customer.status !== 'active') {
    throw createError('Confirme seu e-mail para continuar', 403);
  }

  const passwordMatches = await bcrypt.compare(password, customer.password_hash);

  if (!passwordMatches) {
    throw createError('Credenciais invalidas', 401);
  }

  await runPublicTenantOperation(customer.company_id, async () => {
    await pool.query(
      `UPDATE booking_customers SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1 AND company_id = $2`,
      [customer.id, customer.company_id]
    );
  });

  const customerForToken = { ...customer, role: 'booking_customer', customer_id: customer.id };

  return {
    token: signToken(customerForToken, 'booking_customer'),
    user: sanitizeBookingCustomer({ ...customer, last_login_at: new Date().toISOString() }),
    modules: []
  };
}

async function getAuthenticatedUser(userId) {
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
       users.created_at,
       companies.name AS company_name,
       companies.niche_type
     FROM users
     LEFT JOIN companies ON companies.id = users.company_id
     WHERE users.id = $1
     LIMIT 1`,
    [userId]
  );

  if (result.rowCount === 0) {
    throw createError('Usuario nao encontrado', 404);
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw createError('Usuario inativo', 403);
  }

  const modules = await getCompanyModules(user.company_id);

  return {
    user: sanitizeUser(user),
    modules
  };
}

async function validateFirstAccessToken(token) {
  const accessToken = String(token || '').trim();

  if (!accessToken) {
    throw createError('Token e obrigatorio', 400);
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
    throw createError('Token invalido', 404);
  }

  const row = result.rows[0];

  if (row.used_at) {
    throw createError('Token ja utilizado', 410);
  }

  if (row.is_expired) {
    throw createError('Token expirado', 410);
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
    throw createError('Email e obrigatorio', 400);
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
    throw createError('Token e senha sao obrigatorios', 400);
  }

  if (password.length < 6) {
    throw createError('A senha deve ter pelo menos 6 caracteres', 400);
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
      throw createError('Token invalido', 404);
    }

    const access = tokenResult.rows[0];

    if (access.used_at) {
      throw createError('Token ja utilizado', 410);
    }

    if (access.is_expired) {
      throw createError('Token expirado', 410);
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
    throw createError('Email e obrigatorio', 400);
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
    throw createError('Token e senha sao obrigatorios', 400);
  }

  if (password.length < 6) {
    throw createError('A senha deve ter pelo menos 6 caracteres', 400);
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
      throw createError('Token invalido', 404);
    }

    const resetToken = tokenResult.rows[0];

    if (resetToken.used_at) {
      throw createError('Token ja utilizado', 410);
    }

    if (resetToken.is_expired) {
      throw createError('Token expirado', 410);
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
  issueRefreshToken,
  revokeRefreshToken,
  isRefreshTokenActive,
  REFRESH_COOKIE_OPTIONS,
  sanitizeUser,
  sanitizeBookingCustomer
};
