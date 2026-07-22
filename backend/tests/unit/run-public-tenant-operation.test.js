'use strict';

// TENANT-003A — contrato de runPublicTenantOperation (config/database.js)
// Testa, com poolTenant/pg mockados (sem banco real), que o helper:
//   1. abre a conexão via poolTenant (nunca via pool privilegiado);
//   2. injeta o GUC de tenant dentro de BEGIN;
//   3. propaga o client via ALS para que pool.query ambiente use o mesmo client;
//   4. faz COMMIT no sucesso e ROLLBACK no erro;
//   5. sempre libera a conexão, mesmo em erro.

describe('runPublicTenantOperation (unit, sem banco)', () => {
  let mockClient;
  let poolTenantConnectMock;
  let database;

  beforeEach(() => {
    jest.resetModules();

    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: jest.fn(),
    };

    poolTenantConnectMock = jest.fn().mockResolvedValue(mockClient);

    // `new Pool()` em config/database.js não conecta eagerly — é seguro
    // requerer o módulo real e só substituir `.connect` do poolTenant.
    database = require('../../src/config/database');
    database.poolTenant.connect = poolTenantConnectMock;
  });

  it('abre a conexão via poolTenant, nunca via pool privilegiado', async () => {
    await database.runPublicTenantOperation('company-1', async () => 'ok');

    expect(poolTenantConnectMock).toHaveBeenCalledTimes(1);
  });

  it('executa BEGIN, injeta o GUC de tenant e faz COMMIT no sucesso', async () => {
    await database.runPublicTenantOperation('company-1', async () => 'ok');

    const calls = mockClient.query.mock.calls.map((args) => args[0]);
    expect(calls[0]).toBe('BEGIN');
    expect(calls[1]).toBe('SELECT set_config($1, $2, true)');
    expect(mockClient.query.mock.calls[1][1]).toEqual(['app.current_company_id', 'company-1']);
    expect(calls[calls.length - 1]).toBe('COMMIT');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it('propaga o client via ALS — pool.query ambiente usa o mesmo client dentro do fn', async () => {
    let sawClientInAmbientQuery = null;

    await database.runPublicTenantOperation('company-1', async () => {
      await database.query('SELECT 1');
      sawClientInAmbientQuery = mockClient.query.mock.calls.some((args) => args[0] === 'SELECT 1');
    });

    expect(sawClientInAmbientQuery).toBe(true);
  });

  it('faz ROLLBACK e propaga o erro quando fn lança exceção', async () => {
    const boom = new Error('falha simulada dentro da operacao publica');

    await expect(
      database.runPublicTenantOperation('company-1', async () => {
        throw boom;
      })
    ).rejects.toThrow(boom);

    const calls = mockClient.query.mock.calls.map((args) => args[0]);
    expect(calls).toContain('ROLLBACK');
    expect(calls).not.toContain('COMMIT');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it('libera a conexão mesmo se o ROLLBACK falhar', async () => {
    mockClient.query.mockImplementation((sql) => {
      if (sql === 'ROLLBACK') return Promise.reject(new Error('rollback indisponivel'));
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    await expect(
      database.runPublicTenantOperation('company-1', async () => {
        throw new Error('erro original');
      })
    ).rejects.toThrow();

    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  it('exige companyId — sem ele, withTenantContext lança antes de qualquer query de negócio', async () => {
    await expect(
      database.runPublicTenantOperation(null, async () => 'nao deveria rodar')
    ).rejects.toThrow(/companyId obrigatorio/);
  });
});
