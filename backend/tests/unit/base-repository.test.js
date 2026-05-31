// tests/unit/base-repository.test.js
// Cobre a rede de segurança tenant-scoped do BaseRepository.create()
// (defesa-em-profundidade para repositórios FUTUROS que usem o create herdado).

const { BaseRepository } = require('../../src/shared/core/database/BaseRepository')

function createMockDb(returnRow = { id: 'row-1' }) {
  return {
    query: jest.fn().mockResolvedValue({ rows: [returnRow] }),
  }
}

describe('BaseRepository — create() tenant guard', () => {
  it('lança quando tenantScoped e company_id ausente', async () => {
    const db = createMockDb()
    const repo = new BaseRepository('barber_services', db, { tenantScoped: true })

    await expect(repo.create({ name: 'X' })).rejects.toThrow(/company_id/)
    expect(db.query).not.toHaveBeenCalled()
  })

  it('lança quando tenantScoped e company_id null', async () => {
    const db = createMockDb()
    const repo = new BaseRepository('barber_services', db, { tenantScoped: true })

    await expect(repo.create({ name: 'X', company_id: null })).rejects.toThrow(/company_id/)
    expect(db.query).not.toHaveBeenCalled()
  })

  it('insere quando tenantScoped e company_id presente', async () => {
    const db = createMockDb({ id: 'svc-1' })
    const repo = new BaseRepository('barber_services', db, { tenantScoped: true })

    const row = await repo.create({ name: 'X', company_id: 'comp-1' })

    expect(row).toEqual({ id: 'svc-1' })
    expect(db.query).toHaveBeenCalledTimes(1)
  })

  it('repo global (default, tenantScoped=false) insere sem company_id', async () => {
    const db = createMockDb({ id: 'g-1' })
    const repo = new BaseRepository('settings', db)

    const row = await repo.create({ key: 'k', value: 'v' })

    expect(row).toEqual({ id: 'g-1' })
    expect(db.query).toHaveBeenCalledTimes(1)
  })
})
