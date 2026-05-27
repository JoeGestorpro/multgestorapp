const { asyncHandler, success } = require('../../shared');
const BarberServicesRepository = require('../../repositories/barber-services.repository');
const BarberServiceService = require('../../services/barber-service.service');
const BarberCoreService = require('../../services/barber-core.service');
const barberCoreService = new BarberCoreService();
const barberServiceService = new BarberServiceService(
  new BarberServicesRepository(),
  barberCoreService.validateApprovalCredential.bind(barberCoreService)
);

const listServices = asyncHandler(async (req, res) => {
  const services = await barberServiceService.list(req.user.company_id, req.user, req.query);

  return success(res, services);
}, 'Erro ao listar servicos');

const getServiceById = asyncHandler(async (req, res) => {
  const service = await barberServiceService.getById(req.user.company_id, req.user, req.params.id);

  return success(res, service);
}, 'Erro ao buscar servico');

const createService = asyncHandler(async (req, res) => {
  const service = await barberServiceService.create(req.user.company_id, req.user, req.body);

  return success(res, service, { statusCode: 201 });
}, 'Erro ao criar servico');

const updateService = asyncHandler(async (req, res) => {
  const service = await barberServiceService.update(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, service);
}, 'Erro ao atualizar servico');

const deleteService = asyncHandler(async (req, res) => {
  await barberServiceService.delete(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, null, { message: 'Servico excluido com seguranca' });
}, 'Erro ao excluir servico');

const updateServiceStatus = asyncHandler(async (req, res) => {
  const service = await barberServiceService.updateStatus(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, service);
}, 'Erro ao atualizar status do servico');

module.exports = { listServices, getServiceById, createService, updateService, deleteService, updateServiceStatus };
