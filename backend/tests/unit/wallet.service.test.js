'use strict';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require('../../src/config/database');
const WalletService = require('../../src/services/wallet.service');

describe('WalletService', () => {
  let service;

  beforeEach(() => {
    service = new WalletService();
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('retorna saldo 0 para wallet nova', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ id: 'w-1', company_id: 'c-1', balance: '0.00', currency: 'BRL', updated_at: new Date() }], rowCount: 1 });

      const result = await service.getBalance('c-1');
      expect(result).toHaveProperty('balance', 0);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('retorna saldo existente', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ id: 'w-1', company_id: 'c-1', balance: '150.00', currency: 'BRL', updated_at: new Date() }], rowCount: 1 });

      const result = await service.getBalance('c-1');
      expect(result.balance).toBe(150);
    });
  });

  describe('getTransactions', () => {
    it('retorna transacoes paginadas', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 't-1', type: 'credit', amount: '100.00', balance_before: '0.00', balance_after: '100.00' }], rowCount: 1 });

      const result = await service.getTransactions('c-1');
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('respeita limites de paginacao', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: 50 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.getTransactions('c-1', { page: 1, limit: 200 });
      expect(result.pagination.limit).toBe(100);
    });
  });

  describe('credit', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);
    });

    it('rejeita valor zero ou negativo', async () => {
      await expect(service.credit('c-1', { amount: 0 })).rejects.toThrow('Valor do crédito deve ser maior que zero');
      await expect(service.credit('c-1', { amount: -10 })).rejects.toThrow('Valor do crédito deve ser maior que zero');
    });

    it('credita saldo corretamente', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // INSERT wallet ON CONFLICT DO NOTHING
        .mockResolvedValueOnce({ rows: [{ id: 'w-1', balance: '50.00' }], rowCount: 1 })  // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // UPDATE balance
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // INSERT wallet_transactions
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const result = await service.credit('c-1', { amount: 100, gateway: 'pix', gatewayTransactionId: 'gtx-1' });
      expect(result.balance_after).toBe(150);
    });
  });

  describe('debit', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);
    });

    it('rejeita saldo insuficiente', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'w-1', balance: '10.00' }], rowCount: 1 });  // SELECT FOR UPDATE => 10 < 50

      await expect(service.debit('c-1', { amount: 50 })).rejects.toThrow('Saldo insuficiente');
    });

    it('decrementa saldo corretamente', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'w-1', balance: '100.00' }], rowCount: 1 })  // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // UPDATE balance
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // INSERT wallet_transactions
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const result = await service.debit('c-1', { amount: 30 });
      expect(result.balance_after).toBe(70);
    });
  });

  describe('createTopupRequest', () => {
    it('cria topup_request com checkout_url null se sem token', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'tr-1', amount: '50.00', status: 'pending', expires_at: new Date(), created_at: new Date() }], rowCount: 1 });

      const result = await service.createTopupRequest('c-1', { amount: 50 });
      expect(result.checkout_url).toBeNull();
      expect(result.status).toBe('pending');
    });

    it('rejeita valor invalido', async () => {
      await expect(service.createTopupRequest('c-1', { amount: 0 })).rejects.toThrow('Valor deve ser maior que zero');
    });
  });

  describe('getDepositConfig', () => {
    it('retorna defaults quando nao configurado', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const config = await service.getDepositConfig('c-1');
      expect(config.deposit_enabled).toBe(false);
      expect(config.cancel_fee_window_hours).toBe(6);
    });

    it('retorna configuracao salva', async () => {
      pool.query.mockResolvedValue({ rows: [{ company_id: 'c-1', deposit_enabled: true, deposit_type: 'fixed', deposit_value: 20, cancel_fee_enabled: true, cancel_fee_percentage: 10, cancel_fee_window_hours: 12, auto_confirm_deposit: false }], rowCount: 1 });

      const config = await service.getDepositConfig('c-1');
      expect(config.deposit_enabled).toBe(true);
      expect(config.cancel_fee_window_hours).toBe(12);
    });
  });

  describe('upsertDepositConfig', () => {
    it('insere ou atualiza configuracao', async () => {
      pool.query.mockResolvedValue({ rows: [{ company_id: 'c-1', deposit_enabled: true }], rowCount: 1 });

      const result = await service.upsertDepositConfig('c-1', { deposit_enabled: true });
      expect(result.deposit_enabled).toBe(true);
    });
  });
});
