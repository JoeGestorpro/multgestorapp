const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireBookingCustomerAuth } = require('../middlewares/auth.middleware');
const createRateLimit = require('../middlewares/rate-limit.middleware');

const router = express.Router();
const sensitiveAuthRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

router.post('/login', sensitiveAuthRateLimit, authController.bookingLogin);
router.get('/me', authMiddleware, requireBookingCustomerAuth, authController.bookingMe);

module.exports = router;
