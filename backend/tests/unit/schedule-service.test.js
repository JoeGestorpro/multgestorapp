// tests/unit/schedule-service.test.js
// Tests para ScheduleService (listScheduleBlocks, createScheduleBlock, deleteScheduleBlock)

const mockPool = {
  query: jest.fn(),
  connect: jest.fn()
};

jest.mock('../../src/config/database', () => mockPool);

const ScheduleService = require('../../src/services/schedule.service');

const COMPANY_ID = 'company-a';
const ADMIN_USER = { id: 'user-1', role: 'admin', company_id: COMPANY_ID };
const COLLABORATOR_USER = { id: 'user-2', role: 'collaborator', company_id: COMPANY_ID };

describe('ScheduleService — Unit Tests', () => {
  let service;

  beforeEach(() => {
    service = new ScheduleService();
    mockPool.query.mockReset();
    mockPool.connect.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listScheduleBlocks', () => {
    it('deve listar bloqueios da empresa', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'block-1', company_id: COMPANY_ID, collaborator_id: 'collab-1', block_date: '2025-06-01', start_time: '09:00', end_time: '12:00', reason: 'Folga' }]
      });

      const result = await service.listScheduleBlocks(COMPANY_ID, ADMIN_USER, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('block-1');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM barber_booking_blocks'),
        [COMPANY_ID]
      );
    });

    it('deve lancar erro quando companyId ausente', async () => {
      await expect(service.listScheduleBlocks(null, ADMIN_USER, {}))
        .rejects
        .toThrow('Usuario sem empresa vinculada');
    });
  });

  describe('createScheduleBlock', () => {
    it('deve criar bloqueio com sucesso', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'block-1', company_id: COMPANY_ID, collaborator_id: 'collab-1', starts_at: '2025-06-01T09:00:00Z', ends_at: '2025-06-01T12:00:00Z', reason: 'Folga' }]
      });

      const result = await service.createScheduleBlock(COMPANY_ID, ADMIN_USER, {
        collaboratorId: 'collab-1',
        startsAt: '2025-06-01T09:00:00Z',
        endsAt: '2025-06-01T12:00:00Z',
        reason: 'Folga'
      });

      expect(result.id).toBe('block-1');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO barber_booking_blocks'),
        [COMPANY_ID, 'collab-1', '2025-06-01T09:00:00Z', '2025-06-01T12:00:00Z', 'Folga']
      );
    });

    it('deve rejeitar usuario sem permissao de caixa', async () => {
      await expect(service.createScheduleBlock(COMPANY_ID, COLLABORATOR_USER, {}))
        .rejects
        .toThrow('Apenas usuarios autorizados podem operar o caixa');
    });

    it('deve rejeitar quando companyId ausente', async () => {
      await expect(service.createScheduleBlock(null, ADMIN_USER, {}))
        .rejects
        .toThrow('Usuario sem empresa vinculada');
    });
  });

  describe('deleteScheduleBlock', () => {
    it('deve remover bloqueio pelo ID', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await service.deleteScheduleBlock(COMPANY_ID, ADMIN_USER, 'block-1');

      expect(result).toBe(true);
    });

    it('deve lancar erro 404 quando bloqueio nao existe', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      await expect(service.deleteScheduleBlock(COMPANY_ID, ADMIN_USER, 'block-1'))
        .rejects
        .toThrow('Bloqueio nao encontrado');
    });
  });
});
