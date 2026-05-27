// tests/unit/customer-service.test.js
// Tests para CustomerService (listCustomers, getCustomerById)

const mockPool = {
  query: jest.fn()
};

jest.mock('../../src/config/database', () => mockPool);

const CustomerService = require('../../src/services/customer.service');
const { AppError } = require('../../src/shared');

const COMPANY_ID = 'company-a';
const USER = { id: 'user-1', role: 'admin', company_id: COMPANY_ID };

describe('CustomerService — Unit Tests', () => {
  let service;

  beforeEach(() => {
    service = new CustomerService();
    mockPool.query.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listCustomers', () => {
    it('deve listar clientes da empresa com paginacao', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 2,
        rows: [
          { id: 'cust-1', company_id: COMPANY_ID, name: 'Cliente A', phone: '11999990001', email: 'a@test.com', status: 'active', source: 'agendamento_online', total_count: 2 },
          { id: 'cust-2', company_id: COMPANY_ID, name: 'Cliente B', phone: '11999990002', email: 'b@test.com', status: 'active', source: 'agendamento_online', total_count: 2 }
        ]
      });

      const result = await service.listCustomers(COMPANY_ID, USER, {});

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].origin).toBe('agendamento_online');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM booking_customers'),
        expect.arrayContaining([COMPANY_ID])
      );
    });

    it('deve filtrar por termo de busca', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'cust-1', name: 'Joao Silva', total_count: 1 }]
      });

      const result = await service.listCustomers(COMPANY_ID, USER, { search: 'joao' });

      expect(result.total).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        expect.arrayContaining([expect.stringContaining('joao')])
      );
    });

    it('deve filtrar por status', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'cust-1', name: 'Cliente', status: 'blocked', total_count: 1 }]
      });

      const result = await service.listCustomers(COMPANY_ID, USER, { status: 'blocked' });

      expect(result.items[0].status).toBe('blocked');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('booking_customers.status ='),
        expect.arrayContaining(['blocked'])
      );
    });

    it('deve lancar erro 403 quando companyId ausente', async () => {
      await expect(service.listCustomers(null, USER, {}))
        .rejects
        .toThrow('Usuario sem empresa vinculada');
    });
  });

  describe('getCustomerById', () => {
    it('deve retornar cliente pelo ID', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'cust-1', company_id: COMPANY_ID, name: 'Cliente A', phone: '11999990001', email: 'a@test.com', status: 'active', source: 'whatsapp' }]
      });

      const result = await service.getCustomerById(COMPANY_ID, 'cust-1');

      expect(result.id).toBe('cust-1');
      expect(result.name).toBe('Cliente A');
      expect(result.origin).toBe('whatsapp'); // source mapeado para origin
    });

    it('deve lancar erro 404 quando cliente nao encontrado', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await expect(service.getCustomerById(COMPANY_ID, 'inexistente'))
        .rejects
        .toThrow('Cliente nao encontrado');
    });
  });
});
