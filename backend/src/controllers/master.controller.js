const masterService = require('../services/master.service');
const masterFinanceService = require('../services/master-finance.service');

function sendError(res, error, fallbackMessage) {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? fallbackMessage : error.message
  });
}

function wrap(handler, fallbackMessage) {
  return async function wrappedHandler(req, res) {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(fallbackMessage, error);
      sendError(res, error, fallbackMessage);
    }
  };
}

const getDashboard = wrap(async (req, res) => {
  const dashboard = await masterService.getDashboardData();
  res.json({ success: true, data: dashboard });
}, 'Erro ao carregar dashboard master');

const listCompanies = wrap(async (req, res) => {
  const companies = await masterService.listCompanies(req.query);
  res.json({ success: true, data: companies });
}, 'Erro ao listar empresas');

const getCompany = wrap(async (req, res) => {
  const company = await masterService.getCompany(req.params.id);
  res.json({ success: true, data: company });
}, 'Erro ao carregar empresa');

const createCompany = wrap(async (req, res) => {
  const company = await masterService.createCompany(req.body, req.user);
  res.status(201).json({ success: true, data: company });
}, 'Erro ao criar empresa');

const updateCompany = wrap(async (req, res) => {
  const company = await masterService.updateCompany(req.params.id, req.body, req.user);
  res.json({ success: true, data: company });
}, 'Erro ao atualizar empresa');

const deleteCompany = wrap(async (req, res) => {
  await masterService.deleteCompany(req.params.id, req.user);
  res.json({ success: true, message: 'Empresa removida com sucesso' });
}, 'Erro ao remover empresa');

const updateCompanyStatus = wrap(async (req, res) => {
  const company = await masterService.updateCompanyStatus(req.params.id, req.body.status, req.user);
  res.json({ success: true, data: company });
}, 'Erro ao alterar status da empresa');

const updateCompanyPlan = wrap(async (req, res) => {
  const companyId = req.params.clientId || req.params.id;
  const company = await masterService.updateCompanyPlan(companyId, req.body, req.user);
  res.json({ success: true, data: company });
}, 'Erro ao alterar plano da empresa');

const listModules = wrap(async (req, res) => {
  const modules = await masterService.listModules();
  res.json({ success: true, data: modules });
}, 'Erro ao listar modulos');

const getModule = wrap(async (req, res) => {
  const module = await masterService.getModule(req.params.id);
  res.json({ success: true, data: module });
}, 'Erro ao carregar modulo');

const createModule = wrap(async (req, res) => {
  const module = await masterService.createModule(req.body, req.user);
  res.status(201).json({ success: true, data: module });
}, 'Erro ao criar modulo');

const updateModule = wrap(async (req, res) => {
  const module = await masterService.updateModule(req.params.id, req.body, req.user);
  res.json({ success: true, data: module });
}, 'Erro ao atualizar modulo');

const updateModuleStatus = wrap(async (req, res) => {
  const module = await masterService.updateModuleStatus(req.params.id, req.body.is_active, req.user);
  res.json({ success: true, data: module });
}, 'Erro ao alterar status do modulo');

const deleteModule = wrap(async (req, res) => {
  const result = await masterService.deleteModule(req.params.id, req.user);
  res.json({ success: true, data: result, message: result.deactivated ? 'Modulo inativado por possuir vinculos' : 'Modulo removido com sucesso' });
}, 'Erro ao remover modulo');

const activateModuleForCompany = wrap(async (req, res) => {
  const companyModule = await masterService.activateModuleForCompany(req.body, req.user);
  res.status(201).json({ success: true, data: companyModule });
}, 'Erro ao vincular modulo');

const deactivateModuleForCompany = wrap(async (req, res) => {
  const companyModule = await masterService.deactivateModuleForCompany(req.body, req.user);
  res.json({ success: true, data: companyModule });
}, 'Erro ao desativar modulo da empresa');

const listCompanyModules = wrap(async (req, res) => {
  const companyModules = await masterService.listCompanyModules(req.query);
  res.json({ success: true, data: companyModules });
}, 'Erro ao listar modulos por empresa');

const listCompanyModulesByCompany = wrap(async (req, res) => {
  const companyModules = await masterService.listCompanyModules({ companyId: req.params.companyId });
  res.json({ success: true, data: companyModules });
}, 'Erro ao listar modulos da empresa');

const listSubscriptions = wrap(async (req, res) => {
  const subscriptions = await masterService.listSubscriptions(req.query);
  res.json({ success: true, data: subscriptions });
}, 'Erro ao listar assinaturas');

const getSubscription = wrap(async (req, res) => {
  const subscription = await masterService.getSubscription(req.params.id);
  res.json({ success: true, data: subscription });
}, 'Erro ao carregar assinatura');

const createSubscription = wrap(async (req, res) => {
  const subscription = await masterService.createSubscription(req.body, req.user);
  res.status(201).json({ success: true, data: subscription });
}, 'Erro ao criar assinatura');

const updateSubscription = wrap(async (req, res) => {
  const subscription = await masterService.updateSubscription(req.params.id, req.body, req.user);
  res.json({ success: true, data: subscription });
}, 'Erro ao atualizar assinatura');

const updateSubscriptionStatus = wrap(async (req, res) => {
  const subscription = await masterService.updateSubscriptionStatus(req.params.id, req.body.status, req.user);
  res.json({ success: true, data: subscription });
}, 'Erro ao alterar status da assinatura');

const listActivations = wrap(async (req, res) => {
  const activations = await masterService.listActivations(req.query);
  res.json({ success: true, data: activations });
}, 'Erro ao listar ativacoes');

const getActivationLink = wrap(async (req, res) => {
  const activation = await masterService.getActivationLink(req.params.id, req.user);
  res.json({ success: true, data: activation });
}, 'Erro ao carregar link de ativacao');

const resendActivation = wrap(async (req, res) => {
  await masterService.resendActivation(req.params.id, req.user);
  res.json({ success: true, message: 'Ativacao reenviada com sucesso' });
}, 'Erro ao reenviar ativacao');

const cancelActivation = wrap(async (req, res) => {
  await masterService.cancelActivation(req.params.id, req.user);
  res.json({ success: true, message: 'Ativacao cancelada com sucesso' });
}, 'Erro ao cancelar ativacao');

const getSettings = wrap(async (req, res) => {
  const settings = await masterService.getSettings();
  res.json({ success: true, data: settings });
}, 'Erro ao carregar configuracoes');

const updateSettings = wrap(async (req, res) => {
  const settings = await masterService.updateSettings(req.body, req.user);
  res.json({ success: true, data: settings });
}, 'Erro ao salvar configuracoes');

const listAuditLogs = wrap(async (req, res) => {
  const logs = await masterService.listAuditLogs(req.query);
  res.json({ success: true, data: logs });
}, 'Erro ao listar logs de auditoria');

const generateFirstAccess = wrap(async (req, res) => {
  const result = await masterService.generateFirstAccess(req.body, req.user);
  res.status(201).json({ success: true, data: result });
}, 'Erro ao gerar primeiro acesso');

const createManualCompanyAccess = wrap(async (req, res) => {
  const companyId = req.params.clientId || req.params.id;
  const user = await masterService.createManualCompanyAccess(companyId, req.body, req.user);
  res.status(201).json({
    success: true,
    message: 'Acesso manual criado com sucesso.',
    user
  });
}, 'Erro ao criar acesso manual');

const getFinanceOverview = wrap(async (req, res) => {
  const overview = await masterFinanceService.getFinanceOverview();
  res.json({ success: true, data: overview });
}, 'Erro ao carregar overview financeiro');

const getFinanceMrr = wrap(async (req, res) => {
  const series = await masterFinanceService.getMrrSeries(req.query.months);
  res.json({ success: true, data: series });
}, 'Erro ao carregar serie de MRR');

const getFinanceRevenueByModule = wrap(async (req, res) => {
  const report = await masterFinanceService.getRevenueByModule();
  res.json({ success: true, data: report });
}, 'Erro ao carregar receita por modulo');

const getFinanceRevenueByGateway = wrap(async (req, res) => {
  const report = await masterFinanceService.getRevenueByGateway();
  res.json({ success: true, data: report });
}, 'Erro ao carregar receita por gateway');

const listFinanceSubscriptions = wrap(async (req, res) => {
  const subscriptions = await masterFinanceService.listFinanceSubscriptions(req.query);
  res.json({ success: true, data: subscriptions });
}, 'Erro ao listar assinaturas financeiras');

const listFinanceEvents = wrap(async (req, res) => {
  const events = await masterFinanceService.listFinanceEvents(req.query);
  res.json({ success: true, data: events });
}, 'Erro ao listar eventos financeiros');

const listFinanceAlerts = wrap(async (req, res) => {
  const alerts = await masterFinanceService.getFinancialAlerts();
  res.json({ success: true, data: alerts });
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
