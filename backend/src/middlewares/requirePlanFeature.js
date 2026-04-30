const {
  canUsePlanFeature,
  getLockedFeatureMessage
} = require('../utils/planFeatures');
const { getCompanyPlanSnapshot } = require('../services/company-plan.service');

function requirePlanFeature(featureKey) {
  return async function planFeatureMiddleware(req, res, next) {
    try {
      const companyId = req.user?.company_id;

      // REGRA MULTI-TENANT: sempre usar company_id.
      if (!companyId) {
        return res.status(403).json({
          success: false,
          error: 'Este recurso não está disponível no seu plano atual.'
        });
      }

      const companyPlan = await getCompanyPlanSnapshot(companyId);
      const planType = companyPlan?.plan_type || 'trial';

      if (!canUsePlanFeature(planType, featureKey)) {
        return res.status(403).json({
          success: false,
          error: getLockedFeatureMessage(featureKey)
        });
      }

      return next();
    } catch (error) {
      console.error('Erro ao validar recurso por plano:', error);
      return res.status(500).json({
        success: false,
        error: 'Não foi possível validar o plano atual.'
      });
    }
  };
}

module.exports = requirePlanFeature;
