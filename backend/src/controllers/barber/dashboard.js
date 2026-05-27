const { asyncHandler, success } = require('../../shared');

const BarberCoreService = require('../../services/barber-core.service');
const barberCoreService = new BarberCoreService();

function sendError(req, res, error, fallbackMessage) {
  const statusCode = error.statusCode || 500;
  const traceId = req.traceId || null;

  if (error.responseBody && typeof error.responseBody === 'object') {
    return res.status(statusCode).json({ ...error.responseBody, ...(traceId && { traceId }) });
  }

  const message = statusCode >= 500
    ? (fallbackMessage || 'Erro interno no servidor')
    : (error.message || fallbackMessage || 'Erro interno no servidor');

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(traceId && { traceId })
  });
}

const myDashboard = asyncHandler(async (req, res) => {
  const dashboard = await barberCoreService.getMyDashboard(req.user.company_id, req.user);

  return success(res, dashboard);
}, 'Erro ao carregar dashboard pessoal');

const mySales = asyncHandler(async (req, res) => {
  const sales = await barberCoreService.getMySales(req.user.company_id, req.user);

  return success(res, sales);
}, 'Erro ao listar vendas pessoais');

const myReport = asyncHandler(async (req, res) => {
  const report = await barberCoreService.getMyReport(req.user.company_id, req.user, req.query);

  return success(res, report);
}, 'Erro ao carregar relatorio pessoal');

async function getDashboard(req, res) {
  try {
    const dashboard = await barberCoreService.getDashboard(req.user.company_id, req.user);

    return res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    req.log.error({ err: error }, 'Erro ao carregar dashboard barber');
    return sendError(req, res, error, 'Erro ao carregar dashboard');
  }
}

async function getServicesAnalytics(req, res) {
  try {
    const data = await barberCoreService.getServicesAnalytics(req.user.company_id, req.query);
    return res.json({ success: true, data });
  } catch (error) {
    req.log.error({ err: error }, 'Erro ao carregar analise de servicos');
    return sendError(req, res, error, 'Erro ao carregar analise de servicos');
  }
}

module.exports = {
  myDashboard,
  mySales,
  myReport,
  getDashboard,
  getServicesAnalytics
};
