const {
  isPlanActive,
  getCompanyPlanSnapshot
} = require('../services/company-plan.service');
const { asyncHandler } = require('../shared');

const requireActivePlan = asyncHandler(async (req, res, next) => {
  const companyId = req.user?.company_id;

  if (!companyId) {
    return res.status(403).json({
      error: 'Plano inativo',
      message: 'Seu periodo de teste expirou. Escolha um plano para continuar usando o sistema.'
    });
  }

  const companyPlan = await getCompanyPlanSnapshot(companyId);

  if (!companyPlan || !isPlanActive(companyPlan)) {
    const planStatus = String(companyPlan?.plan_status || '').trim().toLowerCase();
    const message = planStatus && planStatus !== 'active'
      ? 'Seu plano esta inativo. Regularize sua assinatura para continuar.'
      : 'Seu periodo de teste expirou. Escolha um plano para continuar usando o sistema.';

    return res.status(403).json({
      error: 'Plano inativo',
      message
    });
  }

  req.companyPlan = companyPlan;
  return next();
});

module.exports = requireActivePlan;
