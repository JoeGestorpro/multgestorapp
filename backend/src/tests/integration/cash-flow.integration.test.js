const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env'), quiet: true });

const pool = require('../../config/database');
const { createUnitOfWork } = require('../../shared');
const CashSessionRepository = require('../../repositories/cash-session.repository');
const CashFlowService = require('../../services/cash-flow.service');

let passed = 0;
let failed = 0;
let testCompanyId = null;
let testDate = null;

function assert(condition, message) {
  if (!condition) {
    failed++;
    console.error(`  FAIL: ${message}`);
    return;
  }
  passed++;
  console.log(`  PASS: ${message}`);
}

async function setup() {
  const result = await pool.query(
    `INSERT INTO companies (name, public_booking_slug)
     VALUES ($1, $2)
     RETURNING id`,
    ['Cash Flow Test Company', 'cash-flow-test-' + Date.now()]
  );
  testCompanyId = result.rows[0].id;
  testDate = new Date().toISOString().slice(0, 10);
}

async function cleanup() {
  if (testCompanyId) {
    await pool.query('DELETE FROM barber_cash_sessions WHERE company_id = $1', [testCompanyId]);
    await pool.query('DELETE FROM barber_audit_logs WHERE company_id = $1', [testCompanyId]);
    await pool.query('DELETE FROM companies WHERE id = $1', [testCompanyId]);
  }
}

async function testOpenCashSuccess() {
  console.log('\n[openCash] sucesso');
  const service = new CashFlowService();
  const adminUser = { id: null, role: 'admin' };

  const session = await service.openCash(testCompanyId, adminUser, {
    cash_date: testDate,
    opening_balance: 100,
    notes: 'Abertura de teste'
  });

  assert(session !== null, 'criou sessao');
  assert(session.company_id === testCompanyId, 'company_id correto');
  const sessionDate = typeof session.cash_date === 'string' ? session.cash_date : session.cash_date.toISOString().slice(0, 10);
  assert(sessionDate === testDate, 'cash_date correto: ' + sessionDate);
  assert(session.status === 'open', 'status = open');
  assert(Number(session.opening_balance) === 100, 'opening_balance = 100');
  assert(session.opened_at !== null, 'opened_at preenchido');

  const auditResult = await pool.query(
    `SELECT * FROM barber_audit_logs WHERE company_id = $1 AND action = 'open_cash'`,
    [testCompanyId]
  );
  assert(auditResult.rows.length >= 1, 'audit log registrado');
  assert(auditResult.rows[0].entity_type === 'barber_cash_session', 'audit entity_type correto');

  const outboxResult = await pool.query(
    `SELECT * FROM outbox_messages
     WHERE company_id = $1 AND type = 'cash_session.opened'
     ORDER BY created_at DESC LIMIT 1`,
    [testCompanyId]
  );
  assert(outboxResult.rows.length >= 1, 'outbox event emitido');
  assert(outboxResult.rows[0].payload.session_id === session.id, 'payload session_id correto');
  assert(outboxResult.rows[0].aggregate_id === session.id, 'aggregate_id = session.id');
  assert(outboxResult.rows[0].status === 'pending', 'status = pending');

  return session;
}

async function testOpenCashNegativeBalance() {
  console.log('\n[openCash] saldo inicial negativo');
  const service = new CashFlowService();
  const adminUser = { id: null, role: 'admin' };

  try {
    await service.openCash(testCompanyId, adminUser, {
      cash_date: testDate,
      opening_balance: -50
    });
    assert(false, 'deveria ter lancado erro');
  } catch (err) {
    assert(err.statusCode === 400, 'statusCode 400: ' + err.statusCode);
    assert(err.message.includes('invalido'), 'mensagem de erro');
  }
}

async function testOpenCashUnauthorized() {
  console.log('\n[openCash] usuario nao autorizado');
  const service = new CashFlowService();
  const collaboratorUser = { id: null, role: 'collaborator' };

  try {
    await service.openCash(testCompanyId, collaboratorUser, {
      cash_date: testDate,
      opening_balance: 100
    });
    assert(false, 'deveria ter lancado erro');
  } catch (err) {
    assert(err.statusCode === 403, 'statusCode 403: ' + err.statusCode);
  }
}

async function testOpenCashNoCompany() {
  console.log('\n[openCash] sem company_id');
  const service = new CashFlowService();
  const adminUser = { id: null, role: 'admin' };

  try {
    await service.openCash(null, adminUser, {
      cash_date: testDate,
      opening_balance: 100
    });
    assert(false, 'deveria ter lancado erro');
  } catch (err) {
    assert(err.statusCode === 403, 'statusCode 403: ' + err.statusCode);
  }
}

async function testRollbackOnError() {
  console.log('\n[UoW] rollback em erro');
  const repo = new CashSessionRepository();
  const uow = createUnitOfWork();
  const adminUser = { id: null, role: 'admin' };
  const errorDate = testDate;

  await pool.query(
    `DELETE FROM barber_cash_sessions WHERE company_id = $1 AND cash_date = $2::date`,
    [testCompanyId, errorDate]
  );

  try {
    await uow.begin();
    const txRepo = uow.repository(CashSessionRepository);
    await txRepo.ensureExists(testCompanyId, errorDate, adminUser.id, 200, 'rollback test');
    const existing = await txRepo.findByCompanyAndDate(testCompanyId, errorDate);
    assert(existing !== null, 'criou dentro da transacao');
    assert(Number(existing.opening_balance) === 200, 'balance 200 dentro da tx');
    throw new Error('erro forçado para rollback');
  } catch (err) {
    await uow.rollback();
    assert(err.message === 'erro forçado para rollback', 'erro propagado');
  }

  const check = await pool.query(
    `SELECT * FROM barber_cash_sessions WHERE company_id = $1 AND cash_date = $2::date`,
    [testCompanyId, errorDate]
  );
  assert(check.rows.length === 0, 'nenhuma sessao persistida apos rollback');
}

async function testCommitPersists() {
  console.log('\n[UoW] commit persiste dados');
  const repo = new CashSessionRepository();
  const uow = createUnitOfWork();
  const adminUser = { id: null, role: 'admin' };
  const commitDate = testDate;

  await pool.query(
    `DELETE FROM barber_cash_sessions WHERE company_id = $1 AND cash_date = $2::date`,
    [testCompanyId, commitDate]
  );

  try {
    await uow.begin();
    const txRepo = uow.repository(CashSessionRepository);
    await txRepo.ensureExists(testCompanyId, commitDate, adminUser.id, 300, 'commit test');
    await txRepo.open(testCompanyId, commitDate, 300, adminUser.id, 'commit test');
    await txRepo.recalculate(testCompanyId, commitDate);
    await txRepo.appendAuditLog(testCompanyId, adminUser.id, 'open_cash', null, {
      cash_date: commitDate,
      opening_balance: 300
    });
    await uow.commit();
  } catch (err) {
    await uow.rollback();
    assert(false, 'commit nao deveria falhar: ' + err.message);
    return;
  }

  const check = await pool.query(
    `SELECT * FROM barber_cash_sessions WHERE company_id = $1 AND cash_date = $2::date`,
    [testCompanyId, commitDate]
  );
  assert(check.rows.length === 1, 'sessao persistida apos commit');
  assert(Number(check.rows[0].opening_balance) === 300, 'opening_balance = 300');

  const auditCheck = await pool.query(
    `SELECT * FROM barber_audit_logs WHERE company_id = $1 AND action = 'open_cash' AND entity_type = 'barber_cash_session'`,
    [testCompanyId]
  );
  assert(auditCheck.rows.length >= 1, 'audit log persistido apos commit');
}

async function testTenantIsolation() {
  console.log('\n[UoW] isolamento tenant');
  const altResult = await pool.query(
    `INSERT INTO companies (name, public_booking_slug)
     VALUES ($1, $2)
     RETURNING id`,
    ['Cash Flow Tenant B', 'cash-flow-tenant-b-' + Date.now()]
  );
  const altCompanyId = altResult.rows[0].id;
  const adminUser = { id: null, role: 'admin' };

  try {
    const service = new CashFlowService();
    await service.openCash(altCompanyId, adminUser, {
      cash_date: testDate,
      opening_balance: 999
    });

    const companyASessions = await pool.query(
      `SELECT * FROM barber_cash_sessions WHERE company_id = $1`,
      [testCompanyId]
    );

    for (const row of companyASessions.rows) {
      assert(row.company_id === testCompanyId, 'sessao A pertence a empresa A');
      assert(Number(row.opening_balance) !== 999, 'sessao A nao tem balance 999 da empresa B');
    }

    const companyBSessions = await pool.query(
      `SELECT * FROM barber_cash_sessions WHERE company_id = $1`,
      [altCompanyId]
    );
    assert(companyBSessions.rows.length >= 1, 'empresa B tem sessao');
    assert(Number(companyBSessions.rows[0].opening_balance) === 999, 'empresa B balance = 999');
  } finally {
    await pool.query('DELETE FROM barber_cash_sessions WHERE company_id = $1', [altCompanyId]);
    await pool.query('DELETE FROM barber_audit_logs WHERE company_id = $1', [altCompanyId]);
    await pool.query('DELETE FROM companies WHERE id = $1', [altCompanyId]);
  }
}

async function testRepoClientPropagation() {
  console.log('\n[UoW] propagation do client');
  const uow = createUnitOfWork();
  const adminUser = { id: null, role: 'admin' };

  try {
    await uow.begin();
    const txRepo = uow.repository(CashSessionRepository);
    assert(txRepo.db === uow.client, 'repository.db === uow.client');
    await txRepo.ensureExists(testCompanyId, testDate, adminUser.id, 100, 'propagation test');
    const session = await txRepo.findByCompanyAndDate(testCompanyId, testDate);
    assert(session !== null, 'query funciona com client da transacao');
    await uow.rollback();
  } catch (err) {
    await uow.rollback();
    throw err;
  }
}

async function testRollbackSafety() {
  console.log('\n[UoW] rollback seguro sem begin');
  const uow = createUnitOfWork();
  try {
    await uow.rollback();
    assert(true, 'rollback() sem begin nao lanca erro');
  } catch (err) {
    assert(false, 'rollback() sem begin lancou erro: ' + err.message);
  }
}

async function testCloseCashAuth() {
  console.log('\n[closeCash] sem company_id');
  const service = new CashFlowService();
  try {
    await service.closeCash(null, { role: 'admin' }, { cash_date: testDate });
    assert(false, 'deveria ter lancado erro');
  } catch (err) {
    assert(err.statusCode === 403, 'statusCode 403: ' + err.statusCode);
  }

  console.log('\n[closeCash] usuario nao autorizado');
  try {
    await service.closeCash(testCompanyId, { id: null, role: 'collaborator' }, { cash_date: testDate });
    assert(false, 'deveria ter lancado erro');
  } catch (err) {
    assert(err.statusCode === 403, 'statusCode 403: ' + err.statusCode);
  }
}

async function testCloseCashRollback() {
  console.log('\n[closeCash] rollback em erro');
  const uow = createUnitOfWork();
  const adminUser = { id: null, role: 'admin' };

  await pool.query(
    `DELETE FROM barber_cash_sessions WHERE company_id = $1 AND cash_date = $2::date`,
    [testCompanyId, testDate]
  );

  try {
    await uow.begin();
    const txRepo = uow.repository(CashSessionRepository);
    await txRepo.ensureExists(testCompanyId, testDate, adminUser.id, 100, 'rollback test');
    await txRepo.open(testCompanyId, testDate, 100, adminUser.id, 'rollback test');
    await txRepo.recalculate(testCompanyId, testDate);
    await txRepo.close(testCompanyId, testDate, adminUser.id, 'rollback test');

    uow.addEvent('cash_session.closed', {
      session_id: '00000000-0000-0000-0000-000000000000',
      company_id: testCompanyId,
      cash_date: testDate
    }, {
      traceId: 'test-rollback-close',
      companyId: testCompanyId,
      aggregateType: 'cash_session',
      aggregateId: '00000000-0000-0000-0000-000000000000'
    });

    throw new Error('erro forçado para rollback close');
  } catch (err) {
    await uow.rollback();
    assert(err.message === 'erro forçado para rollback close', 'erro propagado');
  }

  const check = await pool.query(
    `SELECT * FROM barber_cash_sessions WHERE company_id = $1 AND cash_date = $2::date`,
    [testCompanyId, testDate]
  );
  assert(check.rows.length === 0, 'nenhuma sessao persistida apos rollback');

  const eventCheck = await pool.query(
    `SELECT * FROM outbox_messages WHERE trace_id = 'test-rollback-close'`
  );
  assert(eventCheck.rows.length === 0, 'nenhum evento outbox persistido apos rollback');
}

async function testCloseCashAlreadyClosed() {
  console.log('\n[closeCash] sessao ja fechada');
  const service = new CashFlowService();
  const adminUser = { id: null, role: 'admin' };

  await pool.query(
    `DELETE FROM barber_cash_sessions WHERE company_id = $1 AND cash_date = $2::date`,
    [testCompanyId, testDate]
  );

  const session = await service.openCash(testCompanyId, adminUser, {
    cash_date: testDate,
    opening_balance: 100
  });

  await service.closeCash(testCompanyId, adminUser, {
    cash_date: testDate,
    notes: 'primeiro fechamento'
  });

  try {
    await service.closeCash(testCompanyId, adminUser, {
      cash_date: testDate
    });
    assert(false, 'deveria ter lancado erro de ja fechado');
  } catch (err) {
    assert(err.statusCode === 409, 'statusCode 409: ' + err.statusCode);
  }
}

async function testCloseCashSuccess() {
  console.log('\n[closeCash] sucesso');
  const service = new CashFlowService();
  const adminUser = { id: null, role: 'admin' };

  await pool.query(
    `DELETE FROM barber_cash_sessions WHERE company_id = $1 AND cash_date = $2::date`,
    [testCompanyId, testDate]
  );

  const opened = await service.openCash(testCompanyId, adminUser, {
    cash_date: testDate,
    opening_balance: 100
  });

  const session = await service.closeCash(testCompanyId, adminUser, {
    cash_date: testDate,
    notes: 'Fechamento de teste'
  });

  assert(session !== null, 'retornou sessao');
  assert(session.company_id === testCompanyId, 'company_id correto');
  assert(session.status === 'closed', 'status = closed');
  assert(session.closed_at !== null, 'closed_at preenchido');
  assert(Number(session.opening_balance) === 100, 'opening_balance preservado');

  const auditResult = await pool.query(
    `SELECT * FROM barber_audit_logs WHERE company_id = $1 AND action = 'close_cash'`,
    [testCompanyId]
  );
  assert(auditResult.rows.length >= 1, 'audit log registrado');
  assert(auditResult.rows[0].entity_type === 'barber_cash_session', 'audit entity_type correto');

  const outboxResult = await pool.query(
    `SELECT * FROM outbox_messages
     WHERE company_id = $1 AND type = 'cash_session.closed'
     ORDER BY created_at DESC LIMIT 1`,
    [testCompanyId]
  );
  assert(outboxResult.rows.length >= 1, 'outbox event emitido');
  assert(outboxResult.rows[0].payload.session_id === session.id, 'payload session_id correto');
  assert(outboxResult.rows[0].aggregate_id === session.id, 'aggregate_id = session.id');
  assert(outboxResult.rows[0].payload.net_total !== undefined, 'payload net_total presente');
  assert(outboxResult.rows[0].status === 'pending', 'status = pending');
}

async function testCloseCashOrdering() {
  console.log('\n[closeCash] aggregate ordering');
  const service = new CashFlowService();
  const adminUser = { id: null, role: 'admin' };

  await pool.query(
    `DELETE FROM barber_cash_sessions WHERE company_id = $1 AND cash_date = $2::date`,
    [testCompanyId, testDate]
  );

  await pool.query(
    `DELETE FROM outbox_messages WHERE company_id = $1`,
    [testCompanyId]
  );

  await service.openCash(testCompanyId, adminUser, {
    cash_date: testDate,
    opening_balance: 100
  });

  await service.closeCash(testCompanyId, adminUser, {
    cash_date: testDate,
    notes: 'Fechamento c/ ordering'
  });

  const events = await pool.query(
    `SELECT type, created_at FROM outbox_messages
     WHERE company_id = $1 AND aggregate_type = 'cash_session'
     ORDER BY created_at ASC`,
    [testCompanyId]
  );

  assert(events.rows.length >= 2, 'pelo menos 2 eventos (open + close)');
  assert(events.rows[0].type === 'cash_session.opened', 'primeiro evento = opened, atual: ' + events.rows[0].type);
  assert(events.rows[1].type === 'cash_session.closed', 'segundo evento = closed, atual: ' + events.rows[1].type);
}

async function testLogCompatible() {
  console.log('\n[openCash] compatibilidade via CashFlowService');
  const cashFlowService = new CashFlowService();
  const adminUser = { company_id: testCompanyId, id: null, role: 'admin' };

  await pool.query(
    `DELETE FROM barber_cash_sessions WHERE company_id = $1 AND cash_date = $2::date`,
    [testCompanyId, testDate]
  );

  try {
    const result = await cashFlowService.openCash(testCompanyId, adminUser, {
      cash_date: testDate,
      opening_balance: 50
    });
    assert(result !== null, 'retornou resultado');
    assert(result.id !== undefined, 'tem session id');
    assert(result.company_id === testCompanyId, 'company_id correto na resposta');
    assert(Number(result.opening_balance) === 50, 'opening_balance = 50');
  } catch (err) {
    assert(false, 'compatibilidade falhou: ' + err.message);
  }
}

async function main() {
  console.log('='.repeat(40));
  console.log('Cash Flow — UoW Integration Tests');
  console.log('='.repeat(40));

  try {
    await setup();

    await testRepoClientPropagation();

    await testRollbackSafety();

    await testOpenCashNoCompany();

    await testOpenCashUnauthorized();

    await testOpenCashNegativeBalance();

    await testRollbackOnError();

    await testCommitPersists();

    await testOpenCashSuccess();

    await testCloseCashAuth();

    await testCloseCashRollback();

    await testCloseCashAlreadyClosed();

    await testCloseCashSuccess();

    await testCloseCashOrdering();

    await testTenantIsolation();

    await testLogCompatible();

  } catch (err) {
    console.error('\n  ERRO na suite:', err.message);
    failed++;
  } finally {
    await cleanup();
    console.log('\n' + '='.repeat(40));
    console.log('Total: ' + (passed + failed) + ' | PASS: ' + passed + ' | FAIL: ' + failed);
    console.log('='.repeat(40));
    process.exit(failed > 0 ? 1 : 0);
  }
}

main();
