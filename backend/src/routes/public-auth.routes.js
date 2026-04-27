const express = require('express');
const authController = require('../controllers/auth.controller');
const createRateLimit = require('../middlewares/rate-limit.middleware');

const router = express.Router();
const sensitiveAuthRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

router.post('/primeiro-acesso', sensitiveAuthRateLimit, authController.requestFirstAccess);
router.post('/set-password', sensitiveAuthRateLimit, authController.setFirstAccessPassword);
router.post('/forgot-password', sensitiveAuthRateLimit, authController.forgotPassword);
router.post('/reset-password', sensitiveAuthRateLimit, authController.resetPassword);

module.exports = router;
