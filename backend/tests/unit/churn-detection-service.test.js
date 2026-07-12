'use strict';

jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

jest.mock('../../src/services/llm/LlmService', () => ({
  llmService: { complete: jest.fn() }
}));

const pool = require('../../src/config/database');
const { llmService } = require('../../src/services/llm/LlmService');
const { generateChurnDetection } = require('../../src/services/llm/churn-detection.service');

describe('generateChurnDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna null sem gravar nada quando nao ha clientes em risco', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await generateChurnDetection('company-1');

    expect(result).toBeNull();
    expect(llmService.complete).not.toHaveBeenCalled();
  });

  it('classifica risco por dias sem visita e grava o alerta', async () => {
    const sixtyDaysAgo = new Date(Date.now() - 61 * 86_400_000).toISOString();
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 86_400_000).toISOString();

    pool.query
      .mockResolvedValueOnce({
        rows: [
          { customer_name: 'Cliente Alto Risco', customer_phone: '11999990000', last_visit: sixtyDaysAgo, total_visits: '3' },
          { customer_name: 'Cliente Baixo Risco', customer_phone: '11999990001', last_visit: thirtyFiveDaysAgo, total_visits: '5' }
        ]
      })
      .mockResolvedValueOnce({ rows: [{ id: 'sugg-2', type: 'churn_alert' }] });

    llmService.complete.mockResolvedValue({
      provider: 'mock',
      text: 'Envie uma mensagem de reengajamento para os clientes de risco alto.',
      safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
      metadata: { simulated: true }
    });

    const result = await generateChurnDetection('company-1');

    expect(llmService.complete).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'READ_ONLY', sessionId: 'company:company-1' })
    );

    const insertArgs = pool.query.mock.calls[1];
    const insertedData = JSON.parse(insertArgs[1][3]);
    expect(insertedData.byRisk.alto).toBe(1);
    expect(insertedData.byRisk.baixo).toBe(1);
    expect(result).toEqual({ id: 'sugg-2', type: 'churn_alert' });
  });
});
