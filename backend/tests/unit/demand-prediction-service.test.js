'use strict';

jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

jest.mock('../../src/services/llm/LlmService', () => ({
  llmService: { complete: jest.fn() }
}));

const pool = require('../../src/config/database');
const { llmService } = require('../../src/services/llm/LlmService');
const { generateDemandPrediction } = require('../../src/services/llm/demand-prediction.service');

describe('generateDemandPrediction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna null sem gravar nada quando nao ha agendamentos recentes', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await generateDemandPrediction('company-1');

    expect(result).toBeNull();
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(llmService.complete).not.toHaveBeenCalled();
  });

  it('agrega agendamentos, chama a LLM em modo READ_ONLY e grava a sugestao', async () => {
    // Todos numa segunda-feira as 10h (weekday=1, hour=10) para garantir o pico.
    const monday10am = [
      '2026-06-01T10:00:00.000Z',
      '2026-06-08T10:00:00.000Z',
      '2026-06-15T10:00:00.000Z'
    ].map((starts_at) => ({ starts_at }));

    pool.query
      .mockResolvedValueOnce({ rows: monday10am }) // SELECT agendamentos
      .mockResolvedValueOnce({ rows: [{ id: 'sugg-1', type: 'demand_prediction' }] }); // INSERT

    llmService.complete.mockResolvedValue({
      provider: 'mock',
      text: 'Segunda-feira as 10h e o pico — reforce a equipe.',
      safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
      metadata: { simulated: true }
    });

    const result = await generateDemandPrediction('company-1');

    expect(llmService.complete).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'READ_ONLY', sessionId: 'company:company-1' })
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO ai_suggestions'),
      expect.arrayContaining(['company-1', expect.any(String), expect.any(String), expect.any(String), 'rule-based'])
    );
    expect(result).toEqual({ id: 'sugg-1', type: 'demand_prediction' });
  });

  it('rejeita sem company_id', async () => {
    await expect(generateDemandPrediction(undefined)).rejects.toThrow();
  });
});
