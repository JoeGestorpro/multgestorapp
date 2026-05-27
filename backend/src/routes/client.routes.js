const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireBookingCustomerAuth } = require('../middlewares/auth.middleware');
const requireCompany = require('../middlewares/requireCompany');
const { asyncHandler } = require('../shared');
const clientBookingController = require('../controllers/client-booking.controller');
const pool = require('../config/database');

const router = express.Router();

const requireBarberModule = asyncHandler(async (req, res, next) => {
  const result = await pool.query(
    `SELECT modules.id
     FROM company_modules
     INNER JOIN modules ON modules.id = company_modules.module_id
     WHERE company_modules.company_id = $1
       AND company_modules.status = 'active'
       AND modules.slug = 'barber'
       AND modules.is_active = true
     LIMIT 1`,
    [req.user.company_id]
  );

  if (result.rowCount === 0) {
    return res.status(403).json({
      success: false,
      error: 'Modulo BarberGestor nao liberado para esta empresa'
    });
  }

  return next();
});

router.use(authMiddleware);
router.use(requireBookingCustomerAuth);
router.use(requireCompany);
router.use(requireBarberModule);

router.get('/appointments', clientBookingController.listMyAppointments);
router.post('/appointments', clientBookingController.createMyAppointment);
router.patch('/appointments/:id/cancel', clientBookingController.cancelMyAppointment);

module.exports = router;
