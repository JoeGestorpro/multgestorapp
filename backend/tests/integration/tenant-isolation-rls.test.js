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

    expect(pool.connect).toHaveBeenCalled();
    const queries = mockClient.query.mock.calls.map(c => c[0]);
    expect(queries).toContain('BEGIN');
    expect(queries.some(q => q.includes('SET LOCAL app.current_company_id'))).toBe(true);

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
  let testPool;
  let companyAId, companyBId;

  beforeAll(async () => {
    const connStr = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    testPool = new Pool({ connectionString: connStr, max: 3 });

    companyAId = crypto.randomUUID();
    companyBId = crypto.randomUUID();

    await testPool.query(
      `INSERT INTO companies (id, name, public_booking_slug) VALUES ($1, 'RLS Test A', 'rls-a'), ($2, 'RLS Test B', 'rls-b')
       ON CONFLICT (id) DO NOTHING`,
      [companyAId, companyBId]
    );

    await testPool.query(
      `INSERT INTO barber_services (id, company_id, name, price, estimated_time_minutes)
       VALUES (gen_random_uuid(), $1, 'Svc A', 50, 30),
              (gen_random_uuid(), $2, 'Svc B', 60, 45)
       ON CONFLICT DO NOTHING`,
      [companyAId, companyBId]
    );

    const rlsSql = require('fs').readFileSync(
      require('path').resolve(__dirname, '../../src/database/rls_tenant_tables.sql'), 'utf8'
    );
    await testPool.query(rlsSql);
  });

  afterAll(async () => {
    if (testPool) {
      try {
        await testPool.query('DELETE FROM barber_services WHERE company_id IN ($1, $2)', [companyAId, companyBId]);
        await testPool.query('DELETE FROM companies WHERE id IN ($1, $2)', [companyAId, companyBId]);
      } catch (_) {}
      await testPool.end();
    }
  });

  it('tenant A não lê dados de tenant B com RLS ENABLEd', async () => {
    const client = await testPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL app.current_company_id = $1', [companyAId]);

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
    const client = await testPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL app.current_company_id = $1', [companyBId]);

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
    const client = await testPool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query('SELECT * FROM barber_services');
      expect(result.rows).toHaveLength(0);
      await client.query('COMMIT');
    } finally {
      client.release();
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

    const client = await testPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL app.current_company_id = $1', [companyBId]);
      const result = await client.query(
        "SELECT * FROM barber_services WHERE name = 'Wrap Test Svc'"
      );
      expect(result.rows).toHaveLength(0);
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    await testPool.query(
      "DELETE FROM barber_services WHERE name = 'Wrap Test Svc' AND company_id = $1",
      [companyAId]
    );
  });
});
