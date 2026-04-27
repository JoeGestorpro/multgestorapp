const express = require('express');
const barberController = require('../controllers/barber.controller');
const clientBookingController = require('../controllers/client-booking.controller');
const authController = require('../controllers/auth.controller');
const createRateLimit = require('../middlewares/rate-limit.middleware');

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

module.exports = router;
