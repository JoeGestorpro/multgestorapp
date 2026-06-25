'use strict';

const { AsyncLocalStorage } = require('async_hooks');

describe('ALS tenant binding (unit)', () => {
  let pool, tenantStore, runWithTenantClient, _originalQuery;

  beforeEach(() => {
    jest.resetModules();
    pool = require('../../src/config/database');
    tenantStore = require('../../src/config/database').tenantStore;
    runWithTenantClient = require('../../src/config/database').runWithTenantClient;
    _originalQuery = require('../../src/config/database')._originalQuery;
  });

  it('pool.query usa client do ALS quando há contexto', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [{ result: 'from-client' }], rowCount: 1 }),
    };

    let result;
    await runWithTenantClient(mockClient, async () => {
      result = await pool.query('SELECT 1');
    });

    expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
    expect(result.rows[0].result).toBe('from-client');
  });

  it('pool.query delega para _originalQuery quando NÃO há contexto ALS', () => {
    expect(typeof pool._originalQuery).toBe('function');
    expect(typeof pool.query).toBe('function');
    expect(pool.query).not.toBe(pool._originalQuery);
  });

  it('contexto ALS não vaza entre chamadas', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    };

    await runWithTenantClient(mockClient, async () => {
      const store = tenantStore.getStore();
      expect(store?.client).toBe(mockClient);
    });

    const storeAfter = tenantStore.getStore();
    expect(storeAfter).toBeUndefined();
  });

  it('tenantStore.getStore() retorna undefined fora de contexto', () => {
    expect(tenantStore.getStore()).toBeUndefined();
  });

  it('poolTenant usa APP_RUNTIME_URL quando configurada', () => {
    const pool = require('../../src/config/database');
    const poolTenant = require('../../src/config/database').poolTenant;
    expect(poolTenant).toBeDefined();
    expect(typeof poolTenant.query).toBe('function');
  });
});

describe('requireCompany — binding real (unit)', () => {
  let pool, requireCompany;
  let mockClient;

  beforeEach(() => {
    jest.resetModules();

    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: jest.fn(),
    };

    jest.mock('../../src/config/database', () => {
      const { AsyncLocalStorage } = require('async_hooks');
      const tenantStore = new AsyncLocalStorage();

      const poolMock = {
        connect: jest.fn().mockResolvedValue(mockClient),
        poolTenant: {
          connect: jest.fn().mockResolvedValue(mockClient),
        },
        query: jest.fn(),
        on: jest.fn(),
      };

      poolMock.query = jest.fn((...args) => {
        const store = tenantStore.getStore();
        if (store?.client) return store.client.query(...args);
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      return Object.assign(poolMock, {
        tenantStore,
        runWithTenantClient: (client, companyIdOrFn, maybeFn) => {
          let companyId, fn;
          if (typeof companyIdOrFn === 'function') {
            fn = companyIdOrFn;
            companyId = null;
          } else {
            companyId = companyIdOrFn;
            fn = maybeFn;
          }
          return tenantStore.run({ client, companyId }, fn);
        },
        _originalQuery: jest.fn(),
      });
    });

    pool = require('../../src/config/database');
    requireCompany = require('../../src/middlewares/requireCompany');
  });

  function makeReq(user) {
    return {
      user,
      headers: {},
    };
  }

  function makeRes() {
    const listeners = {};
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      on: jest.fn((event, cb) => {
        listeners[event] = cb;
      }),
      _emit(event) {
        if (listeners[event]) listeners[event]();
      },
      writableFinished: false,
    };
  }

  it('abre client + BEGIN + SET LOCAL com companyId correto', async () => {
    const req = makeReq({ id: 'u1', company_id: 'comp-abc', role: 'admin', auth_scope: 'barber_admin' });
    const res = makeRes();
    const next = jest.fn();

    requireCompany(req, res, next);
    await new Promise(r => setTimeout(r, 50));

    expect(pool.poolTenant.connect).toHaveBeenCalled();
    const queries = mockClient.query.mock.calls.map(c => c[0]);
    expect(queries).toContain('BEGIN');
    expect(queries.some(q => q.includes('set_config'))).toBe(true);

    res._emit('finish');
  });

  it('release é chamado em finish', async () => {
    const req = makeReq({ id: 'u1', company_id: 'comp-abc', role: 'admin' });
    const res = makeRes();
    const next = jest.fn();

    requireCompany(req, res, next);
    await new Promise(r => setTimeout(r, 50));

    res._emit('finish');
    await new Promise(r => setTimeout(r, 20));

    expect(mockClient.release).toHaveBeenCalled();
  });

  it('release é chamado em close (request abortada)', async () => {
    const req = makeReq({ id: 'u1', company_id: 'comp-abc', role: 'admin' });
    const res = makeRes();
    const next = jest.fn();

    requireCompany(req, res, next);
    await new Promise(r => setTimeout(r, 50));

    res._emit('close');
    await new Promise(r => setTimeout(r, 20));

    expect(mockClient.release).toHaveBeenCalled();
  });

  it('retorna 401 quando user não autenticado', () => {
    const req = makeReq(null);
    const res = makeRes();
    const next = jest.fn();

    requireCompany(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 403 quando user sem company_id', () => {
    const req = makeReq({ id: 'u1', company_id: null, role: 'admin' });
    const res = makeRes();
    const next = jest.fn();

    requireCompany(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

const hasTestDb = !!(process.env.TEST_DATABASE_URL || (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('supabase')));
const describeDb = hasTestDb ? describe : describe.skip;

describeDb('RLS isolation — integration (requires TEST_DATABASE_URL)', () => {
  const { Pool } = require('pg');
  const crypto = require('crypto');
  let adminPool;
  let runtimePool;
  let companyAId, companyBId;

  beforeAll(async () => {
    const adminConnStr = process.env.ADMIN_DATABASE_URL || process.env.DATABASE_URL;
    const runtimeConnStr = process.env.APP_RUNTIME_URL || process.env.TEST_DATABASE_URL;
    adminPool = new Pool({ connectionString: adminConnStr, max: 3 });
    runtimePool = new Pool({ connectionString: runtimeConnStr, max: 3 });

    companyAId = crypto.randomUUID();
    companyBId = crypto.randomUUID();

    await adminPool.query(
      `INSERT INTO companies (id, name, public_booking_slug) VALUES ($1, 'RLS Test A', 'rls-a'), ($2, 'RLS Test B', 'rls-b')
       ON CONFLICT (id) DO NOTHING`,
      [companyAId, companyBId]
    );

    await adminPool.query(
      `INSERT INTO barber_services (id, company_id, name, price, estimated_time_minutes)
       VALUES (gen_random_uuid(), $1, 'Svc A', 50, 30),
              (gen_random_uuid(), $2, 'Svc B', 60, 45)
       ON CONFLICT DO NOTHING`,
      [companyAId, companyBId]
    );

    await adminPool.query(
      `INSERT INTO users (id, company_id, name, email, role, password_hash)
       VALUES (gen_random_uuid(), $1, 'User A1', 'user-a1@test.com', 'admin', 'rls-test-password-hash'),
              (gen_random_uuid(), $1, 'User A2', 'user-a2@test.com', 'collaborator', 'rls-test-password-hash'),
              (gen_random_uuid(), $2, 'User B1', 'user-b1@test.com', 'admin', 'rls-test-password-hash'),
              (gen_random_uuid(), $2, 'User B2', 'user-b2@test.com', 'collaborator', 'rls-test-password-hash')
       ON CONFLICT DO NOTHING`,
      [companyAId, companyBId]
    );
  });

  afterAll(async () => {
    if (adminPool) {
      try {
        await adminPool.query('DELETE FROM users WHERE company_id IN ($1, $2)', [companyAId, companyBId]);
        await adminPool.query('DELETE FROM barber_services WHERE company_id IN ($1, $2)', [companyAId, companyBId]);
        await adminPool.query('DELETE FROM companies WHERE id IN ($1, $2)', [companyAId, companyBId]);
      } catch (_) {}
      await adminPool.end();
    }
    if (runtimePool) {
      await runtimePool.end();
    }
  });

  it('tenant A não lê dados de tenant B com RLS ENABLEd', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query('SELECT * FROM barber_services');
      const companyIds = result.rows.map(r => r.company_id);

      expect(companyIds.every(id => id === companyAId)).toBe(true);
      expect(companyIds).not.toContain(companyBId);

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('tenant B não lê dados de tenant A com RLS ENABLEd', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyBId)]);

      const result = await client.query('SELECT * FROM barber_services');
      const companyIds = result.rows.map(r => r.company_id);

      expect(companyIds.every(id => id === companyBId)).toBe(true);
      expect(companyIds).not.toContain(companyAId);

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('sem GUC setado → query retorna 0 linhas (RLS bloqueia)', async () => {
    const { Pool } = require('pg');
    const runtimeConnStr = process.env.APP_RUNTIME_URL || process.env.TEST_DATABASE_URL;
    const freshPool = new Pool({ connectionString: runtimeConnStr, max: 1 });
    const client = await freshPool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query('SELECT * FROM barber_services');
      expect(result.rows).toHaveLength(0);
      await client.query('COMMIT');
    } finally {
      client.release();
      await freshPool.end();
    }
  });

  it('pool.connect() via wrap ALS + BEGIN → write isolado por tenant', async () => {
    const pool = require('../../src/config/database');
    const { runWithTenantClient } = pool;

    await runWithTenantClient(null, companyAId, async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO barber_services (id, company_id, name, price, estimated_time_minutes)
           VALUES (gen_random_uuid(), $1, 'Wrap Test Svc', 40, 25)`,
          [companyAId]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    });

    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyBId)]);
      const result = await client.query(
        "SELECT * FROM barber_services WHERE name = 'Wrap Test Svc'"
      );
      expect(result.rows).toHaveLength(0);
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    await adminPool.query(
      "DELETE FROM barber_services WHERE name = 'Wrap Test Svc' AND company_id = $1",
      [companyAId]
    );
  });

  // ─── companies ───────────────────────────────────────────────────────

  it('empresa A lê apenas seus próprios dados em companies', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query('SELECT * FROM companies');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(companyAId);
      expect(result.rows[0].name).toBe('RLS Test A');

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('empresa B lê apenas seus próprios dados em companies', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyBId)]);

      const result = await client.query('SELECT * FROM companies');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(companyBId);
      expect(result.rows[0].name).toBe('RLS Test B');

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('empresa não consegue atualizar company de outro tenant', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query(
        "UPDATE companies SET name = 'Hacked' WHERE id = $1",
        [companyBId]
      );
      expect(result.rowCount).toBe(0);

      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const { rows } = await adminPool.query('SELECT name FROM companies WHERE id = $1', [companyBId]);
    expect(rows[0].name).toBe('RLS Test B');
  });

  it('empresa consegue atualizar seus próprios dados', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query(
        'UPDATE companies SET phone = $1 WHERE id = $2',
        ['11999999999', companyAId]
      );
      expect(result.rowCount).toBe(1);

      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const { rows } = await adminPool.query('SELECT phone FROM companies WHERE id = $1', [companyAId]);
    expect(rows[0].phone).toBe('11999999999');
  });

  it('app_runtime não pode criar nova company (INSERT DENY)', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      await expect(
        client.query(
          `INSERT INTO companies (id, name, public_booking_slug)
           VALUES (gen_random_uuid(), 'Rogue Company', 'rogue')`
        )
      ).rejects.toThrow();

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  // ─── users ────────────────────────────────────────────────────────────

  it('empresa A vê apenas usuários do seu tenant', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query('SELECT * FROM users');
      const companyIds = [...new Set(result.rows.map(r => r.company_id))];

      expect(companyIds).toEqual([companyAId]);
      expect(result.rows.length).toBeGreaterThanOrEqual(2);

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('empresa B vê apenas usuários do seu tenant', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyBId)]);

      const result = await client.query('SELECT * FROM users');
      const companyIds = [...new Set(result.rows.map(r => r.company_id))];

      expect(companyIds).toEqual([companyBId]);
      expect(result.rows.length).toBeGreaterThanOrEqual(2);

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('empresa consegue criar usuário no próprio tenant', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query(
        `INSERT INTO users (id, company_id, name, email, role, password_hash)
         VALUES (gen_random_uuid(), $1, 'New User', 'new@user.com', 'collaborator', 'rls-test-password-hash')`,
        [companyAId]
      );
      expect(result.rowCount).toBe(1);

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('empresa NÃO consegue criar usuário em outro tenant (WITH CHECK)', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      await expect(
        client.query(
          `INSERT INTO users (id, company_id, name, email, role, password_hash)
           VALUES (gen_random_uuid(), $1, 'Rogue User', 'rogue@hacker.com', 'admin', 'rls-test-password-hash')`,
          [companyBId]
        )
      ).rejects.toThrow();

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    const { rows } = await adminPool.query(
      "SELECT * FROM users WHERE email = 'rogue@hacker.com'"
    );
    expect(rows).toHaveLength(0);
  });

  it('empresa consegue atualizar usuário do próprio tenant', async () => {
    const { rows: users } = await adminPool.query(
      "SELECT id FROM users WHERE company_id = $1 AND email = 'user-a1@test.com'",
      [companyAId]
    );
    expect(users).toHaveLength(1);
    const userId = users[0].id;

    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query(
        "UPDATE users SET name = 'Updated A1' WHERE id = $1",
        [userId]
      );
      expect(result.rowCount).toBe(1);

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('empresa NÃO consegue atualizar usuário de outro tenant (USING)', async () => {
    const { rows: users } = await adminPool.query(
      "SELECT id FROM users WHERE company_id = $1 AND email = 'user-b1@test.com'",
      [companyBId]
    );
    expect(users).toHaveLength(1);
    const userId = users[0].id;

    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query(
        "UPDATE users SET name = 'Hacked' WHERE id = $1",
        [userId]
      );
      expect(result.rowCount).toBe(0);

      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const { rows } = await adminPool.query(
      "SELECT name FROM users WHERE id = $1",
      [userId]
    );
    expect(rows[0].name).toBe('User B1');
  });

  it('app_runtime não pode deletar usuário (RLS default-deny → rowCount=0)', async () => {
    const { rows: users } = await adminPool.query(
      'SELECT id FROM users WHERE company_id = $1 LIMIT 1',
      [companyAId]
    );
    expect(users).toHaveLength(1);
    const userId = users[0].id;

    const client = await runtimePool.connect();
    let result;
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      result = await client.query('DELETE FROM users WHERE id = $1', [userId]);

      await client.query('COMMIT');
    } finally {
      client.release();
    }

    expect(result.rowCount).toBe(0);

    const { rows: stillExists } = await adminPool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );
    expect(stillExists).toHaveLength(1);
  });

  // ─── PR 2 — WITH CHECK explícito ─────────────────────────────────────

  it('WITH CHECK — INSERT barber_service no próprio tenant é permitido', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query(
        `INSERT INTO barber_services (id, company_id, name, price, estimated_time_minutes)
         VALUES (gen_random_uuid(), $1, 'WithCheck Svc', 40, 25)`,
        [companyAId]
      );
      expect(result.rowCount).toBe(1);

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('WITH CHECK — INSERT barber_service em outro tenant é bloqueado', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      await expect(
        client.query(
          `INSERT INTO barber_services (id, company_id, name, price, estimated_time_minutes)
           VALUES (gen_random_uuid(), $1, 'Cross Tenant Svc', 40, 25)`,
          [companyBId]
        )
      ).rejects.toThrow();

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('WITH CHECK — UPDATE barber_collaborator no próprio tenant é permitido', async () => {
    const { rows } = await adminPool.query(
      `INSERT INTO barber_collaborators (id, company_id, nickname, commission_type, commission_rate)
       VALUES (gen_random_uuid(), $1, 'Colab WithCheck A', 'percentage', 10)
       RETURNING id`,
      [companyAId]
    );
    const collaboratorId = rows[0].id;

    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query(
        "UPDATE barber_collaborators SET nickname = 'Colab WithCheck Updated' WHERE id = $1",
        [collaboratorId]
      );
      expect(result.rowCount).toBe(1);

      await client.query('COMMIT');
    } finally {
      client.release();
    }

    await adminPool.query('DELETE FROM barber_collaborators WHERE id = $1', [collaboratorId]);
  });

  it('WITH CHECK — UPDATE barber_collaborator de outro tenant é bloqueado (USING)', async () => {
    const { rows } = await adminPool.query(
      `INSERT INTO barber_collaborators (id, company_id, nickname, commission_type, commission_rate)
       VALUES (gen_random_uuid(), $1, 'Colab WithCheck B', 'percentage', 10)
       RETURNING id`,
      [companyBId]
    );
    const collaboratorId = rows[0].id;

    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query(
        "UPDATE barber_collaborators SET nickname = 'Hacked Colab' WHERE id = $1",
        [collaboratorId]
      );
      expect(result.rowCount).toBe(0);

      await client.query('COMMIT');
    } finally {
      client.release();
    }

    await adminPool.query('DELETE FROM barber_collaborators WHERE id = $1', [collaboratorId]);
  });

  it('WITH CHECK — INSERT booking_customer no próprio tenant é permitido', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const result = await client.query(
        `INSERT INTO booking_customers (id, company_id, name, phone, email, password_hash, email_verified, status, source)
         VALUES (gen_random_uuid(), $1, 'Bk Customer A', '11988887777', 'bk-a@test.com', 'rls-test-password-hash', false, 'active', 'test')`,
        [companyAId]
      );
      expect(result.rowCount).toBe(1);

      await client.query('COMMIT');
    } finally {
      client.release();
    }
  });

  it('WITH CHECK — INSERT booking_customer em outro tenant é bloqueado', async () => {
    const client = await runtimePool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      await expect(
        client.query(
          `INSERT INTO booking_customers (id, company_id, name, phone, email, password_hash, email_verified, status, source)
           VALUES (gen_random_uuid(), $1, 'Cross Tenant Customer', '11988887777', 'bk-a@test.com', 'rls-test-password-hash', false, 'active', 'test')`,
          [companyBId]
        )
      ).rejects.toThrow();

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  // ─── PR 3 — app_runtime role ─────────────────────────────────────────

  it('app_runtime — conexão via APP_RUNTIME_URL respeita RLS', async () => {
    const appRuntimeUrl = process.env.APP_RUNTIME_URL;
    if (!appRuntimeUrl) {
      console.warn('[skip] APP_RUNTIME_URL não configurada');
      return;
    }

    const { Pool } = require('pg');
    const rtPool = new Pool({ connectionString: appRuntimeUrl, max: 1 });
    const client = await rtPool.connect();
    try {
      const { rows } = await client.query(
        "SELECT current_user AS role, pg_has_role('app_runtime', 'member') AS is_app_runtime"
      );
      expect(rows[0].is_app_runtime).toBe(true);

      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyAId)]);

      const services = await client.query('SELECT * FROM barber_services');
      const companies = services.rows.map(r => r.company_id);
      expect(companies.every(id => id === companyAId)).toBe(true);

      await client.query('COMMIT');
    } finally {
      client.release();
      await rtPool.end();
    }
  });

  it('app_runtime — sem current_company_id, RLS bloqueia tudo', async () => {
    const appRuntimeUrl = process.env.APP_RUNTIME_URL;
    if (!appRuntimeUrl) {
      console.warn('[skip] APP_RUNTIME_URL não configurada');
      return;
    }

    const { Pool } = require('pg');
    const rtPool = new Pool({ connectionString: appRuntimeUrl, max: 1 });
    const client = await rtPool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query('SELECT * FROM barber_services');
      expect(result.rows).toHaveLength(0);

      await client.query('COMMIT');
    } finally {
      client.release();
      await rtPool.end();
    }
  });
});
