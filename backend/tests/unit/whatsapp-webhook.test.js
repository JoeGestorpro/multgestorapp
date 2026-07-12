const crypto = require('crypto')
const EventEmitter = require('events')
const WhatsAppWebhook = require('../../src/integrations/webhooks/whatsapp-webhook')

jest.mock('../../src/shared/core/events', () => ({
  eventBus: {
    publish: jest.fn()
  }
}))

const { eventBus } = require('../../src/shared/core/events')

function createValidSignature(rawBody, secret) {
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return `sha256=${hmac}`
}

function createMockReqRes(overrides = {}) {
  const req = {
    query: {},
    headers: {},
    body: null,
    rawBody: null,
    ...overrides
  }

  const res = new EventEmitter()
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)

  return { req, res }
}

const TEST_APP_SECRET = 'test-meta-app-secret'
const TEST_VERIFY_TOKEN = 'test-verify-token'
const TEST_PHONE_ID = 'test-phone-id'

function createWebhook(config = {}) {
  return new WhatsAppWebhook({
    verifyToken: TEST_VERIFY_TOKEN,
    metaAppSecret: TEST_APP_SECRET,
    ...config
  })
}

describe('WhatsAppWebhook', () => {
  let webhook

  beforeEach(() => {
    jest.clearAllMocks()
    webhook = createWebhook()
  })

  describe('constructor', () => {
    it('uses config values when provided', () => {
      const wh = new WhatsAppWebhook({
        verifyToken: 'custom-token',
        metaAppSecret: 'custom-secret'
      })
      expect(wh.verifyToken).toBe('custom-token')
      expect(wh.metaAppSecret).toBe('custom-secret')
    })

    it('falls back to env vars when config not provided', () => {
      const prevToken = process.env.WHATSAPP_VERIFY_TOKEN
      const prevSecret = process.env.META_APP_SECRET
      process.env.WHATSAPP_VERIFY_TOKEN = 'env-token'
      process.env.META_APP_SECRET = 'env-secret'

      const wh = new WhatsAppWebhook({})
      expect(wh.verifyToken).toBe('env-token')
      expect(wh.metaAppSecret).toBe('env-secret')

      process.env.WHATSAPP_VERIFY_TOKEN = prevToken
      process.env.META_APP_SECRET = prevSecret
    })
  })

  describe('handleVerification (GET)', () => {
    it('accepts verification with correct token and returns challenge', async () => {
      const { req, res } = createMockReqRes({
        query: {
          'hub.mode': 'subscribe',
          'hub.verify_token': TEST_VERIFY_TOKEN,
          'hub.challenge': '123456789'
        }
      })

      const result = await webhook.handleVerification(req, res)

      expect(result).toBe(true)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith('123456789')
    })

    it('rejects verification with incorrect token', async () => {
      const { req, res } = createMockReqRes({
        query: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': '123456789'
        }
      })

      const result = await webhook.handleVerification(req, res)

      expect(result).toBe(false)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ error: 'Verification failed' })
    })

    it('rejects verification with missing token', async () => {
      const { req, res } = createMockReqRes({
        query: {
          'hub.mode': 'subscribe',
          'hub.challenge': '123456789'
        }
      })

      const result = await webhook.handleVerification(req, res)

      expect(result).toBe(false)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('rejects verification with wrong mode', async () => {
      const { req, res } = createMockReqRes({
        query: {
          'hub.mode': 'unsubscribe',
          'hub.verify_token': TEST_VERIFY_TOKEN,
          'hub.challenge': '123456789'
        }
      })

      const result = await webhook.handleVerification(req, res)

      expect(result).toBe(false)
      expect(res.status).toHaveBeenCalledWith(403)
    })
  })

  describe('_validateSignature', () => {
    it('returns true when signature is valid', () => {
      const rawBody = JSON.stringify({ object: 'whatsapp_business_account', entry: [] })
      const signature = createValidSignature(rawBody, TEST_APP_SECRET)

      const { req } = createMockReqRes({
        headers: { 'x-hub-signature-256': signature },
        rawBody: Buffer.from(rawBody, 'utf8')
      })

      expect(webhook._validateSignature(req)).toBe(true)
    })

    it('returns false when signature header is missing', () => {
      const rawBody = JSON.stringify({ test: 'data' })
      const { req } = createMockReqRes({
        headers: {},
        rawBody: Buffer.from(rawBody, 'utf8')
      })

      expect(webhook._validateSignature(req)).toBe(false)
    })

    it('returns false when rawBody is missing', () => {
      const rawBody = JSON.stringify({ test: 'data' })
      const signature = createValidSignature(rawBody, TEST_APP_SECRET)

      const { req } = createMockReqRes({
        headers: { 'x-hub-signature-256': signature },
        rawBody: null
      })

      expect(webhook._validateSignature(req)).toBe(false)
    })

    it('returns false when signature does not match', () => {
      const rawBody = JSON.stringify({ test: 'data' })

      const { req } = createMockReqRes({
        headers: { 'x-hub-signature-256': 'sha256=0000000000000000000000000000000000000000000000000000000000000000' },
        rawBody: Buffer.from(rawBody, 'utf8')
      })

      expect(webhook._validateSignature(req)).toBe(false)
    })

    it('returns false when app secret is not configured', () => {
      const wh = createWebhook({ metaAppSecret: '' })
      const rawBody = JSON.stringify({ test: 'data' })
      const signature = createValidSignature(rawBody, TEST_APP_SECRET)

      const { req } = createMockReqRes({
        headers: { 'x-hub-signature-256': signature },
        rawBody: Buffer.from(rawBody, 'utf8')
      })

      expect(wh._validateSignature(req)).toBe(false)
    })

    it('returns false with length-mismatched signature to avoid timing leak', () => {
      const rawBody = JSON.stringify({ test: 'data' })

      const { req } = createMockReqRes({
        headers: { 'x-hub-signature-256': 'sha256=tooshort' },
        rawBody: Buffer.from(rawBody, 'utf8')
      })

      expect(webhook._validateSignature(req)).toBe(false)
    })

    it('accepts rawBody as string when not a buffer', () => {
      const rawBody = JSON.stringify({ test: 'data' })
      const signature = createValidSignature(rawBody, TEST_APP_SECRET)

      const { req } = createMockReqRes({
        headers: { 'x-hub-signature-256': signature },
        rawBody
      })

      expect(webhook._validateSignature(req)).toBe(true)
    })
  })

  describe('handleIncoming (POST)', () => {
    function validWhatsAppPayload() {
      return {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'test-waba-id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                phone_number_id: TEST_PHONE_ID,
                display_phone_number: '5511999999999'
              },
              contacts: [{ profile: { name: 'Joao' }, wa_id: '5511988888888' }],
              messages: [{
                from: '5511988888888',
                id: 'wamid.incoming123',
                timestamp: '1717200000',
                type: 'text',
                text: { body: 'Ola, tudo bem?' }
              }]
            },
            field: 'messages'
          }]
        }]
      }
    }

    function buildPost(body, secret = TEST_APP_SECRET) {
      const rawBody = JSON.stringify(body)
      const signature = createValidSignature(rawBody, secret)
      const { req, res } = createMockReqRes({
        headers: { 'x-hub-signature-256': signature },
        rawBody: Buffer.from(rawBody, 'utf8'),
        body
      })
      return { req, res, rawBody }
    }

    it('processes valid incoming message', async () => {
      const payload = validWhatsAppPayload()
      const { req, res } = buildPost(payload)

      await webhook.handleIncoming(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ status: 'received' })
      expect(eventBus.publish).toHaveBeenCalledWith(
        'integration.whatsapp.message_received',
        expect.objectContaining({
          provider_message_id: 'wamid.incoming123',
          from: '5511988888888',
          type: 'text',
          text: 'Ola, tudo bem?'
        }),
        expect.objectContaining({
          aggregate_type: 'whatsapp_message',
          aggregate_id: 'wamid.incoming123'
        })
      )
    })

    it('rejects when signature is invalid', async () => {
      const payload = validWhatsAppPayload()
      const rawBody = JSON.stringify(payload)
      const { req, res } = createMockReqRes({
        headers: { 'x-hub-signature-256': 'sha256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
        rawBody: Buffer.from(rawBody, 'utf8'),
        body: payload
      })

      await webhook.handleIncoming(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' })
      expect(eventBus.publish).not.toHaveBeenCalled()
    })

    it('rejects when signature header is missing', async () => {
      const payload = validWhatsAppPayload()
      const { req, res } = createMockReqRes({
        headers: {},
        rawBody: Buffer.from(JSON.stringify(payload), 'utf8'),
        body: payload
      })

      await webhook.handleIncoming(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' })
    })

    it('returns 200 with ignored status for non-whatsapp objects', async () => {
      const payload = { object: 'instagram', entry: [] }
      const { req, res } = buildPost(payload)

      await webhook.handleIncoming(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ status: 'ignored' })
    })

    it('returns 400 for payload without object field', async () => {
      const payload = { notObject: true }
      const { req, res } = buildPost(payload)

      await webhook.handleIncoming(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('processes status updates', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'test-waba-id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { phone_number_id: TEST_PHONE_ID },
              statuses: [{
                id: 'wamid.status456',
                status: 'delivered',
                timestamp: '1717200100',
                recipient_id: '5511988888888'
              }]
            },
            field: 'messages'
          }]
        }]
      }
      const { req, res } = buildPost(payload)

      await webhook.handleIncoming(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(eventBus.publish).toHaveBeenCalledWith(
        'integration.whatsapp.status_update',
        expect.objectContaining({
          provider_message_id: 'wamid.status456',
          status: 'delivered',
          recipient_id: '5511988888888'
        }),
        expect.any(Object)
      )
    })

    it('handles errors gracefully', async () => {
      const payload = validWhatsAppPayload()
      const { req, res } = buildPost(payload)

      eventBus.publish.mockImplementationOnce(() => { throw new Error('bus error') })

      await webhook.handleIncoming(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal error processing webhook' })
    })
  })

  describe('validatePayload', () => {
    it('returns valid for correct payload', () => {
      const result = webhook.validatePayload({
        object: 'whatsapp_business_account',
        entry: []
      })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for null body', () => {
      const result = webhook.validatePayload(null)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Empty body')
    })

    it('returns invalid for missing object', () => {
      const result = webhook.validatePayload({})
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Missing object')
    })

    it('returns invalid for non-array entry', () => {
      const result = webhook.validatePayload({ object: 'test', entry: 'not-array' })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('entry')
    })
  })
})
