'use strict';

let mockClientQuery;
let mockPoolConnect;

beforeEach(() => {
  mockClientQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  // Suporta as DUAS formas do pg: callback (cb) — usada internamente por Pool.query —
  // e promise (sem cb) — usada por services/UoW via await pool.connect().
  mockPoolConnect = jest.fn().mockImplementation((cb) => {
    const client = { query: mockClientQuery, release: jest.fn() };
    if (typeof cb === 'function') {
      cb(null, client, jest.fn());
      return undefined;
    }
    return Promise.resolve(client);
  });
});

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: (...args) => mockPoolConnect(...args),
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    on: jest.fn(),
  })),
}));

jest.mock('../../src/shared/core/logger', () => ({
  appLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe('pool.connect() tenant-aware wrap (unit)', () => {
  let pool, tenantStore, runWithTenantClient;

  beforeEach(() => {
    jest.resetModules();
    mockClientQuery.mockClear();
    mockPoolConnect.mockClear();

    pool = require('../../src/config/database');
    tenantStore = pool.tenantStore;
    runWithTenantClient = pool.runWithTenantClient;
  });

  it('runWithTenantClient aceita (client, companyId, fn)', async () => {
    let capturedStore;
    await runWithTenantClient(null, 'comp-123', async () => {
      capturedStore = tenantStore.getStore();
    });

    expect(capturedStore).toEqual({ client: null, companyId: 'comp-123' });
  });

  it('runWithTenantClient mantém compatibilidade com (client, fn)', async () => {
    let capturedStore;
    await runWithTenantClient({ fake: true }, async () => {
      capturedStore = tenantStore.getStore();
    });

    expect(capturedStore).toEqual({ client: { fake: true }, companyId: null });
  });

  it('pool.connect() fora de contexto ALS retorna client cru', async () => {
    const client = await pool.connect();

    expect(mockPoolConnect).toHaveBeenCalled();
    expect(client).toBeDefined();
  });

  it('REGRESSÃO: pool.connect(cb) honra a forma callback (senão pool.query trava)', async () => {
    // pg chama internamente this.connect((err, client) => ...) dentro de Pool.query.
    // Se o override ignorar o callback, ele nunca é invocado e pool.query trava para sempre.
    const cb = jest.fn();
    const ret = pool.connect(cb);

    expect(cb).toHaveBeenCalledTimes(1);          // callback foi invocado (não trava)
    expect(cb.mock.calls[0][0]).toBeNull();        // err = null
    expect(cb.mock.calls[0][1]).toBeDefined();     // client entregue ao callback
    expect(ret).toBeUndefined();                   // forma callback não retorna promise
  });

  it('pool.connect() em contexto ALS com companyId retorna client com wrap', async () => {
    let wrappedClient;
    await runWithTenantClient(null, 'comp-xyz', async () => {
      wrappedClient = await pool.connect();
    });

    expect(wrappedClient).toBeDefined();
    expect(typeof wrappedClient.query).toBe('function');
  });

  it('wrap intercepta BEGIN e emite SET LOCAL com companyId correto', async () => {
    let wrappedClient;
    await runWithTenantClient(null, 'comp-xyz', async () => {
      wrappedClient = await pool.connect();
    });

    await wrappedClient.query('BEGIN');

    const calls = mockClientQuery.mock.calls.map(c => c[0]);
    expect(calls).toContain('BEGIN');
    expect(calls.some(q => typeof q === 'string' && q.includes('SET LOCAL app.current_company_id'))).toBe(true);

    const setLocalCall = mockClientQuery.mock.calls.find(
      c => typeof c[0] === 'string' && c[0].includes('SET LOCAL')
    );
    expect(setLocalCall[1]).toEqual(['comp-xyz']);
  });

  it('SET LOCAL é idempotente: não emite 2x na mesma transação', async () => {
    let wrappedClient;
    await runWithTenantClient(null, 'comp-abc', async () => {
      wrappedClient = await pool.connect();
    });

    await wrappedClient.query('BEGIN');
    await wrappedClient.query('SELECT 1');
    await wrappedClient.query('BEGIN');

    const setLocalCalls = mockClientQuery.mock.calls.filter(
      c => typeof c[0] === 'string' && c[0].includes('SET LOCAL')
    );
    expect(setLocalCalls).toHaveLength(1);
  });

  it('wrap intercepta START TRANSACTION além de BEGIN', async () => {
    let wrappedClient;
    await runWithTenantClient(null, 'comp-start', async () => {
      wrappedClient = await pool.connect();
    });

    await wrappedClient.query('START TRANSACTION');

    const setLocalCalls = mockClientQuery.mock.calls.filter(
      c => typeof c[0] === 'string' && c[0].includes('SET LOCAL')
    );
    expect(setLocalCalls).toHaveLength(1);
    expect(setLocalCalls[0][1]).toEqual(['comp-start']);
  });

  it('wrap é case-insensitive: begin, Begin, BEGIN', async () => {
    let wrappedClient;
    await runWithTenantClient(null, 'comp-case', async () => {
      wrappedClient = await pool.connect();
    });

    await wrappedClient.query('begin');

    const setLocalCalls = mockClientQuery.mock.calls.filter(
      c => typeof c[0] === 'string' && c[0].includes('SET LOCAL')
    );
    expect(setLocalCalls).toHaveLength(1);
  });

  it('queries sem BEGIN não recebem SET LOCAL', async () => {
    let wrappedClient;
    await runWithTenantClient(null, 'comp-nobegin', async () => {
      wrappedClient = await pool.connect();
    });

    await wrappedClient.query('SELECT 1');
    await wrappedClient.query('SELECT 2');

    const setLocalCalls = mockClientQuery.mock.calls.filter(
      c => typeof c[0] === 'string' && c[0].includes('SET LOCAL')
    );
    expect(setLocalCalls).toHaveLength(0);
  });

  it('pool.connect() em contexto ALS SEM companyId retorna client cru', async () => {
    let client;
    await runWithTenantClient(null, null, async () => {
      client = await pool.connect();
    });

    await client.query('BEGIN');

    const setLocalCalls = mockClientQuery.mock.calls.filter(
      c => typeof c[0] === 'string' && c[0].includes('SET LOCAL')
    );
    expect(setLocalCalls).toHaveLength(0);
  });

  it('UnitOfWork.begin() recebe GUC via wrap transparente', async () => {
    const { UnitOfWork } = require('../../src/shared/core/database/unit-of-work');
    const uow = new UnitOfWork(pool);

    await runWithTenantClient(null, 'comp-uow', async () => {
      await uow.begin();
    });

    const calls = mockClientQuery.mock.calls.map(c => c[0]);
    expect(calls).toContain('BEGIN');
    expect(calls.some(q => typeof q === 'string' && q.includes('SET LOCAL app.current_company_id'))).toBe(true);

    const setLocalCall = mockClientQuery.mock.calls.find(
      c => typeof c[0] === 'string' && c[0].includes('SET LOCAL')
    );
    expect(setLocalCall[1]).toEqual(['comp-uow']);

    await uow.rollback();
  });
});
