const { asyncHandler, success, NotFoundError, ensureCompany } = require('../../shared');
const pool = require('../../config/database');
const { appLogger } = require('../../shared/core/logger');
const { generateDemandPrediction } = require('../../services/llm/demand-prediction.service');
const { generateChurnDetection } = require('../../services/llm/churn-detection.service');

const logger = appLogger.child({ module: 'ai-insights.controller' });

// Dedupe simples em memória: evita disparar duas gerações concorrentes do
// mesmo tipo/empresa (ex.: dois GETs quase simultâneos com cache vazio).
const inFlight = new Map();

function dedupe(key, fn) {
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

async function getActiveSuggestions(companyId) {
  const result = await pool.query(
    `SELECT id, type, title, description, data, status, source, created_at, expires_at
     FROM ai_suggestions
     WHERE company_id = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at DESC`,
    [companyId]
  );
  return result.rows;
}

async function ensureGenerated(companyId, suggestions) {
  const hasType = (type) => suggestions.some((s) => s.type === type);
  const tasks = [];

  if (!hasType('demand_prediction')) {
    tasks.push(
      dedupe(`${companyId}:demand_prediction`, () => generateDemandPrediction(companyId))
        .catch((err) => { logger.error({ err: err.message, companyId }, 'Falha ao gerar previsao de demanda'); })
    );
  }
  if (!hasType('churn_alert')) {
    tasks.push(
      dedupe(`${companyId}:churn_alert`, () => generateChurnDetection(companyId))
        .catch((err) => { logger.error({ err: err.message, companyId }, 'Falha ao gerar alerta de churn'); })
    );
  }

  if (tasks.length > 0) {
    await Promise.all(tasks);
    return getActiveSuggestions(companyId);
  }

  return suggestions;
}

const getInsights = asyncHandler(async (req, res) => {
  const companyId = req.user.company_id;
  ensureCompany(companyId);

  const cached = await getActiveSuggestions(companyId);
  const suggestions = await ensureGenerated(companyId, cached);

  return success(res, { suggestions });
}, 'Erro ao carregar insights de IA');

const refreshInsights = asyncHandler(async (req, res) => {
  const companyId = req.user.company_id;
  ensureCompany(companyId);

  // Força nova previsão: aposenta as sugestões ativas atuais e gera de novo,
  // ignorando o cache de 24h (rota já é rate-limited na camada de rota).
  await pool.query(
    `UPDATE ai_suggestions SET status = 'dismissed'
     WHERE company_id = $1 AND status = 'active' AND type IN ('demand_prediction', 'churn_alert')`,
    [companyId]
  );

  await Promise.all([
    generateDemandPrediction(companyId).catch((err) => { logger.error({ err: err.message, companyId }, 'Falha ao atualizar previsao de demanda'); }),
    generateChurnDetection(companyId).catch((err) => { logger.error({ err: err.message, companyId }, 'Falha ao atualizar alerta de churn'); })
  ]);

  const suggestions = await getActiveSuggestions(companyId);
  return success(res, { suggestions });
}, 'Erro ao atualizar insights de IA');

const dismissInsight = asyncHandler(async (req, res) => {
  const companyId = req.user.company_id;
  ensureCompany(companyId);

  const result = await pool.query(
    `UPDATE ai_suggestions SET status = 'dismissed'
     WHERE id = $1 AND company_id = $2 AND status = 'active'
     RETURNING id, type, status`,
    [req.params.id, companyId]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Sugestao de IA');
  }

  return success(res, result.rows[0]);
}, 'Erro ao dispensar insight de IA');

module.exports = { getInsights, refreshInsights, dismissInsight };
