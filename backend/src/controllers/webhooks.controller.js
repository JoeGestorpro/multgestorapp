const { asyncHandler, success } = require('../shared')
const kiwifyService = require('../services/webhooks/kiwify.service')

const receiveKiwifyWebhook = asyncHandler(async (req, res) => {
  const result = await kiwifyService.processKiwifyWebhook(req.body || {}, req)
  return success(res, result)
})

module.exports = { receiveKiwifyWebhook }
