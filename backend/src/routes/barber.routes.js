const express = require('express');
const barberController = require('../controllers/barber');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireBarberAdminAuth } = require('../middlewares/auth.middleware');
const createRateLimit = require('../middlewares/rate-limit.middleware');
const requireActivePlan = require('../middlewares/requireActivePlan');
const requirePlanFeature = require('../middlewares/requirePlanFeature');
const requireCompany = require('../middlewares/requireCompany');
const { asyncHandler } = require('../shared');
const multer = require('multer');
const requireBarberModule = require('../middlewares/requireBarberModule');
const { validateRequest } = require('../shared/core/validation');
const {
  createSaleSchema,
  createCollaboratorSchema,
  createServiceSchema,
  createAppointmentSchema,
  createAdvanceSchema,
  updateServiceSchema,
  updateServiceStatusSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
  updateCustomerSchema,
  updateCustomerStatusSchema,
  updateCollaboratorSchema,
  updateCollaboratorStatusSchema
} = require('../shared/core/validation/schemas');

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

// Controle de abuso/custo das rotas públicas de agendamento (mesmo padrão de public-booking.routes.js).
// Estas rotas duplicam endpoints em /api/public/booking/:slug sem auth — precisam do mesmo rate limit
// para evitar bypass do limite via caminho alternativo.

// Leitura pública: teto generoso por IP para não punir uso legítimo.
const barberPublicReadRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60
});

// Teto por IP para criação pública (anti-flood por origem).
const barberPublicBookingIpRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

// Cota por tenant (slug), independente de IP: impede flood da agenda de UMA barbearia
// mesmo com rotação de IP. Janela maior, teto por estabelecimento.
const barberPublicBookingTenantRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => `booking-tenant:${req.params.slug}`
});

router.get('/public/:slug/booking-info', barberPublicReadRateLimit, barberController.getPublicBooking);
router.get('/public/:slug/available-slots', barberPublicReadRateLimit, barberController.getPublicAvailableSlots);
router.post('/public/:slug/appointments', barberPublicBookingIpRateLimit, barberPublicBookingTenantRateLimit, barberController.createPublicBookingAppointment);

router.use(authMiddleware);
router.use(requireBarberAdminAuth);
router.use(requireCompany);
router.use(requireBarberModule);

router.get('/me', barberController.barberMe);
router.get('/company/theme', barberController.getCompanyTheme);
router.put('/company/theme', barberController.updateCompanyTheme);
router.get('/company/onboarding-status', barberController.getOnboardingStatus);
router.put('/company/setup', barberController.saveOnboardingSetup);
router.patch('/company/profile', barberController.updateCompanyProfile);
router.get('/company/plan', barberController.getCompanyPlan);
router.get('/company/branding', barberController.getCompanyBranding);
router.put('/company/branding', barberController.updateCompanyBranding);
router.get('/booking/landing', barberController.getBookingLanding);
router.put('/booking/landing', barberController.updateBookingLanding);
router.post('/booking/landing/banner', upload.single('image'), barberController.uploadBookingBanner);
router.delete('/booking/landing/banner', barberController.removeBookingBanner);
router.post('/booking/landing/gallery', upload.single('image'), barberController.addBookingGalleryImage);
router.delete('/booking/landing/gallery/:imageId', barberController.removeBookingGalleryImage);
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
router.get('/services/analytics', barberController.getServicesAnalytics);
router.get('/services/:id', barberController.getServiceById);
router.post('/services', validateRequest(createServiceSchema), barberController.createService);
router.put('/services/:id', validateRequest(updateServiceSchema), barberController.updateService);
router.delete('/services/:id', barberController.deleteService);
router.patch('/services/:id/status', validateRequest(updateServiceStatusSchema), barberController.updateServiceStatus);
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
router.get('/fridge-items/report', barberController.getFridgeReport);
router.patch('/fridge-items/:id/favorite', barberController.toggleFridgeFavorite);
router.get('/collaborators', barberController.listCollaborators);
router.get('/collaborators/financial-summary', requirePlanFeature('advanced_reports'), barberController.listCollaboratorFinancialSummary);
router.get('/collaborators/:id', barberController.getCollaboratorById);
router.post('/collaborators', requireActivePlan, requirePlanFeature('collaborators'), validateRequest(createCollaboratorSchema), barberController.createCollaborator);
router.put('/collaborators/:id', validateRequest(updateCollaboratorSchema), barberController.updateCollaborator);
router.post('/collaborators/:id/avatar', upload.single('avatar'), barberController.saveCollaboratorAvatar);
router.delete('/collaborators/:id/avatar', barberController.removeCollaboratorAvatar);
router.patch('/collaborators/:id/status', validateRequest(updateCollaboratorStatusSchema), barberController.updateCollaboratorStatus);
router.patch('/collaborators/:id/permissions', requirePlanFeature('extra_permissions'), barberController.updateCollaboratorPermissions);
router.delete('/collaborators/:id', barberController.deleteCollaborator);
router.get('/advances', barberController.listAdvances);
router.post('/advances', validateRequest(createAdvanceSchema), barberController.createAdvance);
router.patch('/advances/:id/approve', barberController.approveAdvance);
router.patch('/advances/:id/reject', barberController.rejectAdvance);
router.get('/settlements', requirePlanFeature('advanced_reports'), barberController.listSettlements);
router.post('/settlements', requirePlanFeature('advanced_reports'), barberController.createSettlement);
router.get('/appointments', requirePlanFeature('advanced_schedule'), barberController.listAppointments);
router.post('/appointments', requirePlanFeature('advanced_schedule'), validateRequest(createAppointmentSchema), barberController.createAppointment);
router.patch('/appointments/:id/status', requirePlanFeature('advanced_schedule'), validateRequest(updateAppointmentStatusSchema), barberController.updateAppointmentStatus);
router.patch('/appointments/:id/reschedule', requirePlanFeature('advanced_schedule'), validateRequest(rescheduleAppointmentSchema), barberController.rescheduleAppointment);
router.delete('/appointments/:id', requirePlanFeature('advanced_schedule'), barberController.deleteAppointment);
router.get('/customers', barberController.listCustomers);
router.get('/customers/:id', barberController.getCustomerById);
router.get('/customers/:id/crm', barberController.getCustomerCrm);
router.get('/customers/:id/history', barberController.getCustomerHistory);
router.post('/customers/:id/notes', barberController.createCustomerNote);
router.put('/customers/:id', validateRequest(updateCustomerSchema), barberController.updateCustomerData);
router.patch('/customers/:id/status', validateRequest(updateCustomerStatusSchema), barberController.updateCustomerStatus);
router.get('/financial/summary', requirePlanFeature('financial_dashboard'), barberController.getSummary);
router.get('/financial/dre', requirePlanFeature('advanced_reports'), barberController.getDre);
router.get('/financial/by-payment-method', requirePlanFeature('financial_dashboard'), barberController.getByPaymentMethod);
router.get('/financial/by-collaborator', requirePlanFeature('advanced_reports'), barberController.getByCollaborator);

router.get('/wallet/balance', requirePlanFeature('financial_dashboard'), barberController.getWalletBalance);
router.get('/wallet/transactions', requirePlanFeature('financial_dashboard'), barberController.getTransactions);
router.post('/wallet/topup', requirePlanFeature('financial_dashboard'), barberController.createTopup);
router.get('/deposit-config', requirePlanFeature('financial_dashboard'), barberController.getDepositConfig);
router.put('/deposit-config', requirePlanFeature('financial_dashboard'), barberController.updateDepositConfig);

router.get('/sales', barberController.listSales);
router.get('/sales/summary', barberController.getSalesSummary);
router.post('/sales', requireActivePlan, validateRequest(createSaleSchema), barberController.createSale);
router.post('/sales/:id/cancel', barberController.cancelSale);
router.delete('/sales/:id', barberController.deleteSale);

router.get('/schedule/blocks', barberController.listScheduleBlocks);
router.post('/schedule/blocks', barberController.createScheduleBlock);
router.delete('/schedule/blocks/:id', barberController.deleteScheduleBlock);

router.get('/working-hours', barberController.listWorkingHours);
router.post('/working-hours', barberController.updateWorkingHours);

router.get('/availability', barberController.getAvailability);
router.put('/availability', barberController.updateAvailability);

router.get('/crm/summary', barberController.getCrmSummary);
router.get('/agenda/crm', barberController.getAgendaCrm);

// Pacotes — PRD-009
router.get('/packages', requirePlanFeature('advanced_reports'), barberController.list);
router.post('/packages', requirePlanFeature('advanced_reports'), barberController.create);
router.put('/packages/:id', requirePlanFeature('advanced_reports'), barberController.update);
router.delete('/packages/:id', requirePlanFeature('advanced_reports'), barberController.remove);
router.post('/packages/:id/purchase', requirePlanFeature('financial_dashboard'), barberController.purchase);
router.get('/customers/:id/packages', requirePlanFeature('advanced_reports'), barberController.customerPackages);

// Fidelidade — PRD-010
router.get('/loyalty/program', requirePlanFeature('advanced_reports'), barberController.getProgram);
router.put('/loyalty/program', requirePlanFeature('advanced_reports'), barberController.updateProgram);
router.get('/customers/:id/loyalty', requirePlanFeature('advanced_reports'), barberController.getBalance);
router.get('/customers/:id/loyalty/transactions', requirePlanFeature('advanced_reports'), barberController.listTransactions);
router.post('/customers/:id/loyalty/redeem', requirePlanFeature('financial_dashboard'), barberController.redeem);

// Anamnese — PRD-011
router.get('/anamnesis/templates', requirePlanFeature('advanced_reports'), barberController.listTemplates);
router.post('/anamnesis/templates', requirePlanFeature('advanced_reports'), barberController.createTemplate);
router.put('/anamnesis/templates/:id', requirePlanFeature('advanced_reports'), barberController.updateTemplate);
router.delete('/anamnesis/templates/:id', requirePlanFeature('advanced_reports'), barberController.removeTemplate);
router.get('/customers/:id/anamnesis', requirePlanFeature('advanced_reports'), barberController.getResponse);
router.put('/customers/:id/anamnesis', requirePlanFeature('advanced_reports'), barberController.updateResponse);
router.post('/customers/:id/anamnesis/export', requirePlanFeature('advanced_reports'), barberController.exportData);
router.delete('/customers/:id/anamnesis', requirePlanFeature('advanced_reports'), barberController.requestDelete);

const integrationRoutes = require('./integration.routes');
router.use('/integrations', integrationRoutes);

module.exports = router;
