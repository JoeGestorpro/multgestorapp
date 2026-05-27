const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const emailService = require('./email/email.service');
const { getCompanyPlanSnapshot } = require('./company-plan.service');
const { isValidEmail, isValidPin } = require('../utils/validators');
const { appLogger } = require('../shared/core/logger');
const {
  createError,
  ensureCompany,
  ensureAdmin
} = require('../utils/barber-helpers');

const PIN_RESET_EXPIRATION_MINUTES = 10;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePin(value) {
  return String(value || '').replace(/\D/g, '');
}

async function columnExists(tableName, columnName) {
  const result = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2 LIMIT 1`,
    [tableName, columnName]
  );
  return result.rowCount > 0;
}

async function ensurePinRecoverySchema() {
  const requiredPinResetColumns = ['id', 'company_id', 'user_id', 'email', 'token_hash', 'expires_at', 'used_at', 'created_at'];
  const [hasPinHash, hasPinResetTokens, pinResetColumnsResult] = await Promise.all([
    columnExists('users', 'pin_hash'),
    pool.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pin_reset_tokens' LIMIT 1`),
    pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pin_reset_tokens'`)
  ]);
  const availableColumns = new Set(pinResetColumnsResult.rows.map((row) => row.column_name));
  const hasRequiredPinResetColumns = requiredPinResetColumns.every((columnName) => availableColumns.has(columnName));
  if (!hasPinHash || hasPinResetTokens.rowCount === 0 || !hasRequiredPinResetColumns) {
    throw createError('Atualizacao de banco pendente para recuperar PIN com seguranca', 503);
  }
}

const DEFAULT_THEME = {
  primary_color: '#a3ff12',
  secondary_color: '#0c1017',
  accent_color: '#7fe11e',
  wallpaper_url: null,
  onboarding_completed: false,
  setup_progress: 0
};

async function getCompanyTheme(companyId) {
  const hasThemeColumns = await columnExists('companies', 'logo_url');
  if (!hasThemeColumns) {
    return { company_id: companyId, company_name: 'Barbearia', logo_url: null, wallpaper_url: null, ...DEFAULT_THEME };
  }
  const hasOnboardingColumns = await columnExists('companies', 'onboarding_completed');
  let onboardingFields = '';
  if (hasOnboardingColumns) {
    onboardingFields = ', onboarding_completed, setup_progress';
  }
  const result = await pool.query(
    `SELECT id as company_id, name as company_name, logo_url, primary_color, secondary_color, accent_color, wallpaper_url ${onboardingFields} FROM companies WHERE id = $1 LIMIT 1`,
    [companyId]
  );
  if (result.rowCount === 0) {
    return { company_id: companyId, company_name: 'Barbearia', logo_url: null, wallpaper_url: null, ...DEFAULT_THEME };
  }
  const company = result.rows[0];
  return {
    company_id: company.company_id,
    company_name: company.company_name || 'Barbearia',
    logo_url: company.logo_url || null,
    primary_color: company.primary_color || DEFAULT_THEME.primary_color,
    secondary_color: company.secondary_color || DEFAULT_THEME.secondary_color,
    accent_color: company.accent_color || DEFAULT_THEME.accent_color,
    wallpaper_url: company.wallpaper_url || null,
    onboarding_completed: hasOnboardingColumns ? (company.onboarding_completed || false) : DEFAULT_THEME.onboarding_completed,
    setup_progress: hasOnboardingColumns ? (company.setup_progress || 0) : DEFAULT_THEME.setup_progress
  };
}

class CompanyService {
  async getBarberMe(companyId, user) {
    ensureCompany(companyId);
    const result = await pool.query(
      `SELECT
         users.id, users.name, users.email, users.phone, users.role, users.company_id, users.is_active,
         users.can_launch_sales, users.can_view_own_dashboard, users.can_view_own_reports, users.created_at,
         companies.name AS company_name,
         barber_collaborators.id AS collaborator_id,
         barber_collaborators.nickname,
         barber_collaborators.avatar_url,
         barber_collaborators.commission_type,
         barber_collaborators.commission_rate,
         barber_collaborators.can_make_barter
       FROM users
       LEFT JOIN companies ON companies.id = users.company_id
       LEFT JOIN barber_collaborators
         ON barber_collaborators.user_id = users.id
        AND barber_collaborators.company_id = users.company_id
        AND COALESCE(barber_collaborators.is_deleted, false) = false
       WHERE users.id = $1 AND users.company_id = $2
       LIMIT 1`,
      [user.id, companyId]
    );
    if (result.rowCount === 0) {
      throw createError('Usuario nao encontrado no BarberGestor', 404);
    }
    return result.rows[0];
  }

  async getCompanyPlanProfile(companyId) {
    ensureCompany(companyId);
    const companyPlan = await getCompanyPlanSnapshot(companyId);
    if (!companyPlan) {
      throw createError('Empresa nao encontrada para carregar o plano', 404);
    }
    return {
      company_id: companyId,
      plan: companyPlan.plan_type,
      status: companyPlan.plan_status,
      isActive: Boolean(companyPlan.is_active),
      trialEndsAt: companyPlan.trial_ends_at || null,
      currentPeriodStart: companyPlan.current_period_start || null,
      currentPeriodEnd: companyPlan.current_period_end || companyPlan.next_due_date || null,
      nextDueDate: companyPlan.next_due_date || null,
      maxCollaborators: companyPlan.max_collaborators ?? null,
      gateway: companyPlan.gateway || null,
      source: companyPlan.source || 'unknown',
      subscriptionStatus: companyPlan.subscription_status || null,
      features: companyPlan.features || {}
    };
  }

  async forgotPin(companyId, user, data = {}) {
    ensureCompany(companyId);
    ensureAdmin(user, 'Apenas admin pode iniciar a recuperacao de PIN');
    await ensurePinRecoverySchema();

    const email = normalizeEmail(data.email);
    if (!isValidEmail(email)) {
      throw createError('Informe um e-mail valido para recuperar o PIN.', 400);
    }

    const genericResponse = {
      success: true,
      message: 'Se o e-mail estiver correto, enviaremos um codigo de recuperacao.'
    };

    const accountResult = await pool.query(
      `SELECT users.id, users.name, users.email, companies.name AS company_name
       FROM users
       INNER JOIN companies ON companies.id = users.company_id
       WHERE users.company_id = $1 AND users.email = $2 AND users.role IN ('admin', 'owner')
         AND COALESCE(users.is_active, true) = true
       LIMIT 1`,
      [companyId, email]
    );

    if (accountResult.rowCount === 0) {
      return genericResponse;
    }

    const account = accountResult.rows[0];
    const code = String(Math.floor(100000 + (Math.random() * 900000)));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + (PIN_RESET_EXPIRATION_MINUTES * 60 * 1000));

    await pool.query(
      `UPDATE pin_reset_tokens SET used_at = NOW() WHERE company_id = $1 AND user_id = $2 AND used_at IS NULL`,
      [companyId, account.id]
    );

    await pool.query(
      `INSERT INTO pin_reset_tokens (company_id, user_id, email, token_hash, expires_at) VALUES ($1, $2, $3, $4, $5)`,
      [companyId, account.id, account.email, codeHash, expiresAt]
    );

    try {
      await emailService.sendBarberPinResetEmail({
        to: account.email,
        name: account.name,
        companyName: account.company_name,
        code,
        expiresAt
      });
    } catch (error) {
      appLogger.error({ companyId, userId: account.id, email: account.email, err: error }, '[pin-reset-email] Falha ao enviar codigo de recuperacao');
    }

    return genericResponse;
  }

  async resetPin(companyId, user, data = {}) {
    ensureCompany(companyId);
    ensureAdmin(user, 'Apenas admin pode redefinir o PIN');
    await ensurePinRecoverySchema();

    const email = normalizeEmail(data.email);
    const code = String(data.code || '').trim();
    const newPin = normalizePin(data.newPin || data.new_pin);

    if (!isValidEmail(email)) {
      throw createError('Informe um e-mail valido para redefinir o PIN.', 400);
    }
    if (!/^\d{6}$/.test(code)) {
      throw createError('Informe o codigo de 6 digitos enviado por e-mail.', 400);
    }
    if (!isValidPin(newPin, 4)) {
      throw createError('Informe um novo PIN com pelo menos 4 digitos.', 400);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const tokenResult = await client.query(
        `SELECT pin_reset_tokens.id, pin_reset_tokens.user_id, pin_reset_tokens.token_hash, pin_reset_tokens.expires_at, pin_reset_tokens.used_at
         FROM pin_reset_tokens
         INNER JOIN users ON users.id = pin_reset_tokens.user_id AND users.company_id = pin_reset_tokens.company_id
         WHERE pin_reset_tokens.company_id = $1 AND pin_reset_tokens.email = $2 AND users.role IN ('admin', 'owner')
         ORDER BY pin_reset_tokens.created_at DESC
         LIMIT 1
         FOR UPDATE`,
        [companyId, email]
      );

      if (tokenResult.rowCount === 0) {
        throw createError('Codigo de recuperacao invalido ou expirado.', 400);
      }

      const tokenRecord = tokenResult.rows[0];
      if (tokenRecord.used_at || new Date(tokenRecord.expires_at).getTime() < Date.now()) {
        throw createError('Codigo de recuperacao invalido ou expirado.', 400);
      }

      const codeMatches = await bcrypt.compare(code, tokenRecord.token_hash);
      if (!codeMatches) {
        throw createError('Codigo de recuperacao invalido ou expirado.', 400);
      }

      const pinHash = await bcrypt.hash(newPin, 10);
      await client.query(`UPDATE users SET pin_hash = $1, updated_at = NOW() WHERE id = $2 AND company_id = $3`, [pinHash, tokenRecord.user_id, companyId]);
      await client.query(`UPDATE pin_reset_tokens SET used_at = NOW() WHERE company_id = $1 AND user_id = $2 AND used_at IS NULL`, [companyId, tokenRecord.user_id]);
      await client.query('COMMIT');

      return { success: true, message: 'PIN atualizado com sucesso.' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async validateApprovalCredential(companyId, userId, data) {
    const pin = String(data.pin || '').trim();
    const adminPassword = String(data.adminPassword || data.admin_password || '');
    const hasPinHash = await columnExists('users', 'pin_hash');

    if (process.env.ADMIN_APPROVAL_PIN && pin && pin === process.env.ADMIN_APPROVAL_PIN) {
      return true;
    }

    const credentialColumns = ['password_hash'];
    if (hasPinHash) credentialColumns.push('pin_hash');

    const result = await pool.query(
      `SELECT ${credentialColumns.join(', ')} FROM users WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [userId, companyId]
    );

    if (result.rowCount === 0) {
      throw createError('Usuario admin nao encontrado', 404);
    }

    if (hasPinHash && pin && result.rows[0].pin_hash) {
      const pinMatches = await bcrypt.compare(pin, result.rows[0].pin_hash);
      if (pinMatches) return true;
    }

    if (!adminPassword) {
      throw createError('Informe a senha admin ou PIN para confirmar', 401);
    }

    const passwordMatches = await bcrypt.compare(adminPassword, result.rows[0].password_hash);
    if (!passwordMatches) {
      throw createError('Senha admin ou PIN invalido', 401);
    }
    return true;
  }

  async validateApprovalPin(companyId, user, pinValue) {
    ensureCompany(companyId);
    ensureAdmin(user, 'Apenas dono ou admin pode cancelar vendas');

    const pin = normalizePin(pinValue);
    if (!isValidPin(pin, 4)) {
      throw createError('Informe o PIN admin com pelo menos 4 digitos', 401);
    }

    const hasPinHash = await columnExists('users', 'pin_hash');
    if (!hasPinHash) {
      throw createError('PIN admin ainda nao esta configurado no banco', 503);
    }

    const result = await pool.query(
      `SELECT pin_hash FROM users WHERE id = $1 AND company_id = $2 AND role IN ('admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin') AND COALESCE(is_active, true) = true LIMIT 1`,
      [user.id, companyId]
    );

    if (result.rowCount === 0) {
      throw createError('Usuario admin nao encontrado para validar PIN', 404);
    }
    if (!result.rows[0].pin_hash) {
      throw createError('Configure um PIN admin antes de cancelar vendas', 409);
    }

    const pinMatches = await bcrypt.compare(pin, result.rows[0].pin_hash);
    if (!pinMatches) {
      throw createError('PIN admin invalido', 401);
    }
    return true;
  }

  async getOnboardingStatus(companyId) {
    const hasOnboardingColumns = await columnExists('companies', 'onboarding_completed');
    if (!hasOnboardingColumns) {
      return { onboarding_completed: false, setup_progress: 0 };
    }
    const result = await pool.query(`SELECT onboarding_completed, setup_progress FROM companies WHERE id = $1`, [companyId]);
    if (result.rowCount === 0) {
      return { onboarding_completed: false, setup_progress: 0 };
    }
    return {
      onboarding_completed: result.rows[0].onboarding_completed || false,
      setup_progress: result.rows[0].setup_progress || 0
    };
  }

  async saveOnboardingSetup(companyId, data) {
    const allowedFields = ['company_name', 'logo_url', 'primary_color', 'secondary_color', 'accent_color', 'phone', 'whatsapp', 'address'];
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        let value = data[field];
        if (field === 'primary_color' || field === 'secondary_color' || field === 'accent_color') {
          if (typeof value === 'string' && !/^#[0-9A-Fa-f]{6}$/.test(value)) continue;
        }
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    const hasOnboardingColumns = await columnExists('companies', 'onboarding_completed');
    if (hasOnboardingColumns && data.onboarding_completed !== undefined) {
      setClauses.push(`onboarding_completed = $${paramIndex}`);
      values.push(data.onboarding_completed);
      paramIndex++;
    }
    if (hasOnboardingColumns && data.setup_progress !== undefined) {
      setClauses.push(`setup_progress = $${paramIndex}`);
      values.push(data.setup_progress);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      return getCompanyTheme(companyId);
    }

    values.push(companyId);
    await pool.query(`UPDATE companies SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, values);
    return getCompanyTheme(companyId);
  }
}

module.exports = CompanyService;
