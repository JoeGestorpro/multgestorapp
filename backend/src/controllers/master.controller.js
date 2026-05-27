const masterService = require('../services/master.service');
const masterFinanceService = require('../services/master-finance.service');
const { asyncHandler, success } = require('../shared');

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await masterService.getDashboardData();
  return success(res, dashboard);
}, 'Erro ao carregar dashboard master');

const listCompanies = asyncHandler(async (req, res) => {
  const companies = await masterService.listCompanies(req.query);
  return success(res, companies);
}, 'Erro ao listar empresas');

const getCompany = asyncHandler(async (req, res) => {
  const company = await masterService.getCompany(req.params.id);
  return success(res, company);
}, 'Erro ao carregar empresa');

const createCompany = asyncHandler(async (req, res) => {
  const company = await masterService.createCompany(req.body, req.user);
  return success(res, company, { statusCode: 201 });
}, 'Erro ao criar empresa');

const updateCompany = asyncHandler(async (req, res) => {
  const company = await masterService.updateCompany(req.params.id, req.body, req.user);
  return success(res, company);
}, 'Erro ao atualizar empresa');

const deleteCompany = asyncHandler(async (req, res) => {
  await masterService.deleteCompany(req.params.id, req.user);
  return success(res, null, { message: 'Empresa removida com sucesso' });
}, 'Erro ao remover empresa');

const updateCompanyStatus = asyncHandler(async (req, res) => {
  const company = await masterService.updateCompanyStatus(req.params.id, req.body.status, req.user);
  return success(res, company);
}, 'Erro ao alterar status da empresa');

const updateCompanyPlan = asyncHandler(async (req, res) => {
  const companyId = req.params.clientId || req.params.id;
  const company = await masterService.updateCompanyPlan(companyId, req.body, req.user);
  return success(res, company);
}, 'Erro ao alterar plano da empresa');

const listModules = asyncHandler(async (req, res) => {
  const modules = await masterService.listModules();
  return success(res, modules);
}, 'Erro ao listar modulos');

const getModule = asyncHandler(async (req, res) => {
  const module = await masterService.getModule(req.params.id);
  return success(res, module);
}, 'Erro ao carregar modulo');

const createModule = asyncHandler(async (req, res) => {
  const module = await masterService.createModule(req.body, req.user);
  return success(res, module, { statusCode: 201 });
}, 'Erro ao criar modulo');

const updateModule = asyncHandler(async (req, res) => {
  const module = await masterService.updateModule(req.params.id, req.body, req.user);
  return success(res, module);
}, 'Erro ao atualizar modulo');

const updateModuleStatus = asyncHandler(async (req, res) => {
  const module = await masterService.updateModuleStatus(req.params.id, req.body.is_active, req.user);
  return success(res, module);
}, 'Erro ao alterar status do modulo');

const deleteModule = asyncHandler(async (req, res) => {
  const result = await masterService.deleteModule(req.params.id, req.user);
  return success(res, result, { message: result.deactivated ? 'Modulo inativado por possuir vinculos' : 'Modulo removido com sucesso' });
}, 'Erro ao remover modulo');

const activateModuleForCompany = asyncHandler(async (req, res) => {
  const companyModule = await masterService.activateModuleForCompany(req.body, req.user);
  return success(res, companyModule, { statusCode: 201 });
}, 'Erro ao vincular modulo');

const deactivateModuleForCompany = asyncHandler(async (req, res) => {
  const companyModule = await masterService.deactivateModuleForCompany(req.body, req.user);
  return success(res, companyModule);
}, 'Erro ao desativar modulo da empresa');

const listCompanyModules = asyncHandler(async (req, res) => {
  const companyModules = await masterService.listCompanyModules(req.query);
  return success(res, companyModules);
}, 'Erro ao listar modulos por empresa');

const listCompanyModulesByCompany = asyncHandler(async (req, res) => {
  const companyModules = await masterService.listCompanyModules({ companyId: req.params.companyId });
  return success(res, companyModules);
}, 'Erro ao listar modulos da empresa');

const listSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await masterService.listSubscriptions(req.query);
  return success(res, subscriptions);
}, 'Erro ao listar assinaturas');

const getSubscription = asyncHandler(async (req, res) => {
  const subscription = await masterService.getSubscription(req.params.id);
  return success(res, subscription);
}, 'Erro ao carregar assinatura');

const createSubscription = asyncHandler(async (req, res) => {
  const subscription = await masterService.createSubscription(req.body, req.user);
  return success(res, subscription, { statusCode: 201 });
}, 'Erro ao criar assinatura');

const updateSubscription = asyncHandler(async (req, res) => {
  const subscription = await masterService.updateSubscription(req.params.id, req.body, req.user);
  return success(res, subscription);
}, 'Erro ao atualizar assinatura');

const updateSubscriptionStatus = asyncHandler(async (req, res) => {
  const subscription = await masterService.updateSubscriptionStatus(req.params.id, req.body.status, req.user);
  return success(res, subscription);
}, 'Erro ao alterar status da assinatura');

const listActivations = asyncHandler(async (req, res) => {
  const activations = await masterService.listActivations(req.query);
  return success(res, activations);
}, 'Erro ao listar ativacoes');

const getActivationLink = asyncHandler(async (req, res) => {
  const activation = await masterService.getActivationLink(req.params.id, req.user);
  return success(res, activation);
}, 'Erro ao carregar link de ativacao');

const resendActivation = asyncHandler(async (req, res) => {
  await masterService.resendActivation(req.params.id, req.user);
  return success(res, null, { message: 'Ativacao reenviada com sucesso' });
}, 'Erro ao reenviar ativacao');

const cancelActivation = asyncHandler(async (req, res) => {
  await masterService.cancelActivation(req.params.id, req.user);
  return success(res, null, { message: 'Ativacao cancelada com sucesso' });
}, 'Erro ao cancelar ativacao');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await masterService.getSettings();
  return success(res, settings);
}, 'Erro ao carregar configuracoes');

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await masterService.updateSettings(req.body, req.user);
  return success(res, settings);
}, 'Erro ao salvar configuracoes');

const listAuditLogs = asyncHandler(async (req, res) => {
  const logs = await masterService.listAuditLogs(req.query);
  return success(res, logs);
}, 'Erro ao listar logs de auditoria');

const generateFirstAccess = asyncHandler(async (req, res) => {
  const result = await masterService.generateFirstAccess(req.body, req.user);
  return success(res, result, { statusCode: 201 });
}, 'Erro ao gerar primeiro acesso');

const createManualCompanyAccess = asyncHandler(async (req, res) => {
  const companyId = req.params.clientId || req.params.id;
  const user = await masterService.createManualCompanyAccess(companyId, req.body, req.user);
  return success(res, user, { statusCode: 201, message: 'Acesso manual criado com sucesso.' });
}, 'Erro ao criar acesso manual');

const getFinanceOverview = asyncHandler(async (req, res) => {
  const overview = await masterFinanceService.getFinanceOverview();
  return success(res, overview);
}, 'Erro ao carregar overview financeiro');

const getFinanceMrr = asyncHandler(async (req, res) => {
  const series = await masterFinanceService.getMrrSeries(req.query.months);
  return success(res, series);
}, 'Erro ao carregar serie de MRR');

const getFinanceRevenueByModule = asyncHandler(async (req, res) => {
  const report = await masterFinanceService.getRevenueByModule();
  return success(res, report);
}, 'Erro ao carregar receita por modulo');

const getFinanceRevenueByGateway = asyncHandler(async (req, res) => {
  const report = await masterFinanceService.getRevenueByGateway();
  return success(res, report);
}, 'Erro ao carregar receita por gateway');

const listFinanceSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await masterFinanceService.listFinanceSubscriptions(req.query);
  return success(res, subscriptions);
}, 'Erro ao listar assinaturas financeiras');

const listFinanceEvents = asyncHandler(async (req, res) => {
  const events = await masterFinanceService.listFinanceEvents(req.query);
  return success(res, events);
}, 'Erro ao listar eventos financeiros');

const listFinanceAlerts = asyncHandler(async (req, res) => {
  const alerts = await masterFinanceService.getFinancialAlerts();
  return success(res, alerts);
}, 'Erro ao listar alertas financeiros');

module.exports = {
  getDashboard,
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  updateCompanyStatus,
  updateCompanyPlan,
  listModules,
  getModule,
  createModule,
  updateModule,
  updateModuleStatus,
  deleteModule,
  activateModuleForCompany,
  deactivateModuleForCompany,
  listCompanyModules,
  listCompanyModulesByCompany,
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  updateSubscriptionStatus,
  listActivations,
  getActivationLink,
  resendActivation,
  cancelActivation,
  getSettings,
  updateSettings,
  listAuditLogs,
  generateFirstAccess,
  createManualCompanyAccess,
  getFinanceOverview,
  getFinanceMrr,
  getFinanceRevenueByModule,
  getFinanceRevenueByGateway,
  listFinanceSubscriptions,
  listFinanceEvents,
  listFinanceAlerts
};
