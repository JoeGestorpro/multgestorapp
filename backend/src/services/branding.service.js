const BrandingRepository = require('../repositories/branding.repository')
const { ValidationError, NotFoundError, ForbiddenError } = require('../shared')

function ensureCompany(companyId) {
  if (!companyId) {
    throw new ForbiddenError('Usuario sem empresa vinculada')
  }
}

class BrandingService {
  constructor(repository) {
    this.repository = repository
  }

  async getBranding(companyId) {
    ensureCompany(companyId)
    return this.repository.getBranding(companyId)
  }

  async updateBranding(companyId, updates) {
    ensureCompany(companyId)
    return this.repository.updateBranding(companyId, updates)
  }

  async getTheme(companyId) {
    ensureCompany(companyId)
    return this.repository.getTheme(companyId)
  }

  async updateTheme(companyId, updates) {
    ensureCompany(companyId)
    return this.repository.updateTheme(companyId, updates)
  }

  async getBookingLanding(companyId) {
    ensureCompany(companyId)
    return this.repository.getBookingLanding(companyId)
  }

  async updateBookingLanding(companyId, data) {
    ensureCompany(companyId)
    return this.repository.upsertBookingLanding(companyId, {
      headline: data.landing_headline || data.headline || '',
      description: data.landing_description || data.description || '',
      bannerUrl: data.landing_banner_url || data.banner_url || null,
      gallery: data.landing_gallery || data.gallery || [],
      heroUrl: data.landing_hero_url || data.hero_url || null,
      isActive: data.is_active !== false
    })
  }

  async uploadBanner(companyId, bannerUrl) {
    ensureCompany(companyId)
    return this.repository.upsertBookingLanding(companyId, {
      headline: '',
      description: '',
      bannerUrl,
      gallery: [],
      heroUrl: null,
      isActive: true
    })
  }

  async removeBanner(companyId) {
    ensureCompany(companyId)
    return this.repository.upsertBookingLanding(companyId, {
      headline: '',
      description: '',
      bannerUrl: null,
      gallery: [],
      heroUrl: null,
      isActive: true
    })
  }

  async addGalleryImage(companyId, imageUrl) {
    ensureCompany(companyId)
    const existing = await this.repository.getBookingLanding(companyId)
    const gallery = existing?.landing_gallery || []

    if (gallery.length >= 6) {
      throw new ValidationError('Maximo de 6 imagens na galeria')
    }

    gallery.push(imageUrl)

    return this.repository.upsertBookingLanding(companyId, {
      headline: existing?.landing_headline || '',
      description: existing?.landing_description || '',
      bannerUrl: existing?.landing_banner_url || null,
      gallery,
      heroUrl: existing?.landing_hero_url || null,
      isActive: existing?.is_active !== false
    })
  }

  async removeGalleryImage(companyId, imageUrl) {
    ensureCompany(companyId)
    const existing = await this.repository.getBookingLanding(companyId)
    const gallery = (existing?.landing_gallery || []).filter(url => url !== imageUrl)

    return this.repository.upsertBookingLanding(companyId, {
      headline: existing?.landing_headline || '',
      description: existing?.landing_description || '',
      bannerUrl: existing?.landing_banner_url || null,
      gallery,
      heroUrl: existing?.landing_hero_url || null,
      isActive: existing?.is_active !== false
    })
  }
}

module.exports = BrandingService
