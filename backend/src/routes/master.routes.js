const express = require('express');
const masterController = require('../controllers/master.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireMasterAdminAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(requireMasterAdminAuth);

router.get('/dashboard', masterController.getDashboard);
router.get('/finance/overview', masterController.getFinanceOverview);
router.get('/finance/mrr', masterController.getFinanceMrr);
router.get('/finance/revenue-by-module', masterController.getFinanceRevenueByModule);
router.get('/finance/revenue-by-gateway', masterController.getFinanceRevenueByGateway);
router.get('/finance/subscriptions', masterController.listFinanceSubscriptions);
router.get('/finance/events', masterController.listFinanceEvents);
router.get('/finance/alerts', masterController.listFinanceAlerts);

router.get('/companies', masterController.listCompanies);
router.post('/companies', masterController.createCompany);
router.get('/companies/:id', masterController.getCompany);
router.put('/companies/:id', masterController.updateCompany);
router.patch('/companies/:id/status', masterController.updateCompanyStatus);
router.delete('/companies/:id', masterController.deleteCompany);

router.get('/modules', masterController.listModules);
router.post('/modules', masterController.createModule);
router.get('/modules/:id', masterController.getModule);
router.put('/modules/:id', masterController.updateModule);
router.patch('/modules/:id', masterController.updateModule);
router.patch('/modules/:id/status', masterController.updateModuleStatus);
router.delete('/modules/:id', masterController.deleteModule);

router.get('/company-modules', masterController.listCompanyModules);
router.post('/company-modules', masterController.activateModuleForCompany);
router.post('/company-modules/activate', masterController.activateModuleForCompany);
router.post('/company-modules/deactivate', masterController.deactivateModuleForCompany);
router.get('/company-modules/company/:companyId', masterController.listCompanyModulesByCompany);

router.get('/subscriptions', masterController.listSubscriptions);
router.post('/subscriptions', masterController.createSubscription);
router.get('/subscriptions/:id', masterController.getSubscription);
router.put('/subscriptions/:id', masterController.updateSubscription);
router.patch('/subscriptions/:id/status', masterController.updateSubscriptionStatus);

router.get('/activations', masterController.listActivations);
router.patch('/activations/:id/resend', masterController.resendActivation);
router.patch('/activations/:id/cancel', masterController.cancelActivation);

router.get('/settings', masterController.getSettings);
router.put('/settings', masterController.updateSettings);

router.get('/audit-logs', masterController.listAuditLogs);

router.post('/first-access/generate', masterController.generateFirstAccess);
router.post('/first-access', masterController.generateFirstAccess);

module.exports = router;
