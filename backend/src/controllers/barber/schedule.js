const { asyncHandler, success } = require('../../shared');
const BarberCoreService = require('../../services/barber-core.service');
const barberCoreService = new BarberCoreService();

const listScheduleBlocks = asyncHandler(async (req, res) => {
  const blocks = await barberCoreService.listScheduleBlocks(req.user.company_id, req.user, req.query);

  return success(res, blocks);
}, 'Erro ao listar bloqueios de agenda');

const createScheduleBlock = asyncHandler(async (req, res) => {
  const block = await barberCoreService.createScheduleBlock(req.user.company_id, req.user, req.body);

  return success(res, block, { statusCode: 201 });
}, 'Erro ao criar bloqueio de agenda');

const deleteScheduleBlock = asyncHandler(async (req, res) => {
  await barberCoreService.deleteScheduleBlock(req.user.company_id, req.user, req.params.id);

  return success(res, null, { message: 'Bloqueio excluido com sucesso' });
}, 'Erro ao excluir bloqueio de agenda');

const listWorkingHours = asyncHandler(async (req, res) => {
  const hours = await barberCoreService.listWorkingHours(req.user.company_id, req.user);

  return success(res, hours);
}, 'Erro ao listar horários de funcionamento');

const updateWorkingHours = asyncHandler(async (req, res) => {
  const hours = await barberCoreService.updateWorkingHours(req.user.company_id, req.user, req.body);

  return success(res, hours);
}, 'Erro ao atualizar horários de funcionamento');

const getAvailability = asyncHandler(async (req, res) => {
  const data = await barberCoreService.getAvailability(req.user.company_id, req.user);

  return success(res, data);
}, 'Erro ao carregar disponibilidade');

const updateAvailability = asyncHandler(async (req, res) => {
  const result = await barberCoreService.updateAvailability(req.user.company_id, req.user, req.body);

  return success(res, result);
}, 'Erro ao atualizar disponibilidade');

module.exports = { listScheduleBlocks, createScheduleBlock, deleteScheduleBlock, listWorkingHours, updateWorkingHours, getAvailability, updateAvailability };
