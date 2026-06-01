const express = require('express');
const webhooksController = require('../controllers/webhooks.controller');

const router = express.Router();

router.post('/kiwify', webhooksController.receiveKiwifyWebhook);
router.post('/abacatepay', webhooksController.receiveAbacatepayWebhook);

module.exports = router;
