'use strict';

/**
 * Sessões de refresh token — rotação e revogação server-side (migração 030)
 *
 * Valida contra banco de teste real:
 *   - issueRefreshToken persiste sessão ativa com jti
 *   - revokeRefreshToken invalida a sessão
 *   - rotação (replacesJti) revoga o token anterior e liga replaced_by
 *   - token expirado não é considerado ativo
 *   - generateRefreshToken inclui jti no payload quando fornecido
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret-not-for-production';

const hasTestDb = !!(
  process.env.TEST_DATABASE_URL ||
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('supabase'))
);
const describeDb = hasTestDb ? describe : describe.skip;

describeDb('Refresh token — sessão server-side (requires TEST_DATABASE_URL)', () => {
  let pool;
  let authService;
  const FAKE_USER_ID = crypto.randomUUID();
  const FAKE_COMPANY_ID = crypto.randomUUID();

  beforeAll(() => {
    pool = require('../../src/config/database');
    authService = require('../../src/services/auth.service');
  });

  afterAll(async () => {
    await pool._originalQuery('DELETE FROM refresh_tokens WHERE subject_id = $1', [FAKE_USER_ID]);
    await pool.end();
    await pool.poolTenant.end();
  });

  it('issueRefreshToken persiste sessão ativa e o JWT carrega o jti', async () => {
    const token = await authService.issueRefreshToken(
      FAKE_USER_ID, 'admin', FAKE_COMPANY_ID, 'barber_admin'
    );

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    expect(payload.token_type).toBe('refresh');
    expect(payload.jti).toBeDefined();
    expect(payload.auth_scope).toBe('barber_admin');

    await expect(authService.isRefreshTokenActive(payload.jti)).resolves.toBe(true);
  });

  it('revokeRefreshToken invalida a sessão', async () => {
    const token = await authService.issueRefreshToken(
      FAKE_USER_ID, 'admin', FAKE_COMPANY_ID, 'barber_admin'
    );
    const { jti } = jwt.verify(token, process.env.JWT_SECRET);

    await authService.revokeRefreshToken(jti);

    await expect(authService.isRefreshTokenActive(jti)).resolves.toBe(false);
  });

  it('rotação: replacesJti revoga o token anterior e registra replaced_by', async () => {
    const first = await authService.issueRefreshToken(
      FAKE_USER_ID, 'admin', FAKE_COMPANY_ID, 'barber_admin'
    );
    const { jti: firstJti } = jwt.verify(first, process.env.JWT_SECRET);

    const second = await authService.issueRefreshToken(
      FAKE_USER_ID, 'admin', FAKE_COMPANY_ID, 'barber_admin',
      { replacesJti: firstJti }
    );
    const { jti: secondJti } = jwt.verify(second, process.env.JWT_SECRET);

    await expect(authService.isRefreshTokenActive(firstJti)).resolves.toBe(false);
    await expect(authService.isRefreshTokenActive(secondJti)).resolves.toBe(true);

    const row = await pool._originalQuery(
      'SELECT replaced_by FROM refresh_tokens WHERE jti = $1', [firstJti]
    );
    expect(row.rows[0].replaced_by).toBe(secondJti);
  });

  it('sessão expirada não é ativa', async () => {
    const jti = crypto.randomUUID();
    await pool._originalQuery(
      `INSERT INTO refresh_tokens (jti, subject_id, auth_scope, expires_at)
       VALUES ($1, $2, 'barber_admin', NOW() - interval '1 minute')`,
      [jti, FAKE_USER_ID]
    );

    await expect(authService.isRefreshTokenActive(jti)).resolves.toBe(false);
  });

  it('purge job remove sessões expiradas além da retenção', async () => {
    const { runRefreshTokenPurgeJob } = require('../../src/jobs/refresh-token-purge-job');
    const oldJti = crypto.randomUUID();
    const freshJti = crypto.randomUUID();

    await pool._originalQuery(
      `INSERT INTO refresh_tokens (jti, subject_id, auth_scope, expires_at)
       VALUES ($1, $2, 'barber_admin', NOW() - interval '30 days'),
              ($3, $2, 'barber_admin', NOW() + interval '7 days')`,
      [oldJti, FAKE_USER_ID, freshJti]
    );

    await runRefreshTokenPurgeJob();

    const rows = await pool._originalQuery(
      'SELECT jti FROM refresh_tokens WHERE jti = ANY($1::uuid[])',
      [[oldJti, freshJti]]
    );
    const remaining = rows.rows.map((r) => r.jti);
    expect(remaining).not.toContain(oldJti);
    expect(remaining).toContain(freshJti);
  });

  it('token legado (sem jti) continua verificável pelo JWT', () => {
    const legacy = authService.generateRefreshToken(
      FAKE_USER_ID, 'admin', FAKE_COMPANY_ID, 'barber_admin'
    );
    const payload = jwt.verify(legacy, process.env.JWT_SECRET);
    expect(payload.token_type).toBe('refresh');
    expect(payload.jti).toBeUndefined();
  });
});
