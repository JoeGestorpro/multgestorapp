'use strict';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require('../../src/config/database');
const LoyaltyService = require('../../src/services/loyalty.service');

describe('LoyaltyService', () => {
  let service;

  beforeEach(() => {
    service = new LoyaltyService();
    jest.clearAllMocks();
  });

  describe('getProgram', () => {
    it('retorna programa configurado', async () => {
      pool.query.mockResolvedValue({ rows: [{ company_id: 'c-1', type: 'points', points_per_currency: 10, min_redeem_points: 50, points_per_real: 5, is_active: true, updated_at: new Date() }], rowCount: 1 });

      const result = await service.getProgram('c-1');
      expect(result.points_per_currency).toBe(10);
      expect(result.is_active).toBe(true);
    });

    it('retorna defaults se nao configurado', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await service.getProgram('c-1');
      expect(result.is_active).toBe(false);
      expect(result.points_per_real).toBe(1);
    });
  });

  describe('upsertProgram', () => {
    it('insere ou atualiza programa', async () => {
      pool.query.mockResolvedValue({ rows: [{ company_id: 'c-1', is_active: true }], rowCount: 1 });

      const result = await service.upsertProgram('c-1', { is_active: true });
      expect(result.is_active).toBe(true);
    });
  });

  describe('getCustomerLoyalty', () => {
    it('retorna dados de fidelidade do cliente', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ id: 'cl-1', company_id: 'c-1', customer_id: 'cust-1', points_balance: 150, lifetime_points: 200, lifetime_redeemed: 50, program_active: true, min_redeem_points: 10 }], rowCount: 1 });

      const result = await service.getCustomerLoyalty('c-1', 'cust-1');
      expect(result.points_balance).toBe(150);
      expect(result.min_redeem_points).toBe(10);
    });
  });

  describe('earnPoints', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);
    });

    it('acumula pontos baseado no programa', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ company_id: 'c-1', is_active: true, points_per_real: 10 }], rowCount: 1 });

      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // INSERT customer_loyalty ON CONFLICT
        .mockResolvedValueOnce({ rows: [{ id: 'cl-1', points_balance: 0 }], rowCount: 1 })  // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // UPDATE points_balance
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // INSERT loyalty_transactions
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const result = await service.earnPoints('c-1', 'cust-1', { amount: 50 });
      expect(result.points_earned).toBe(500);
      expect(result.balance).toBe(500);
    });

    it('retorna 0 se programa inativo', async () => {
      pool.query.mockResolvedValue({ rows: [{ company_id: 'c-1', is_active: false }], rowCount: 1 });

      const result = await service.earnPoints('c-1', 'cust-1', { amount: 50 });
      expect(result.points_earned).toBe(0);
    });
  });

  describe('redeemPoints', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);
    });

    it('resgata pontos com sucesso', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ company_id: 'c-1', is_active: true, min_redeem_points: 10, points_per_real: 1 }], rowCount: 1 });

      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'cl-1', points_balance: 200 }], rowCount: 1 })  // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // UPDATE points_balance
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // INSERT loyalty_transactions
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const result = await service.redeemPoints('c-1', 'cust-1', 100);
      expect(result.points_redeemed).toBe(100);
      expect(result.balance).toBe(100);
    });

    it('rejeita pontos abaixo do minimo', async () => {
      pool.query.mockResolvedValue({ rows: [{ company_id: 'c-1', is_active: true, min_redeem_points: 100 }], rowCount: 1 });

      await expect(service.redeemPoints('c-1', 'cust-1', 50)).rejects.toThrow('Mínimo para resgate é 100 pontos');
    });
  });

  describe('listTransactions', () => {
    it('retorna extrato do cliente', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 't-1', points: 100, type: 'earned' }], rowCount: 1 });

      const result = await service.listTransactions('c-1', 'cust-1');
      expect(result).toHaveLength(1);
    });
  });
});
