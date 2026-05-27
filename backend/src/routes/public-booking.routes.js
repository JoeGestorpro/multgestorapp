const express = require('express');
const barberController = require('../controllers/barber');
const clientBookingController = require('../controllers/client-booking.controller');
const authController = require('../controllers/auth.controller');
const createRateLimit = require('../middlewares/rate-limit.middleware');
const { PLAN_FEATURES, FEATURE_MIN_PLAN } = require('../utils/planFeatures');
const { PLAN_DEFINITIONS } = require('../services/company-plan.service');

const router = express.Router();
const sensitivePublicRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

router.get('/booking/:slug', barberController.getPublicBooking);
router.post('/booking/:slug/appointments', barberController.createPublicBookingAppointment);
router.post('/booking/:companySlug/register', sensitivePublicRateLimit, clientBookingController.preRegister);
router.post('/booking/:companySlug/login', sensitivePublicRateLimit, (req, res, next) => {
  req.body.companySlug = req.body.companySlug || req.params.companySlug;
  return authController.bookingLogin(req, res, next);
});
router.post('/booking/:companySlug/resend-confirmation', sensitivePublicRateLimit, (req, res, next) => {
  req.body.companySlug = req.body.companySlug || req.params.companySlug;
  return clientBookingController.resendConfirmation(req, res, next);
});
router.post('/scheduling/:companySlug/pre-register', sensitivePublicRateLimit, clientBookingController.preRegister);
router.post('/scheduling/resend-confirmation', sensitivePublicRateLimit, clientBookingController.resendConfirmation);
router.get('/scheduling/confirm-email', clientBookingController.confirmEmail);
router.get('/scheduling/:companySlug/availability', clientBookingController.getAvailability);

// GET /api/public/plan-config
// Retorna planos, limites e features para o frontend consumir (dado público)
router.get('/plan-config', (req, res) => {
  const PLAN_OPTIONS = [
    { value: 'trial',        label: 'Teste grátis' },
    { value: 'free',         label: 'Gratuito' },
    { value: 'essencial',    label: 'Essencial' },
    { value: 'profissional', label: 'Profissional' },
    { value: 'premium',      label: 'Premium' }
  ];

  return res.json({
    success: true,
    data: {
      plans: PLAN_OPTIONS,
      limits: PLAN_DEFINITIONS,
      features: PLAN_FEATURES,
      feature_min_plan: FEATURE_MIN_PLAN
    }
  });
});

// GET /api/public/plan-options
// Retorna planos formatados para self-service de plano (precos e limites)
router.get('/plan-options', (req, res) => {
  const PLAN_OPTIONS = [
    {
      value: 'essencial',
      label: 'Essencial',
      description: 'Ideal para comecar',
      price_monthly: 49.90,
      price_yearly: 499.00,
      max_collaborators: 2,
      features: ['Agendamento online', 'Controle de clientes', 'Relatorios basicos']
    },
    {
      value: 'profissional',
      label: 'Profissional',
      description: 'Para barbearias em crescimento',
      price_monthly: 99.90,
      price_yearly: 999.00,
      max_collaborators: 5,
      features: ['Tudo do Essencial', 'Controle de caixa', 'Comissoes automaticas', 'Multi-filial']
    },
    {
      value: 'premium',
      label: 'Premium',
      description: 'Solucao completa',
      price_monthly: 149.90,
      price_yearly: 1499.00,
      max_collaborators: null,
      features: ['Tudo do Profissional', 'API e integracoes', 'Suporte prioritario', 'Dominio proprio']
    }
  ];

  return res.json({
    success: true,
    data: { plans: PLAN_OPTIONS }
  });
});

module.exports = router;
