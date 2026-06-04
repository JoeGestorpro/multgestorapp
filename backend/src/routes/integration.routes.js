const express = require('express')
const integrationController = require('../controllers/integration.controller')
const { validateRequest } = require('../shared/core/validation')
const { upsertIntegrationSchema, testIntegrationSchema } = require('../shared/core/validation/schemas')

const router = express.Router()

router.get('/whatsapp', integrationController.getWhatsAppConfig)
router.put('/whatsapp', validateRequest(upsertIntegrationSchema), integrationController.upsertWhatsAppConfig)
router.delete('/whatsapp', integrationController.deleteWhatsAppConfig)
router.post('/whatsapp/test', validateRequest(testIntegrationSchema), integrationController.testWhatsAppConfig)

module.exports = router
