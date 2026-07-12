'use strict';

jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

jest.mock('../../src/services/llm/demand-prediction.service', () => ({
  generateDemandPrediction: jest.fn()
}));

jest.mock('../../src/services/llm/churn-detection.service', () => ({
  generateChurnDetection: jest.fn()
}));

const pool = require('../../src/config/database');
const { generateDemandPrediction } = require('../../src/services/llm/demand-prediction.service');
const { generateChurnDetection } = require('../../src/services/llm/churn-detection.service');
const { getInsights, refreshInsights, dismissInsight } = require('../../src/controllers/barber/ai-insights');

function buildRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('ai-insights controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInsights', () => {
    it('retorna sugestoes ja cacheadas sem chamar geracao', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 's-1', type: 'demand_prediction' }, { id: 's-2', type: 'churn_alert' }] });
      const req = { user: { company_id: 'c-1' } };
      const res = buildRes();

      await getInsights(req, res, jest.fn());

      expect(generateDemandPrediction).not.toHaveBeenCalled();
      expect(generateChurnDetection).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { suggestions: expect.arrayContaining([expect.objectContaining({ id: 's-1' })]) }
      }));
    });

    it('gera os tipos ausentes quando o cache esta vazio e retorna a lista atualizada', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // cache vazio
        .mockResolvedValueOnce({ rows: [{ id: 's-1', type: 'demand_prediction' }, { id: 's-2', type: 'churn_alert' }] }); // reconsulta apos gerar
      generateDemandPrediction.mockResolvedValue({ id: 's-1', type: 'demand_prediction' });
      generateChurnDetection.mockResolvedValue({ id: 's-2', type: 'churn_alert' });

      const req = { user: { company_id: 'c-1' } };
      const res = buildRes();

      await getInsights(req, res, jest.fn());

      expect(generateDemandPrediction).toHaveBeenCalledWith('c-1');
      expect(generateChurnDetection).toHaveBeenCalledWith('c-1');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('dismissInsight', () => {
    it('marca a sugestao como dismissed quando encontrada', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 's-1', type: 'demand_prediction', status: 'dismissed' }] });
      const req = { user: { company_id: 'c-1' }, params: { id: 's-1' } };
      const res = buildRes();

      await dismissInsight(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { id: 's-1', type: 'demand_prediction', status: 'dismissed' }
      }));
    });

    it('encaminha NotFoundError (404) quando a sugestao nao existe/nao pertence a empresa', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });
      const req = { user: { company_id: 'c-1' }, params: { id: 'nao-existe' } };
      const res = buildRes();
      const next = jest.fn();

      await dismissInsight(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('refreshInsights', () => {
    it('aposenta sugestoes ativas e forca nova geracao dos dois tipos', async () => {
      pool.query
        .mockResolvedValueOnce({ rowCount: 2 }) // UPDATE dismiss
        .mockResolvedValueOnce({ rows: [{ id: 's-3', type: 'demand_prediction' }, { id: 's-4', type: 'churn_alert' }] }); // SELECT final
      generateDemandPrediction.mockResolvedValue({ id: 's-3', type: 'demand_prediction' });
      generateChurnDetection.mockResolvedValue({ id: 's-4', type: 'churn_alert' });

      const req = { user: { company_id: 'c-1' } };
      const res = buildRes();

      await refreshInsights(req, res, jest.fn());

      expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining("SET status = 'dismissed'"), ['c-1']);
      expect(generateDemandPrediction).toHaveBeenCalledWith('c-1');
      expect(generateChurnDetection).toHaveBeenCalledWith('c-1');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
