const { upsertIntegrationSchema, testIntegrationSchema } = require('../../src/shared/core/validation/schemas')

describe('upsertIntegrationSchema', () => {
  describe('valid payloads', () => {
    it('aceita config completa para meta_cloud_api', () => {
      const r = upsertIntegrationSchema.safeParse({
        providerType: 'meta_cloud_api',
        phoneNumberId: 'ph_123',
        accessToken: 'tok_abc',
        integrationEnabled: true
      })
      expect(r.success).toBe(true)
    })

    it('aceita config mock sem phoneNumberId e accessToken', () => {
      const r = upsertIntegrationSchema.safeParse({
        providerType: 'mock'
      })
      expect(r.success).toBe(true)
    })

    it('aceita apiUrl opcional', () => {
      const r = upsertIntegrationSchema.safeParse({
        providerType: 'meta_cloud_api',
        phoneNumberId: 'ph_123',
        accessToken: 'tok_abc',
        apiUrl: 'https://graph.facebook.com/v19.0'
      })
      expect(r.success).toBe(true)
    })

    it('aceita businessAccountId opcional', () => {
      const r = upsertIntegrationSchema.safeParse({
        providerType: 'meta_cloud_api',
        phoneNumberId: 'ph_123',
        accessToken: 'tok_abc',
        businessAccountId: 'ba_456'
      })
      expect(r.success).toBe(true)
    })

    it('aceita integrationEnabled false', () => {
      const r = upsertIntegrationSchema.safeParse({
        providerType: 'mock',
        integrationEnabled: false
      })
      expect(r.success).toBe(true)
      expect(r.data.integrationEnabled).toBe(false)
    })

    it('aceita todos os providerTypes validos', () => {
      const types = ['meta_cloud_api', 'evolution_api', 'z_api', 'mock']
      for (const t of types) {
        const data = t === 'mock'
          ? { providerType: t }
          : { providerType: t, phoneNumberId: 'ph_1', accessToken: 'tok_1' }
        const r = upsertIntegrationSchema.safeParse(data)
        expect(r.success).toBe(true)
      }
    })
  })

  describe('invalid payloads', () => {
    it('rejeita providerType invalido', () => {
      const r = upsertIntegrationSchema.safeParse({ providerType: 'invalid_provider' })
      expect(r.success).toBe(false)
    })

    it('rejeita providerType ausente', () => {
      const r = upsertIntegrationSchema.safeParse({})
      expect(r.success).toBe(false)
    })

    it('rejeita phoneNumberId ausente para non-mock', () => {
      const r = upsertIntegrationSchema.safeParse({
        providerType: 'meta_cloud_api',
        accessToken: 'tok_abc'
      })
      expect(r.success).toBe(false)
      expect(r.error.issues.some(i => i.path.includes('phoneNumberId'))).toBe(true)
    })

    it('rejeita accessToken ausente para non-mock', () => {
      const r = upsertIntegrationSchema.safeParse({
        providerType: 'meta_cloud_api',
        phoneNumberId: 'ph_123'
      })
      expect(r.success).toBe(false)
      expect(r.error.issues.some(i => i.path.includes('accessToken'))).toBe(true)
    })

    it('rejeita apiUrl com formato invalido', () => {
      const r = upsertIntegrationSchema.safeParse({
        providerType: 'meta_cloud_api',
        phoneNumberId: 'ph_123',
        accessToken: 'tok_abc',
        apiUrl: 'not-a-url'
      })
      expect(r.success).toBe(false)
    })

    it('nao rejeita phoneNumberId ausente para mock', () => {
      const r = upsertIntegrationSchema.safeParse({ providerType: 'mock' })
      expect(r.success).toBe(true)
    })

    it('nao rejeita accessToken ausente para mock', () => {
      const r = upsertIntegrationSchema.safeParse({ providerType: 'mock' })
      expect(r.success).toBe(true)
    })
  })
})

describe('testIntegrationSchema', () => {
  it('aceita payload com to e template', () => {
    const r = testIntegrationSchema.safeParse({
      to: '5511999999999',
      template: 'appointment_confirmed'
    })
    expect(r.success).toBe(true)
  })

  it('aceita payload com variables', () => {
    const r = testIntegrationSchema.safeParse({
      to: '5511999999999',
      template: 'appointment_confirmed',
      variables: { name: 'Joao' }
    })
    expect(r.success).toBe(true)
    expect(r.data.variables.name).toBe('Joao')
  })

  it('rejeita to ausente', () => {
    const r = testIntegrationSchema.safeParse({})
    expect(r.success).toBe(false)
  })

  it('rejeita to vazio', () => {
    const r = testIntegrationSchema.safeParse({ to: '' })
    expect(r.success).toBe(false)
  })
})
