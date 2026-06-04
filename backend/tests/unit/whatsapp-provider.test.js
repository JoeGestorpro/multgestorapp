const EventEmitter = require('events')
const https = require('node:https')

jest.mock('node:https', () => ({
  request: jest.fn()
}))

const WhatsAppProvider = require('../../src/integrations/whatsapp/whatsapp-provider')

function createMockResponse(responseData, statusCode = 200) {
  const res = new EventEmitter()
  res.statusCode = statusCode
  res.headers = { 'content-type': 'application/json' }
  // Schedule data emission on next tick
  process.nextTick(() => {
    res.emit('data', Buffer.from(JSON.stringify(responseData)))
    res.emit('end')
  })
  return res
}

function mockHttpsRequest(responseData, statusCode = 200) {
  const req = new EventEmitter()
  req.write = jest.fn()
  req.end = jest.fn()
  req.destroy = jest.fn()

  https.request.mockImplementation((_options, callback) => {
    const res = createMockResponse(responseData, statusCode)
    if (callback) callback(res)
    return req
  })

  return req
}

describe('WhatsAppProvider', () => {
  let provider

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('sets default config values', () => {
      provider = new WhatsAppProvider({})
      expect(provider.config.providerType).toBe('meta_cloud_api')
      expect(provider.config.apiBaseUrl).toBe('https://graph.facebook.com/v19.0')
      expect(provider.config.accessToken).toBe('')
    })

    it('accepts custom config', () => {
      provider = new WhatsAppProvider({
        providerType: 'evolution_api',
        accessToken: 'tok_123',
        phoneNumberId: 'ph_456',
        companyId: 'comp-1'
      })
      expect(provider.config.providerType).toBe('evolution_api')
      expect(provider.config.accessToken).toBe('tok_123')
      expect(provider.config.phoneNumberId).toBe('ph_456')
      expect(provider.config.companyId).toBe('comp-1')
    })
  })

  describe('send', () => {
    beforeEach(() => {
      provider = new WhatsAppProvider({
        accessToken: 'test-token',
        phoneNumberId: 'test-phone-id',
        apiBaseUrl: 'https://graph.facebook.com/v19.0',
        enabled: true
      })
    })

    it('throws if provider is disabled', async () => {
      provider = new WhatsAppProvider({ enabled: false })
      await expect(provider.send({ to: '5511999999999' })).rejects.toThrow('disabled')
    })

    it('throws if provider type is mock', async () => {
      provider = new WhatsAppProvider({ providerType: 'mock' })
      await expect(provider.send({ to: '5511999999999' })).rejects.toThrow('mock')
    })

    it('returns error if phoneNumberId is missing', async () => {
      provider = new WhatsAppProvider({ accessToken: 'tok', enabled: true })
      const result = await provider.send({ to: '5511999999999' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('phoneNumberId')
    })

    it('returns error if accessToken is missing', async () => {
      provider = new WhatsAppProvider({ phoneNumberId: 'ph', enabled: true })
      const result = await provider.send({ to: '5511999999999' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('accessToken')
    })

    it('returns error if recipient is missing', async () => {
      const result = await provider.send({})
      expect(result.success).toBe(false)
      expect(result.error).toContain('Recipient')
    })

    it('sends template message successfully via Meta Cloud API', async () => {
      const responseData = { messages: [{ id: 'wamid.test123' }] }
      mockHttpsRequest(responseData, 200)

      const result = await provider.send({
        to: '5511999999999',
        template: 'appointment_confirmed',
        variables: {
          customer_name: 'Joao',
          appointment_date: '28/05/2026',
          appointment_time: '14:00'
        }
      })

      expect(result.success).toBe(true)
      expect(result.message_id).toBe('wamid.test123')
      expect(result.status).toBe('sent')

      expect(https.request).toHaveBeenCalledTimes(1)
      const callArgs = https.request.mock.calls[0][0]
      expect(callArgs.method).toBe('POST')
      expect(callArgs.hostname).toBe('graph.facebook.com')
      expect(callArgs.path).toContain('/test-phone-id/messages')
      expect(callArgs.headers.Authorization).toBe('Bearer test-token')
    })

    it('handles Meta Cloud API error response', async () => {
      const responseData = {
        error: {
          message: '(#100) Invalid parameter',
          type: 'OAuthException',
          code: 100
        }
      }
      mockHttpsRequest(responseData, 400)

      const result = await provider.send({
        to: '5511999999999',
        template: 'appointment_confirmed'
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe('failed')
      expect(result.error).toContain('Invalid parameter')
    })

    it('sends text message when no template provided', async () => {
      const responseData = { messages: [{ id: 'wamid.text123' }] }
      mockHttpsRequest(responseData, 200)

      const result = await provider.send({
        to: '5511999999999',
        text: 'Olá, tudo bem?'
      })

      expect(result.success).toBe(true)
      expect(result.message_id).toBe('wamid.text123')
    })

    it('handles generic provider type', async () => {
      provider = new WhatsAppProvider({
        providerType: 'evolution_api',
        enabled: true
      })
      const result = await provider.send({ to: '5511999999999' })
      expect(result.success).toBe(false)
      expect(result.status).toBe('not_implemented')
    })
  })

  describe('validateConfig', () => {
    it('returns valid for proper config', () => {
      provider = new WhatsAppProvider({
        accessToken: 'tok',
        phoneNumberId: 'ph'
      })
      const result = provider.validateConfig()
      expect(result.valid).toBe(true)
    })

    it('returns valid for mock config', () => {
      provider = new WhatsAppProvider({ providerType: 'mock' })
      const result = provider.validateConfig()
      expect(result.valid).toBe(true)
    })

    it('returns invalid if accessToken missing for non-mock', () => {
      provider = new WhatsAppProvider({ phoneNumberId: 'ph' })
      const result = provider.validateConfig()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('accessToken is required for non-mock providers')
    })

    it('returns invalid if phoneNumberId missing for non-mock', () => {
      provider = new WhatsAppProvider({ accessToken: 'tok' })
      const result = provider.validateConfig()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('phoneNumberId is required for non-mock providers')
    })

    it('returns invalid for unsupported providerType', () => {
      provider = new WhatsAppProvider({ providerType: 'unsupported' })
      const result = provider.validateConfig()
      expect(result.valid).toBe(false)
    })

    it('returns invalid when providerType is missing', () => {
      provider = new WhatsAppProvider({ providerType: '' })
      const result = provider.validateConfig()
      expect(result.valid).toBe(false)
    })
  })

  describe('getInfo', () => {
    it('masks sensitive fields', () => {
      provider = new WhatsAppProvider({
        accessToken: 'secret-token',
        phoneNumberId: 'ph_123',
        businessAccountId: 'ba_456',
        companyId: 'comp-1'
      })
      const info = provider.getInfo()
      expect(info.phoneNumberId).toBe('***configured***')
      expect(info.businessAccountId).toBe('***configured***')
      expect(info.tokenConfigured).toBe(true)
      expect(info.name).toBe('whatsapp-base')
    })

    it('shows null for unconfigured fields', () => {
      provider = new WhatsAppProvider({ companyId: 'comp-1' })
      const info = provider.getInfo()
      expect(info.phoneNumberId).toBeNull()
      expect(info.businessAccountId).toBeNull()
      expect(info.tokenConfigured).toBe(false)
    })
  })

  describe('getStatus', () => {
    it('returns placeholder', async () => {
      provider = new WhatsAppProvider({})
      const result = await provider.getStatus('msg-123')
      expect(result.message_id).toBe('msg-123')
      expect(result.status).toBe('unknown')
    })
  })

  describe('isAvailable', () => {
    it('returns true when enabled', () => {
      provider = new WhatsAppProvider({ enabled: true })
      expect(provider.isAvailable()).toBe(true)
    })

    it('returns false when disabled', () => {
      provider = new WhatsAppProvider({ enabled: false })
      expect(provider.isAvailable()).toBe(false)
    })
  })
})
