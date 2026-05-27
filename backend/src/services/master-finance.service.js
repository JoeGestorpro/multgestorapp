const pool = require('../config/database');
const { AppError } = require('../shared/core/errors');

const ACTIVE_STATUSES = ['active', 'trialing'];
const LATE_STATUSES = ['past_due', 'late', 'overdue'];
const CANCELED_STATUSES = ['canceled'];
const PAID_STATUSES = ['paid', 'approved', 'succeeded'];
const PENDING_INVOICE_STATUSES = ['pending', 'open', 'overdue', 'past_due', 'late'];

async function tableExists(tableName) {
  const result = await pool.query('SELECT to_regclass($1) AS table_name', [`public.${tableName}`]);
  return Boolean(result.rows[0]?.table_name);
}

function getMonthlyAmountExpression(alias = 'subscriptions') {
  return `CASE
    WHEN COALESCE(${alias}.billing_cycle, 'monthly') IN ('yearly', 'annual') THEN COALESCE(${alias}.price, 0) / 12.0
    WHEN COALESCE(${alias}.billing_cycle, 'monthly') = 'quarterly' THEN COALESCE(${alias}.price, 0) / 3.0
    WHEN COALESCE(${alias}.billing_cycle, 'monthly') = 'weekly' THEN COALESCE(${alias}.price, 0) * 4.345
    ELSE COALESCE(${alias}.price, 0)
  END`;
}

function getMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function formatMonthLabel(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC'
  }).format(new Date(value));
}

async function getFinanceOverview() {
  const [subscriptionsResult, invoicesResult, companiesResult] = await Promise.all([
    getSubscriptionOverviewMetrics(),
    getInvoiceOverviewMetrics(),
    getCompanyOverviewMetrics()
  ]);

  const activeSubscriptions = Number(subscriptionsResult.active_subscriptions || 0);
  const mrr = Number(subscriptionsResult.current_mrr || 0);
  const churnBase = Number(subscriptionsResult.active_at_start_of_month || 0);
  const monthlyChurn = churnBase > 0
    ? Number(subscriptionsResult.canceled_this_month || 0) / churnBase
    : 0;

  return {
    mrr,
    revenueReceivedMonth: Number(invoicesResult.received_this_month || 0),
    revenuePending: Number(invoicesResult.pending_revenue || 0),
    activeSubscriptions,
    trialingSubscriptions: Number(subscriptionsResult.trialing_subscriptions || 0),
    lateSubscriptions: Number(subscriptionsResult.late_subscriptions || 0),
    canceledSubscriptions: Number(subscriptionsResult.canceled_subscriptions || 0),
    canceledThisMonth: Number(subscriptionsResult.canceled_this_month || 0),
    monthlyChurn,
    newClientsMonth: Number(companiesResult.new_clients_this_month || 0),
    activeCompanies: Number(companiesResult.active_companies || 0),
    arpa: activeSubscriptions > 0 ? mrr / activeSubscriptions : 0
  };
}

async function getSubscriptionOverviewMetrics() {
  const result = await pool.query(
    `WITH month_bounds AS (
       SELECT date_trunc('month', NOW()) AS month_start
     )
     SELECT
       COALESCE(SUM(CASE WHEN subscriptions.status IN ('active', 'trialing') THEN ${getMonthlyAmountExpression()} ELSE 0 END), 0)::numeric AS current_mrr,
       COUNT(*) FILTER (WHERE subscriptions.status IN ('active', 'trialing'))::int AS active_subscriptions,
       COUNT(*) FILTER (WHERE subscriptions.status = 'trialing')::int AS trialing_subscriptions,
       COUNT(*) FILTER (WHERE subscriptions.status IN ('past_due', 'late', 'overdue'))::int AS late_subscriptions,
       COUNT(*) FILTER (WHERE subscriptions.status = 'canceled')::int AS canceled_subscriptions,
       COUNT(*) FILTER (
         WHERE subscriptions.canceled_at >= (SELECT month_start FROM month_bounds)
       )::int AS canceled_this_month,
       COUNT(*) FILTER (
         WHERE subscriptions.started_at < (SELECT month_start FROM month_bounds)
           AND (subscriptions.canceled_at IS NULL OR subscriptions.canceled_at >= (SELECT month_start FROM month_bounds))
       )::int AS active_at_start_of_month
     FROM subscriptions`
  );

  return result.rows[0] || {};
}

async function getInvoiceOverviewMetrics() {
  if (!(await tableExists('invoices'))) {
    return {
      received_this_month: 0,
      pending_revenue: 0
    };
  }

  const result = await pool.query(
    `WITH month_bounds AS (
       SELECT date_trunc('month', NOW()) AS month_start
     )
     SELECT
       COALESCE(SUM(
         CASE
           WHEN invoices.status = ANY($1::text[])
             AND invoices.paid_at >= (SELECT month_start FROM month_bounds)
           THEN COALESCE(invoices.amount, 0)
           ELSE 0
         END
       ), 0)::numeric AS received_this_month,
       COALESCE(SUM(
         CASE
           WHEN invoices.status = ANY($2::text[])
           THEN COALESCE(invoices.amount, 0)
           ELSE 0
         END
       ), 0)::numeric AS pending_revenue
     FROM invoices`,
    [PAID_STATUSES, PENDING_INVOICE_STATUSES]
  );

  return result.rows[0] || {};
}

async function getCompanyOverviewMetrics() {
  const result = await pool.query(
    `WITH month_bounds AS (
       SELECT date_trunc('month', NOW()) AS month_start
     )
     SELECT
       COUNT(*) FILTER (
         WHERE companies.created_at >= (SELECT month_start FROM month_bounds)
           AND COALESCE(companies.is_deleted, false) = false
       )::int AS new_clients_this_month,
       COUNT(*) FILTER (
         WHERE companies.status = 'active'
           AND COALESCE(companies.is_deleted, false) = false
       )::int AS active_companies
     FROM companies`
  );

  return result.rows[0] || {};
}

async function getMrrSeries(months = 12) {
  const result = await pool.query(
    `WITH months AS (
       SELECT generate_series(
         date_trunc('month', NOW()) - (($1::int - 1) * INTERVAL '1 month'),
         date_trunc('month', NOW()),
         INTERVAL '1 month'
       ) AS month_start
     )
     SELECT
       months.month_start,
       COALESCE(SUM(
         CASE
           WHEN subscriptions.started_at < (months.month_start + INTERVAL '1 month')
             AND (subscriptions.canceled_at IS NULL OR subscriptions.canceled_at >= months.month_start)
             AND subscriptions.status <> 'refunded'
           THEN ${getMonthlyAmountExpression()}
           ELSE 0
         END
       ), 0)::numeric AS mrr,
       COUNT(*) FILTER (
         WHERE subscriptions.started_at < (months.month_start + INTERVAL '1 month')
           AND (subscriptions.canceled_at IS NULL OR subscriptions.canceled_at >= months.month_start)
           AND subscriptions.status <> 'refunded'
       )::int AS subscription_count
     FROM months
     LEFT JOIN subscriptions ON TRUE
     GROUP BY months.month_start
     ORDER BY months.month_start ASC`,
    [months]
  );

  return {
    items: result.rows.map((row) => ({
      month: row.month_start,
      label: formatMonthLabel(row.month_start),
      mrr: Number(row.mrr || 0),
      subscriptionCount: Number(row.subscription_count || 0)
    }))
  };
}

async function getRevenueByModule() {
  if (!(await tableExists('invoices'))) {
    return { items: [] };
  }

  const result = await pool.query(
    `SELECT
       COALESCE(invoices.module_key, subscriptions.module_key, modules.slug, 'sem_modulo') AS module_key,
       COALESCE(modules.name, subscriptions.plan_name, invoices.module_key, 'Sem modulo') AS module_name,
       COALESCE(SUM(CASE WHEN invoices.status = ANY($1::text[]) THEN invoices.amount ELSE 0 END), 0)::numeric AS revenue_received
     FROM invoices
     LEFT JOIN subscriptions ON subscriptions.id = invoices.subscription_id
     LEFT JOIN modules ON modules.id = subscriptions.module_id
     GROUP BY COALESCE(invoices.module_key, subscriptions.module_key, modules.slug, 'sem_modulo'),
              COALESCE(modules.name, subscriptions.plan_name, invoices.module_key, 'Sem modulo')
     ORDER BY revenue_received DESC, module_name ASC`,
    [PAID_STATUSES]
  );

  return {
    items: result.rows.map((row) => ({
      moduleKey: row.module_key,
      moduleName: row.module_name,
      revenueReceived: Number(row.revenue_received || 0)
    }))
  };
}

async function getRevenueByGateway() {
  if (!(await tableExists('invoices'))) {
    return { items: [] };
  }

  const result = await pool.query(
    `SELECT
       COALESCE(NULLIF(TRIM(invoices.gateway), ''), 'manual') AS gateway_name,
       COALESCE(SUM(CASE WHEN invoices.status = ANY($1::text[]) THEN invoices.amount ELSE 0 END), 0)::numeric AS revenue_received
     FROM invoices
     GROUP BY COALESCE(NULLIF(TRIM(invoices.gateway), ''), 'manual')
     ORDER BY revenue_received DESC, gateway_name ASC`,
    [PAID_STATUSES]
  );

  return {
    items: result.rows.map((row) => ({
      gatewayName: row.gateway_name,
      revenueReceived: Number(row.revenue_received || 0)
    }))
  };
}

async function listFinanceSubscriptions(query = {}) {
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const values = [limit];

  const result = await pool.query(
    `SELECT
       subscriptions.id,
       subscriptions.company_id,
       companies.name AS company_name,
       subscriptions.module_id,
       COALESCE(subscriptions.module_key, modules.slug, 'sem_modulo') AS module_key,
       COALESCE(modules.name, subscriptions.plan_name, 'Sem modulo') AS module_name,
       subscriptions.plan_id,
       plans.name AS plan_name_resolved,
       subscriptions.plan_name,
       subscriptions.status,
       subscriptions.gateway,
       ${getMonthlyAmountExpression()}::numeric AS monthly_amount
     FROM subscriptions
     LEFT JOIN companies ON companies.id = subscriptions.company_id
     LEFT JOIN modules ON modules.id = subscriptions.module_id
     LEFT JOIN plans ON plans.id = subscriptions.plan_id
     ORDER BY subscriptions.updated_at DESC NULLS LAST, subscriptions.created_at DESC
     LIMIT $1`,
    values
  );

  return {
    items: result.rows.map((row) => ({
      ...row,
      monthly_amount: Number(row.monthly_amount || 0)
    }))
  };
}

async function listFinanceEvents(query = {}) {
  if (!(await tableExists('payment_gateway_events'))) {
    return { items: [] };
  }

  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const values = [limit];

  const result = await pool.query(
    `SELECT
       payment_gateway_events.id,
       payment_gateway_events.gateway,
       payment_gateway_events.event_type,
       payment_gateway_events.processing_status,
       companies.name AS company_name,
       payment_gateway_events.created_at
     FROM payment_gateway_events
     LEFT JOIN companies ON companies.id = payment_gateway_events.company_id
     ORDER BY payment_gateway_events.created_at DESC
     LIMIT $1`,
    values
  );

  return { items: result.rows };
}

async function getFinancialAlerts() {
  const items = [];
  const [hasPaymentEventsTable, hasInvoicesTable, hasPlansTable] = await Promise.all([
    tableExists('payment_gateway_events'),
    tableExists('invoices'),
    tableExists('plans')
  ]);

  const queryTasks = [
    hasPaymentEventsTable
      ? pool.query(
        `SELECT gateway, event_type, error_message, created_at
         FROM payment_gateway_events
         WHERE processing_status = 'error'
         ORDER BY created_at DESC
         LIMIT 5`
      )
      : Promise.resolve({ rows: [] }),
    pool.query(
      `SELECT companies.name, companies.created_at
       FROM companies
       WHERE companies.status = 'active'
         AND COALESCE(companies.is_deleted, false) = false
         AND NOT EXISTS (
           SELECT 1
           FROM subscriptions
           WHERE subscriptions.company_id = companies.id
             AND subscriptions.status IN ('active', 'trialing')
         )
       ORDER BY companies.created_at DESC
       LIMIT 5`
    ),
    hasInvoicesTable
      ? pool.query(
        `SELECT invoices.id, invoices.paid_at
         FROM invoices
         LEFT JOIN subscriptions ON subscriptions.id = invoices.subscription_id
         WHERE invoices.status = ANY($1::text[])
           AND invoices.company_id IS NULL
           AND subscriptions.company_id IS NULL
         ORDER BY invoices.paid_at DESC NULLS LAST, invoices.created_at DESC
         LIMIT 5`,
        [PAID_STATUSES]
      )
      : Promise.resolve({ rows: [] }),
    pool.query(
      `SELECT companies.name, companies.created_at
       FROM companies
       WHERE companies.status = 'active'
         AND COALESCE(companies.is_deleted, false) = false
         AND NOT EXISTS (
           SELECT 1
           FROM first_access_tokens
           WHERE first_access_tokens.company_id = companies.id
         )
       ORDER BY companies.created_at DESC
       LIMIT 5`
    ),
    hasPlansTable
      ? pool.query(
        `SELECT name, module_key, created_at
         FROM plans
         WHERE is_active = true
           AND COALESCE(price, 0) <= 0
         ORDER BY created_at DESC
         LIMIT 5`
      )
      : Promise.resolve({ rows: [] })
  ];

  const [
    webhookErrorsResult,
    activeWithoutSubscriptionResult,
    paidWithoutCompanyResult,
    missingFirstAccessResult,
    plansWithoutPriceResult
  ] = await Promise.allSettled(queryTasks);

  if (webhookErrorsResult.status === 'fulfilled') {
    webhookErrorsResult.value.rows.forEach((row) => {
      items.push({
        severity: 'critical',
        code: 'webhook_error',
        title: 'Webhook com erro',
        message: `${row.gateway || 'gateway'}: ${row.event_type || 'evento'} falhou (${row.error_message || 'sem detalhe'})`,
        createdAt: row.created_at
      });
    });
  }

  if (activeWithoutSubscriptionResult.status === 'fulfilled') {
    activeWithoutSubscriptionResult.value.rows.forEach((row) => {
      items.push({
        severity: 'warning',
        code: 'active_company_without_subscription',
        title: 'Cliente ativo sem assinatura',
        message: `${row.name} esta ativo, mas sem assinatura ativa.`,
        createdAt: row.created_at
      });
    });
  }

  if (paidWithoutCompanyResult.status === 'fulfilled') {
    paidWithoutCompanyResult.value.rows.forEach((row) => {
      items.push({
        severity: 'critical',
        code: 'paid_invoice_without_company',
        title: 'Pagamento sem empresa vinculada',
        message: `Fatura paga ${row.id} sem empresa associada.`,
        createdAt: row.paid_at
      });
    });
  }

  if (missingFirstAccessResult.status === 'fulfilled') {
    missingFirstAccessResult.value.rows.forEach((row) => {
      items.push({
        severity: 'warning',
        code: 'company_without_first_access',
        title: 'Cliente sem primeiro acesso enviado',
        message: `${row.name} ainda nao tem token de primeiro acesso gerado.`,
        createdAt: row.created_at
      });
    });
  }

  if (plansWithoutPriceResult.status === 'fulfilled') {
    plansWithoutPriceResult.value.rows.forEach((row) => {
      items.push({
        severity: 'warning',
        code: 'plan_without_price',
        title: 'Plano sem preco definido',
        message: `${row.name} (${row.module_key || 'sem modulo'}) esta ativo com preco zerado.`,
        createdAt: row.created_at
      });
    });
  }

  const summary = items.reduce((acc, item) => {
    if (item.severity === 'critical') {
      acc.critical += 1;
    } else {
      acc.warning += 1;
    }
    return acc;
  }, { critical: 0, warning: 0 });

  return { items, summary };
}

module.exports = {
  AppError,
  getFinanceOverview,
  getMrrSeries,
  getRevenueByModule,
  getRevenueByGateway,
  listFinanceSubscriptions,
  listFinanceEvents,
  getFinancialAlerts
};
