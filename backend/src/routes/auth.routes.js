const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireBackofficeAuth } = require('../middlewares/auth.middleware');
const createRateLimit = require('../middlewares/rate-limit.middleware');

const router = express.Router();
const sensitiveAuthRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/barber/login', authController.login);
router.post('/master/login', authController.masterLogin);
router.post('/first-access/validate', authController.validateFirstAccess);
router.post('/first-access/set-password', sensitiveAuthRateLimit, authController.setFirstAccessPassword);
router.get('/validate-first-access-token', authController.validateFirstAccess);
router.post('/set-password', sensitiveAuthRateLimit, authController.setFirstAccessPassword);
router.post('/forgot-password', sensitiveAuthRateLimit, authController.forgotPassword);
router.post('/reset-password', sensitiveAuthRateLimit, authController.resetPassword);
router.get('/me', authMiddleware, requireBackofficeAuth, authController.me);

module.exports = router;
