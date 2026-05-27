const { appLogger } = require('../shared/core/logger');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/database');
const emailService = require('./email/email.service');
const {
  createError,
  normalizeEmail,
  normalizePhone,
  hashToken,
  maskTokenPreview,
  maskEmailPreview
} = require('../shared/capabilities/booking-engine/scheduling-utils');

function logFlowStep(flow, step, details = {}) {
  appLogger.info({ details }, `[client-booking:${flow}] ${step}`);
}

async function getCompanyBySlug(companySlug, client = pool) {
  const slug = String(companySlug || '').trim().toLowerCase();

  if (!slug) {
    throw createError('Empresa de agendamento invalida', 400);
  }

  const result = await client.query(
    `SELECT companies.id, companies.name, companies.public_booking_slug
     FROM companies
     INNER JOIN company_modules ON company_modules.company_id = companies.id
     INNER JOIN modules ON modules.id = company_modules.module_id
     WHERE companies.public_booking_slug = $1
       AND COALESCE(companies.is_deleted, false) = false
       AND company_modules.status = 'active'
       AND modules.slug = 'barber'
       AND modules.is_active = true
     LIMIT 1`,
    [slug]
  );

  if (result.rowCount === 0) {
    throw createError('Empresa não encontrada', 404);
  }

  return result.rows[0];
}

function validateEmailConfiguration() {
  const resendApiKeyExists = Boolean(String(process.env.RESEND_API_KEY || '').trim());
  const emailFromAddress = String(process.env.EMAIL_FROM || '').trim();
  const emailFromName = String(process.env.EMAIL_NAME || 'MultGestor').trim();
  const emailFrom = emailFromAddress ? `${emailFromName} <${emailFromAddress}>` : '';
  const emailFromIsValid = /^.+<[^<>@\s]+@[^<>@\s]+>$/.test(emailFrom) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailFrom);

  return {
    resendApiKeyExists,
    emailFrom,
    emailFromIsValid,
    appUrlExists: Boolean(
      String(process.env.APP_BASE_URL || process.env.FRONTEND_URL || process.env.APP_URL || '').trim()
    ),
    apiUrlExists: Boolean(String(process.env.API_URL || '').trim())
  };
}

async function writeAuthAudit(action, options = {}, client = pool) {
  await client.query(
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

async function createVerificationToken({ customer, company, client = pool }) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresInHours = Math.max(Number(process.env.EMAIL_VERIFICATION_TOKEN_HOURS || 24), 1);

  await client.query(
    `UPDATE email_verification_tokens
     SET used_at = COALESCE(used_at, NOW())
     WHERE booking_customer_id = $1
       AND used_at IS NULL`,
    [customer.id]
  );

  const tokenResult = await client.query(
    `INSERT INTO email_verification_tokens (booking_customer_id, company_id, token_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 * INTERVAL '1 hour'))
     RETURNING id, expires_at`,
    [customer.id, company.id, tokenHash, expiresInHours]
  );

  return {
    tokenId: tokenResult.rows[0].id,
    expiresAt: tokenResult.rows[0].expires_at,
    rawToken
  };
}

async function dispatchVerificationEmail({ customer, tokenId, rawToken, expiresAt, client = pool }) {
  const emailResult = await emailService.sendClientEmailVerificationEmail({
    to: customer.email,
    name: customer.name,
    token: rawToken,
    expiresAt
  });

  await writeAuthAudit('client_email_verification_sent', {
    email: customer.email,
    details: {
      booking_customer_id: customer.id,
      token_id: tokenId,
      token_preview: maskTokenPreview(rawToken),
      provider: emailResult.provider,
      message_id: emailResult.messageId
    }
  }, client);

  return emailResult;
}

async function preRegisterClient(companySlug, data, meta = {}) {
  logFlowStep('pre-register', 'request_received', {
    companySlug: String(companySlug || '').trim(),
    email: maskEmailPreview(data.email)
  });

  const name = String(data.name || '').trim();
  const phone = normalizePhone(data.phone);
  const email = normalizeEmail(data.email);
  const password = String(data.password || '');
  const confirmPassword = String(data.confirmPassword || data.confirm_password || '');

  if (!name || !phone || !email || !password || !confirmPassword) {
    throw createError('Nome, telefone, email, senha e confirmacao de senha sao obrigatorios', 400);
  }

  if (password.length < 6) {
    throw createError('A senha deve ter pelo menos 6 caracteres', 400);
  }

  if (password !== confirmPassword) {
    throw createError('As senhas nao conferem', 400);
  }

  logFlowStep('pre-register', 'payload_validated', {
    hasName: Boolean(name),
    hasPhone: Boolean(phone),
    email: maskEmailPreview(email)
  });

  const client = await pool.connect();
  let verificationEmailJob = null;
  let responsePayload = null;

  try {
    await client.query('BEGIN');

    const company = await getCompanyBySlug(companySlug, client);
    logFlowStep('pre-register', 'company_resolved', {
      companySlug: company.public_booking_slug,
      companyId: company.id
    });

    const existingCustomerResult = await client.query(
      `SELECT id, company_id, email_verified, status
       FROM booking_customers
       WHERE company_id = $1
         AND lower(email) = $2
       LIMIT 1`,
      [company.id, email]
    );

    const conflictingAdminResult = await client.query(
      `SELECT id
       FROM users
       WHERE company_id = $1
         AND lower(email) = $2
       LIMIT 1`,
      [company.id, email]
    );

    const passwordHash = await bcrypt.hash(password, 10);

    if (conflictingAdminResult.rowCount > 0) {
      throw createError('Este email ja pertence a um usuario administrativo desta empresa. Faca login com a conta existente.', 409);
    }

    if (existingCustomerResult.rowCount > 0) {
      const existingCustomer = existingCustomerResult.rows[0];
      logFlowStep('pre-register', 'existing_user_found', {
        customerId: existingCustomer.id,
        companyMatches: String(existingCustomer.company_id) === String(company.id),
        emailVerified: existingCustomer.email_verified,
        status: existingCustomer.status
      });


      if (existingCustomer.email_verified && existingCustomer.status === 'active') {
        throw createError('E-mail já cadastrado. Faça login.', 409);
      }

      await client.query(
        `UPDATE booking_customers
         SET name = $1,
             phone = $2,
             password_hash = $3,
             email_verified = false,
             status = 'pending',
             source = 'agendamento_online',
             updated_at = NOW()
         WHERE id = $4
           AND company_id = $5`,
        [name, phone, passwordHash, existingCustomer.id, company.id]
      );
      logFlowStep('pre-register', 'pending_user_updated', {
        customerId: existingCustomer.id
      });

      verificationEmailJob = await createVerificationToken({
        customer: {
          id: existingCustomer.id,
          name,
          email
        },
        company,
        client
      });
      logFlowStep('pre-register', 'verification_token_created', {
        customerId: existingCustomer.id,
        tokenId: verificationEmailJob.tokenId,
        tokenPreview: maskTokenPreview(verificationEmailJob.rawToken)
      });

      await client.query('COMMIT');
      logFlowStep('pre-register', 'transaction_committed', {
        customerId: existingCustomer.id
      });

      responsePayload = {
        alreadyExisted: true,
        message: 'Cadastro já iniciado. Reenviamos a confirmação.',
        customer: {
          id: existingCustomer.id,
          name,
          email
        },
        token: verificationEmailJob
      };
    } else {
      const userResult = await client.query(
        `INSERT INTO booking_customers (
           company_id,
           name,
           phone,
           email,
           password_hash,
           email_verified,
           status,
           source,
           updated_at
         )
         VALUES ($1, $2, $3, $4, $5, false, 'pending', 'agendamento_online', NOW())
         RETURNING id, name, email`,
        [company.id, name, phone, email, passwordHash]
      );
      logFlowStep('pre-register', 'client_user_created', {
        customerId: userResult.rows[0].id,
        companyId: company.id
      });

      verificationEmailJob = await createVerificationToken({
        customer: userResult.rows[0],
        company,
        client
      });
      logFlowStep('pre-register', 'verification_token_created', {
        customerId: userResult.rows[0].id,
        tokenId: verificationEmailJob.tokenId,
        tokenPreview: maskTokenPreview(verificationEmailJob.rawToken)
      });

      await writeAuthAudit('client_pre_registered', {
        email,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        details: {
          company_id: company.id,
          booking_customer_id: userResult.rows[0].id
        }
      }, client);

      await client.query('COMMIT');
      logFlowStep('pre-register', 'transaction_committed', {
        customerId: userResult.rows[0].id
      });

      responsePayload = {
        message: 'Cadastro iniciado. Verifique seu e-mail.',
        customer: userResult.rows[0],
        token: verificationEmailJob
      };
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logFlowStep('pre-register', 'transaction_rolled_back', {
      error: error.message,
      statusCode: error.statusCode || 500
    });
    throw error;
  } finally {
    client.release();
  }

  const emailConfig = validateEmailConfiguration();
  logFlowStep('pre-register', 'email_configuration_checked', {
    resendConfigured: emailConfig.resendApiKeyExists,
    emailFromConfigured: Boolean(emailConfig.emailFrom),
    emailFromIsValid: emailConfig.emailFromIsValid,
    appUrlConfigured: emailConfig.appUrlExists,
    apiUrlConfigured: emailConfig.apiUrlExists
  });

  let emailSent = false;
  let emailError = null;

  try {
    logFlowStep('pre-register', 'sending_confirmation_email', {
      customerId: responsePayload.customer.id,
      tokenId: responsePayload.token.tokenId
    });
    await dispatchVerificationEmail({
      customer: responsePayload.customer,
      tokenId: responsePayload.token.tokenId,
      rawToken: responsePayload.token.rawToken,
      expiresAt: responsePayload.token.expiresAt
    });
    logFlowStep('pre-register', 'confirmation_email_sent', {
      customerId: responsePayload.customer.id,
      tokenId: responsePayload.token.tokenId
    });
    emailSent = true;
  } catch (error) {
    emailSent = false;
    emailError = error.message || 'Erro ao enviar e-mail de confirmação';

    appLogger.error({ customerId: responsePayload.customer.id, tokenId: responsePayload.token.tokenId, emailError, provider: 'resend' }, '[client-booking:pre-register] confirmation_email_failed');
  }

  return {
    success: true,
    alreadyExisted: responsePayload.alreadyExisted || false,
    emailSent,
    message: emailSent
      ? responsePayload.message
      : 'Cadastro iniciado, mas não conseguimos enviar o e-mail de confirmação. Use reenviar confirmação.'
  };
}

async function resendClientConfirmation(data, meta = {}) {
  const email = normalizeEmail(data.email);
  const companySlug = String(data.companySlug || data.company_slug || '').trim().toLowerCase();

  if (!email || !companySlug) {
    throw createError('Email e companySlug sao obrigatorios', 400);
  }

  const client = await pool.connect();
  let emailJob = null;
  let user = null;
  let company = null;

  try {
    await client.query('BEGIN');

    logFlowStep('resend-confirmation', 'request_received', {
      companySlug,
      email: maskEmailPreview(email)
    });

    company = await getCompanyBySlug(companySlug, client);
    logFlowStep('resend-confirmation', 'company_resolved', {
      companyId: company.id
    });
    const userResult = await client.query(
      `SELECT id, name, email, company_id, email_verified, status
       FROM booking_customers
       WHERE company_id = $1
         AND lower(email) = $2
       LIMIT 1`,
      [company.id, email]
    );

    if (userResult.rowCount === 0) {
      throw createError('Nao encontramos um pre-cadastro pendente para este email', 404);
    }

    user = userResult.rows[0];

    if (user.email_verified && user.status === 'active') {
      throw createError('Este email ja foi confirmado. Faca login para continuar.', 409);
    }

    emailJob = await createVerificationToken({ customer: user, company, client });
    logFlowStep('resend-confirmation', 'verification_token_created', {
      customerId: user.id,
      tokenId: emailJob.tokenId,
      tokenPreview: maskTokenPreview(emailJob.rawToken)
    });

    await writeAuthAudit('client_email_verification_resent', {
      email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        company_id: company.id,
        booking_customer_id: user.id
      }
    }, client);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  let emailSent = false;
  let emailError = null;

  try {
    logFlowStep('resend-confirmation', 'sending_confirmation_email', {
      customerId: user.id,
      tokenId: emailJob.tokenId
    });
    await dispatchVerificationEmail({
      customer: user,
      tokenId: emailJob.tokenId,
      rawToken: emailJob.rawToken,
      expiresAt: emailJob.expiresAt
    });
    logFlowStep('resend-confirmation', 'confirmation_email_sent', {
      customerId: user.id,
      tokenId: emailJob.tokenId
    });
    emailSent = true;
  } catch (error) {
    emailSent = false;
    emailError = error.message || 'Erro ao enviar e-mail de confirmação';

    appLogger.error({ customerId: user.id, tokenId: emailJob.tokenId, emailError, provider: 'resend' }, '[client-booking:resend-confirmation] confirmation_email_failed');
  }

  return {
    success: true,
    emailSent,
    message: emailSent
      ? 'Cadastro já iniciado. Reenviamos a confirmação.'
      : 'Não conseguimos enviar o e-mail de confirmação. Tente novamente em instantes.'
  };
}

async function confirmClientEmail(token, meta = {}) {
  const rawToken = String(token || '').trim();

  if (!rawToken) {
    throw createError('Token de confirmacao obrigatorio', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    logFlowStep('confirm-email', 'request_received', {
      tokenPreview: maskTokenPreview(rawToken)
    });

    const tokenResult = await client.query(
      `SELECT
         email_verification_tokens.id,
         email_verification_tokens.booking_customer_id,
         email_verification_tokens.company_id,
         email_verification_tokens.expires_at,
         email_verification_tokens.used_at,
         booking_customers.name,
         booking_customers.email,
         companies.public_booking_slug
       FROM email_verification_tokens
       INNER JOIN booking_customers
         ON booking_customers.id = email_verification_tokens.booking_customer_id
        AND booking_customers.company_id = email_verification_tokens.company_id
       INNER JOIN companies ON companies.id = email_verification_tokens.company_id
       WHERE email_verification_tokens.token_hash = $1
       LIMIT 1
       FOR UPDATE`,
      [hashToken(rawToken)]
    );

    if (tokenResult.rowCount === 0) {
      throw createError('Token de confirmacao invalido', 404);
    }

    const verification = tokenResult.rows[0];
    logFlowStep('confirm-email', 'token_resolved', {
      tokenId: verification.id,
      customerId: verification.booking_customer_id,
      tokenAlreadyUsed: Boolean(verification.used_at)
    });

    if (verification.used_at) {
      throw createError('Este token ja foi utilizado', 410);
    }

    if (new Date(verification.expires_at) <= new Date()) {
      throw createError('Este token expirou', 410);
    }

    await client.query(
      `UPDATE email_verification_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [verification.id]
    );

    await client.query(
      `UPDATE booking_customers
       SET email_verified = true,
           status = 'active',
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2`,
      [verification.booking_customer_id, verification.company_id]
    );

    await writeAuthAudit('client_email_confirmed', {
      email: verification.email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        booking_customer_id: verification.booking_customer_id,
        token_id: verification.id,
        token_preview: maskTokenPreview(rawToken)
      }
    }, client);

    await client.query('COMMIT');

    const bookingUrl = `/agendar/${verification.public_booking_slug}`;

    return {
      message: 'Email confirmado com sucesso.',
      booking_url: bookingUrl,
      login_url: `/agendar/${verification.public_booking_slug}/login?redirect=${encodeURIComponent(bookingUrl)}`
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { preRegisterClient, resendClientConfirmation, confirmClientEmail };
