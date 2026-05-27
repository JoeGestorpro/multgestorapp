const { asyncHandler, success } = require('../../shared');
const BarberCoreService = require('../../services/barber-core.service');
const barberCoreService = new BarberCoreService();

const listSales = asyncHandler(async (req, res) => {
  const sales = await barberCoreService.listSales(req.user.company_id, req.user, req.query);

  return success(res, sales);
}, 'Erro ao listar vendas');

const getSalesSummary = asyncHandler(async (req, res) => {
  const summary = await barberCoreService.getSalesSummary(req.user.company_id, req.user, req.query);

  return success(res, summary);
}, 'Erro ao carregar resumo de vendas');

const createSale = asyncHandler(async (req, res) => {
  const sale = await barberCoreService.createSale(req.user.company_id, req.user, req.body);

  return success(res, sale, { statusCode: 201 });
}, 'Erro ao criar venda');

const deleteSale = asyncHandler(async (req, res) => {
  const sale = await barberCoreService.deleteSale(req.user.company_id, req.params.id);

  return success(res, sale);
}, 'Erro ao deletar venda');

const cancelSale = asyncHandler(async (req, res) => {
  const result = await barberCoreService.cancelSale(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, result);
}, 'Erro ao cancelar venda');

module.exports = { listSales, getSalesSummary, createSale, cancelSale, deleteSale };
