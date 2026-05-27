// tests/unit/validation-schemas.test.js
const {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createSaleSchema,
  createCollaboratorSchema,
  createServiceSchema,
  createAppointmentSchema
} = require('../../src/shared/core/validation/schemas')

describe('loginSchema', () => {
  it('aceita email e senha validos', () => {
    const r = loginSchema.safeParse({ email: 'user@test.com', password: '123456' })
    expect(r.success).toBe(true)
  })
  it('normaliza email para lowercase', () => {
    const r = loginSchema.safeParse({ email: 'USER@TEST.COM', password: '123456' })
    expect(r.success).toBe(true)
    expect(r.data.email).toBe('user@test.com')
  })
  it('rejeita email invalido', () => {
    const r = loginSchema.safeParse({ email: 'nao-e-email', password: '123456' })
    expect(r.success).toBe(false)
  })
  it('rejeita senha ausente', () => {
    const r = loginSchema.safeParse({ email: 'user@test.com' })
    expect(r.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = { name: 'Joao', email: 'joao@test.com', password: 'senha123' }
  it('aceita dados validos', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })
  it('rejeita nome muito curto', () => {
    expect(registerSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false)
  })
  it('rejeita senha menor que 6 chars', () => {
    expect(registerSchema.safeParse({ ...valid, password: '123' }).success).toBe(false)
  })
})

describe('createSaleSchema', () => {
  const validItem = { service_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }
  const valid = { items: [validItem], payment_method: 'dinheiro' }
  it('aceita venda valida', () => {
    expect(createSaleSchema.safeParse(valid).success).toBe(true)
  })
  it('rejeita items vazio', () => {
    expect(createSaleSchema.safeParse({ ...valid, items: [] }).success).toBe(false)
  })
  it('rejeita forma de pagamento invalida', () => {
    expect(createSaleSchema.safeParse({ ...valid, payment_method: 'bitcoin' }).success).toBe(false)
  })
})

describe('createCollaboratorSchema', () => {
  it('aceita dados validos', () => {
    const r = createCollaboratorSchema.safeParse({ name: 'Pedro Silva' })
    expect(r.success).toBe(true)
  })
  it('rejeita nome muito curto', () => {
    const r = createCollaboratorSchema.safeParse({ name: 'P' })
    expect(r.success).toBe(false)
  })
})

describe('createServiceSchema', () => {
  const valid = { name: 'Corte', price: 40, duration_minutes: 30 }
  it('aceita servico valido', () => {
    expect(createServiceSchema.safeParse(valid).success).toBe(true)
  })
  it('rejeita preco negativo', () => {
    expect(createServiceSchema.safeParse({ ...valid, price: -1 }).success).toBe(false)
  })
  it('rejeita duracao menor que 5', () => {
    expect(createServiceSchema.safeParse({ ...valid, duration_minutes: 3 }).success).toBe(false)
  })
})

describe('createAppointmentSchema', () => {
  it('aceita agendamento valido', () => {
    const r = createAppointmentSchema.safeParse({ start_at: '2026-06-01T10:00:00Z' })
    expect(r.success).toBe(true)
  })
  it('rejeita sem start_at', () => {
    const r = createAppointmentSchema.safeParse({ service_id: '550e8400-e29b-41d4-a716-446655440000' })
    expect(r.success).toBe(false)
  })
})
