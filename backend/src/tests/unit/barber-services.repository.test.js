const BarberServicesRepository = require('../../repositories/barber-services.repository')

let passed = 0
let failed = 0

function assert(condition, message) {
  if (!condition) {
    failed++
    console.error(`  FAIL: ${message}`)
    return
  }
  passed++
  console.log(`  PASS: ${message}`)
}

function makeMockDb(rows = [], rowCount = rows.length) {
  return {
    query: async () => ({ rows, rowCount })
  }
}

async function testFindAll() {
  console.log('\nfindAll')
  const fakeRows = [
    { id: '1', company_id: 'c1', name: 'Corte', is_active: true, is_deleted: false },
    { id: '2', company_id: 'c1', name: 'Barba', is_active: true, is_deleted: false }
  ]
  const repo = new BarberServicesRepository(makeMockDb(fakeRows))
  const result = await repo.findAll('c1')
  assert(result.length === 2, 'retorna 2 servicos')
  assert(result[0].name === 'Corte', 'primeiro servico e Corte')
  assert(result[1].name === 'Barba', 'segundo servico e Barba')
}

async function testFindAllWithSearch() {
  console.log('\nfindAll com filtro search')
  const fakeRows = [
    { id: '1', company_id: 'c1', name: 'Corte Degradê', is_active: true }
  ]
  const repo = new BarberServicesRepository(makeMockDb(fakeRows))
  const result = await repo.findAll('c1', { search: 'Degradê' })
  assert(result.length === 1, 'filtro search retorna 1 resultado')
  assert(result[0].name === 'Corte Degradê', 'nome filtrado corretamente')
}

async function testFindAllWithStatusFilter() {
  console.log('\nfindAll com filtro status')
  const repo = new BarberServicesRepository(makeMockDb([]))
  const active = await repo.findAll('c1', { status: 'active' })
  assert(Array.isArray(active), 'status active retorna array')
  const inactive = await repo.findAll('c1', { status: 'inactive' })
  assert(Array.isArray(inactive), 'status inactive retorna array')
}

async function testFindById() {
  console.log('\nfindById')
  const fakeRows = [
    { id: 'svc-1', company_id: 'c1', name: 'Corte', is_active: true }
  ]
  const repo = new BarberServicesRepository(makeMockDb(fakeRows))
  const result = await repo.findById('c1', 'svc-1')
  assert(result !== null, 'encontra servico existente')
  assert(result.id === 'svc-1', 'retorna id correto')
  assert(result.name === 'Corte', 'retorna nome correto')
}

async function testFindByIdNotFound() {
  console.log('\nfindById nao encontrado')
  const repo = new BarberServicesRepository(makeMockDb([], 0))
  const result = await repo.findById('c1', 'inexistente')
  assert(result === null, 'retorna null quando nao encontrado')
}

async function testCreate() {
  console.log('\ncreate')
  const createdRow = {
    id: 'new-1',
    company_id: 'c1',
    name: 'Novo Servico',
    description: null,
    price: 50,
    service_type: 'service',
    icon: 'scissors',
    commission_type: 'percentage',
    commission_value: 10,
    estimated_time_minutes: 30,
    is_active: true,
    is_deleted: false
  }
  const repo = new BarberServicesRepository(makeMockDb([createdRow]))
  const result = await repo.create('c1', {
    name: 'Novo Servico',
    price: 50,
    serviceType: 'service',
    icon: 'scissors',
    commissionType: 'percentage',
    commissionValue: 10,
    estimatedTimeMinutes: 30,
    isActive: true
  })
  assert(result !== null, 'cria servico')
  assert(result.id === 'new-1', 'retorna id do servico criado')
  assert(result.name === 'Novo Servico', 'retorna nome correto')
  assert(result.company_id === 'c1', 'retorna company_id correto')
}

async function testUpdate() {
  console.log('\nupdate')
  const updatedRow = {
    id: 'svc-1',
    company_id: 'c1',
    name: 'Corte Atualizado',
    price: 60
  }
  const repo = new BarberServicesRepository(makeMockDb([updatedRow]))
  const result = await repo.update('c1', 'svc-1', {
    name: 'Corte Atualizado',
    price: 60,
    serviceType: 'service',
    icon: 'scissors',
    commissionType: 'percentage',
    commissionValue: 10,
    estimatedTimeMinutes: 30,
    isActive: true
  })
  assert(result !== null, 'atualiza servico')
  assert(result.name === 'Corte Atualizado', 'nome atualizado corretamente')
  assert(result.price === 60, 'preco atualizado corretamente')
}

async function testUpdateNotFound() {
  console.log('\nupdate nao encontrado')
  const repo = new BarberServicesRepository(makeMockDb([], 0))
  const result = await repo.update('c1', 'inexistente', {
    name: 'Test', price: 0, serviceType: 'service',
    icon: 'scissors', commissionType: 'percentage',
    commissionValue: 0, estimatedTimeMinutes: 0, isActive: true
  })
  assert(result === null, 'retorna null quando servico nao existe')
}

async function testUpdateStatus() {
  console.log('\nupdateStatus')
  const updatedRow = { id: 'svc-1', company_id: 'c1', is_active: false }
  const repo = new BarberServicesRepository(makeMockDb([updatedRow]))
  const result = await repo.updateStatus('c1', 'svc-1', false)
  assert(result !== null, 'atualiza status')
  assert(result.is_active === false, 'status alterado para false')
}

async function testUpdateStatusNotFound() {
  console.log('\nupdateStatus nao encontrado')
  const repo = new BarberServicesRepository(makeMockDb([], 0))
  const result = await repo.updateStatus('c1', 'inexistente', true)
  assert(result === null, 'retorna null quando servico nao existe')
}

async function testSoftDelete() {
  console.log('\nsoftDelete')
  const deletedRow = { id: 'svc-1' }
  const repo = new BarberServicesRepository(makeMockDb([deletedRow]))
  const result = await repo.softDelete('c1', 'svc-1')
  assert(result !== null, 'soft delete retorna registro')
  assert(result.id === 'svc-1', 'retorna id do servico deletado')
}

async function testSoftDeleteNotFound() {
  console.log('\nsoftDelete nao encontrado')
  const repo = new BarberServicesRepository(makeMockDb([], 0))
  const result = await repo.softDelete('c1', 'inexistente')
  assert(result === null, 'retorna null quando servico nao existe')
}

async function testCount() {
  console.log('\ncount')
  const repo = new BarberServicesRepository(makeMockDb([{ total: 5 }]))
  const total = await repo.count('c1')
  assert(total === 5, 'retorna contagem correta')
}

async function testConstructorUsesDefaultPool() {
  console.log('\nconstructor')
  const repo = new BarberServicesRepository()
  assert(repo.db !== undefined, 'usa pool padrao quando db nao injetado')
}

async function run() {
  console.log('BarberServicesRepository Unit Tests')
  console.log('====================================')

  await testFindAll()
  await testFindAllWithSearch()
  await testFindAllWithStatusFilter()
  await testFindById()
  await testFindByIdNotFound()
  await testCreate()
  await testUpdate()
  await testUpdateNotFound()
  await testUpdateStatus()
  await testUpdateStatusNotFound()
  await testSoftDelete()
  await testSoftDeleteNotFound()
  await testCount()
  await testConstructorUsesDefaultPool()

  console.log(`\n${'='.repeat(36)}`)
  console.log(`Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`)

  if (failed > 0) {
    process.exit(1)
  }
}

run().catch(err => {
  console.error('Test suite error:', err)
  process.exit(1)
})
