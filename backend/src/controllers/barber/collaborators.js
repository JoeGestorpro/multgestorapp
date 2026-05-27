const { asyncHandler, success } = require('../../shared');
const CollaboratorRepository = require('../../repositories/collaborator.repository');
const CollaboratorService = require('../../services/collaborator.service');
const BarberCoreService = require('../../services/barber-core.service');

const collaboratorService = new CollaboratorService(new CollaboratorRepository());
const barberCoreService = new BarberCoreService();

const listCollaborators = asyncHandler(async (req, res) => {
  const collaborators = await collaboratorService.list(req.user.company_id, req.user);

  return success(res, collaborators);
}, 'Erro ao listar colaboradores');

const listCollaboratorFinancialSummary = asyncHandler(async (req, res) => {
  const summary = await barberCoreService.listCollaboratorFinancialSummary(req.user.company_id, req.user, req.query);

  return success(res, summary);
}, 'Erro ao listar resumo financeiro dos colaboradores');

const getCollaboratorById = asyncHandler(async (req, res) => {
  const collaborator = await collaboratorService.getById(req.user.company_id, req.user, req.params.id);

  return success(res, collaborator);
}, 'Erro ao buscar colaborador');

const createCollaborator = asyncHandler(async (req, res) => {
  const collaborator = await collaboratorService.create(req.user.company_id, req.user, req.body);

  return success(res, collaborator, { statusCode: 201 });
}, 'Erro ao criar colaborador');

const updateCollaborator = asyncHandler(async (req, res) => {
  const collaborator = await collaboratorService.update(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, collaborator);
}, 'Erro ao atualizar colaborador');

const updateCollaboratorStatus = asyncHandler(async (req, res) => {
  const collaborator = await collaboratorService.updateStatus(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, collaborator);
}, 'Erro ao atualizar status do colaborador');

const updateCollaboratorPermissions = asyncHandler(async (req, res) => {
  const collaborator = await collaboratorService.updatePermissions(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, collaborator);
}, 'Erro ao atualizar permissoes do colaborador');

const saveCollaboratorAvatar = asyncHandler(async (req, res) => {
  const collaborator = await barberCoreService.saveCollaboratorAvatar(req.user.company_id, req.user, req.params.id, req.file);

  return success(res, collaborator);
}, 'Erro ao salvar foto do colaborador');

const removeCollaboratorAvatar = asyncHandler(async (req, res) => {
  const collaborator = await barberCoreService.removeCollaboratorAvatar(req.user.company_id, req.user, req.params.id);

  return success(res, collaborator);
}, 'Erro ao remover foto do colaborador');

const deleteCollaborator = asyncHandler(async (req, res) => {
  await collaboratorService.delete(req.user.company_id, req.user, req.params.id);

  return success(res, null, { message: 'Colaborador excluido com seguranca' });
}, 'Erro ao excluir colaborador');

module.exports = {
  listCollaborators,
  listCollaboratorFinancialSummary,
  getCollaboratorById,
  createCollaborator,
  updateCollaborator,
  updateCollaboratorStatus,
  updateCollaboratorPermissions,
  saveCollaboratorAvatar,
  removeCollaboratorAvatar,
  deleteCollaborator
};
