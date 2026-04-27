const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
process.env.EMAIL_PROVIDER = 'mock';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const pool = require('../src/config/database');
const authService = require('../src/services/auth.service');
const masterService = require('../src/services/master.service');
const requireMasterAdmin = require('../src/middlewares/master.middleware');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runMasterMiddleware(user) {
  let statusCode = null;
  let nextCalled = false;

  const req = { user };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      return payload;
    }
  };

  requireMasterAdmin(req, res, () => {
    nextCalled = true;
  });

  return { statusCode, nextCalled };
}

async function cleanup({ companyId, moduleSlug, emails }) {
  if (emails.length > 0) {
    await pool.query('DELETE FROM auth_audit_logs WHERE email = ANY($1)', [emails]);
  }

  if (companyId) {
    await pool.query('DELETE FROM company_modules WHERE company_id = $1', [companyId]);
    await pool.query('DELETE FROM first_access_tokens WHERE company_id = $1', [companyId]);
    await pool.query('DELETE FROM companies WHERE id = $1', [companyId]);
  }

  if (emails.length > 0) {
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [emails]);
  }

  if (moduleSlug) {
    await pool.query('DELETE FROM modules WHERE slug = $1', [moduleSlug]);
  }
}

async function main() {
  const stamp = Date.now();
  const masterEmail = `test-master-${stamp}@example.com`;
  const clientEmail = `test-client-${stamp}@example.com`;
  const collaboratorEmail = `test-collab-${stamp}@example.com`;
  const password = 'SenhaTeste123';
  const moduleSlug = `barber-test-${stamp}`;
  const emails = [masterEmail, clientEmail, collaboratorEmail];
  let companyId = null;

  try {
    const masterHash = await bcrypt.hash(password, 10);
    const master = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, company_id, is_active)
       VALUES ('Master Test', $1, $2, 'master_admin', NULL, true)
       RETURNING id, role, company_id`,
      [masterEmail, masterHash]
    );

    assert(master.rows[0].role === 'master_admin', 'master_admin nao foi criado');
    assert(master.rows[0].company_id === null, 'master_admin nao deve ter company_id');

    const masterLogin = await authService.login({ email: masterEmail, password });
    assert(masterLogin.user.role === 'master_admin', 'login master_admin falhou');
    assert(masterLogin.modules.length === 0, 'master_admin nao deve depender de modulos');

    const masterAccess = runMasterMiddleware({ role: 'master_admin' });
    assert(masterAccess.nextCalled === true, 'master_admin deveria acessar rotas master');

    const adminBlocked = runMasterMiddleware({ role: 'admin' });
    assert(adminBlocked.statusCode === 403, 'admin de cliente deveria ser bloqueado no painel master');

    const collaboratorBlocked = runMasterMiddleware({ role: 'collaborator' });
    assert(collaboratorBlocked.statusCode === 403, 'colaborador deveria ser bloqueado no painel master');

    const company = await pool.query(
      `INSERT INTO companies (name, niche_type)
       VALUES ($1, 'barber')
       RETURNING id`,
      [`Empresa Teste ${stamp}`]
    );
    companyId = company.rows[0].id;

    const moduleResult = await pool.query(
      `INSERT INTO modules (name, slug, description, is_active)
       VALUES ('BarberGestor', $1, 'Modulo de teste', true)
       RETURNING id`,
      [moduleSlug]
    );
    await pool.query(
      `INSERT INTO company_modules (company_id, module_id, status, activated_at)
       VALUES ($1, $2, 'active', NOW())`,
      [companyId, moduleResult.rows[0].id]
    );

    await masterService.generateFirstAccess({
      companyId,
      name: 'Cliente Teste',
      email: `invalid-role-${stamp}@example.com`,
      role: 'master_admin',
      generatedBy: master.rows[0].id
    })
      .then(() => assert(false, 'primeiro acesso nao deveria criar master_admin'))
      .catch((error) => assert(error.statusCode === 400, 'role invalida deveria retornar 400'));

    const firstAccess = await masterService.generateFirstAccess({
      companyId,
      name: 'Cliente Teste',
      email: clientEmail,
      role: 'admin',
      generatedBy: master.rows[0].id
    });

    const validated = await authService.validateFirstAccessToken(firstAccess.firstAccess.token);
    assert(validated.user.email === clientEmail, 'primeiro acesso valido falhou');

    const expiredToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO first_access_tokens (company_id, user_id, token, expires_at)
       VALUES ($1, $2, $3, NOW() - INTERVAL '1 hour')`,
      [companyId, firstAccess.user.id, expiredToken]
    );
    await authService.validateFirstAccessToken(expiredToken)
      .then(() => assert(false, 'token expirado deveria falhar'))
      .catch((error) => assert(error.statusCode === 410, 'token expirado nao retornou 410'));

    await authService.setFirstAccessPassword({
      token: firstAccess.firstAccess.token,
      password
    });
    await authService.validateFirstAccessToken(firstAccess.firstAccess.token)
      .then(() => assert(false, 'token usado deveria falhar'))
      .catch((error) => assert(error.statusCode === 410, 'token usado nao retornou 410'));

    const clientLogin = await authService.login({ email: clientEmail, password });
    assert(clientLogin.user.company_id === companyId, 'cliente perdeu company_id');
    assert(clientLogin.modules.some((module) => module.slug === moduleSlug), 'cliente nao recebeu modulo ativo');

    const unknownReset = await authService.requestPasswordReset({ email: `missing-${stamp}@example.com` });
    assert(unknownReset === null, 'reset nao deve revelar email inexistente');

    const reset = await authService.requestPasswordReset({ email: clientEmail });
    assert(reset.token, 'reset token nao foi gerado');

    const expiredResetToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() - INTERVAL '1 hour')`,
      [firstAccess.user.id, expiredResetToken]
    );
    await authService.resetPassword({ token: expiredResetToken, password: `${password}2` })
      .then(() => assert(false, 'reset expirado deveria falhar'))
      .catch((error) => assert(error.statusCode === 410, 'reset expirado nao retornou 410'));

    await authService.resetPassword({ token: reset.token, password: `${password}4` });
    await authService.resetPassword({ token: reset.token, password: `${password}5` })
      .then(() => assert(false, 'reset token usado deveria falhar'))
      .catch((error) => assert(error.statusCode === 410, 'reset usado nao retornou 410'));

    const collaboratorHash = await bcrypt.hash(password, 10);
    const collaborator = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, company_id, is_active)
       VALUES ('Colab Teste', $1, $2, 'collaborator', $3, true)
       RETURNING id`,
      [collaboratorEmail, collaboratorHash, companyId]
    );
    const collaboratorLogin = await authService.login({ email: collaboratorEmail, password });
    assert(collaboratorLogin.user.company_id === companyId, 'colaborador perdeu isolamento por empresa');

    const masterToken = jwt.sign(
      { id: master.rows[0].id, email: masterEmail, role: 'master_admin', company_id: null },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const collaboratorToken = jwt.sign(
      { id: collaborator.rows[0].id, email: collaboratorEmail, role: 'collaborator', company_id: companyId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    assert(masterToken && collaboratorToken, 'tokens JWT nao foram gerados');

    console.log('auth-flows.test.js OK');
  } finally {
    await cleanup({ companyId, moduleSlug, emails });
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
