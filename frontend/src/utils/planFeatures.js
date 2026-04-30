import { getPlanLabel, normalizePlanType } from './companyPlans'

export const PLAN_FEATURES = {
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
}

export const FEATURE_MIN_PLAN_LABEL = {
  collaborators: 'Essencial',
  advanced_reports: 'Profissional',
  financial_dashboard: 'Essencial',
  extra_permissions: 'Profissional',
  advanced_schedule: 'Essencial',
  future_modules: 'Profissional'
}

export function normalizeFeaturePlanType(planType) {
  const aliases = {
    gratuito: 'free',
    gratis: 'free',
    basic: 'essencial',
    basico: 'essencial',
    pro: 'profissional'
  }

  const normalized = String(planType || 'trial').trim().toLowerCase()
  const resolved = aliases[normalized] || normalizePlanType(normalized)
  return PLAN_FEATURES[resolved] ? resolved : 'trial'
}

export function canUseFeature(planType, featureKey) {
  return Boolean(PLAN_FEATURES[normalizeFeaturePlanType(planType)]?.[featureKey])
}

export function getPlanDisplayLabel(planType) {
  const normalizedPlanType = normalizeFeaturePlanType(planType)

  if (normalizedPlanType === 'trial') {
    return 'Teste gratis'
  }

  if (normalizedPlanType === 'free') {
    return 'Gratuito'
  }

  return getPlanLabel(planType)
}

export function getLockedFeatureMessage(featureKey) {
  const minimumPlan = FEATURE_MIN_PLAN_LABEL[featureKey] || 'Essencial'
  return `Recurso disponível a partir do plano ${minimumPlan}. Faça upgrade para liberar.`
}
