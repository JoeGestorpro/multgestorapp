const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env'), quiet: true });

const pool = require('../../config/database');
const BarberServicesRepository = require('../../repositories/barber-services.repository');
const BarberServiceService = require('../../services/barber-service.service');

let passed = 0;
let failed = 0;
let testCompanyId = null;
let altCompanyId = null;

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
    ['Repo Pilot Test Company', 'repo-pilot-test-' + Date.now()]
  );
  testCompanyId = result.rows[0].id;

  const altResult = await pool.query(
    `INSERT INTO companies (name, public_booking_slug)
     VALUES ($1, $2)
     RETURNING id`,
    ['Repo Pilot Alt Company', 'repo-pilot-alt-' + Date.now()]
  );
  altCompanyId = altResult.rows[0].id;
}

async function cleanup() {
  const ids = [testCompanyId, altCompanyId].filter(Boolean);
  for (const id of ids) {
    await pool.query('DELETE FROM barber_services WHERE company_id = $1', [id]);
    await pool.query('DELETE FROM companies WHERE id = $1', [id]);
  }
}

async function testCreate() {
  console.log('\n[CRUD] create');

  const repo = new BarberServicesRepository();
  const result = await repo.create(testCompanyId, {
    name: 'Corte Masculino',
    description: 'Corte com tesoura e maquina',
    price: 50,
    serviceType: 'service',
    icon: 'scissors',
    commissionType: 'percentage',
    commissionValue: 10,
    estimatedTimeMinutes: 30,
    isActive: true
  });

  assert(result !== null, 'retorna registro');
  assert(result.id !== undefined, 'gerou UUID: ' + result.id);
  assert(result.company_id === testCompanyId, 'company_id correto');
  assert(result.name === 'Corte Masculino', 'nome correto');
  assert(result.price === '50.00', 'preco correto: ' + result.price);
  assert(result.is_active === true, 'is_active true');
  assert(result.is_deleted === false, 'is_deleted false');
  assert(result.created_at !== null, 'created_at preenchido');
  assert(result.updated_at !== null, 'updated_at preenchido');

  return result;
}

async function testCreateMinimal() {
  console.log('\n[CRUD] create com dados minimos via service');

  const repo = new BarberServicesRepository();
  const service = new BarberServiceService(repo);
  const adminUser = { id: 'admin-test', role: 'admin' };

  const result = await service.create(testCompanyId, adminUser, {
    name: 'Barba',
    price: 0
  });

  assert(result !== null, 'criou com dados minimos');
  assert(result.name === 'Barba', 'nome obrigatorio');
  assert(result.description === null, 'description null quando nao enviado');
  assert(result.estimated_time_minutes === null, 'estimated_time_minutes null');
  assert(result.icon === 'scissors', 'icon default scissors');
  assert(result.service_type === 'service', 'service_type default service');
  assert(result.commission_type === 'percentage', 'commission_type default percentage');
  assert(result.commission_value === '0.00', 'commission_value default 0');

  return result;
}

async function testFindById() {
  console.log('\n[CRUD] findById');

  const repo = new BarberServicesRepository();
  const created = await repo.create(testCompanyId, {
    name: 'Hidratacao', price: 80,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 15, estimatedTimeMinutes: 45, isActive: true
  });

  const found = await repo.findById(testCompanyId, created.id);
  assert(found !== null, 'encontrou servico');
  assert(found.id === created.id, 'id corresponde');
  assert(found.name === 'Hidratacao', 'nome corresponde');
  assert(found.price === '80.00', 'preco corresponde');
}

async function testFindByIdNotFound() {
  console.log('\n[CRUD] findById nao encontrado');

  const repo = new BarberServicesRepository();
  const result = await repo.findById(testCompanyId, '00000000-0000-0000-0000-000000000000');
  assert(result === null, 'retorna null para UUID inexistente');
}

async function testFindAll() {
  console.log('\n[CRUD] findAll');

  const repo = new BarberServicesRepository();
  const all = await repo.findAll(testCompanyId);
  assert(all.length >= 3, 'retorna pelo menos 3 servicos (criados nos testes anteriores)');
  assert(all.every(s => s.company_id === testCompanyId), 'todos pertencem a empresa correta');
  assert(all.every(s => s.is_deleted === false), 'nenhum deletado');
}

async function testFindAllWithSearch() {
  console.log('\n[CRUD] findAll com search');

  const repo = new BarberServicesRepository();
  const result = await repo.findAll(testCompanyId, { search: 'Corte' });
  assert(result.length >= 1, 'search Corte retorna resultados');
  assert(result.every(s => s.name.toLowerCase().includes('corte')), 'todos contem Corte no nome');
}

async function testFindAllWithSearchNoMatch() {
  console.log('\n[CRUD] findAll com search sem match');

  const repo = new BarberServicesRepository();
  const result = await repo.findAll(testCompanyId, { search: 'ZZZZ_NAO_EXISTE' });
  assert(Array.isArray(result), 'retorna array');
  assert(result.length === 0, 'array vazio para search sem match');
}

async function testFindAllStatusFilter() {
  console.log('\n[CRUD] findAll com filtro status');

  const repo = new BarberServicesRepository();
  await repo.create(testCompanyId, {
    name: 'Servico Inativo', price: 10,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 0, estimatedTimeMinutes: 15, isActive: false
  });

  const active = await repo.findAll(testCompanyId, { status: 'active' });
  assert(active.every(s => s.is_active === true), 'status active: todos ativos');

  const inactive = await repo.findAll(testCompanyId, { status: 'inactive' });
  assert(inactive.every(s => s.is_active === false), 'status inactive: todos inativos');
}

async function testUpdate() {
  console.log('\n[CRUD] update');

  const repo = new BarberServicesRepository();
  const created = await repo.create(testCompanyId, {
    name: 'Original', price: 30,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 5, estimatedTimeMinutes: 20, isActive: true
  });

  const updated = await repo.update(testCompanyId, created.id, {
    name: 'Atualizado', description: 'Nova descricao',
    price: 45, serviceType: 'service', icon: 'scissors',
    commissionType: 'fixed', commissionValue: 8,
    estimatedTimeMinutes: 25, isActive: true
  });

  assert(updated !== null, 'retorna registro');
  assert(updated.name === 'Atualizado', 'nome alterado');
  assert(updated.price === '45.00', 'preco alterado');
  assert(updated.description === 'Nova descricao', 'descricao alterada');
  assert(updated.commission_type === 'fixed', 'tipo comissao alterado');
  assert(updated.estimated_time_minutes === 25, 'tempo alterado');

  const updatedAt = new Date(updated.updated_at);
  assert(updatedAt instanceof Date && !isNaN(updatedAt), 'updated_at e data valida');
  assert(updatedAt > new Date('2020-01-01'), 'updated_at tem valor razoavel');
}

async function testUpdateNotFound() {
  console.log('\n[CRUD] update servico inexistente');

  const repo = new BarberServicesRepository();
  const result = await repo.update(testCompanyId, '00000000-0000-0000-0000-000000000000', {
    name: 'Nao Existe', price: 0,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 0, estimatedTimeMinutes: 0, isActive: true
  });
  assert(result === null, 'retorna null para UUID inexistente');
}

async function testUpdateStatus() {
  console.log('\n[CRUD] updateStatus');

  const repo = new BarberServicesRepository();
  const created = await repo.create(testCompanyId, {
    name: 'Toggle Status', price: 20,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 0, estimatedTimeMinutes: 10, isActive: true
  });

  const disabled = await repo.updateStatus(testCompanyId, created.id, false);
  assert(disabled.is_active === false, 'status alterado para false');

  const enabled = await repo.updateStatus(testCompanyId, created.id, true);
  assert(enabled.is_active === true, 'status alterado para true');
}

async function testSoftDelete() {
  console.log('\n[CRUD] softDelete');

  const repo = new BarberServicesRepository();
  const created = await repo.create(testCompanyId, {
    name: 'Deletar', price: 15,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 0, estimatedTimeMinutes: 5, isActive: true
  });

  const deleted = await repo.softDelete(testCompanyId, created.id);
  assert(deleted !== null, 'softDelete retorna id');
  assert(deleted.id === created.id, 'id do servico deletado');

  const afterDelete = await repo.findById(testCompanyId, created.id);
  assert(afterDelete === null, 'findById nao retorna servico deletado');

  const all = await repo.findAll(testCompanyId);
  assert(!all.some(s => s.id === created.id), 'findAll nao lista servico deletado');
}

async function testSoftDeleteNotFound() {
  console.log('\n[CRUD] softDelete inexistente');

  const repo = new BarberServicesRepository();
  const result = await repo.softDelete(testCompanyId, '00000000-0000-0000-0000-000000000000');
  assert(result === null, 'retorna null para UUID inexistente');
}

async function testCount() {
  console.log('\n[CRUD] count');

  const repo = new BarberServicesRepository();
  const before = await repo.count(testCompanyId);
  assert(typeof before === 'number', 'count retorna numero');
  assert(before >= 0, 'count nao negativo');

  await repo.create(testCompanyId, {
    name: 'Count Test', price: 5,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 0, estimatedTimeMinutes: 5, isActive: true
  });

  const after = await repo.count(testCompanyId);
  assert(after === before + 1, 'count incrementou apos create');
}

async function testTenantIsolation() {
  console.log('\n[TENANT] isolamento');

  const repo = new BarberServicesRepository();

  const svcA = await repo.create(testCompanyId, {
    name: 'Service Empresa A', price: 100,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 10, estimatedTimeMinutes: 30, isActive: true
  });

  const svcB = await repo.create(altCompanyId, {
    name: 'Service Empresa B', price: 200,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 20, estimatedTimeMinutes: 60, isActive: true
  });

  const allA = await repo.findAll(testCompanyId);
  assert(!allA.some(s => s.company_id === altCompanyId), 'findAll A nao ve servicos de B');

  const allB = await repo.findAll(altCompanyId);
  assert(!allB.some(s => s.company_id === testCompanyId), 'findAll B nao ve servicos de A');

  const foundA = await repo.findById(testCompanyId, svcB.id);
  assert(foundA === null, 'findById A nao encontra servico de B');

  const foundB = await repo.findById(altCompanyId, svcA.id);
  assert(foundB === null, 'findById B nao encontra servico de A');

  const updated = await repo.update(testCompanyId, svcB.id, {
    name: 'Hack Tentativa', price: 0,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 0, estimatedTimeMinutes: 0, isActive: true
  });
  assert(updated === null, 'update A nao altera servico de B');

  const deleted = await repo.softDelete(testCompanyId, svcB.id);
  assert(deleted === null, 'softDelete A nao deleta servico de B');

  const svcBstillAlive = await repo.findById(altCompanyId, svcB.id);
  assert(svcBstillAlive !== null, 'servico B ainda existe apos tentativa de invasao');
  assert(svcBstillAlive.name === 'Service Empresa B', 'nome de B intacto');
}

async function testServiceBusinessRules() {
  console.log('\n[SERVICE] regras de negocio');

  const repo = new BarberServicesRepository();
  const adminUser = { id: 'admin-1', role: 'admin' };
  const collaboratorUser = { id: 'collab-1', role: 'collaborator' };
  const service = new BarberServiceService(repo);

  try {
    await service.list(null, adminUser);
    assert(false, 'list sem companyId deveria lancar erro');
  } catch (err) {
    assert(err.statusCode === 403, 'list sem companyId: 403');
  }

  try {
    await service.create(testCompanyId, collaboratorUser, { name: 'Test' });
    assert(false, 'create por collaborator deveria lancar erro');
  } catch (err) {
    assert(err.statusCode === 403, 'create por collaborator: 403');
  }

  try {
    await service.create(testCompanyId, adminUser, {});
    assert(false, 'create sem nome deveria lancar erro');
  } catch (err) {
    assert(err.statusCode === 400, 'create sem nome: 400');
    assert(err.message === 'Nome do servico e obrigatorio', 'mensagem correta');
  }

  try {
    await service.create(testCompanyId, adminUser, { name: 'Test', price: -5 });
    assert(false, 'create com preco negativo deveria lancar erro');
  } catch (err) {
    assert(err.statusCode === 400, 'create preco negativo: 400');
    assert(err.message === 'Preco invalido', 'mensagem correta');
  }

  try {
    await service.getById(testCompanyId, adminUser, '00000000-0000-0000-0000-000000000000');
    assert(false, 'getById inexistente deveria lancar erro');
  } catch (err) {
    assert(err.statusCode === 404, 'getById inexistente: 404');
  }

  try {
    await service.delete(testCompanyId, adminUser, '00000000-0000-0000-0000-000000000000');
    assert(false, 'delete inexistente deveria lancar erro');
  } catch (err) {
    assert(err.statusCode === 404, 'delete inexistente: 404');
  }

  const created = await repo.create(testCompanyId, {
    name: 'Service Null Test', price: 0,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 0, estimatedTimeMinutes: 10, isActive: true
  });

  const nonAdminView = await service.list(testCompanyId, collaboratorUser);
  assert(nonAdminView.every(s => s.is_active === true), 'non-admin ve apenas ativos');
}

async function testTransactionReadiness() {
  console.log('\n[TRANSACTION] readiness');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const txRepo = new BarberServicesRepository(client);
    const created = await txRepo.create(testCompanyId, {
      name: 'Transacao Test', price: 99,
      serviceType: 'service', commissionType: 'percentage',
      commissionValue: 10, estimatedTimeMinutes: 30, isActive: true
    });
    assert(created !== null, 'criou dentro da transacao');
    assert(created.id !== undefined, 'UUID gerado na transacao');

    const updated = await txRepo.update(testCompanyId, created.id, {
      name: 'Transacao Alterado', price: 199,
      serviceType: 'service', icon: 'scissors',
      commissionType: 'percentage', commissionValue: 15,
      estimatedTimeMinutes: 45, isActive: true
    });
    assert(updated.name === 'Transacao Alterado', 'alterou dentro da transacao');

    await client.query('ROLLBACK');

    const repo = new BarberServicesRepository();
    const afterRollback = await repo.findById(testCompanyId, created.id);
    assert(afterRollback === null, 'rollback reverteu criacao');
  } finally {
    client.release();
  }
}

async function testTransactionErrorRollback() {
  console.log('\n[TRANSACTION] rollback em erro');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const txRepo = new BarberServicesRepository(client);
    const svc1 = await txRepo.create(testCompanyId, {
      name: 'Antes do Erro', price: 10,
      serviceType: 'service', commissionType: 'percentage',
      commissionValue: 0, estimatedTimeMinutes: 5, isActive: true
    });
    assert(svc1 !== null, 'criou primeiro servico');

    try {
      await client.query('INSERT INTO tabela_inexistente VALUES (1)');
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
    }

    const repo = new BarberServicesRepository();
    const afterRollback = await repo.findById(testCompanyId, svc1.id);
    assert(afterRollback === null, 'rollback reverteu tudo apos erro');
  } finally {
    client.release();
  }
}

async function testNullHandling() {
  console.log('\n[NULL] manuseio de nulos');

  const repo = new BarberServicesRepository();
  const result = await repo.create(testCompanyId, {
    name: 'Null Test', price: 0,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 0, estimatedTimeMinutes: null, isActive: true
  });

  assert(result.description === null, 'description null quando nao enviado');
  assert(result.estimated_time_minutes === null, 'estimated_time_minutes null quando nao enviado');

  const searchResult = await repo.findAll(testCompanyId, { search: 'Null Test' });
  assert(searchResult.length >= 1, 'search funciona com description null');
  assert(searchResult[0].name === 'Null Test', 'nome correto apesar de description null');
}

async function testSoftDeleteRecreate() {
  console.log('\n[EDGE] soft-delete + re-create');

  const repo = new BarberServicesRepository();
  const svc1 = await repo.create(testCompanyId, {
    name: 'Nome Unico', price: 25,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 5, estimatedTimeMinutes: 15, isActive: true
  });

  await repo.softDelete(testCompanyId, svc1.id);

  const svc2 = await repo.create(testCompanyId, {
    name: 'Nome Unico', price: 30,
    serviceType: 'service', commissionType: 'percentage',
    commissionValue: 5, estimatedTimeMinutes: 15, isActive: true
  });

  assert(svc2 !== null, 're-create com mesmo nome funciona');
  assert(svc2.id !== svc1.id, 'gera novo UUID');
  assert(svc2.name === 'Nome Unico', 'mesmo nome ok');
  assert(svc2.is_deleted === false, 'novo registro nao deletado');
}

async function testServiceIntegrationWithRepo() {
  console.log('\n[INTEGRATION] service + repository');

  const repo = new BarberServicesRepository();
  const service = new BarberServiceService(repo);
  const adminUser = { id: 'admin-test', role: 'admin' };

  const created = await service.create(testCompanyId, adminUser, {
    name: 'Service Integration Test',
    description: 'Testando service + repo juntos',
    price: 75.50,
    service_type: 'service',
    commission_type: 'fixed',
    commission_value: 12,
    estimated_time_minutes: 40
  });
  assert(created !== null, 'service.create funciona');
  assert(created.name === 'Service Integration Test', 'nome normalizado');
  assert(created.price === '75.50', 'preco normalizado');

  const found = await service.getById(testCompanyId, adminUser, created.id);
  assert(found !== null, 'service.getById funciona');
  assert(found.name === 'Service Integration Test', 'getById retorna dados corretos');

  const listed = await service.list(testCompanyId, adminUser);
  assert(listed.some(s => s.id === created.id), 'service.list inclui servico criado');

  const updated = await service.update(testCompanyId, adminUser, created.id, {
    name: 'Integration Updated',
    price: 100,
    service_type: 'service',
    commission_type: 'percentage',
    commission_value: 20,
    estimated_time_minutes: 50
  });
  assert(updated.name === 'Integration Updated', 'service.update funciona');
  assert(updated.price === '100.00', 'preco atualizado');

  const statusUpdated = await service.updateStatus(testCompanyId, adminUser, created.id, { is_active: false });
  assert(statusUpdated.is_active === false, 'service.updateStatus funciona');

  await service.delete(testCompanyId, adminUser, created.id, {});

  try {
    await service.getById(testCompanyId, adminUser, created.id);
    assert(false, 'getById apos delete deveria lancar 404');
  } catch (err) {
    assert(err.statusCode === 404, 'getById apos delete: 404');
  }
}

async function run() {
  console.log('========================================');
  console.log('Repository Pilot — Integration Tests');
  console.log('========================================');

  try {
    await setup();
    console.log(`\nSetup: company_id=${testCompanyId}, alt_company_id=${altCompanyId}`);

    await testCreate();
    await testCreateMinimal();
    await testFindById();
    await testFindByIdNotFound();
    await testFindAll();
    await testFindAllWithSearch();
    await testFindAllWithSearchNoMatch();
    await testFindAllStatusFilter();
    await testUpdate();
    await testUpdateNotFound();
    await testUpdateStatus();
    await testSoftDelete();
    await testSoftDeleteNotFound();
    await testCount();
    await testTenantIsolation();
    await testServiceBusinessRules();
    await testTransactionReadiness();
    await testTransactionErrorRollback();
    await testNullHandling();
    await testSoftDeleteRecreate();
    await testServiceIntegrationWithRepo();

  } finally {
    await cleanup();
  }

  console.log(`\n${'='}.repeat(40)`);
  console.log(`Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
  console.log(`${'='}.repeat(40)`);

  await pool.end();

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
