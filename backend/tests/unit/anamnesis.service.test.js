'use strict';

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require('../../src/config/database');
const AnamnesisService = require('../../src/services/anamnesis.service');

describe('AnamnesisService', () => {
  let service;

  beforeEach(() => {
    service = new AnamnesisService();
    jest.clearAllMocks();
  });

  describe('listTemplates', () => {
    it('retorna templates da empresa', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 't-1', name: 'Template Anamnese' }], rowCount: 1 });

      const result = await service.listTemplates('c-1');
      expect(result).toHaveLength(1);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE company_id = $1'), ['c-1']);
    });
  });

  describe('createTemplate', () => {
    it('cria template com dados validos', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 't-1', name: 'Template', questions: [] }], rowCount: 1 });

      const result = await service.createTemplate('c-1', { name: 'Template', questions: [] });
      expect(result.name).toBe('Template');
    });

    it('rejeita nome vazio', async () => {
      await expect(service.createTemplate('c-1', { name: '', questions: [] })).rejects.toThrow('Nome do template é obrigatório');
    });

    it('rejeita questions nao array', async () => {
      await expect(service.createTemplate('c-1', { name: 'Template', questions: 'nope' })).rejects.toThrow('questions deve ser um array');
    });
  });

  describe('updateTemplate', () => {
    it('atualiza template existente', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 't-1', name: 'Atualizado' }], rowCount: 1 });

      const result = await service.updateTemplate('c-1', 't-1', { name: 'Atualizado' });
      expect(result.name).toBe('Atualizado');
    });

    it('rejeita template inexistente', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(service.updateTemplate('c-1', 't-999', { name: 'X' })).rejects.toThrow('Template não encontrado');
    });
  });

  describe('deleteTemplate', () => {
    it('marca is_deleted', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 't-1' }], rowCount: 1 });

      await service.deleteTemplate('c-1', 't-1');
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SET is_deleted = true'), expect.arrayContaining(['t-1']));
    });

    it('rejeita template inexistente', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(service.deleteTemplate('c-1', 't-999')).rejects.toThrow('Template não encontrado');
    });
  });

  describe('getResponse', () => {
    it('retorna response do cliente', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 'r-1', customer_id: 'cust-1', responses: {} }], rowCount: 1 });

      const result = await service.getResponse('c-1', 'cust-1');
      expect(result.customer_id).toBe('cust-1');
    });

    it('retorna null se nao existe', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await service.getResponse('c-1', 'cust-1');
      expect(result).toBeNull();
    });
  });

  describe('upsertResponse', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);
    });

    it('rejeita responses invalido', async () => {
      await expect(service.upsertResponse('c-1', 'cust-1', { responses: 'not-an-object' })).rejects.toThrow('responses deve ser um objeto');
    });

    it('upsert com consentimento', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'r-1', company_id: 'c-1', customer_id: 'cust-1', consent_granted: true }], rowCount: 1 })  // INSERT ... ON CONFLICT
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const result = await service.upsertResponse('c-1', 'cust-1', { responses: { alergia: 'nenhuma' }, consent_granted: true });
      expect(result.consent_granted).toBe(true);
    });

    it('grava consent_ip quando consent_granted=true', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'r-1', consent_ip: '192.168.1.1', consent_granted: true }], rowCount: 1 })  // INSERT
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const result = await service.upsertResponse('c-1', 'cust-1', {
        responses: { alergia: 'nenhuma' },
        consent_granted: true,
        consent_ip: '192.168.1.1'
      });
      expect(result.consent_ip).toBe('192.168.1.1');
    });

    it('consent_ip é null quando consent_granted=false', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'r-1', consent_ip: null, consent_granted: false }], rowCount: 1 })  // INSERT
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const result = await service.upsertResponse('c-1', 'cust-1', {
        responses: { alergia: 'nenhuma' },
        consent_granted: false,
        consent_ip: '192.168.1.1'
      });
      expect(result.consent_ip).toBeNull();
    });
  });

  describe('exportData', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);
    });

    it('exporta dados existentes', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'r-1', template_name: 'Template', responses: { alergia: 'nenhuma' }, consent_granted: true, consent_granted_at: null }], rowCount: 1 });

      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // UPDATE lgpd flags
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const result = await service.exportData('c-1', 'cust-1');
      expect(result.exported_at).toBeDefined();
      expect(result.customer_id).toBe('cust-1');
    });

    it('rejeita se sem dados', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(service.exportData('c-1', 'cust-1')).rejects.toThrow('Cliente não possui dados de anamnese');
    });
  });

  describe('requestDelete', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(mockClient);
    });

    it('anonimiza dados com sucesso', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'r-1' }], rowCount: 1 })  // SELECT response
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // UPDATE anonimizacao
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const result = await service.requestDelete('c-1', 'cust-1');
      expect(result.message).toContain('anonimizados');
    });

    it('rejeita se sem dados', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // SELECT response => rowCount === 0

      await expect(service.requestDelete('c-1', 'cust-999')).rejects.toThrow('Cliente não possui dados de anamnese');
    });
  });
});
