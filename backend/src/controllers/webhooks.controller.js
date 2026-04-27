const kiwifyService = require('../services/webhooks/kiwify.service');

async function receiveKiwifyWebhook(req, res) {
  try {
    const result = await kiwifyService.processKiwifyWebhook(req.body || {}, req);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Erro no webhook Kiwify:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 500 ? 'Erro interno ao processar webhook' : error.message
    });
  }
}

module.exports = {
  receiveKiwifyWebhook
};
