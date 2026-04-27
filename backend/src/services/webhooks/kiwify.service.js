const pool = require('../../config/database');
const masterService = require('../master.service');
const emailService = require('../email/email.service');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeSlug(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveWebhookSecret(req) {
  const authHeader = normalizeText(req.headers.authorization);
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  return (
    normalizeText(req.headers['x-kiwify-token']) ||
    normalizeText(req.headers['x-webhook-token']) ||
    normalizeText(req.headers['x-kiwify-signature']) ||
    normalizeText(req.query.token) ||
    bearerToken
  );
}

function validateWebhookSecret(req) {
  const expectedSecret = normalizeText(process.env.KIWIFY_WEBHOOK_SECRET);

  if (!expectedSecret) {
    throw createError('KIWIFY_WEBHOOK_SECRET nao configurado', 500);
  }

  if (resolveWebhookSecret(req) !== expectedSecret) {
    throw createError('Webhook nao autorizado', 401);
  }
}

function extractCustomer(payload = {}) {
  const customer = payload.customer || payload.buyer || payload.client || {};
  return {
    email: normalizeEmail(customer.email || payload.customer_email || payload.email),
    name: normalizeText(customer.name || payload.customer_name || payload.name || 'Cliente Kiwify'),
    document: normalizeText(customer.document || customer.cpf || payload.customer_document),
    phone: normalizeText(customer.phone || customer.whatsapp || payload.customer_phone)
  };
}

function extractCompany(payload = {}, customer = {}) {
  return {
    name: normalizeText(
      payload.company_name ||
      payload.tenant_name ||
      payload.business_name ||
      customer.name ||
      'Nova empresa'
    ),
    email: customer.email || normalizeEmail(payload.company_email),
    document: customer.document || normalizeText(payload.company_document),
    phone: customer.phone || normalizeText(payload.company_phone)
  };
}

function extractFinancialPayload(payload = {}) {
  const rawPrice = Number(
    payload.amount ||
    payload.price ||
    payload.total_amount ||
    payload.subscription_amount ||
    payload.invoice_amount ||
    0
  );

  return {
    planName: normalizeText(payload.plan_name || payload.offer_name || payload.product_name || payload.product?.name || 'Plano Kiwify'),
    billingCycle: normalizeSlug(payload.billing_cycle || payload.plan_cycle || payload.recurrence || payload.subscription_cycle) || 'monthly',
    gateway: normalizeSlug(payload.gateway || payload.gateway_name || payload.payment_gateway) || 'kiwify',
    moduleKey: normalizeSlug(payload.module_key || payload.product_key || payload.module_slug || payload.product?.slug),
    price: Number.isFinite(rawPrice) ? rawPrice : 0,
    paidAt: payload.paid_at || payload.approved_at || payload.payment_date || null,
    dueAt: payload.due_at || payload.next_due_date || payload.expiration_date || null,
    currentPeriodEnd: payload.current_period_end || payload.next_due_date || null,
    currentPeriodStart: payload.current_period_start || payload.subscription_started_at || payload.created_at || null,
    invoiceId: normalizeText(payload.invoice_id || payload.charge_id || payload.payment_id || payload.order_id),
    subscriptionExternalId: normalizeText(payload.subscription_id || payload.subscription_code || payload.order_subscription_id),
    customerExternalId: normalizeText(payload.customer_id || payload.buyer_id)
  };
}

function extractEvent(payload = {}) {
  const eventType = normalizeSlug(
    payload.event_type ||
    payload.event ||
    payload.type ||
    payload.webhook_event ||
    payload.status
  );

  const baseEventId = normalizeText(
    payload.event_id ||
    payload.id ||
    payload.webhook_id ||
    payload.transaction_id ||
    payload.invoice_id ||
    payload.order_id
  );

  return {
    eventType: eventType || 'unknown',
    eventId: baseEventId || `kiwify-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
  };
}

async function requireFinanceTables() {
  const result = await pool.query(
    `SELECT to_regclass('public.payment_gateway_events') AS payment_gateway_events,
            to_regclass('public.invoices') AS invoices,
            to_regclass('public.subscription_events') AS subscription_events`
  );

  const row = result.rows[0] || {};
  if (!row.payment_gateway_events || !row.invoices || !row.subscription_events) {
    throw createError('Migrations financeiras nao aplicadas', 503);
  }
}

async function findModuleId(moduleKey, client) {
  if (!moduleKey) {
    return null;
  }

  const result = await client.query(
    'SELECT id, slug FROM modules WHERE slug = $1 AND is_active = true LIMIT 1',
    [moduleKey]
  );

  return result.rows[0] || null;
}

async function findPlan(moduleId, planName, billingCycle, client) {
  if (!moduleId) {
    return null;
  }

  const result = await client.query(
    `SELECT id, module_key, name
     FROM plans
     WHERE module_id = $1
       AND LOWER(name) = LOWER($2)
       AND billing_cycle = $3
     LIMIT 1`,
    [moduleId, planName, billingCycle]
  );

  return result.rows[0] || null;
}

async function ensureCompany(companyData, client) {
  const byEmail = companyData.email
    ? await client.query(
        `SELECT id, name, status, owner_user_id
         FROM companies
         WHERE LOWER(email) = LOWER($1)
           AND COALESCE(is_deleted, false) = false
         LIMIT 1`,
        [companyData.email]
      )
    : { rowCount: 0, rows: [] };

  if (byEmail.rowCount > 0) {
    return byEmail.rows[0];
  }

  const result = await client.query(
    `INSERT INTO companies (name, document, email, phone, niche, niche_type, status, updated_at)
     VALUES ($1, $2, $3, $4, NULL, NULL, 'active', NOW())
     RETURNING id, name, status, owner_user_id`,
    [companyData.name, companyData.document || null, companyData.email || null, companyData.phone || null]
  );

  return result.rows[0];
}

async function ensureSubscriptionRecord({
  companyId,
  module,
  plan,
  finance,
  status
}, client) {
  const existing = finance.subscriptionExternalId
    ? await client.query(
        `SELECT *
         FROM subscriptions
         WHERE external_subscription_id = $1
         LIMIT 1`,
        [finance.subscriptionExternalId]
      )
    : await client.query(
        `SELECT *
         FROM subscriptions
         WHERE company_id = $1
           AND COALESCE(module_key, '') = COALESCE($2, '')
         ORDER BY created_at DESC
         LIMIT 1`,
        [companyId, finance.moduleKey || module?.slug || null]
      );

  if (existing.rowCount > 0) {
    const updateResult = await client.query(
      `UPDATE subscriptions
       SET module_id = COALESCE($2, module_id),
           module_key = COALESCE($3, module_key),
           plan_id = COALESCE($4, plan_id),
           plan_name = COALESCE($5, plan_name),
           price = $6,
           billing_cycle = $7,
           status = $8,
           gateway = $9,
           external_subscription_id = COALESCE($10, external_subscription_id),
           external_customer_id = COALESCE($11, external_customer_id),
           current_period_start = COALESCE($12, current_period_start),
           current_period_end = COALESCE($13, current_period_end),
           next_due_date = COALESCE($14::date, next_due_date),
           canceled_at = CASE WHEN $8 = 'canceled' THEN COALESCE(canceled_at, NOW()) ELSE NULL END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        existing.rows[0].id,
        module?.id || null,
        finance.moduleKey || module?.slug || null,
        plan?.id || null,
        finance.planName,
        finance.price,
        finance.billingCycle,
        status,
        finance.gateway,
        finance.subscriptionExternalId || null,
        finance.customerExternalId || null,
        finance.currentPeriodStart || null,
        finance.currentPeriodEnd || null,
        finance.dueAt || finance.currentPeriodEnd || null
      ]
    );

    return updateResult.rows[0];
  }

  const insertResult = await client.query(
    `INSERT INTO subscriptions (
       company_id,
       module_id,
       module_key,
       plan_id,
       plan_name,
       price,
       status,
       billing_cycle,
       next_due_date,
       started_at,
       gateway,
       external_subscription_id,
       external_customer_id,
       current_period_start,
       current_period_end,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::date, COALESCE($10, NOW()), $11, $12, $13, $14, $15, NOW())
     RETURNING *`,
    [
      companyId,
      module?.id || null,
      finance.moduleKey || module?.slug || null,
      plan?.id || null,
      finance.planName,
      finance.price,
      status,
      finance.billingCycle,
      finance.dueAt || finance.currentPeriodEnd || null,
      finance.currentPeriodStart || null,
      finance.gateway,
      finance.subscriptionExternalId || null,
      finance.customerExternalId || null,
      finance.currentPeriodStart || null,
      finance.currentPeriodEnd || null
    ]
  );

  return insertResult.rows[0];
}

async function activateCompanyModule(companyId, moduleId, client) {
  if (!moduleId) {
    return null;
  }

  const existing = await client.query(
    `SELECT id, status
     FROM company_modules
     WHERE company_id = $1 AND module_id = $2
     LIMIT 1`,
    [companyId, moduleId]
  );

  if (existing.rowCount > 0) {
    const result = await client.query(
      `UPDATE company_modules
       SET status = 'active',
           activated_at = COALESCE(activated_at, NOW()),
           deactivated_at = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [existing.rows[0].id]
    );

    return result.rows[0];
  }

  const result = await client.query(
    `INSERT INTO company_modules (company_id, module_id, status, activated_at, updated_at)
     VALUES ($1, $2, 'active', NOW(), NOW())
     RETURNING *`,
    [companyId, moduleId]
  );

  return result.rows[0];
}

async function syncInvoice({ companyId, subscriptionId, finance, status, payload }, client) {
  const existing = finance.invoiceId
    ? await client.query(
        `SELECT id
         FROM invoices
         WHERE external_invoice_id = $1
         LIMIT 1`,
        [finance.invoiceId]
      )
    : { rowCount: 0, rows: [] };

  if (existing.rowCount > 0) {
    const result = await client.query(
      `UPDATE invoices
       SET company_id = COALESCE($2, company_id),
           subscription_id = COALESCE($3, subscription_id),
           gateway = $4,
           external_charge_id = COALESCE($5, external_charge_id),
           module_key = COALESCE($6, module_key),
           amount = $7,
           status = $8,
           due_at = COALESCE($9, due_at),
           paid_at = COALESCE($10, paid_at),
           refunded_at = CASE WHEN $8 = 'refunded' THEN COALESCE(refunded_at, NOW()) ELSE refunded_at END,
           metadata = COALESCE(metadata, '{}'::jsonb) || $11::jsonb,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        existing.rows[0].id,
        companyId,
        subscriptionId,
        finance.gateway,
        finance.invoiceId || null,
        finance.moduleKey || null,
        finance.price,
        status,
        finance.dueAt || null,
        finance.paidAt || null,
        JSON.stringify(payload || {})
      ]
    );

    return result.rows[0];
  }

  const result = await client.query(
    `INSERT INTO invoices (
       company_id,
       subscription_id,
       gateway,
       external_invoice_id,
       external_charge_id,
       module_key,
       amount,
       status,
       due_at,
       paid_at,
       metadata,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW())
     RETURNING *`,
    [
      companyId,
      subscriptionId,
      finance.gateway,
      finance.invoiceId || null,
      finance.invoiceId || null,
      finance.moduleKey || null,
      finance.price,
      status,
      finance.dueAt || null,
      finance.paidAt || null,
      JSON.stringify(payload || {})
    ]
  );

  return result.rows[0];
}

async function createSubscriptionEvent(subscriptionId, companyId, gateway, event, payload, client) {
  await client.query(
    `INSERT INTO subscription_events (subscription_id, company_id, gateway, event_id, event_type, event_status, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      subscriptionId,
      companyId,
      gateway,
      event.eventId,
      event.eventType,
      payload.status || null,
      JSON.stringify(payload || {})
    ]
  );
}

async function ensureFirstAccess(company, customer) {
  if (!customer.email) {
    return null;
  }

  const generated = await masterService.generateFirstAccess({
    company_id: company.id,
    name: customer.name || company.name,
    email: customer.email,
    role: 'admin',
    expires_in_hours: 48
  }, { id: null, role: 'system' });

  await pool.query(
    `UPDATE companies
     SET owner_user_id = COALESCE(owner_user_id, $2),
         updated_at = NOW()
     WHERE id = $1`,
    [company.id, generated.user.id]
  );

  try {
    await emailService.sendFirstAccessEmail({
      to: generated.firstAccess.user_email || customer.email,
      name: generated.firstAccess.user_name || customer.name || company.name,
      companyName: company.name,
      token: generated.firstAccess.token,
      expiresAt: generated.firstAccess.expires_at
    });
  } catch (error) {
    console.error('[kiwify-first-access-email-error]', error);
  }

  return generated;
}

function mapEventToStatuses(eventType) {
  switch (eventType) {
    case 'compra-aprovada':
    case 'compra_aprovada':
    case 'purchase-approved':
    case 'purchase_approved':
    case 'subscription-renewed':
    case 'subscription_renewed':
    case 'renewed':
      return { subscriptionStatus: 'active', invoiceStatus: 'paid' };
    case 'subscription-late':
    case 'subscription_late':
    case 'late':
    case 'past-due':
    case 'past_due':
    case 'overdue':
      return { subscriptionStatus: 'late', invoiceStatus: 'overdue' };
    case 'subscription-canceled':
    case 'subscription_canceled':
    case 'canceled':
      return { subscriptionStatus: 'canceled', invoiceStatus: 'canceled' };
    case 'compra-reembolsada':
    case 'compra_reembolsada':
    case 'refunded':
      return { subscriptionStatus: 'refunded', invoiceStatus: 'refunded' };
    case 'chargeback':
      return { subscriptionStatus: 'suspended', invoiceStatus: 'chargeback' };
    default:
      return { subscriptionStatus: 'pending', invoiceStatus: 'pending' };
  }
}

async function processKiwifyWebhook(payload, req) {
  validateWebhookSecret(req);
  await requireFinanceTables();

  const event = extractEvent(payload);
  const customer = extractCustomer(payload);
  const companyData = extractCompany(payload, customer);
  const finance = extractFinancialPayload(payload);
  const { subscriptionStatus, invoiceStatus } = mapEventToStatuses(event.eventType);

  if (!customer.email && ['compra_aprovada', 'subscription_renewed', 'purchase_approved', 'renewed'].includes(event.eventType)) {
    throw createError('Payload do webhook sem email do cliente', 400);
  }

  const rawBody = JSON.stringify(payload || {});
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertedEvent = await client.query(
      `INSERT INTO payment_gateway_events (gateway, event_id, event_type, processing_status, raw_body, payload)
       VALUES ('kiwify', $1, $2, 'pending', $3, $4::jsonb)
       ON CONFLICT (gateway, event_id) DO NOTHING
       RETURNING id`,
      [event.eventId, event.eventType, rawBody, rawBody]
    );

    if (insertedEvent.rowCount === 0) {
      const existing = await client.query(
        `SELECT id, processing_status, company_id, subscription_id, created_at
         FROM payment_gateway_events
         WHERE gateway = 'kiwify' AND event_id = $1
         LIMIT 1`,
        [event.eventId]
      );

      await client.query('COMMIT');
      return {
        duplicate: true,
        eventId: event.eventId,
        eventType: event.eventType,
        paymentGatewayEvent: existing.rows[0] || null
      };
    }

    const paymentEventId = insertedEvent.rows[0].id;

    let company = null;
    let subscription = null;
    let invoice = null;
    let module = null;
    let plan = null;

    if (companyData.name || customer.email) {
      company = await ensureCompany(companyData, client);
    }

    module = await findModuleId(finance.moduleKey, client);
    plan = await findPlan(module?.id || null, finance.planName, finance.billingCycle, client);

    if (company) {
      subscription = await ensureSubscriptionRecord({
        companyId: company.id,
        module,
        plan,
        finance,
        status: subscriptionStatus
      }, client);

      invoice = await syncInvoice({
        companyId: company.id,
        subscriptionId: subscription.id,
        finance,
        status: invoiceStatus,
        payload
      }, client);

      if (module?.id) {
        await activateCompanyModule(company.id, module.id, client);
      }

      await client.query(
        `UPDATE companies
         SET status = CASE
           WHEN $2 IN ('active', 'trialing') THEN 'active'
           WHEN $2 = 'canceled' THEN 'inactive'
           WHEN $2 = 'suspended' THEN 'suspended'
           ELSE status
         END,
         updated_at = NOW()
         WHERE id = $1`,
        [company.id, subscriptionStatus]
      );

      await createSubscriptionEvent(subscription.id, company.id, 'kiwify', event, payload, client);
    }

    await client.query(
      `UPDATE payment_gateway_events
       SET processing_status = 'processed',
           company_id = $2,
           subscription_id = $3,
           processed_at = NOW()
       WHERE id = $1`,
      [paymentEventId, company?.id || null, subscription?.id || null]
    );

    await client.query('COMMIT');

    if (company && subscriptionStatus === 'active') {
      await ensureFirstAccess(company, customer);
    }

    return {
      processed: true,
      eventId: event.eventId,
      eventType: event.eventType,
      companyId: company?.id || null,
      subscriptionId: subscription?.id || null,
      invoiceId: invoice?.id || null
    };
  } catch (error) {
    await client.query('ROLLBACK');

    try {
      await pool.query(
        `UPDATE payment_gateway_events
         SET processing_status = 'error',
             error_message = $2,
             processed_at = NOW()
         WHERE gateway = 'kiwify' AND event_id = $1`,
        [event.eventId, error.message]
      );
    } catch (updateError) {
      console.error('[kiwify-webhook-error-log-failed]', updateError);
    }

    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  processKiwifyWebhook
};
