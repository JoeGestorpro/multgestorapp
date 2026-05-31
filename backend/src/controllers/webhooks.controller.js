const { asyncHandler, success } = require('../shared')
const { billingManager } = require('../shared/capabilities/billing')

const receiveKiwifyWebhook = asyncHandler(async (req, res) => {
  const result = await billingManager.handleWebhook('kiwify', req)
  return success(res, result)
})

const receiveAbacatepayWebhook = asyncHandler(async (req, res) => {
  const result = await billingManager.handleWebhook('abacatepay', req)
  return success(res, result)
})

module.exports = { receiveKiwifyWebhook, receiveAbacatepayWebhook }
