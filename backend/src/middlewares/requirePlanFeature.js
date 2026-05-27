const {
  canUsePlanFeature,
  getLockedFeatureMessage
} = require('../utils/planFeatures');
const { getCompanyPlanSnapshot } = require('../services/company-plan.service');
const { asyncHandler } = require('../shared');

function requirePlanFeature(featureKey) {
  return asyncHandler(async (req, res, next) => {
    const companyId = req.user?.company_id;

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
  });
}

module.exports = requirePlanFeature;
