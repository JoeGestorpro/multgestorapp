const express = require('express');
const barberController = require('../controllers/barber.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireBarberAdminAuth } = require('../middlewares/auth.middleware');
const requireActivePlan = require('../middlewares/requireActivePlan');
const requirePlanFeature = require('../middlewares/requirePlanFeature');
const requireCompany = require('../middleware/requireCompany');
const pool = require('../config/database');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo invalido. Aceito apenas JPG, PNG e WEBP.'));
    }
  }
});

const router = express.Router();

router.post('/collaborator-login', barberController.collaboratorLogin);
router.get('/public/:slug/booking-info', barberController.getPublicBooking);
router.get('/public/:slug/available-slots', barberController.getPublicAvailableSlots);
router.post('/public/:slug/appointments', barberController.createPublicBookingAppointment);

async function requireBarberModule(req, res, next) {
  try {
    if (!req.user?.company_id) {
      return res.status(403).json({
        success: false,
        error: 'Usuario sem empresa vinculada'
      });
    }

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
  } catch (error) {
    console.error('Erro ao validar modulo barber:', error);

    return res.status(500).json({
      success: false,
      error: 'Erro ao validar acesso ao modulo'
    });
  }
}

router.use(authMiddleware);
router.use(requireBarberAdminAuth);
router.use(requireCompany);
router.use(requireBarberModule);

router.get('/me', barberController.barberMe);
router.get('/company/plan', barberController.getCompanyPlan);
router.get('/settings', barberController.getSettings);
router.patch('/settings', barberController.updateSettings);
router.post('/settings/pin/forgot', barberController.forgotPin);
router.post('/settings/pin/reset', barberController.resetPin);
router.get('/my-dashboard', barberController.myDashboard);
router.get('/my-sales', barberController.mySales);
router.get('/my-report', requirePlanFeature('advanced_reports'), barberController.myReport);
router.post('/cash/open', requirePlanFeature('financial_dashboard'), barberController.openCash);
router.get('/cash/today', requirePlanFeature('financial_dashboard'), barberController.getTodayCash);
router.get('/cash/daily/:date', requirePlanFeature('financial_dashboard'), barberController.getDailyCash);
router.get('/cash/history', requirePlanFeature('financial_dashboard'), barberController.listCashHistory);
router.get('/cash/weekly', requirePlanFeature('financial_dashboard'), barberController.getWeeklyCash);
router.get('/cash/monthly', requirePlanFeature('financial_dashboard'), barberController.getMonthlyCash);
router.post('/cash/pre-close', requirePlanFeature('financial_dashboard'), barberController.preCloseCash);
router.post('/cash/close', requirePlanFeature('financial_dashboard'), barberController.closeCash);
router.post('/cash/reopen', requirePlanFeature('financial_dashboard'), barberController.reopenCash);
router.get('/dashboard', barberController.getDashboard);
router.get('/services', barberController.listServices);
router.get('/services/:id', barberController.getServiceById);
router.post('/services', barberController.createService);
router.put('/services/:id', barberController.updateService);
router.delete('/services/:id', barberController.deleteService);
router.patch('/services/:id/status', barberController.updateServiceStatus);
router.get('/suppliers', barberController.listSuppliers);
router.get('/suppliers/:id', barberController.getSupplierById);
router.post('/suppliers', barberController.createSupplier);
router.put('/suppliers/:id', barberController.updateSupplier);
router.delete('/suppliers/:id', barberController.deleteSupplier);
router.patch('/suppliers/:id/status', barberController.updateSupplierStatus);
router.get('/products', barberController.listProducts);
router.get('/products/:id', barberController.getProductById);
router.post('/products', barberController.createProduct);
router.put('/products/:id', barberController.updateProduct);
router.delete('/products/:id', barberController.deleteProduct);
router.patch('/products/:id/status', barberController.updateProductStatus);
router.get('/collaborators', barberController.listCollaborators);
router.get('/collaborators/financial-summary', requirePlanFeature('advanced_reports'), barberController.listCollaboratorFinancialSummary);
router.get('/collaborators/:id', barberController.getCollaboratorById);
router.post('/collaborators', requireActivePlan, requirePlanFeature('collaborators'), barberController.createCollaborator);
router.put('/collaborators/:id', barberController.updateCollaborator);
router.post('/collaborators/:id/avatar', upload.single('avatar'), barberController.saveCollaboratorAvatar);
router.delete('/collaborators/:id/avatar', barberController.removeCollaboratorAvatar);
router.patch('/collaborators/:id/status', barberController.updateCollaboratorStatus);
router.patch('/collaborators/:id/permissions', requirePlanFeature('extra_permissions'), barberController.updateCollaboratorPermissions);
router.delete('/collaborators/:id', barberController.deleteCollaborator);
router.get('/advances', barberController.listAdvances);
router.post('/advances', barberController.createAdvance);
router.patch('/advances/:id/approve', barberController.approveAdvance);
router.patch('/advances/:id/reject', barberController.rejectAdvance);
router.get('/settlements', requirePlanFeature('advanced_reports'), barberController.listSettlements);
router.post('/settlements', requirePlanFeature('advanced_reports'), barberController.createSettlement);
router.get('/appointments', requirePlanFeature('advanced_schedule'), barberController.listAppointments);
router.post('/appointments', requirePlanFeature('advanced_schedule'), barberController.createAppointment);
router.patch('/appointments/:id/status', requirePlanFeature('advanced_schedule'), barberController.updateAppointmentStatus);
router.patch('/appointments/:id/reschedule', requirePlanFeature('advanced_schedule'), barberController.rescheduleAppointment);
router.delete('/appointments/:id', requirePlanFeature('advanced_schedule'), barberController.deleteAppointment);
router.get('/customers', barberController.listCustomers);
router.get('/customers/:id', barberController.getCustomerById);
router.patch('/customers/:id/status', barberController.updateCustomerStatus);
router.get('/sales', barberController.listSales);
router.get('/sales/summary', barberController.getSalesSummary);
router.post('/sales', requireActivePlan, barberController.createSale);
router.post('/sales/:id/cancel', barberController.cancelSale);
router.delete('/sales/:id', barberController.deleteSale);

router.get('/schedule/blocks', barberController.listScheduleBlocks);
router.post('/schedule/blocks', barberController.createScheduleBlock);
router.delete('/schedule/blocks/:id', barberController.deleteScheduleBlock);

router.get('/working-hours', barberController.listWorkingHours);
router.post('/working-hours', barberController.updateWorkingHours);

module.exports = router;
