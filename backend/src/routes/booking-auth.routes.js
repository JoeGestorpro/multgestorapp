const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireBookingCustomerAuth } = require('../middlewares/auth.middleware');
const createRateLimit = require('../middlewares/rate-limit.middleware');
const { validateRequest } = require('../shared/core/validation');
const { bookingLoginSchema } = require('../shared/core/validation/schemas');

const router = express.Router();
const sensitiveAuthRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

const generalAuthRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20
});

router.post('/login', loginRateLimit, validateRequest(bookingLoginSchema), authController.bookingLogin);
router.get('/me', authMiddleware, requireBookingCustomerAuth, authController.bookingMe);
router.post('/refresh', generalAuthRateLimit, authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
