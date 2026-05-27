const { asyncHandler, success } = require('../../shared');
const BarberCoreService = require('../../services/barber-core.service');

const barberCoreService = new BarberCoreService();

const listAdvances = asyncHandler(async (req, res) => {
  const advances = await barberCoreService.listAdvances(req.user.company_id, req.user);

  return success(res, advances);
}, 'Erro ao listar vales');

const createAdvance = asyncHandler(async (req, res) => {
  const advance = await barberCoreService.createAdvance(req.user.company_id, req.body, req.user);

  return success(res, advance, { statusCode: 201 });
}, 'Erro ao criar vale');

const approveAdvance = asyncHandler(async (req, res) => {
  const advance = await barberCoreService.updateAdvanceStatus(
    req.user.company_id,
    req.user.id,
    req.params.id,
    'approved',
    req.body
  );

  return success(res, advance);
}, 'Erro ao aprovar vale');

const rejectAdvance = asyncHandler(async (req, res) => {
  const advance = await barberCoreService.updateAdvanceStatus(
    req.user.company_id,
    req.user.id,
    req.params.id,
    'rejected',
    req.body
  );

  return success(res, advance);
}, 'Erro ao rejeitar vale');

const listSettlements = asyncHandler(async (req, res) => {
  const settlements = await barberCoreService.listSettlements(
    req.user.company_id,
    req.query.collaboratorId || req.query.collaborator_id,
    req.user,
    {
      startDate: req.query.startDate || req.query.start_date,
      endDate: req.query.endDate || req.query.end_date
    }
  );

  return success(res, settlements);
}, 'Erro ao listar fechamentos');

const createSettlement = asyncHandler(async (req, res) => {
  const settlement = await barberCoreService.createSettlement(req.user.company_id, req.user, req.body);

  return success(res, settlement, { statusCode: 201 });
}, 'Erro ao criar fechamento');

module.exports = {
  listAdvances,
  createAdvance,
  approveAdvance,
  rejectAdvance,
  listSettlements,
  createSettlement
};
