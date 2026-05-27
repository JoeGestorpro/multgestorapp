// tests/unit/supplier-service.test.js
// BLOCO 2F — Service-Level Tests: SupplierService
// Tests service behavior with mocked repository

const SupplierService = require('../../src/services/supplier.service')
const { ValidationError, NotFoundError, ForbiddenError } = require('../../src/shared/core/errors')

function createMockRepository() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    softDelete: jest.fn(),
  }
}

const ADMIN_USER = { id: 'user-1', role: 'admin', company_id: 'company-a' }
const COLLABORATOR_USER = { id: 'user-2', role: 'collaborator', company_id: 'company-a' }
const COMPANY_ID = 'company-a'

describe('SupplierService — Unit Tests', () => {
  let service
  let repo

  beforeEach(() => {
    repo = createMockRepository()
    service = new SupplierService(repo)
    jest.clearAllMocks()
  })

  describe('list', () => {
    it('returns suppliers for valid admin', async () => {
      const suppliers = [
        { id: 'sup-1', name: 'Supplier 1', company_id: COMPANY_ID },
        { id: 'sup-2', name: 'Supplier 2', company_id: COMPANY_ID },
      ]
      repo.findAll.mockResolvedValue(suppliers)

      const result = await service.list(COMPANY_ID, ADMIN_USER)

      expect(result).toHaveLength(2)
      expect(repo.findAll).toHaveBeenCalledWith(COMPANY_ID, {})
    })

    it('passes filters to repository', async () => {
      repo.findAll.mockResolvedValue([])

      await service.list(COMPANY_ID, ADMIN_USER, { isActive: true })

      expect(repo.findAll).toHaveBeenCalledWith(COMPANY_ID, { isActive: true })
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.list(null, ADMIN_USER)).rejects.toThrow(ForbiddenError)
    })

    it('throws ForbiddenError when user is collaborator', async () => {
      await expect(service.list(COMPANY_ID, COLLABORATOR_USER)).rejects.toThrow(ForbiddenError)
    })

    it('throws ForbiddenError when user is null', async () => {
      await expect(service.list(COMPANY_ID, null)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('getById', () => {
    it('returns supplier when found', async () => {
      const supplier = { id: 'sup-1', name: 'Supplier 1', company_id: COMPANY_ID }
      repo.findById.mockResolvedValue(supplier)

      const result = await service.getById(COMPANY_ID, ADMIN_USER, 'sup-1')

      expect(result).toEqual(supplier)
      expect(repo.findById).toHaveBeenCalledWith(COMPANY_ID, 'sup-1')
    })

    it('throws NotFoundError when supplier not found', async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.getById(COMPANY_ID, ADMIN_USER, 'nonexistent')).rejects.toThrow(NotFoundError)
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.getById(null, ADMIN_USER, 'sup-1')).rejects.toThrow(ForbiddenError)
    })

    it('throws ForbiddenError when user is collaborator', async () => {
      await expect(service.getById(COMPANY_ID, COLLABORATOR_USER, 'sup-1')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('ensureExists', () => {
    it('returns supplier when found', async () => {
      const supplier = { id: 'sup-1', name: 'Supplier 1' }
      repo.findById.mockResolvedValue(supplier)

      const result = await service.ensureExists(COMPANY_ID, 'sup-1')

      expect(result).toEqual(supplier)
    })

    it('throws NotFoundError when supplier not found', async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.ensureExists(COMPANY_ID, 'nonexistent')).rejects.toThrow(NotFoundError)
    })

    it('does not check user role', async () => {
      repo.findById.mockResolvedValue({ id: 'sup-1' })

      const result = await service.ensureExists(COMPANY_ID, 'sup-1')
      expect(result).toBeDefined()
    })
  })

  describe('create', () => {
    it('creates supplier with valid data', async () => {
      repo.create.mockResolvedValue({
        id: 'sup-new',
        company_id: COMPANY_ID,
        name: 'New Supplier',
        email: 'supplier@example.com',
        is_active: true,
      })

      const result = await service.create(COMPANY_ID, ADMIN_USER, {
        name: 'New Supplier',
        email: 'supplier@example.com',
      })

      expect(result.id).toBe('sup-new')
      expect(repo.create).toHaveBeenCalledWith(COMPANY_ID, expect.objectContaining({
        name: 'New Supplier',
        email: 'supplier@example.com',
      }))
    })

    it('throws ValidationError when name is missing', async () => {
      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        email: 'supplier@example.com',
      })).rejects.toThrow(ValidationError)
    })

    it('normalizes email before creating', async () => {
      repo.create.mockResolvedValue({ id: 'sup-new' })

      await service.create(COMPANY_ID, ADMIN_USER, {
        name: 'New Supplier',
        email: '  SUPPLIER@EXAMPLE.COM  ',
      })

      expect(repo.create).toHaveBeenCalledWith(COMPANY_ID, expect.objectContaining({
        email: 'supplier@example.com',
      }))
    })

    it('sets isActive to true by default', async () => {
      repo.create.mockResolvedValue({ id: 'sup-new' })

      await service.create(COMPANY_ID, ADMIN_USER, {
        name: 'New Supplier',
      })

      expect(repo.create).toHaveBeenCalledWith(COMPANY_ID, expect.objectContaining({
        isActive: true,
      }))
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.create(null, ADMIN_USER, {
        name: 'New Supplier',
      })).rejects.toThrow(ForbiddenError)
    })

    it('throws ForbiddenError when user is collaborator', async () => {
      await expect(service.create(COMPANY_ID, COLLABORATOR_USER, {
        name: 'New Supplier',
      })).rejects.toThrow(ForbiddenError)
    })
  })

  describe('update', () => {
    it('updates existing supplier', async () => {
      repo.findById.mockResolvedValue({
        id: 'sup-1',
        company_id: COMPANY_ID,
        name: 'Old Name',
      })
      repo.update.mockResolvedValue({
        id: 'sup-1',
        name: 'New Name',
      })

      const result = await service.update(COMPANY_ID, ADMIN_USER, 'sup-1', {
        name: 'New Name',
      })

      expect(result.name).toBe('New Name')
      expect(repo.update).toHaveBeenCalledWith(COMPANY_ID, 'sup-1', expect.objectContaining({
        name: 'New Name',
      }))
    })

    it('throws NotFoundError when supplier does not exist', async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.update(COMPANY_ID, ADMIN_USER, 'nonexistent', { name: 'New' })).rejects.toThrow(NotFoundError)
    })

    it('throws ValidationError when name is missing', async () => {
      repo.findById.mockResolvedValue({ id: 'sup-1' })

      await expect(service.update(COMPANY_ID, ADMIN_USER, 'sup-1', { email: 'new@example.com' })).rejects.toThrow(ValidationError)
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.update(null, ADMIN_USER, 'sup-1', { name: 'New' })).rejects.toThrow(ForbiddenError)
    })

    it('throws ForbiddenError when user is collaborator', async () => {
      await expect(service.update(COMPANY_ID, COLLABORATOR_USER, 'sup-1', { name: 'New' })).rejects.toThrow(ForbiddenError)
    })
  })

  describe('updateStatus', () => {
    it('activates supplier', async () => {
      repo.findById.mockResolvedValue({ id: 'sup-1' })
      repo.updateStatus.mockResolvedValue({ id: 'sup-1', is_active: true })

      const result = await service.updateStatus(COMPANY_ID, ADMIN_USER, 'sup-1', { is_active: true })

      expect(result.is_active).toBe(true)
      expect(repo.updateStatus).toHaveBeenCalledWith(COMPANY_ID, 'sup-1', true)
    })

    it('deactivates supplier', async () => {
      repo.findById.mockResolvedValue({ id: 'sup-1' })
      repo.updateStatus.mockResolvedValue({ id: 'sup-1', is_active: false })

      await service.updateStatus(COMPANY_ID, ADMIN_USER, 'sup-1', { is_active: false })

      expect(repo.updateStatus).toHaveBeenCalledWith(COMPANY_ID, 'sup-1', false)
    })

    it('throws ValidationError when status is missing', async () => {
      repo.findById.mockResolvedValue({ id: 'sup-1' })

      await expect(service.updateStatus(COMPANY_ID, ADMIN_USER, 'sup-1', {})).rejects.toThrow(ValidationError)
    })

    it('throws NotFoundError when supplier does not exist', async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.updateStatus(COMPANY_ID, ADMIN_USER, 'nonexistent', { is_active: true })).rejects.toThrow(NotFoundError)
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.updateStatus(null, ADMIN_USER, 'sup-1', { is_active: true })).rejects.toThrow(ForbiddenError)
    })

    it('throws ForbiddenError when user is collaborator', async () => {
      await expect(service.updateStatus(COMPANY_ID, COLLABORATOR_USER, 'sup-1', { is_active: true })).rejects.toThrow(ForbiddenError)
    })
  })

  describe('delete', () => {
    it('soft deletes existing supplier', async () => {
      repo.findById.mockResolvedValue({ id: 'sup-1' })
      repo.softDelete.mockResolvedValue({ id: 'sup-1' })

      const result = await service.delete(COMPANY_ID, ADMIN_USER, 'sup-1')

      expect(result).toBe(true)
      expect(repo.softDelete).toHaveBeenCalledWith(COMPANY_ID, 'sup-1')
    })

    it('throws NotFoundError when supplier does not exist', async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.delete(COMPANY_ID, ADMIN_USER, 'nonexistent')).rejects.toThrow(NotFoundError)
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.delete(null, ADMIN_USER, 'sup-1')).rejects.toThrow(ForbiddenError)
    })

    it('throws ForbiddenError when user is collaborator', async () => {
      await expect(service.delete(COMPANY_ID, COLLABORATOR_USER, 'sup-1')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('Tenant isolation', () => {
    it('passes correct company_id to repository on list', async () => {
      repo.findAll.mockResolvedValue([])
      await service.list('company-b', ADMIN_USER)
      expect(repo.findAll).toHaveBeenCalledWith('company-b', {})
    })

    it('passes correct company_id to repository on create', async () => {
      repo.create.mockResolvedValue({ id: 'sup-new' })
      await service.create('company-b', ADMIN_USER, {
        name: 'New Supplier',
      })
      expect(repo.create).toHaveBeenCalledWith('company-b', expect.any(Object))
    })

    it('passes correct company_id to repository on update', async () => {
      repo.findById.mockResolvedValue({ id: 'sup-1' })
      repo.update.mockResolvedValue({ id: 'sup-1' })
      await service.update('company-b', ADMIN_USER, 'sup-1', { name: 'New Name' })
      expect(repo.update).toHaveBeenCalledWith('company-b', 'sup-1', expect.any(Object))
    })

    it('passes correct company_id to repository on delete', async () => {
      repo.findById.mockResolvedValue({ id: 'sup-1' })
      repo.softDelete.mockResolvedValue({ id: 'sup-1' })
      await service.delete('company-b', ADMIN_USER, 'sup-1')
      expect(repo.softDelete).toHaveBeenCalledWith('company-b', 'sup-1')
    })
  })
})
