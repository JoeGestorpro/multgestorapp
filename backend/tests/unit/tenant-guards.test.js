// Jest: globals (describe, it, expect) are available automatically
const {
  ensureSameTenant,
  isMasterAdmin,
  isBarberAdmin,
  isBookingCustomer,
} = require('../../src/shared/tenant/guards')
const { TenantIsolationError } = require('../../src/shared/core/errors')

describe('ensureSameTenant', () => {
  it('allows same company_id', () => {
    expect(() => ensureSameTenant('company-a', 'company-a')).not.toThrow()
  })

  it('allows when one value is missing', () => {
    expect(() => ensureSameTenant(null, 'company-a')).not.toThrow()
    expect(() => ensureSameTenant('company-a', null)).not.toThrow()
    expect(() => ensureSameTenant(null, null)).not.toThrow()
  })

  it('throws on cross-tenant access', () => {
    expect(() => ensureSameTenant('company-a', 'company-b')).toThrow(TenantIsolationError)
  })

  it('compares as strings', () => {
    expect(() => ensureSameTenant(123, '123')).not.toThrow()
  })
})

describe('isMasterAdmin', () => {
  it('returns true for master_admin role', () => {
    expect(isMasterAdmin({ role: 'master_admin' })).toBe(true)
  })

  it('returns false for other roles', () => {
    expect(isMasterAdmin({ role: 'admin' })).toBe(false)
    expect(isMasterAdmin({ role: 'owner' })).toBe(false)
    expect(isMasterAdmin({ role: 'collaborator' })).toBe(false)
    expect(isMasterAdmin({ role: 'client' })).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isMasterAdmin(null)).toBe(false)
    expect(isMasterAdmin(undefined)).toBe(false)
    expect(isMasterAdmin({})).toBe(false)
  })
})

describe('isBarberAdmin', () => {
  it('returns true for admin roles', () => {
    expect(isBarberAdmin({ role: 'admin' })).toBe(true)
    expect(isBarberAdmin({ role: 'owner' })).toBe(true)
    expect(isBarberAdmin({ role: 'collaborator' })).toBe(true)
  })

  it('returns false for non-admin roles', () => {
    expect(isBarberAdmin({ role: 'master_admin' })).toBe(false)
    expect(isBarberAdmin({ role: 'client' })).toBe(false)
    expect(isBarberAdmin({ role: 'booking_customer' })).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isBarberAdmin(null)).toBe(false)
    expect(isBarberAdmin(undefined)).toBe(false)
  })
})

describe('isBookingCustomer', () => {
  it('returns true for booking customer roles', () => {
    expect(isBookingCustomer({ role: 'client' })).toBe(true)
    expect(isBookingCustomer({ role: 'booking_customer' })).toBe(true)
  })

  it('returns false for other roles', () => {
    expect(isBookingCustomer({ role: 'admin' })).toBe(false)
    expect(isBookingCustomer({ role: 'owner' })).toBe(false)
    expect(isBookingCustomer({ role: 'master_admin' })).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isBookingCustomer(null)).toBe(false)
    expect(isBookingCustomer(undefined)).toBe(false)
  })
})
