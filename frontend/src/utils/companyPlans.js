export const PLAN_OPTIONS = [
  { value: 'trial', label: 'Teste gratis' },
  { value: 'free', label: 'Gratuito' },
  { value: 'essencial', label: 'Essencial' },
  { value: 'profissional', label: 'Profissional' },
  { value: 'premium', label: 'Premium' }
]

export const defaultPlanOptions = PLAN_OPTIONS

export const PLAN_LIMITS = {
  trial: {
    max_collaborators: null
  },
  free: {
    max_collaborators: 0
  },
  essencial: {
    max_collaborators: 2
  },
  profissional: {
    max_collaborators: 5
  },
  premium: {
    max_collaborators: null
  }
}

export function normalizePlanType(planType) {
  const normalized = String(planType || 'trial').trim().toLowerCase()
  const aliases = {
    gratuito: 'free',
    gratis: 'free',
    essential: 'essencial',
    essential_basic: 'essencial',
    essencial_basico: 'essencial',
    basic: 'essencial',
    pro: 'profissional'
  }
  const resolved = aliases[normalized] || normalized
  return PLAN_LIMITS[resolved] ? resolved : 'trial'
}

export function getPlanLimits(planType) {
  return PLAN_LIMITS[normalizePlanType(planType)]
}

export function getPlanLabel(planType) {
  const normalized = normalizePlanType(planType)
  return PLAN_OPTIONS.find((item) => item.value === normalized)?.label || 'Teste gratis'
}

export function getPlanCollaboratorLimitLabel(planType) {
  const limit = getPlanLimits(planType).max_collaborators

  if (limit === 0) {
    return 'Sem colaboradores inclusos'
  }

  if (limit === null) {
    return 'Colaboradores ilimitados'
  }

  return `Ate ${limit} colaboradores`
}
