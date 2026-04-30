const pool = require('../config/database');
const { PLAN_FEATURES, normalizeFeaturePlanType } = require('../utils/planFeatures');

const PLAN_DEFINITIONS = {
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
};

async function columnExists(tableName, columnName) {
  const result = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [tableName, columnName]
  );

  return result.rowCount > 0;
}

function normalizePlanType(value) {
  const aliases = {
    'teste gratis': 'trial',
    'teste grátis': 'trial',
    gratuito: 'free',
    gratis: 'free',
    essential: 'essencial',
    essential_basic: 'essencial',
    essencial_basico: 'essencial',
    basic: 'essencial',
    pro: 'profissional'
  };

  const normalized = String(value || 'trial').trim().toLowerCase();
  const resolved = aliases[normalized] || normalized;
  return Object.prototype.hasOwnProperty.call(PLAN_DEFINITIONS, resolved) ? resolved : 'trial';
}

function getPlanLimits(planType) {
  const normalizedPlanType = normalizePlanType(planType);
  return PLAN_DEFINITIONS[normalizedPlanType];
}

function resolveMaxCollaborators(planType) {
  return getPlanLimits(planType).max_collaborators;
}

function isPaidPlanType(planType) {
  return !['trial', 'free'].includes(normalizePlanType(planType));
}

function isDateExpired(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) && Date.now() > date.getTime();
}

function isPlanActive(client) {
  const planType = normalizePlanType(client?.plan_type);
  const planStatus = String(client?.plan_status || 'active').trim().toLowerCase();

  if (planType === 'trial' && !['active', 'trial'].includes(planStatus)) {
    return false;
  }

  if (planType !== 'trial' && planStatus !== 'active') {
    return false;
  }

  if (planType === 'free') {
    return false;
  }

  if (planType === 'trial') {
    const trialEndsAt = client?.trial_ends_at ? new Date(client.trial_ends_at) : null;

    if (trialEndsAt && Number.isFinite(trialEndsAt.getTime()) && Date.now() > trialEndsAt.getTime()) {
      return false;
    }
  }

  return true;
}

function getPlanFeatures(planType) {
  return PLAN_FEATURES[normalizeFeaturePlanType(planType)] || PLAN_FEATURES.trial;
}

async function getCompanyPlanSchemaConfig() {
  const [
    hasPlanType,
    hasPlanStatus,
    hasTrialEndsAt,
    hasMaxCollaborators,
    hasPlanNameOnSubscriptions,
    hasNextDueDateOnSubscriptions,
    hasCurrentPeriodStartOnSubscriptions,
    hasCurrentPeriodEndOnSubscriptions,
    hasGatewayOnSubscriptions,
    hasUpdatedAtOnSubscriptions,
    hasTrialEndsAtOnSubscriptions
  ] = await Promise.all([
    columnExists('companies', 'plan_type'),
    columnExists('companies', 'plan_status'),
    columnExists('companies', 'trial_ends_at'),
    columnExists('companies', 'max_collaborators'),
    columnExists('subscriptions', 'plan_name'),
    columnExists('subscriptions', 'next_due_date'),
    columnExists('subscriptions', 'current_period_start'),
    columnExists('subscriptions', 'current_period_end'),
    columnExists('subscriptions', 'gateway'),
    columnExists('subscriptions', 'updated_at'),
    columnExists('subscriptions', 'trial_ends_at')
  ]);

  return {
    hasPlanType,
    hasPlanStatus,
    hasTrialEndsAt,
    hasMaxCollaborators,
    hasPlanNameOnSubscriptions,
    hasNextDueDateOnSubscriptions,
    hasCurrentPeriodStartOnSubscriptions,
    hasCurrentPeriodEndOnSubscriptions,
    hasGatewayOnSubscriptions,
    hasUpdatedAtOnSubscriptions,
    hasTrialEndsAtOnSubscriptions
  };
}

function buildCompanyPlanSnapshot(company) {
  const planType = normalizePlanType(company.plan_type || 'trial');
  const planStatus = String(company.plan_status || (planType === 'trial' ? 'trial' : (planType === 'free' ? 'free' : 'active')))
    .trim()
    .toLowerCase();

  return {
    id: company.id,
    company_id: company.id,
    plan_type: planType,
    plan_status: planStatus,
    trial_ends_at: company.trial_ends_at || null,
    current_period_start: null,
    current_period_end: null,
    next_due_date: null,
    max_collaborators: company.max_collaborators ?? getPlanLimits(planType).max_collaborators,
    gateway: null,
    subscription_id: null,
    subscription_status: null,
    source: 'company',
    is_active: isPlanActive({
      plan_type: planType,
      plan_status: planStatus,
      trial_ends_at: company.trial_ends_at || null
    }),
    features: getPlanFeatures(planType)
  };
}

function buildSubscriptionPlanSnapshot(company, subscription) {
  const planType = normalizePlanType(subscription.plan_name || company.plan_type || 'trial');
  const rawSubscriptionStatus = String(subscription.status || 'active').trim().toLowerCase();
  const periodEnd = subscription.current_period_end || subscription.next_due_date || null;
  const trialEndsAt = planType === 'trial'
    ? (subscription.trial_ends_at || subscription.next_due_date || company.trial_ends_at || null)
    : null;

  let planStatus = rawSubscriptionStatus || 'active';

  if (planType === 'trial') {
    planStatus = isDateExpired(trialEndsAt) ? 'expired' : 'trial';
  } else if (planType === 'free') {
    planStatus = 'free';
  } else if (rawSubscriptionStatus !== 'active') {
    planStatus = rawSubscriptionStatus || 'active';
  } else {
    planStatus = 'active';
  }

  return {
    id: company.id,
    company_id: company.id,
    plan_type: planType,
    plan_status: planStatus,
    trial_ends_at: trialEndsAt,
    current_period_start: subscription.current_period_start || null,
    current_period_end: periodEnd,
    next_due_date: subscription.next_due_date || periodEnd,
    max_collaborators: getPlanLimits(planType).max_collaborators,
    gateway: subscription.gateway || 'manual',
    subscription_id: subscription.id,
    subscription_status: rawSubscriptionStatus,
    source: `subscription:${subscription.gateway || 'manual'}`,
    is_active: isPlanActive({
      plan_type: planType,
      plan_status: planStatus,
      trial_ends_at: trialEndsAt
    }),
    features: getPlanFeatures(planType)
  };
}

function getSubscriptionPriority(subscription, companyPlanSnapshot) {
  const planType = normalizePlanType(subscription.plan_name || companyPlanSnapshot?.plan_type || 'trial');
  const status = String(subscription.status || '').trim().toLowerCase();
  const trialEndsAt = subscription.trial_ends_at || subscription.next_due_date || companyPlanSnapshot?.trial_ends_at || null;

  if (isPaidPlanType(planType) && status === 'active') {
    return 0;
  }

  if (companyPlanSnapshot && isPaidPlanType(companyPlanSnapshot.plan_type) && companyPlanSnapshot.plan_status === 'active') {
    if (isPaidPlanType(planType) && ['late', 'pending', 'suspended', 'canceled', 'refunded'].includes(status)) {
      return 4;
    }
  }

  if (planType === 'trial' && !isDateExpired(trialEndsAt)) {
    return 2;
  }

  if (planType === 'free') {
    return 3;
  }

  if (isPaidPlanType(planType)) {
    return 4;
  }

  return 5;
}

function sortSubscriptionsByPriority(subscriptions, companyPlanSnapshot, hasUpdatedAtOnSubscriptions) {
  const updatedAtField = hasUpdatedAtOnSubscriptions ? 'updated_at' : 'created_at';

  return [...subscriptions].sort((left, right) => {
    const leftPriority = getSubscriptionPriority(left, companyPlanSnapshot);
    const rightPriority = getSubscriptionPriority(right, companyPlanSnapshot);

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftUpdatedAt = new Date(left[updatedAtField] || left.created_at || 0).getTime();
    const rightUpdatedAt = new Date(right[updatedAtField] || right.created_at || 0).getTime();

    return rightUpdatedAt - leftUpdatedAt;
  });
}

function logPlanDebug(snapshot) {
  if (process.env.NODE_ENV === 'production' || !snapshot?.company_id) {
    return;
  }

  console.log(
    `[PLAN DEBUG] company_id=${snapshot.company_id} plan=${snapshot.plan_type} status=${snapshot.plan_status} source=${snapshot.source}${snapshot.subscription_status ? ` subscription_status=${snapshot.subscription_status}` : ''}`
  );
}

async function getCompanyPlanSnapshot(companyId) {
  const schemaConfig = await getCompanyPlanSchemaConfig();

  const companyColumns = ['id', 'status', 'created_at'];
  if (schemaConfig.hasPlanType) {
    companyColumns.push('plan_type');
  }
  if (schemaConfig.hasPlanStatus) {
    companyColumns.push('plan_status');
  }
  if (schemaConfig.hasTrialEndsAt) {
    companyColumns.push('trial_ends_at');
  }
  if (schemaConfig.hasMaxCollaborators) {
    companyColumns.push('max_collaborators');
  }

  const companyResult = await pool.query(
    `SELECT ${companyColumns.join(', ')}
     FROM companies
     WHERE id = $1
       AND COALESCE(is_deleted, false) = false
     LIMIT 1`,
    [companyId]
  );

  if (companyResult.rowCount === 0) {
    return null;
  }

  const company = companyResult.rows[0];
  const companyPlanSnapshot = buildCompanyPlanSnapshot(company);

  const subscriptionColumns = ['id', 'status', 'created_at'];
  if (schemaConfig.hasPlanNameOnSubscriptions) {
    subscriptionColumns.push('plan_name');
  }
  if (schemaConfig.hasNextDueDateOnSubscriptions) {
    subscriptionColumns.push('next_due_date');
  }
  if (schemaConfig.hasCurrentPeriodStartOnSubscriptions) {
    subscriptionColumns.push('current_period_start');
  }
  if (schemaConfig.hasCurrentPeriodEndOnSubscriptions) {
    subscriptionColumns.push('current_period_end');
  }
  if (schemaConfig.hasGatewayOnSubscriptions) {
    subscriptionColumns.push('gateway');
  }
  if (schemaConfig.hasUpdatedAtOnSubscriptions) {
    subscriptionColumns.push('updated_at');
  }
  if (schemaConfig.hasTrialEndsAtOnSubscriptions) {
    subscriptionColumns.push('trial_ends_at');
  }

  const subscriptionResult = await pool.query(
    `SELECT ${subscriptionColumns.join(', ')}
     FROM subscriptions
     WHERE company_id = $1`,
    [companyId]
  );

  if (subscriptionResult.rowCount > 0) {
    const prioritizedSubscription = sortSubscriptionsByPriority(
      subscriptionResult.rows,
      companyPlanSnapshot,
      schemaConfig.hasUpdatedAtOnSubscriptions
    )[0];

    if (prioritizedSubscription) {
      const subscriptionSnapshot = buildSubscriptionPlanSnapshot(company, prioritizedSubscription);

      if (isPaidPlanType(subscriptionSnapshot.plan_type) && subscriptionSnapshot.plan_status === 'active') {
        logPlanDebug(subscriptionSnapshot);
        return subscriptionSnapshot;
      }

      if (schemaConfig.hasPlanType && company.plan_type) {
        logPlanDebug(companyPlanSnapshot);
        return companyPlanSnapshot;
      }

      if (!isPaidPlanType(companyPlanSnapshot.plan_type) || companyPlanSnapshot.plan_status !== 'active') {
        logPlanDebug(subscriptionSnapshot);
        return subscriptionSnapshot;
      }
    }
  }

  if (schemaConfig.hasPlanType && company.plan_type) {
    logPlanDebug(companyPlanSnapshot);
    return companyPlanSnapshot;
  }

  const fallbackSnapshot = {
    ...companyPlanSnapshot,
    plan_type: 'trial',
    plan_status: isDateExpired(company.trial_ends_at) ? 'expired' : 'trial',
    trial_ends_at: company.trial_ends_at || null,
    max_collaborators: getPlanLimits('trial').max_collaborators,
    source: 'fallback',
    is_active: isPlanActive({
      plan_type: 'trial',
      plan_status: isDateExpired(company.trial_ends_at) ? 'expired' : 'trial',
      trial_ends_at: company.trial_ends_at || null
    }),
    features: getPlanFeatures('trial')
  };

  logPlanDebug(fallbackSnapshot);
  return fallbackSnapshot;
}

module.exports = {
  PLAN_DEFINITIONS,
  normalizePlanType,
  getPlanLimits,
  resolveMaxCollaborators,
  isPlanActive,
  getPlanFeatures,
  getCompanyPlanSnapshot
};
