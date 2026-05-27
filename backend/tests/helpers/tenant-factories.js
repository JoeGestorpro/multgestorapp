// tests/helpers/tenant-factories.js
// Multi-tenant test data factories for integration tests
// Creates isolated Company A / Company B environments

const crypto = require('crypto')

function createTenantId(prefix = 'tenant') {
  return `${prefix}-${crypto.randomUUID()}`
}

function createCompanyA(overrides = {}) {
  return {
    id: overrides.id || createTenantId('company-a'),
    name: overrides.name || 'Barbearia Alpha',
    niche_type: overrides.niche_type || 'barber',
    public_booking_slug: overrides.public_booking_slug || `alpha-${Date.now()}`,
    status: overrides.status || 'active',
    is_active: overrides.is_active !== false,
    ...overrides,
  }
}

function createCompanyB(overrides = {}) {
  return {
    id: overrides.id || createTenantId('company-b'),
    name: overrides.name || 'Barbearia Beta',
    niche_type: overrides.niche_type || 'barber',
    public_booking_slug: overrides.public_booking_slug || `beta-${Date.now()}`,
    status: overrides.status || 'active',
    is_active: overrides.is_active !== false,
    ...overrides,
  }
}

function createUserForCompany(companyId, role = 'admin', overrides = {}) {
  return {
    id: overrides.id || crypto.randomUUID(),
    name: overrides.name || `User ${role}`,
    email: overrides.email || `user-${role}-${Date.now()}-${crypto.randomUUID().slice(0, 6)}@example.com`,
    role,
    company_id: companyId,
    is_active: overrides.is_active !== false,
    phone: overrides.phone || null,
    auth_scope: inferScope(role),
    ...overrides,
  }
}

function inferScope(role) {
  if (role === 'master_admin') return 'master'
  if (['client', 'booking_customer'].includes(role)) return 'booking_customer'
  if (['admin', 'owner', 'collaborator'].includes(role)) return 'barber_admin'
  return null
}

function createSupplierPayload(companyId, overrides = {}) {
  return {
    name: overrides.name || `Fornecedor ${companyId.slice(0, 8)}`,
    company_name: overrides.company_name || `Empresa ${companyId.slice(0, 8)}`,
    phone: overrides.phone || '11999999999',
    email: overrides.email || `supplier-${companyId.slice(0, 6)}@example.com`,
    document: overrides.document || null,
    notes: overrides.notes || null,
    is_active: overrides.is_active !== false,
    company_id: companyId,
    ...overrides,
  }
}

function createAppointmentPayload(companyId, overrides = {}) {
  const startsAt = overrides.starts_at || new Date(Date.now() + 86400000).toISOString()
  const endsAt = overrides.ends_at || new Date(Date.now() + 90000000).toISOString()

  return {
    service_id: overrides.service_id || crypto.randomUUID(),
    collaborator_id: overrides.collaborator_id || crypto.randomUUID(),
    customer_name: overrides.customer_name || 'Cliente Test',
    customer_phone: overrides.customer_phone || '11999999999',
    customer_email: overrides.customer_email || null,
    starts_at: startsAt,
    ends_at: endsAt,
    status: overrides.status || 'scheduled',
    notes: overrides.notes || null,
    source: overrides.source || 'test',
    company_id: companyId,
    ...overrides,
  }
}

function createCollaboratorPayload(companyId, overrides = {}) {
  return {
    name: overrides.name || `Colaborador ${companyId.slice(0, 8)}`,
    email: overrides.email || `colab-${companyId.slice(0, 6)}-${Date.now()}@example.com`,
    phone: overrides.phone || null,
    commission_type: overrides.commission_type || 'percentage',
    commission_rate: overrides.commission_rate ?? 10,
    is_active: overrides.is_active !== false,
    available_for_booking: overrides.available_for_booking ?? false,
    can_launch_sales: overrides.can_launch_sales ?? false,
    company_id: companyId,
    ...overrides,
  }
}

function createServicePayload(companyId, overrides = {}) {
  return {
    name: overrides.name || `Servico ${companyId.slice(0, 8)}`,
    description: overrides.description || null,
    price: overrides.price ?? 50,
    service_type: overrides.service_type || 'service',
    icon: overrides.icon || 'scissors',
    commission_type: overrides.commission_type || 'percentage',
    commission_value: overrides.commission_value ?? 10,
    estimated_time_minutes: overrides.estimated_time_minutes || 30,
    is_active: overrides.is_active !== false,
    company_id: companyId,
    ...overrides,
  }
}

module.exports = {
  createTenantId,
  createCompanyA,
  createCompanyB,
  createUserForCompany,
  inferScope,
  createSupplierPayload,
  createAppointmentPayload,
  createCollaboratorPayload,
  createServicePayload,
}
