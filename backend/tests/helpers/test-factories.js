// tests/helpers/test-factories.js
// Minimal factories for test data generation

const crypto = require('crypto')

function createCompany(overrides = {}) {
  return {
    id: overrides.id || crypto.randomUUID(),
    name: overrides.name || `Test Company ${Date.now()}`,
    niche_type: overrides.niche_type || 'barber',
    public_booking_slug: overrides.public_booking_slug || `test-${Date.now()}`,
    status: overrides.status || 'active',
    is_active: overrides.is_active !== false,
    ...overrides,
  }
}

function createUser(companyId, overrides = {}) {
  return {
    id: overrides.id || crypto.randomUUID(),
    name: overrides.name || 'Test User',
    email: overrides.email || `test-${Date.now()}@example.com`,
    role: overrides.role || 'admin',
    company_id: companyId,
    is_active: overrides.is_active !== false,
    phone: overrides.phone || null,
    ...overrides,
  }
}

function createServicePayload(companyId, overrides = {}) {
  return {
    name: overrides.name || 'Corte Masculino',
    description: overrides.description || null,
    price: overrides.price ?? 50,
    service_type: overrides.service_type || 'service',
    serviceType: overrides.serviceType || 'service',
    icon: overrides.icon || 'scissors',
    commission_type: overrides.commission_type || 'percentage',
    commissionType: overrides.commissionType || 'percentage',
    commission_value: overrides.commission_value ?? 10,
    commissionValue: overrides.commissionValue ?? 10,
    estimated_time_minutes: overrides.estimated_time_minutes || 30,
    estimatedTimeMinutes: overrides.estimatedTimeMinutes || 30,
    is_active: overrides.is_active !== false,
    isActive: overrides.isActive !== false,
    company_id: companyId,
    ...overrides,
  }
}

function createCollaboratorPayload(companyId, overrides = {}) {
  return {
    name: overrides.name || 'Colaborador Test',
    email: overrides.email || `colab-${Date.now()}@example.com`,
    phone: overrides.phone || null,
    commission_type: overrides.commission_type || 'percentage',
    commissionType: overrides.commissionType || 'percentage',
    commission_rate: overrides.commission_rate ?? 10,
    commissionRate: overrides.commissionRate ?? 10,
    is_active: overrides.is_active !== false,
    isActive: overrides.isActive !== false,
    available_for_booking: overrides.available_for_booking ?? false,
    availableForBooking: overrides.availableForBooking ?? false,
    can_launch_sales: overrides.can_launch_sales ?? false,
    canLaunchSales: overrides.canLaunchSales ?? false,
    company_id: companyId,
    ...overrides,
  }
}

function createAppointmentPayload(companyId, overrides = {}) {
  const startsAt = overrides.starts_at || overrides.startsAt || new Date(Date.now() + 86400000).toISOString()

  return {
    service_id: overrides.service_id || overrides.serviceId || crypto.randomUUID(),
    serviceId: overrides.serviceId || overrides.service_id || crypto.randomUUID(),
    collaborator_id: overrides.collaborator_id || overrides.collaboratorId || crypto.randomUUID(),
    collaboratorId: overrides.collaboratorId || overrides.collaborator_id || crypto.randomUUID(),
    customer_name: overrides.customer_name || overrides.customerName || 'Cliente Test',
    customerName: overrides.customerName || overrides.customer_name || 'Cliente Test',
    customer_phone: overrides.customer_phone || overrides.customerPhone || '11999999999',
    customerPhone: overrides.customerPhone || overrides.customer_phone || '11999999999',
    customer_email: overrides.customer_email || overrides.customerEmail || null,
    customerEmail: overrides.customerEmail || overrides.customer_email || null,
    starts_at: startsAt,
    startsAt: startsAt,
    status: overrides.status || 'scheduled',
    notes: overrides.notes || null,
    source: overrides.source || 'test',
    company_id: companyId,
    ...overrides,
  }
}

module.exports = {
  createCompany,
  createUser,
  createServicePayload,
  createCollaboratorPayload,
  createAppointmentPayload,
}
