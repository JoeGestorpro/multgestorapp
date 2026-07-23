const express = require('express');
const webhooksController = require('../controllers/webhooks.controller');
const { webhookAbuseRateLimit } = require('../middlewares/webhook-rate-limit');

const router = express.Router();

// Controle de abuso/custo dos webhooks públicos de pagamento (CLAUDE.md / R-003):
// 1) Pode gerar abuso? Sim — endpoints públicos, não autenticados, alcançáveis por
//    qualquer origem. Um flood consome CPU (verificação de assinatura HMAC), conexões
//    e a capacidade da única instância (free tier).
// 2) Gera custo? Compute/DB por request. A assinatura é verificada antes de qualquer
//    escrita (`provider.verifySignature`), então evento forjado é rejeitado cedo — mas
//    o flood em si já custa CPU/conexões.
// 3) Rate limit? Sim — teto IP-based generoso (ver webhook-rate-limit.js): fail-open sob
//    falha de Redis e provedores repetem em 429 → nenhum evento de pagamento é perdido.
// 4) Limite por tenant? Não se aplica no nível HTTP — o tenant só é conhecido após
//    verificar a assinatura e ler o payload. Os controles por-tenant desta rota são a
//    verificação de assinatura + idempotência (`payment_gateway_events`), não o IP.
router.post('/kiwify', webhookAbuseRateLimit, webhooksController.receiveKiwifyWebhook);
router.post('/abacatepay', webhookAbuseRateLimit, webhooksController.receiveAbacatepayWebhook);

module.exports = router;
