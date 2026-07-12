const { appLogger } = require('../../shared/core/logger')

async function handleSalePackageRedemption(eventPayload, context) {
  const { company_id, customer_id, id: sale_id, items } = eventPayload

  if (!customer_id) {
    appLogger.debug({ sale_id }, '[PackageRedemption] sem customer_id — ignorando')
    return
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    appLogger.debug({ sale_id }, '[PackageRedemption] sem items — ignorando')
    return
  }

  const PackageService = require('../../services/package.service')
  const packageService = new PackageService()

  for (const item of items) {
    if (item.item_type !== 'service' || !item.use_package) continue

    try {
      const result = await packageService.redeemCredit(company_id, customer_id, item.item_id, {
        saleId: sale_id,
        redeemedBy: context?.traceId || 'outbox-worker'
      })
      appLogger.info({ sale_id, item_id: item.item_id, credits_remaining: result.credits_remaining }, '[PackageRedemption] crédito resgatado')
    } catch (err) {
      appLogger.warn({ err, sale_id, item_id: item.item_id }, '[PackageRedemption] falha ao resgatar crédito — continuando')
    }
  }
}

module.exports = { handleSalePackageRedemption }
