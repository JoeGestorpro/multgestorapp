const { appLogger } = require('../../src/shared/core/logger')

jest.mock('../../src/integrations/config/integration-config', () => ({
  getRawConfig: jest.fn()
}))

jest.mock('../../src/integrations/config/encryption', () => ({
  decrypt: jest.fn(),
  encrypt: jest.fn()
}))

const integrationConfig = require('../../src/integrations/config/integration-config')
const { encryption } = require('../../src/integrations/config')
const WhatsAppResolver = require('../../src/integrations/whatsapp/whatsapp-resolver')

describe('WhatsAppResolver', () => {
  let resolver

  beforeEach(() => {
    jest.clearAllMocks()
    resolver = new WhatsAppResolver()
  })

  afterEach(() => {
    resolver._cache.clear()
  })

  describe('resolveProviderForCompany', () => {
    it('returns mock provider when companyId is null', async () => {
      const provider = await resolver.resolveProviderForCompany(null)
      expect(provider.constructor.name).toBe('MockWhatsAppProvider')
    })

    it('returns mock provider when companyId is undefined', async () => {
      const provider = await resolver.resolveProviderForCompany(undefined)
      expect(provider.constructor.name).toBe('MockWhatsAppProvider')
    })

    it('returns mock provider when no config found in DB', async () => {
      integrationConfig.getRawConfig.mockResolvedValue(null)

      const provider = await resolver.resolveProviderForCompany('comp-1')

      expect(provider.constructor.name).toBe('MockWhatsAppProvider')
      expect(integrationConfig.getRawConfig).toHaveBeenCalledWith('comp-1', 'whatsapp')
    })

    it('returns mock provider when integration is disabled', async () => {
      integrationConfig.getRawConfig.mockResolvedValue({
        id: 1,
        company_id: 'comp-1',
        channel: 'whatsapp',
        provider_type: 'meta_cloud_api',
        token_encrypted: 'some-encrypted-token',
        integration_enabled: false
      })

      const provider = await resolver.resolveProviderForCompany('comp-1')

      expect(provider.constructor.name).toBe('MockWhatsAppProvider')
    })

    it('returns mock provider when provider_type is mock', async () => {
      integrationConfig.getRawConfig.mockResolvedValue({
        id: 1,
        company_id: 'comp-1',
        channel: 'whatsapp',
        provider_type: 'mock',
        token_encrypted: null,
        integration_enabled: true
      })

      const provider = await resolver.resolveProviderForCompany('comp-1')

      expect(provider.constructor.name).toBe('MockWhatsAppProvider')
    })

    it('returns mock provider when token decryption fails', async () => {
      integrationConfig.getRawConfig.mockResolvedValue({
        id: 1,
        company_id: 'comp-1',
        channel: 'whatsapp',
        provider_type: 'meta_cloud_api',
        token_encrypted: 'invalid-token',
        api_url: null,
        phone_number_id: 'ph_123',
        business_account_id: null,
        integration_enabled: true
      })
      encryption.decrypt.mockImplementation(() => { throw new Error('decrypt failed') })

      const provider = await resolver.resolveProviderForCompany('comp-1')

      expect(provider.constructor.name).toBe('MockWhatsAppProvider')
    })

    it('returns WhatsAppProvider when config is valid', async () => {
      integrationConfig.getRawConfig.mockResolvedValue({
        id: 1,
        company_id: 'comp-1',
        channel: 'whatsapp',
        provider_type: 'meta_cloud_api',
        token_encrypted: 'encrypted-token',
        api_url: null,
        phone_number_id: 'ph_123',
        business_account_id: 'ba_456',
        integration_enabled: true
      })
      encryption.decrypt.mockReturnValue('decrypted-token')

      const provider = await resolver.resolveProviderForCompany('comp-1')

      expect(provider.constructor.name).toBe('WhatsAppProvider')
      expect(provider.config.accessToken).toBe('decrypted-token')
      expect(provider.config.phoneNumberId).toBe('ph_123')
      expect(provider.config.businessAccountId).toBe('ba_456')
      expect(provider.config.companyId).toBe('comp-1')
    })

    it('uses cached provider on subsequent calls within TTL', async () => {
      integrationConfig.getRawConfig.mockResolvedValue({
        id: 1,
        company_id: 'comp-1',
        channel: 'whatsapp',
        provider_type: 'meta_cloud_api',
        token_encrypted: 'encrypted-token',
        api_url: null,
        phone_number_id: 'ph_123',
        business_account_id: null,
        integration_enabled: true
      })
      encryption.decrypt.mockReturnValue('tok')

      const first = await resolver.resolveProviderForCompany('comp-1')
      const second = await resolver.resolveProviderForCompany('comp-1')

      expect(first).toBe(second)
      expect(integrationConfig.getRawConfig).toHaveBeenCalledTimes(1)
      expect(encryption.decrypt).toHaveBeenCalledTimes(1)
    })
  })

  describe('invalidateCache', () => {
    it('removes cached provider for company', async () => {
      integrationConfig.getRawConfig.mockResolvedValue({
        id: 1,
        company_id: 'comp-1',
        channel: 'whatsapp',
        provider_type: 'meta_cloud_api',
        token_encrypted: 'encrypted-token',
        api_url: null,
        phone_number_id: 'ph_123',
        business_account_id: null,
        integration_enabled: true
      })
      encryption.decrypt.mockReturnValue('tok')

      await resolver.resolveProviderForCompany('comp-1')
      resolver.invalidateCache('comp-1')
      await resolver.resolveProviderForCompany('comp-1')

      expect(integrationConfig.getRawConfig).toHaveBeenCalledTimes(2)
    })
  })

  describe('tenant isolation', () => {
    it('returns different provider instances for different companies', async () => {
      integrationConfig.getRawConfig.mockImplementation((companyId) => {
        if (companyId === 'comp-a') {
          return Promise.resolve({
            id: 1,
            company_id: 'comp-a',
            channel: 'whatsapp',
            provider_type: 'meta_cloud_api',
            token_encrypted: 'enc-a',
            api_url: null,
            phone_number_id: 'ph_a',
            business_account_id: null,
            integration_enabled: true
          })
        }
        if (companyId === 'comp-b') {
          return Promise.resolve({
            id: 2,
            company_id: 'comp-b',
            channel: 'whatsapp',
            provider_type: 'meta_cloud_api',
            token_encrypted: 'enc-b',
            api_url: null,
            phone_number_id: 'ph_b',
            business_account_id: null,
            integration_enabled: true
          })
        }
        return Promise.resolve(null)
      })
      encryption.decrypt.mockImplementation((enc) => {
        if (enc === 'enc-a') return 'tok-a'
        if (enc === 'enc-b') return 'tok-b'
        return 'tok-default'
      })

      const providerA = await resolver.resolveProviderForCompany('comp-a')
      const providerB = await resolver.resolveProviderForCompany('comp-b')

      expect(providerA).not.toBe(providerB)
      expect(providerA.config.phoneNumberId).toBe('ph_a')
      expect(providerB.config.phoneNumberId).toBe('ph_b')
      expect(providerA.config.accessToken).toBe('tok-a')
      expect(providerB.config.accessToken).toBe('tok-b')
    })
  })
})
