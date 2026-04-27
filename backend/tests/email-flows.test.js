const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
process.env.EMAIL_PROVIDER = 'mock';
process.env.FRONTEND_URL = 'https://app.multgestor.test';
delete process.env.MOCK_EMAIL_FAIL;

const pool = require('../src/config/database');
const authController = require('../src/controllers/auth.controller');
const authService = require('../src/services/auth.service');
const mockProvider = require('../src/providers/email/mock.provider');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createMockResponse() {
  const response = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  return response;
}

async function callController(handler, body) {
  const req = {
    body,
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'email-flow-test'
    }
  };
  const res = createMockResponse();

  await handler(req, res);
  return res;
}

async function cleanup({ companyId, emails }) {
  if (emails.length > 0) {
    await pool.query('DELETE FROM auth_audit_logs WHERE email = ANY($1)', [emails]);
  }

  if (companyId) {
    await pool.query('DELETE FROM first_access_tokens WHERE company_id = $1', [companyId]);
    await pool.query('DELETE FROM companies WHERE id = $1', [companyId]);
  }

  if (emails.length > 0) {
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [emails]);
  }
}

async function main() {
  const stamp = Date.now();
  const clientEmail = `email-client-${stamp}@example.com`;
  const missingEmail = `missing-${stamp}@example.com`;
  const failEmail = `email-fail-${stamp}@example.com`;
  const password = 'SenhaTeste123';
  const emails = [clientEmail, missingEmail, failEmail];
  let companyId = null;

  try {
    mockProvider.clear();

    const company = await pool.query(
      `INSERT INTO companies (name, niche_type)
       VALUES ($1, 'barber')
       RETURNING id`,
      [`Empresa Email ${stamp}`]
    );
    companyId = company.rows[0].id;

    const hash = await bcrypt.hash(password, 10);
    const client = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, company_id, is_active)
       VALUES ('Cliente Email', $1, $2, 'admin', $3, true)
       RETURNING id`,
      [clientEmail, hash, companyId]
    );

    const firstAccessResponse = await callController(authController.requestFirstAccess, {
      email: clientEmail
    });
    assert(firstAccessResponse.statusCode === 200, 'primeiro acesso deveria responder 200');
    assert(firstAccessResponse.payload.success === true, 'primeiro acesso deveria responder sucesso');
    assert(!firstAccessResponse.payload.data, 'primeiro acesso publico nao deve retornar data/token');

    const firstAccessToken = await pool.query(
      `SELECT token, expires_at
       FROM first_access_tokens
       WHERE user_id = $1 AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [client.rows[0].id]
    );
    assert(firstAccessToken.rowCount === 1, 'token de primeiro acesso nao foi salvo');
    assert(new Date(firstAccessToken.rows[0].expires_at).getTime() > 0, 'token de primeiro acesso sem expiracao');

    assert(mockProvider.sentMessages.length === 1, 'email de primeiro acesso nao foi disparado');
    assert(mockProvider.sentMessages[0].html.includes('/set-password?token='), 'email de primeiro acesso sem link correto');

    await authService.validateFirstAccessToken('token-invalido')
      .then(() => assert(false, 'primeiro acesso com token invalido deveria falhar'))
      .catch((error) => assert(error.statusCode === 404, 'primeiro acesso invalido nao retornou 404'));

    const missingResponse = await callController(authController.forgotPassword, {
      email: missingEmail
    });
    assert(missingResponse.statusCode === 200, 'email inexistente deve manter resposta neutra');
    assert(!missingResponse.payload.data, 'email inexistente nao deve retornar token');

    const forgotResponse = await callController(authController.forgotPassword, {
      email: clientEmail
    });
    assert(forgotResponse.statusCode === 200, 'forgot-password deveria responder 200');
    assert(!forgotResponse.payload.data, 'forgot-password publico nao deve retornar data/token');

    const resetToken = await pool.query(
      `SELECT token, expires_at
       FROM password_reset_tokens
       WHERE user_id = $1 AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [client.rows[0].id]
    );
    assert(resetToken.rowCount === 1, 'token de reset nao foi salvo');
    assert(mockProvider.sentMessages.length === 2, 'email de reset nao foi disparado');
    assert(mockProvider.sentMessages[1].html.includes('/reset-password?token='), 'email de reset sem link correto');

    await authService.resetPassword({
      token: 'token-invalido',
      password: `${password}3`
    })
      .then(() => assert(false, 'reset com token invalido deveria falhar'))
      .catch((error) => assert(error.statusCode === 404, 'reset invalido nao retornou 404'));

    await authService.resetPassword({
      token: resetToken.rows[0].token,
      password: `${password}4`
    });
    await authService.resetPassword({
      token: resetToken.rows[0].token,
      password: `${password}5`
    })
      .then(() => assert(false, 'reset token usado deveria falhar'))
      .catch((error) => assert(error.statusCode === 410, 'reset usado nao retornou 410'));

    const expiredReset = await authService.requestPasswordReset({ email: clientEmail });
    await pool.query(
      `UPDATE password_reset_tokens
       SET expires_at = NOW() - INTERVAL '1 hour'
       WHERE token = $1`,
      [expiredReset.token]
    );
    await authService.resetPassword({
      token: expiredReset.token,
      password: `${password}6`
    })
      .then(() => assert(false, 'reset expirado deveria falhar'))
      .catch((error) => assert(error.statusCode === 410, 'reset expirado nao retornou 410'));

    const failHash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, company_id, is_active)
       VALUES ('Email Falha', $1, $2, 'admin', $3, true)`,
      [failEmail, failHash, companyId]
    );

    process.env.MOCK_EMAIL_FAIL = 'true';
    const failedSend = await authService.requestPasswordReset({ email: failEmail });
    assert(failedSend.emailSent === false, 'falha de envio deveria ser tratada sem lancar erro');

    const failedToken = await pool.query(
      `SELECT id
       FROM password_reset_tokens
       WHERE token = $1
       LIMIT 1`,
      [failedSend.token]
    );
    assert(failedToken.rowCount === 1, 'token deve continuar salvo mesmo com falha auditada de envio');

    console.log('email-flows.test.js OK');
  } finally {
    delete process.env.MOCK_EMAIL_FAIL;
    await cleanup({ companyId, emails });
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
