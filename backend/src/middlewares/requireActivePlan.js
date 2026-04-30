const {
  isPlanActive,
  getCompanyPlanSnapshot
} = require('../services/company-plan.service');

async function requireActivePlan(req, res, next) {
  try {
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(403).json({
        error: 'Plano inativo',
        message: 'Seu perÃ­odo de teste expirou. Escolha um plano para continuar usando o sistema.'
      });
    }

    const companyPlan = await getCompanyPlanSnapshot(companyId);

    if (!companyPlan || !isPlanActive(companyPlan)) {
      const planStatus = String(companyPlan?.plan_status || '').trim().toLowerCase();
      const message = planStatus && planStatus !== 'active'
        ? 'Seu plano estÃ¡ inativo. Regularize sua assinatura para continuar.'
        : 'Seu perÃ­odo de teste expirou. Escolha um plano para continuar usando o sistema.';

      return res.status(403).json({
        error: 'Plano inativo',
        message
      });
    }

    req.companyPlan = companyPlan;
    return next();
  } catch (error) {
    console.error('Erro ao validar plano ativo:', error);
    return res.status(500).json({
      error: 'Erro ao validar plano',
      message: 'NÃ£o foi possÃ­vel validar o plano ativo da empresa.'
    });
  }
}

module.exports = requireActivePlan;
