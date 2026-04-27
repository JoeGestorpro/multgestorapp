const express = require('express');
const barberController = require('../controllers/barber.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireBarberAdminAuth } = require('../middlewares/auth.middleware');
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
router.get('/my-dashboard', barberController.myDashboard);
router.get('/my-sales', barberController.mySales);
router.get('/my-report', barberController.myReport);
router.post('/cash/open', barberController.openCash);
router.get('/cash/today', barberController.getTodayCash);
router.get('/cash/daily/:date', barberController.getDailyCash);
router.get('/cash/history', barberController.listCashHistory);
router.get('/cash/weekly', barberController.getWeeklyCash);
router.get('/cash/monthly', barberController.getMonthlyCash);
router.post('/cash/pre-close', barberController.preCloseCash);
router.post('/cash/close', barberController.closeCash);
router.post('/cash/reopen', barberController.reopenCash);
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
router.get('/collaborators/financial-summary', barberController.listCollaboratorFinancialSummary);
router.get('/collaborators/:id', barberController.getCollaboratorById);
router.post('/collaborators', barberController.createCollaborator);
router.put('/collaborators/:id', barberController.updateCollaborator);
router.post('/collaborators/:id/avatar', upload.single('avatar'), barberController.saveCollaboratorAvatar);
router.delete('/collaborators/:id/avatar', barberController.removeCollaboratorAvatar);
router.patch('/collaborators/:id/status', barberController.updateCollaboratorStatus);
router.patch('/collaborators/:id/permissions', barberController.updateCollaboratorPermissions);
router.delete('/collaborators/:id', barberController.deleteCollaborator);
router.get('/advances', barberController.listAdvances);
router.post('/advances', barberController.createAdvance);
router.patch('/advances/:id/approve', barberController.approveAdvance);
router.patch('/advances/:id/reject', barberController.rejectAdvance);
router.get('/settlements', barberController.listSettlements);
router.post('/settlements', barberController.createSettlement);
router.get('/appointments', barberController.listAppointments);
router.post('/appointments', barberController.createAppointment);
router.patch('/appointments/:id', barberController.updateAppointment);
router.patch('/appointments/:id/cancel', barberController.cancelAppointment);
router.get('/customers', barberController.listCustomers);
router.get('/customers/:id', barberController.getCustomerById);
router.patch('/customers/:id/status', barberController.updateCustomerStatus);
router.get('/sales', barberController.listSales);
router.post('/sales', barberController.createSale);
router.delete('/sales/:id', barberController.deleteSale);

module.exports = router;
