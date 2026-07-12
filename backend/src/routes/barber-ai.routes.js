const express = require('express');
const aiInsightsController = require('../controllers/barber/ai-insights');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireBarberAdminAuth } = require('../middlewares/auth.middleware');
const requireCompany = require('../middlewares/requireCompany');
const requireBarberModule = require('../middlewares/requireBarberModule');
const createRateLimit = require('../middlewares/rate-limit.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(requireBarberAdminAuth);
router.use(requireCompany);
router.use(requireBarberModule);

function tenantKey(prefix) {
  return (req) => `${prefix}:${req.user?.company_id || req.ip}`;
}

// Proteção de rotas (regra do projeto — toda rota exposta responde: abuso? custo? rate limit? limite por tenant?):
// - GET /insights: leitura autenticada; se o cache (24h) estiver vazio, dispara geração (LLM). Rate limit por
//   tenant evita que reloads em rajada multipliquem chamadas de LLM antes do INSERT do cache concluir.
const aiInsightsReadRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  keyGenerator: tenantKey('ai-insights-read')
});

// - POST /insights/:id/dismiss: escrita simples (1 UPDATE), sem custo de LLM, mas ainda assim limitada por tenant
//   contra flood acidental de toggles.
const aiInsightsDismissRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator: tenantKey('ai-insights-dismiss')
});

// - GET /insights/refresh: SEMPRE chama a LLM (ignora cache) — maior vetor de custo/abuso da IA operacional.
//   Teto baixo por tenant; o LlmService tem seus próprios wrappers de orçamento/rate limit por sessão, mas
//   este limite é a primeira barreira antes mesmo de chegar ao LlmService.
const aiInsightsRefreshRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: tenantKey('ai-insights-refresh')
});

router.get('/insights', aiInsightsReadRateLimit, aiInsightsController.getInsights);
router.get('/insights/refresh', aiInsightsRefreshRateLimit, aiInsightsController.refreshInsights);
router.post('/insights/:id/dismiss', aiInsightsDismissRateLimit, aiInsightsController.dismissInsight);

module.exports = router;
