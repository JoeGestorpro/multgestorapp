// tests/unit/collaborator-service.test.js
// BLOCO 2F — Service-Level Tests: CollaboratorService
// Tests service behavior with mocked repository and pool

const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('../../src/shared/core/errors')
const { createCollaboratorTransactionMock } = require('../helpers/transaction-mock')

// Create transaction mock before requiring service
// Note: variables must be prefixed with 'mock' for jest.mock to access them
const mockTransaction = createCollaboratorTransactionMock()
const mockPool = mockTransaction.poolMock
const mockClient = mockTransaction.clientMock
const mockTransactionHelpers = mockTransaction.helpers

jest.mock('../../src/config/database', () => mockPool)

const CollaboratorService = require('../../src/services/collaborator.service')
const dbModule = require('../../src/config/database')

function createMockRepository() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIdWithUser: jest.fn(),
    findByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    updateAvatar: jest.fn(),
    softDelete: jest.fn(),
    countActive: jest.fn(),
  }
}

function setupMockClient(overrides = {}) {
  const { poolMock: newPoolMock, clientMock: newClientMock, helpers: newHelpers } =
    createCollaboratorTransactionMock(overrides)
  dbModule.connect.mockReturnValue(newClientMock)
  return { clientMock: newClientMock, helpers: newHelpers }
}

const ADMIN_USER = { id: 'user-1', role: 'admin', company_id: 'company-a' }
const COLLABORATOR_USER = { id: 'user-2', role: 'collaborator', company_id: 'company-a' }
const COMPANY_ID = 'company-a'

describe('CollaboratorService — Unit Tests', () => {
  let service
  let repo

  beforeEach(() => {
    repo = createMockRepository()
    service = new CollaboratorService(repo)
    jest.clearAllMocks()

    // Default mock behavior
    dbModule.query.mockResolvedValue({ rows: [], rowCount: 0 })
    dbModule.connect.mockReturnValue(mockClient)
  })

  describe('list', () => {
    it('returns collaborators for valid admin', async () => {
      const collaborators = [
        { id: 'col-1', nickname: 'Collab 1', company_id: COMPANY_ID },
        { id: 'col-2', nickname: 'Collab 2', company_id: COMPANY_ID },
      ]
      repo.findAll.mockResolvedValue(collaborators)

      const result = await service.list(COMPANY_ID, ADMIN_USER)

      expect(result).toHaveLength(2)
      expect(repo.findAll).toHaveBeenCalledWith(COMPANY_ID)
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
    it('returns collaborator when found', async () => {
      const collaborator = { id: 'col-1', nickname: 'Collab 1', company_id: COMPANY_ID }
      repo.findByIdWithUser.mockResolvedValue(collaborator)

      const result = await service.getById(COMPANY_ID, ADMIN_USER, 'col-1')

      expect(result).toBeDefined()
      expect(repo.findByIdWithUser).toHaveBeenCalledWith(COMPANY_ID, 'col-1')
    })

    it('throws NotFoundError when collaborator not found', async () => {
      repo.findByIdWithUser.mockResolvedValue(null)

      await expect(service.getById(COMPANY_ID, ADMIN_USER, 'nonexistent')).rejects.toThrow(NotFoundError)
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.getById(null, ADMIN_USER, 'col-1')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('getByUserId', () => {
    it('returns collaborator when found', async () => {
      const collaborator = { id: 'col-1', user_id: 'user-1' }
      repo.findByUserId.mockResolvedValue(collaborator)

      const result = await service.getByUserId(COMPANY_ID, 'user-1')

      expect(result).toEqual(collaborator)
      expect(repo.findByUserId).toHaveBeenCalledWith(COMPANY_ID, 'user-1')
    })

    it('returns null when not found', async () => {
      repo.findByUserId.mockResolvedValue(null)

      const result = await service.getByUserId(COMPANY_ID, 'nonexistent')

      expect(result).toBeNull()
    })

    it('does not check user role', async () => {
      repo.findByUserId.mockResolvedValue({ id: 'col-1' })

      const result = await service.getByUserId(COMPANY_ID, 'user-1')
      expect(result).toBeDefined()
    })
  })

  describe('create', () => {
    it('creates collaborator with valid data', async () => {
      const { clientMock: mockClient } = setupMockClient()

      const result = await service.create(COMPANY_ID, ADMIN_USER, {
        name: 'New Collab',
        email: 'collab@example.com',
        password: 'password123',
      })

      expect(result).toBeDefined()
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })

    it('throws ConflictError when email already exists', async () => {
      const { clientMock: mockClient } = setupMockClient({
        emailCheck: { rows: [{ id: 'user-existing' }], rowCount: 1 },
      })

      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        name: 'New Collab',
        email: 'existing@example.com',
        password: 'password123',
      })).rejects.toThrow(ConflictError)
    })

    it('throws ValidationError when name is missing', async () => {
      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        email: 'collab@example.com',
        password: 'password123',
      })).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError when email is missing', async () => {
      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        name: 'New Collab',
        password: 'password123',
      })).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError when password is too short', async () => {
      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        name: 'New Collab',
        email: 'collab@example.com',
        password: '12345',
      })).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError when email is invalid', async () => {
      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        name: 'New Collab',
        email: 'invalid-email',
        password: 'password123',
      })).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError when commission rate is negative', async () => {
      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        name: 'New Collab',
        email: 'collab@example.com',
        password: 'password123',
        commission_rate: -5,
      })).rejects.toThrow(ValidationError)
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.create(null, ADMIN_USER, {
        name: 'New Collab',
        email: 'collab@example.com',
        password: 'password123',
      })).rejects.toThrow(ForbiddenError)
    })

    it('throws ForbiddenError when user is collaborator', async () => {
      await expect(service.create(COMPANY_ID, COLLABORATOR_USER, {
        name: 'New Collab',
        email: 'collab@example.com',
        password: 'password123',
      })).rejects.toThrow(ForbiddenError)
    })

    it('rolls back on error', async () => {
      // Create a fresh mock for this test to ensure failOnQuery works
      const freshMock = createCollaboratorTransactionMock({
        failOnQuery: 2, // falha na terceira query (após BEGIN e email check)
      })
      dbModule.connect.mockReturnValue(freshMock.clientMock)

      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        name: 'New Collab',
        email: 'collab@example.com',
        password: 'password123',
      })).rejects.toThrow('Database error')

      expect(freshMock.clientMock.query).toHaveBeenCalledWith('ROLLBACK')
    })
  })

  describe('update', () => {
    it('updates existing collaborator', async () => {
      repo.findByIdWithUser.mockResolvedValue({
        id: 'col-1',
        user_id: 'user-1',
        company_id: COMPANY_ID,
        nickname: 'Old Name',
      })
      const { clientMock: mockClient } = setupMockClient()

      const result = await service.update(COMPANY_ID, ADMIN_USER, 'col-1', {
        name: 'New Name',
        email: 'collab@example.com',
        commission_rate: 15,
      })

      expect(result).toBeDefined()
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    })

    it('throws NotFoundError when collaborator does not exist', async () => {
      repo.findByIdWithUser.mockResolvedValue(null)

      await expect(service.update(COMPANY_ID, ADMIN_USER, 'nonexistent', { name: 'New' })).rejects.toThrow(NotFoundError)
    })

    it('allows update without password', async () => {
      repo.findByIdWithUser.mockResolvedValue({
        id: 'col-1',
        user_id: 'user-1',
        company_id: COMPANY_ID,
      })
      const { clientMock: mockClient } = setupMockClient()

      const result = await service.update(COMPANY_ID, ADMIN_USER, 'col-1', {
        name: 'New Name',
        email: 'collab@example.com',
      })

      expect(result).toBeDefined()
    })

    it('throws ConflictError when email is duplicated', async () => {
      repo.findByIdWithUser.mockResolvedValue({
        id: 'col-1',
        user_id: 'user-1',
        company_id: COMPANY_ID,
      })
      const { clientMock: mockClient } = setupMockClient({
        duplicateEmailCheck: { rows: [{ id: 'user-other' }], rowCount: 1 },
      })

      await expect(service.update(COMPANY_ID, ADMIN_USER, 'col-1', {
        name: 'New Name',
        email: 'other@example.com',
      })).rejects.toThrow(ConflictError)
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.update(null, ADMIN_USER, 'col-1', { name: 'New' })).rejects.toThrow(ForbiddenError)
    })
  })

  describe('updateStatus', () => {
    it('activates collaborator', async () => {
      repo.findById.mockResolvedValue({ id: 'col-1', user_id: 'user-1' })
      repo.updateStatus.mockResolvedValue({ id: 'col-1', is_active: true })
      const { clientMock: mockClient } = setupMockClient()

      const result = await service.updateStatus(COMPANY_ID, ADMIN_USER, 'col-1', { is_active: true })

      expect(result.is_active).toBe(true)
      expect(repo.updateStatus).toHaveBeenCalledWith(COMPANY_ID, 'col-1', true)
    })

    it('deactivates collaborator', async () => {
      repo.findById.mockResolvedValue({ id: 'col-1', user_id: 'user-1' })
      repo.updateStatus.mockResolvedValue({ id: 'col-1', is_active: false })
      const { clientMock: mockClient } = setupMockClient()

      await service.updateStatus(COMPANY_ID, ADMIN_USER, 'col-1', { is_active: false })

      expect(repo.updateStatus).toHaveBeenCalledWith(COMPANY_ID, 'col-1', false)
    })

    it('throws ValidationError when status is missing', async () => {
      repo.findById.mockResolvedValue({ id: 'col-1' })

      await expect(service.updateStatus(COMPANY_ID, ADMIN_USER, 'col-1', {})).rejects.toThrow(ValidationError)
    })

    it('throws NotFoundError when collaborator does not exist', async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.updateStatus(COMPANY_ID, ADMIN_USER, 'nonexistent', { is_active: true })).rejects.toThrow(NotFoundError)
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.updateStatus(null, ADMIN_USER, 'col-1', { is_active: true })).rejects.toThrow(ForbiddenError)
    })
  })

  describe('updatePermissions', () => {
    it('updates collaborator permissions', async () => {
      repo.findByIdWithUser.mockResolvedValue({
        id: 'col-1',
        user_id: 'user-1',
        company_id: COMPANY_ID,
        can_launch_sales: false,
        can_view_own_dashboard: true,
        can_view_own_reports: true,
      })
      dbModule.query.mockResolvedValue({ rows: [] })

      const result = await service.updatePermissions(COMPANY_ID, ADMIN_USER, 'col-1', {
        can_launch_sales: true,
      })

      expect(result.can_launch_sales).toBe(true)
    })

    it('throws NotFoundError when collaborator does not exist', async () => {
      repo.findByIdWithUser.mockResolvedValue(null)

      await expect(service.updatePermissions(COMPANY_ID, ADMIN_USER, 'nonexistent', { can_launch_sales: true })).rejects.toThrow(NotFoundError)
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.updatePermissions(null, ADMIN_USER, 'col-1', { can_launch_sales: true })).rejects.toThrow(ForbiddenError)
    })
  })

  describe('delete', () => {
    it('soft deletes existing collaborator', async () => {
      repo.findById.mockResolvedValue({ id: 'col-1' })
      repo.softDelete.mockResolvedValue({ id: 'col-1' })

      const result = await service.delete(COMPANY_ID, ADMIN_USER, 'col-1')

      expect(result).toBe(true)
      expect(repo.softDelete).toHaveBeenCalledWith(COMPANY_ID, 'col-1')
    })

    it('throws NotFoundError when collaborator does not exist', async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.delete(COMPANY_ID, ADMIN_USER, 'nonexistent')).rejects.toThrow(NotFoundError)
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.delete(null, ADMIN_USER, 'col-1')).rejects.toThrow(ForbiddenError)
    })

    it('throws ForbiddenError when user is collaborator', async () => {
      await expect(service.delete(COMPANY_ID, COLLABORATOR_USER, 'col-1')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('Tenant isolation', () => {
    it('passes correct company_id to repository on list', async () => {
      repo.findAll.mockResolvedValue([])
      await service.list('company-b', ADMIN_USER)
      expect(repo.findAll).toHaveBeenCalledWith('company-b')
    })

    it('passes correct company_id to repository on create', async () => {
      const { clientMock: mockClient } = setupMockClient()

      await service.create('company-b', ADMIN_USER, {
        name: 'New Collab',
        email: 'collab@example.com',
        password: 'password123',
      })

      // Verify company_id was passed to user creation query
      const createCall = mockClient.query.mock.calls.find(
        call => call[0] && call[0].includes('INSERT INTO users')
      )
      expect(createCall).toBeDefined()
      expect(createCall[1][0]).toBe('company-b')
    })

    it('passes correct company_id to repository on update', async () => {
      repo.findByIdWithUser.mockResolvedValue({
        id: 'col-1',
        user_id: 'user-1',
        company_id: 'company-b',
      })
      const { clientMock: mockClient } = setupMockClient()

      await service.update('company-b', ADMIN_USER, 'col-1', {
        name: 'New Name',
        email: 'collab@example.com',
      })

      expect(repo.findByIdWithUser).toHaveBeenCalledWith('company-b', 'col-1')
    })

    it('passes correct company_id to repository on delete', async () => {
      repo.findById.mockResolvedValue({ id: 'col-1' })
      repo.softDelete.mockResolvedValue({ id: 'col-1' })
      await service.delete('company-b', ADMIN_USER, 'col-1')
      expect(repo.softDelete).toHaveBeenCalledWith('company-b', 'col-1')
    })
  })
})
