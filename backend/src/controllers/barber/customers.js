const { asyncHandler, success } = require('../../shared');
const BarberCoreService = require('../../services/barber-core.service');
const CRMRepository = require('../../repositories/crm.repository');
const CRMService = require('../../services/crm.service');
const barberCoreService = new BarberCoreService();
const crmService = new CRMService(new CRMRepository());

const listCustomers = asyncHandler(async (req, res) => {
  const customers = await barberCoreService.listCustomers(req.user.company_id, req.user, req.query);

  return success(res, customers);
}, 'Erro ao listar clientes');

const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await barberCoreService.getCustomerById(req.user.company_id, req.params.id);

  return success(res, customer);
}, 'Erro ao buscar cliente');

const updateCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await crmService.updateCustomerStatus(req.user.company_id, req.params.id, req.body);

  return success(res, customer);
}, 'Erro ao atualizar status do cliente');

const getCustomerCrm = asyncHandler(async (req, res) => {
  const data = await crmService.getCustomerHistory(req.user.company_id, req.params.id);

  return success(res, data);
}, 'Erro ao carregar CRM do cliente');

const getCustomerHistory = asyncHandler(async (req, res) => {
  const data = await crmService.getCustomerHistory(req.user.company_id, req.params.id);

  return success(res, data);
}, 'Erro ao carregar historico do cliente');

const createCustomerNote = asyncHandler(async (req, res) => {
  const note = await crmService.createCustomerNote(req.user.company_id, req.params.id, req.user.id, req.body);

  return success(res, note, { statusCode: 201 });
}, 'Erro ao criar anotacao do cliente');

const updateCustomerData = asyncHandler(async (req, res) => {
  const customer = await crmService.updateCustomerStatus(req.user.company_id, req.params.id, req.body);

  return success(res, customer);
}, 'Erro ao atualizar cliente');

module.exports = { listCustomers, getCustomerById, updateCustomerStatus, getCustomerCrm, getCustomerHistory, createCustomerNote, updateCustomerData };
