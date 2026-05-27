const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env'), quiet: true });

const crypto = require('crypto');
const pool = require('../../config/database');
const { createUnitOfWork, UnitOfWork, OutboxWorker } = require('../../shared');

let passed = 0;
let failed = 0;
let testCompanyId = null;

function assert(condition, message) {
  if (!condition) {
    failed++;
    console.error(`  FAIL: ${message}`);
    return;
  }
  passed++;
  console.log(`  PASS: ${message}`);
}

async function cleanupOutbox() {
  await pool.query('DELETE FROM outbox_messages WHERE status IN ($1, $2, $3)', ['pending', 'processing', 'failed']);
}

async function testFlushOnCommit() {
  console.log('\n[Outbox] flush persiste evento no commit');

  const traceId = 'trace-' + crypto.randomUUID();

  const uow = createUnitOfWork();
  try {
    await uow.begin();
    uow.addEvent('test.event', { hello: 'world' }, {
      traceId,
      companyId: '00000000-0000-0000-0000-000000000001',
      aggregateType: 'test'
    });
    await uow.commit();
  } catch (err) {
    await uow.rollback();
    assert(false, 'commit falhou: ' + err.message);
    return;
  }

  const result = await pool.query(
    `SELECT * FROM outbox_messages WHERE trace_id = $1`, [traceId]
  );
  assert(result.rows.length === 1, 'evento persistido');
  assert(result.rows[0].type === 'test.event', 'type correto');
  assert(result.rows[0].payload.hello === 'world', 'payload correto');
  assert(result.rows[0].status === 'pending', 'status = pending');
  assert(result.rows[0].aggregate_type === 'test', 'aggregate_type correto');
  assert(result.rows[0].aggregate_id === null, 'aggregate_id null quando nao enviado');
  assert(result.rows[0].retry_count === 0, 'retry_count = 0');
  assert(result.rows[0].max_retries === 5, 'max_retries = 5');
  assert(result.rows[0].next_retry_at === null, 'next_retry_at null no primeiro insert');

  await pool.query('DELETE FROM outbox_messages WHERE id = $1', [result.rows[0].id]);
}

async function testRollbackRemovesEvent() {
  console.log('\n[Outbox] rollback remove evento');
const traceId = 'trace-rollback-' + crypto.randomUUID();

  const uow = createUnitOfWork();
  try {
    await uow.begin();
    uow.addEvent('test.rollback', { should: 'disappear' }, {
      traceId,
      companyId: '00000000-0000-0000-0000-000000000001'
    });
    throw new Error('erro forçado');
  } catch (err) {
    await uow.rollback();
    assert(err.message === 'erro forçado', 'erro propagado');
  }

  const result = await pool.query(
    `SELECT * FROM outbox_messages WHERE trace_id = $1`, [traceId]
  );
  assert(result.rows.length === 0, 'nenhum evento persistido apos rollback');
}

async function testMultipleEventsOrdering() {
  console.log('\n[Outbox] multiplos eventos mantem order');
const traceId = 'trace-order-' + crypto.randomUUID();

  const uow = createUnitOfWork();
  try {
    await uow.begin();
    uow.addEvent('test.first', { step: 1 }, { traceId, companyId: '00000000-0000-0000-0000-000000000001' });
    uow.addEvent('test.second', { step: 2 }, { traceId, companyId: '00000000-0000-0000-0000-000000000001' });
    uow.addEvent('test.third', { step: 3 }, { traceId, companyId: '00000000-0000-0000-0000-000000000001' });
    await uow.commit();
  } catch (err) {
    await uow.rollback();
    assert(false, 'commit falhou: ' + err.message);
    return;
  }

  const result = await pool.query(
    `SELECT payload FROM outbox_messages WHERE trace_id = $1 ORDER BY created_at ASC`, [traceId]
  );
  assert(result.rows.length === 3, '3 eventos');
  assert(result.rows[0].payload.step === 1, 'primeiro evento = step 1');
  assert(result.rows[1].payload.step === 2, 'segundo evento = step 2');
  assert(result.rows[2].payload.step === 3, 'terceiro evento = step 3');

  await pool.query(`DELETE FROM outbox_messages WHERE trace_id = $1`, [traceId]);
}

async function testWorkerProcessesEvent() {
  console.log('\n[Outbox] worker processa evento');
const traceId = 'trace-worker-' + crypto.randomUUID();
  const uow = createUnitOfWork();
  try {
    await uow.begin();
    uow.addEvent('test.worker', { value: 42 }, {
      traceId,
      companyId: '00000000-0000-0000-0000-000000000001'
    });
    await uow.commit();
  } catch (err) {
    await uow.rollback();
    assert(false, 'commit falhou: ' + err.message);
    return;
  }

  let handlerCalled = false;
  let handlerPayload = null;
  let handlerMeta = null;

  const worker = new OutboxWorker(pool, { batchSize: 10, pollIntervalMs: 5000 });
  worker.register('test.worker', async (payload, meta) => {
    handlerCalled = true;
    handlerPayload = payload;
    handlerMeta = meta;
  });

  await worker.poll();

  assert(handlerCalled, 'handler foi chamado');
  assert(handlerPayload.value === 42, 'payload correto');
  assert(handlerMeta.traceId === traceId, 'traceId propagado');
  assert(handlerMeta.eventId !== undefined, 'eventId propagado');

  const check = await pool.query(
    `SELECT * FROM outbox_messages WHERE trace_id = $1`, [traceId]
  );
  assert(check.rows.length === 1, 'evento existe');
  assert(check.rows[0].status === 'processed', 'status = processed');
  assert(check.rows[0].processed_at !== null, 'processed_at preenchido');

  await pool.query(`DELETE FROM outbox_messages WHERE trace_id = $1`, [traceId]);
}

async function testWorkerRetryOnError() {
  console.log('\n[Outbox] worker retry em erro');
const traceId = 'trace-retry-' + crypto.randomUUID();
  const uow = createUnitOfWork();
  try {
    await uow.begin();
    uow.addEvent('test.retry', { will: 'fail' }, {
      traceId,
      companyId: '00000000-0000-0000-0000-000000000001'
    });
    await uow.commit();
  } catch (err) {
    await uow.rollback();
    assert(false, 'commit falhou: ' + err.message);
    return;
  }

  const before = await pool.query(
    `SELECT id FROM outbox_messages WHERE trace_id = $1`, [traceId]
  );
  const outboxId = before.rows[0].id;

  const worker = new OutboxWorker(pool, { batchSize: 10 });
  let callCount = 0;
  worker.register('test.retry', async () => {
    callCount++;
    throw new Error('erro simulado #' + callCount);
  });

  await worker.poll();

  const afterFirstRetry = await pool.query(
    `SELECT * FROM outbox_messages WHERE id = $1`, [outboxId]
  );
  assert(afterFirstRetry.rows[0].status === 'pending', 'status voltou a pending apos erro');
  assert(afterFirstRetry.rows[0].retry_count === 1, 'retry_count = 1');
  assert(afterFirstRetry.rows[0].next_retry_at !== null, 'next_retry_at agendado');
  assert(afterFirstRetry.rows[0].last_error.includes('erro simulado'), 'last_error registrado');

  await pool.query(`DELETE FROM outbox_messages WHERE id = $1`, [outboxId]);
}

async function testWorkerDeadLetter() {
  console.log('\n[Outbox] worker dead letter apos max retries');
const traceId = 'trace-dead-' + crypto.randomUUID();
  const uow = createUnitOfWork();
  try {
    await uow.begin();
    uow.addEvent('test.deadletter', { doomed: true }, {
      traceId,
      companyId: '00000000-0000-0000-0000-000000000001',
      maxRetries: 2
    });
    await uow.commit();
  } catch (err) {
    await uow.rollback();
    assert(false, 'commit falhou: ' + err.message);
    return;
  }

  const before = await pool.query(
    `SELECT id FROM outbox_messages WHERE trace_id = $1`, [traceId]
  );
  const outboxId = before.rows[0].id;

  const worker = new OutboxWorker(pool, { batchSize: 10 });
  worker.register('test.deadletter', async () => {
    throw new Error('sempre falha');
  });

  await worker.poll();

  const afterFirst = await pool.query(
    `SELECT * FROM outbox_messages WHERE id = $1`, [outboxId]
  );
  assert(afterFirst.rows[0].status === 'pending', 'apos 1o erro: pending');
  assert(afterFirst.rows[0].retry_count === 1, 'retry_count = 1');

  await pool.query(
    `UPDATE outbox_messages SET next_retry_at = NOW() WHERE id = $1`, [outboxId]
  );

  await worker.poll();

  const afterSecond = await pool.query(
    `SELECT * FROM outbox_messages WHERE id = $1`, [outboxId]
  );
  assert(afterSecond.rows[0].status === 'failed', 'apos 2o erro: failed (dead letter)');
  assert(afterSecond.rows[0].retry_count === 2, 'retry_count = 2');
  assert(afterSecond.rows[0].last_error === 'sempre falha', 'last_error preservado');

  await pool.query(`DELETE FROM outbox_messages WHERE id = $1`, [outboxId]);
}

async function testWorkerSkipsLocked() {
  console.log('\n[Outbox] SKIP LOCKED evita duplicacao');
const traceId1 = 'trace-skip-' + crypto.randomUUID();
  const traceId2 = 'trace-skip2-' + crypto.randomUUID();

  const uow = createUnitOfWork();
  try {
    await uow.begin();
    uow.addEvent('test.skip', { concurrent: true }, {
      traceId: traceId1,
      companyId: '00000000-0000-0000-0000-000000000001'
    });
    uow.addEvent('test.skip2', { concurrent: true }, {
      traceId: traceId2,
      companyId: '00000000-0000-0000-0000-000000000001'
    });
    await uow.commit();
  } catch (err) {
    await uow.rollback();
    assert(false, 'commit falhou: ' + err.message);
    return;
  }

  const conn1 = await pool.connect();
  await conn1.query('BEGIN');
  await conn1.query(
    `UPDATE outbox_messages
     SET status = 'processing', locked_at = NOW(), locked_by = 'worker-1'
     WHERE id IN (
       SELECT id FROM outbox_messages
       WHERE trace_id = $1
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [traceId1]
  );

  const worker = new OutboxWorker(pool, { batchSize: 10 });
  let skipEventProcessed = false;
  worker.register('test.skip', async () => {
    skipEventProcessed = true;
  });
  worker.register('test.skip2', async () => {
  });

  await worker.poll();

  assert(skipEventProcessed === false, 'evento lockado pelo conn1 nao foi processado pelo worker');

  await conn1.query('ROLLBACK');
  conn1.release();

  await pool.query(`DELETE FROM outbox_messages WHERE trace_id IN ($1, $2)`, [traceId1, traceId2]);
}

async function testTraceIdAndTenantPropagation() {
  console.log('\n[Outbox] traceId e tenant persistem no evento');
const traceId = 'trace-meta-' + crypto.randomUUID();

  const uow = createUnitOfWork();
  try {
    await uow.begin();
    uow.addEvent('test.meta', { data: true }, {
      traceId,
      companyId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      aggregateType: 'order',
      aggregateId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    });
    await uow.commit();
  } catch (err) {
    await uow.rollback();
    assert(false, 'commit falhou: ' + err.message);
    return;
  }

  const result = await pool.query(
    `SELECT * FROM outbox_messages WHERE trace_id = $1`, [traceId]
  );
  assert(result.rows.length === 1, 'evento encontrado por trace_id');
  assert(result.rows[0].company_id === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'company_id propagado');
  assert(result.rows[0].trace_id === traceId, 'trace_id propagado');
  assert(result.rows[0].aggregate_type === 'order', 'aggregate_type propagado');
  assert(result.rows[0].aggregate_id === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aggregate_id propagado');

  await pool.query(`DELETE FROM outbox_messages WHERE trace_id = $1`, [traceId]);
}

async function testNoHandlerEventFails() {
  console.log('\n[Outbox] evento sem handler vai para failed');

  await pool.query('DELETE FROM outbox_messages');
  const eventId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO outbox_messages (id, type, payload, trace_id, company_id)
     VALUES ($1, $2, $3::jsonb, $4, $5)`,
    [eventId, 'test.no_handler', JSON.stringify({ orphan: true }), 'trace-orphan-' + crypto.randomUUID(), '00000000-0000-0000-0000-000000000001']
  );

  const beforeCheck = await pool.query(
    `SELECT id, status FROM outbox_messages WHERE id = $1`, [eventId]
  );
  assert(beforeCheck.rows.length === 1, 'evento inserido antes do poll');
  assert(beforeCheck.rows[0].status === 'pending', 'status = pending antes do poll');

  const worker = new OutboxWorker(pool, { batchSize: 100 });
  await worker.poll();

  const after = await pool.query(
    `SELECT * FROM outbox_messages WHERE id = $1`, [eventId]
  );
  assert(after.rows.length === 1, 'evento ainda existe');
  assert(after.rows[0].status === 'failed', 'status = failed sem handler, atual: ' + after.rows[0].status);
  assert(after.rows[0].last_error !== null, 'last_error preenchido');
  assert(after.rows[0].last_error.includes('No handler'), 'last_error explica motivo');

  await pool.query(`DELETE FROM outbox_messages WHERE id = $1`, [eventId]);
}

async function testWorkerStartStop() {
  console.log('\n[Outbox] start/stop worker');
  const worker = new OutboxWorker(pool, { batchSize: 10, pollIntervalMs: 5000 });

  await worker.startAndPoll();
  assert(worker.running === true, 'worker.running = true apos start');
  assert(worker.timer !== null, 'timer agendado');

  worker.stop();
  assert(worker.running === false, 'worker.running = false apos stop');
  assert(worker.timer === null, 'timer limpo apos stop');

  worker.stop();
  assert(worker.running === false, 'stop idempotente');
}

async function testMaxRetriesDefault() {
  console.log('\n[Outbox] maxRetries default = 5');
const traceId = 'trace-default-retry-' + crypto.randomUUID();
  const uow = createUnitOfWork();
  try {
    await uow.begin();
    uow.addEvent('test.default_retries', {}, {
      traceId,
      companyId: '00000000-0000-0000-0000-000000000001'
    });
    await uow.commit();
  } catch (err) {
    await uow.rollback();
    assert(false, 'commit falhou: ' + err.message);
    return;
  }

  const result = await pool.query(
    `SELECT * FROM outbox_messages WHERE trace_id = $1`, [traceId]
  );
  assert(result.rows[0].max_retries === 5, 'max_retries = 5 (padrao)');

  await pool.query(`DELETE FROM outbox_messages WHERE trace_id = $1`, [traceId]);
}

async function main() {
  console.log('='.repeat(40));
  console.log('Outbox Pattern — Integration Tests');
  console.log('='.repeat(40));

  try {
    await cleanupOutbox();

    await testFlushOnCommit();

    await testRollbackRemovesEvent();

    await testMultipleEventsOrdering();

    await testTraceIdAndTenantPropagation();

    await testMaxRetriesDefault();

    await testNoHandlerEventFails();

    await testWorkerProcessesEvent();

    await testWorkerRetryOnError();

    await testWorkerDeadLetter();

    await testWorkerSkipsLocked();

    await testWorkerStartStop();

  } catch (err) {
    console.error('\n  ERRO na suite:', err.message);
    failed++;
  } finally {
    await cleanupOutbox();
    console.log('\n' + '='.repeat(40));
    console.log('Total: ' + (passed + failed) + ' | PASS: ' + passed + ' | FAIL: ' + failed);
    console.log('='.repeat(40));
    process.exit(failed > 0 ? 1 : 0);
  }
}

main();
