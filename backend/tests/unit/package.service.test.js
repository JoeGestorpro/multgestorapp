'use strict';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require('../../src/config/database');
const PackageService = require('../../src/services/package.service');

describe('PackageService', () => {
  let service;

  beforeEach(() => {
    service = new PackageService();
    jest.clearAllMocks();
  });

  describe('listPackages', () => {
    it('retorna pacotes da empresa', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'p-1', name: 'Pacote Bronze' }], rowCount: 1 });

      const result = await service.listPackages('c-1');
      expect(result).toHaveLength(1);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE company_id = $1'), ['c-1']);
    });
  });

  describe('createPackage', () => {
    it('cria pacote com dados validos', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'p-1', name: 'Pacote Bronze', total_credits: 5, price: '100.00' }], rowCount: 1 });

      const result = await service.createPackage('c-1', { name: 'Pacote Bronze', total_credits: 5, price: 100 });
      expect(result.id).toBe('p-1');
    });

    it('rejeita nome vazio', async () => {
      await expect(service.createPackage('c-1', { name: '', total_credits: 5 })).rejects.toThrow('Nome do pacote é obrigatório');
    });

    it('rejeita total_credits zero', async () => {
      await expect(service.createPackage('c-1', { name: 'Pacote', total_credits: 0 })).rejects.toThrow('total_credits deve ser > 0');
    });
  });

  describe('updatePackage', () => {
    it('atualiza pacote existente', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'p-1' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 'p-1', name: 'Pacote Atualizado' }], rowCount: 1 });

      const result = await service.updatePackage('c-1', 'p-1', { name: 'Pacote Atualizado' });
      expect(result.name).toBe('Pacote Atualizado');
    });

    it('rejeita pacote inexistente', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(service.updatePackage('c-1', 'p-999', { name: 'X' })).rejects.toThrow('Pacote não encontrado');
    });
  });

  describe('deletePackage', () => {
    it('marca is_deleted = true', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'p-1' }], rowCount: 1 });

      await service.deletePackage('c-1', 'p-1');
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SET is_deleted = true'), expect.arrayContaining(['p-1']));
    });
  });

  describe('purchasePackage', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);
    });

    it('compra pacote e retorna customer_package', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'p-1', total_credits: 5, price: '100.00', validity_days: 30 }], rowCount: 1 });

      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ id: 'cp-1', package_id: 'p-1', credits_remaining: 5 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await service.purchasePackage('c-1', 'cust-1', 'p-1');
      expect(result.credits_remaining).toBe(5);
    });

    it('rejeita pacote inativo', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(service.purchasePackage('c-1', 'cust-1', 'p-999')).rejects.toThrow('Pacote não encontrado ou inativo');
    });
  });

  describe('getCustomerPackages', () => {
    it('retorna pacotes do cliente com JOIN', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'cp-1', package_name: 'Bronze', credits_remaining: 3 }], rowCount: 1 });

      const result = await service.getCustomerPackages('c-1', 'cust-1');
      expect(result).toHaveLength(1);
      expect(result[0].package_name).toBe('Bronze');
    });
  });

  describe('redeemCredit', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);
    });

    it('resgata credito e decrementa saldo', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ id: 'cp-1', package_id: 'p-1', credits_remaining: 3 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await service.redeemCredit('c-1', 'cust-1', 'svc-1');
      expect(result.credits_remaining).toBe(2);
    });

    it('rejeita quando sem creditos disponiveis', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(service.redeemCredit('c-1', 'cust-1', 'svc-1')).rejects.toThrow('Cliente não possui pacote com créditos disponíveis');
    });
  });
});
