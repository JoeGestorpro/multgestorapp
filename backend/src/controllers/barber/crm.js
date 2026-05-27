const { asyncHandler, success } = require('../../shared');
const CRMRepository = require('../../repositories/crm.repository');
const CRMService = require('../../services/crm.service');
const crmService = new CRMService(new CRMRepository());

const getCrmSummary = asyncHandler(async (req, res) => {
  const summary = await crmService.getCrmSummary(req.user.company_id, req.query);

  return success(res, summary);
}, 'Erro ao carregar resumo CRM');

const getAgendaCrm = asyncHandler(async (req, res) => {
  const data = await crmService.getAgendaCrm(req.user.company_id, req.query);

  return success(res, data);
}, 'Erro ao carregar CRM da agenda');

module.exports = { getCrmSummary, getAgendaCrm };
