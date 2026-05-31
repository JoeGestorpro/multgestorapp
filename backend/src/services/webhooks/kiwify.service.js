const { billingManager } = require('../../shared/capabilities/billing')

async function processKiwifyWebhook(payload, req) {
  return billingManager.handleWebhook('kiwify', req, payload)
}

module.exports = {
  processKiwifyWebhook
}
