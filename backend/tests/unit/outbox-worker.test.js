'use strict';

const OutboxWorker = require('../../src/shared/core/outbox/outbox-worker');

function createMockPool() {
  const queries = [];
  const mockResults = [];
  let callIndex = 0;

  const pool = {
    queries,
    mockResults: mockResults,
    query: jest.fn(async (sql, params) => {
      queries.push({ sql: sql.trim(), params });
      const result = mockResults[callIndex] || { rows: [], rowCount: 0 };
      callIndex++;
      return result;
    }),
  };

  pool.query.mockImplementation(async (sql, params) => {
    queries.push({ sql: sql.trim(), params });
    const result = mockResults[callIndex] || { rows: [], rowCount: 0 };
    callIndex++;
    return result;
  });

  return pool;
}

function makeEvent(overrides = {}) {
  return {
    id: 'msg-001',
    type: 'test.event',
    payload: { foo: 'bar' },
    trace_id: 'trace-1',
    company_id: 'comp-1',
    retry_count: 0,
    max_retries: 3,
    ...overrides,
  };
}

describe('OutboxWorker — register()', () => {
  it('rejeita handler anônimo (função sem nome)', () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);
    expect(() => {
      worker.register('test.event', () => {});
    }).toThrow(/handler.name vazio/);
  });

  it('rejeita handler com nome vazio (Object.defineProperty)', () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);
    const fn = function() {};
    Object.defineProperty(fn, 'name', { value: '' });
    expect(() => {
      worker.register('test.event', fn);
    }).toThrow(/handler.name vazio/);
  });

  it('rejeita nome duplicado para o mesmo eventType', () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);
    async function myHandler() {}
    worker.register('test.event', myHandler);
    expect(() => {
      worker.register('test.event', myHandler);
    }).toThrow(/Handler duplicado.*myHandler/);
  });

  it('aceita handlers com nomes diferentes para o mesmo eventType', () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);
    async function handlerA() {}
    async function handlerB() {}
    worker.register('test.event', handlerA);
    worker.register('test.event', handlerB);
    expect(worker.handlers.get('test.event').size).toBe(2);
  });

  it('aceita mesmo handler nomeado para eventTypes diferentes', () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);
    async function sharedHandler() {}
    worker.register('event.a', sharedHandler);
    worker.register('event.b', sharedHandler);
    expect(worker.handlers.get('event.a').size).toBe(1);
    expect(worker.handlers.get('event.b').size).toBe(1);
  });
});

describe('OutboxWorker — _process() single-handler (retrocompat)', () => {
  it('sucesso → mensagem processed', async () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);

    let callCount = 0;
    async function handleSuccess() { callCount++; }
    worker.register('test.event', handleSuccess);

    const event = makeEvent();
    
    pool.mockResults.push(
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 }
    );

    await worker._process(event);

    expect(callCount).toBe(1);
    const upsertCall = pool.queries.find(q => q.sql.includes('INSERT INTO outbox_message_handlers'));
    expect(upsertCall).toBeDefined();
    expect(upsertCall.params).toContain('handleSuccess');

    const finalUpdate = pool.queries.find(q => q.sql.includes("status = 'processed', processed_at"));
    expect(finalUpdate).toBeDefined();
    expect(finalUpdate.params[0]).toBe('msg-001');
  });

  it('falha → retry com backoff', async () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);

    async function handleFail() { throw new Error('boom'); }
    worker.register('test.event', handleFail);

    const event = makeEvent({ retry_count: 0, max_retries: 3 });
    
    pool.mockResults.push(
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 }
    );

    await worker._process(event);

    const failUpsert = pool.queries.find(q =>
      q.sql.includes('outbox_message_handlers') && q.sql.includes("'failed'")
    );
    expect(failUpsert).toBeDefined();

    const retryUpdate = pool.queries.find(q =>
      q.sql.includes("status = 'pending'") && q.sql.includes('next_retry_at')
    );
    expect(retryUpdate).toBeDefined();
    expect(retryUpdate.params[1]).toBe(1);
    expect(retryUpdate.params[2]).toBe('boom');
  });

  it('falha com max_retries atingido → mensagem failed', async () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);

    async function handleFail() { throw new Error('permanent'); }
    worker.register('test.event', handleFail);

    const event = makeEvent({ retry_count: 2, max_retries: 3 });
    
    pool.mockResults.push(
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 }
    );

    await worker._process(event);

    const failedUpdate = pool.queries.find(q =>
      q.sql.includes("status = 'failed', retry_count")
    );
    expect(failedUpdate).toBeDefined();
    expect(failedUpdate.params[1]).toBe(3);
  });

  it('sem handler registrado → mensagem failed', async () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);

    const event = makeEvent({ type: 'unknown.event' });
    pool.mockResults.push({ rows: [], rowCount: 0 });
    
    await worker._process(event);

    const failedUpdate = pool.queries.find(q =>
      q.sql.includes("status = 'failed'") && q.params && q.params[1] && q.params[1].includes('No handler registered')
    );
    expect(failedUpdate).toBeDefined();
  });
});

describe('OutboxWorker — _process() multi-handler com idempotência', () => {
  it('2º handler falha → retry, 1º não re-executa', async () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);

    let handlerACalls = 0;
    let handlerBCalls = 0;
    async function handlerA() { handlerACalls++; }
    async function handlerB() { handlerBCalls++; throw new Error('B failed'); }

    worker.register('test.event', handlerA);
    worker.register('test.event', handlerB);

    const event = makeEvent({ retry_count: 0, max_retries: 3 });

    pool.mockResults.push(
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 }
    );

    await worker._process(event);

    expect(handlerACalls).toBe(1);
    expect(handlerBCalls).toBe(1);

    const retryUpdate = pool.queries.find(q =>
      q.sql.includes("status = 'pending'") && q.sql.includes('next_retry_at')
    );
    expect(retryUpdate).toBeDefined();
  });

  it('retry: handler já processed é pulado, só pendente re-executa', async () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);

    let handlerACalls = 0;
    let handlerBCalls = 0;
    async function handlerA() { handlerACalls++; }
    async function handlerB() { handlerBCalls++; }

    worker.register('test.event', handlerA);
    worker.register('test.event', handlerB);

    const event = makeEvent({ retry_count: 1, max_retries: 3 });

    pool.mockResults.push(
      { rows: [{ handler_name: 'handlerA' }], rowCount: 1 },
      { rows: [], rowCount: 0 },
      { rows: [], rowCount: 0 }
    );

    await worker._process(event);

    expect(handlerACalls).toBe(0);
    expect(handlerBCalls).toBe(1);
  });

  it('todos handlers processed → mensagem processed', async () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);

    let handlerACalls = 0;
    let handlerBCalls = 0;
    async function handlerA() { handlerACalls++; }
    async function handlerB() { handlerBCalls++; }

    worker.register('test.event', handlerA);
    worker.register('test.event', handlerB);

    const event = makeEvent();

    pool.mockResults.push(
      { rows: [{ handler_name: 'handlerA' }, { handler_name: 'handlerB' }], rowCount: 2 },
      { rows: [], rowCount: 0 }
    );

    await worker._process(event);

    expect(handlerACalls).toBe(0);
    expect(handlerBCalls).toBe(0);

    const processedUpdate = pool.queries.find(q =>
      q.sql.includes("status = 'processed', processed_at = NOW()")
    );
    expect(processedUpdate).toBeDefined();
  });

  it('handler processed pré-existente → handler pulado (idempotência)', async () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);

    let handlerACalls = 0;
    async function handlerA() { handlerACalls++; }
    worker.register('test.event', handlerA);

    const event = makeEvent();

    pool.mockResults.push(
      { rows: [{ handler_name: 'handlerA' }], rowCount: 1 },
      { rows: [], rowCount: 0 }
    );

    await worker._process(event);

    expect(handlerACalls).toBe(0);

    const processedUpdate = pool.queries.find(q =>
      q.sql.includes("status = 'processed', processed_at = NOW()")
    );
    expect(processedUpdate).toBeDefined();
  });
});

describe('OutboxWorker — lifecycle', () => {
  it('start/stop controla polling', () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool, { pollIntervalMs: 100 });

    worker.start();
    expect(worker.running).toBe(true);

    worker.stop();
    expect(worker.running).toBe(false);
    expect(worker.timer).toBeNull();
  });

  it('start duplicado não reinicia', () => {
    const pool = createMockPool();
    const worker = new OutboxWorker(pool);

    worker.start();
    const firstTimer = worker.timer;
    worker.start();
    expect(worker.timer).toBe(firstTimer);

    worker.stop();
  });
});
