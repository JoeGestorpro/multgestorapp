'use strict';

const mockQuery = jest.fn();
const mockFn = jest.fn().mockResolvedValue('resultado');

jest.mock('../../src/config/database', () => ({
  withTenantContext: async (client, companyId, fn) => {
    if (!companyId) throw new Error('companyId obrigatorio para withTenantContext');
    await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyId)]);
    return fn(client);
  },
  query: jest.fn()
}));

const { withTenantContext } = require('../../src/config/database');

describe('withTenantContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('define app.current_company_id e executa fn', async () => {
    const client = { query: mockQuery };
    const result = await withTenantContext(client, 'comp-123', mockFn);

    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT set_config($1, $2, true)',
      ['app.current_company_id', 'comp-123']
    );
    expect(mockFn).toHaveBeenCalledWith(client);
    expect(result).toBe('resultado');
  });

  it('lanca erro quando companyId nao fornecido', async () => {
    const client = { query: mockQuery };
    await expect(withTenantContext(client, null, mockFn))
      .rejects.toThrow('companyId obrigatorio');
    expect(mockFn).not.toHaveBeenCalled();
  });
});
