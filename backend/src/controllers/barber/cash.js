const { asyncHandler, success } = require('../../shared');
const BarberCoreService = require('../../services/barber-core.service');
const barberCoreService = new BarberCoreService();

const openCash = asyncHandler(async (req, res) => {
  const cash = await barberCoreService.openCash(req.user.company_id, req.user, req.body);
  return success(res, cash, { statusCode: 201 });
}, 'Erro ao abrir caixa');

const getTodayCash = asyncHandler(async (req, res) => {
  const cash = await barberCoreService.getTodayCash(req.user.company_id, req.user);
  return success(res, cash);
}, 'Erro ao carregar caixa de hoje');

const getDailyCash = asyncHandler(async (req, res) => {
  const cash = await barberCoreService.getDailyCash(req.user.company_id, req.user, req.params.date);
  return success(res, cash);
}, 'Erro ao carregar caixa diario');

const listCashHistory = asyncHandler(async (req, res) => {
  const history = await barberCoreService.listCashHistory(req.user.company_id, req.user, req.query);
  return success(res, history);
}, 'Erro ao listar historico de caixa');

const getWeeklyCash = asyncHandler(async (req, res) => {
  const summary = await barberCoreService.getWeeklyCash(req.user.company_id, req.user, req.query);
  return success(res, summary);
}, 'Erro ao carregar relatorio semanal');

const getMonthlyCash = asyncHandler(async (req, res) => {
  const summary = await barberCoreService.getMonthlyCash(req.user.company_id, req.user, req.query);
  return success(res, summary);
}, 'Erro ao carregar relatorio mensal');

const preCloseCash = asyncHandler(async (req, res) => {
  const cash = await barberCoreService.preCloseCash(req.user.company_id, req.user, req.body);
  return success(res, cash);
}, 'Erro ao gerar pre-fechamento');

const closeCash = asyncHandler(async (req, res) => {
  const cash = await barberCoreService.closeCash(req.user.company_id, req.user, req.body);
  return success(res, cash);
}, 'Erro ao fechar caixa');

const reopenCash = asyncHandler(async (req, res) => {
  const cash = await barberCoreService.reopenCash(req.user.company_id, req.user, req.body);
  return success(res, cash);
}, 'Erro ao reabrir caixa');

module.exports = {
  openCash,
  getTodayCash,
  getDailyCash,
  listCashHistory,
  getWeeklyCash,
  getMonthlyCash,
  preCloseCash,
  closeCash,
  reopenCash
};
