const PLAN_FEATURES = {
  trial: {
    collaborators: false,
    advanced_reports: false,
    financial_dashboard: false,
    extra_permissions: false,
    advanced_schedule: false,
    future_modules: false
  },
  free: {
    collaborators: false,
    advanced_reports: false,
    financial_dashboard: false,
    extra_permissions: false,
    advanced_schedule: false,
    future_modules: false
  },
  essencial: {
    collaborators: true,
    advanced_reports: false,
    financial_dashboard: true,
    extra_permissions: false,
    advanced_schedule: true,
    future_modules: false
  },
  profissional: {
    collaborators: true,
    advanced_reports: true,
    financial_dashboard: true,
    extra_permissions: true,
    advanced_schedule: true,
    future_modules: true
  },
  premium: {
    collaborators: true,
    advanced_reports: true,
    financial_dashboard: true,
    extra_permissions: true,
    advanced_schedule: true,
    future_modules: true
  }
};

const FEATURE_MIN_PLAN = {
  collaborators: 'Essencial',
  advanced_reports: 'Profissional',
  financial_dashboard: 'Essencial',
  extra_permissions: 'Profissional',
  advanced_schedule: 'Essencial',
  future_modules: 'Profissional'
};

function normalizeFeaturePlanType(planType) {
  const aliases = {
    gratuito: 'free',
    gratis: 'free',
    basic: 'essencial',
    basico: 'essencial',
    pro: 'profissional'
  };

  const normalized = String(planType || 'trial').trim().toLowerCase();
  const resolved = aliases[normalized] || normalized;
  return PLAN_FEATURES[resolved] ? resolved : 'trial';
}

function canUsePlanFeature(planType, featureKey) {
  return Boolean(PLAN_FEATURES[normalizeFeaturePlanType(planType)]?.[featureKey]);
}

function getLockedFeatureMessage(featureKey) {
  const minimumPlan = FEATURE_MIN_PLAN[featureKey] || 'Essencial';
  return `Este recurso não está disponível no seu plano atual. Faça upgrade para o plano ${minimumPlan} para liberar.`;
}

module.exports = {
  PLAN_FEATURES,
  FEATURE_MIN_PLAN,
  normalizeFeaturePlanType,
  canUsePlanFeature,
  getLockedFeatureMessage
};
