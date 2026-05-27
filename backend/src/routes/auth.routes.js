const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireBackofficeAuth } = require('../middlewares/auth.middleware');
const createRateLimit = require('../middlewares/rate-limit.middleware');
const { validateRequest } = require('../shared/core/validation');
const {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setFirstAccessPasswordSchema
} = require('../shared/core/validation/schemas');

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

router.post('/register', generalAuthRateLimit, validateRequest(registerSchema), authController.register);
router.post('/login', loginRateLimit, validateRequest(loginSchema), authController.login);
router.post('/barber/login', loginRateLimit, validateRequest(loginSchema), authController.login);
router.post('/master/login', loginRateLimit, validateRequest(loginSchema), authController.masterLogin);
router.post('/first-access/validate', authController.validateFirstAccess);
router.post('/first-access/set-password', sensitiveAuthRateLimit, validateRequest(setFirstAccessPasswordSchema), authController.setFirstAccessPassword);
router.get('/validate-first-access-token', authController.validateFirstAccess);
router.post('/set-password', sensitiveAuthRateLimit, validateRequest(setFirstAccessPasswordSchema), authController.setFirstAccessPassword);
router.post('/forgot-password', sensitiveAuthRateLimit, validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', sensitiveAuthRateLimit, validateRequest(resetPasswordSchema), authController.resetPassword);
router.get('/me', authMiddleware, requireBackofficeAuth, authController.me);
router.post('/refresh', generalAuthRateLimit, authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
