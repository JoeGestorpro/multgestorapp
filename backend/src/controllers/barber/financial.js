const { asyncHandler, success } = require('../../shared')
const FinancialReportService = require('../../services/financial-report.service')
const financialService = new FinancialReportService()

const getSummary = asyncHandler(async (req, res) => {
  const { from, to } = req.query
  if (!from || !to) {
    return res.status(400).json({
      success: false,
      error: 'Parametros from e to sao obrigatorios (formato YYYY-MM-DD)'
    })
  }
  const summary = await financialService.getSummary(req.user.company_id, { from, to })
  return success(res, summary)
}, 'Erro ao gerar resumo financeiro')

const getDre = asyncHandler(async (req, res) => {
  const { from, to } = req.query
  if (!from || !to) {
    return res.status(400).json({
      success: false,
      error: 'Parametros from e to sao obrigatorios'
    })
  }
  const dre = await financialService.getDre(req.user.company_id, { from, to })
  return success(res, dre)
}, 'Erro ao gerar DRE')

const getByPaymentMethod = asyncHandler(async (req, res) => {
  const { from, to } = req.query
  if (!from || !to) {
    return res.status(400).json({
      success: false,
      error: 'Parametros from e to sao obrigatorios'
    })
  }
  const data = await financialService._byPaymentMethod(req.user.company_id, from, to)
  return success(res, data)
}, 'Erro ao gerar relatorio por forma de pagamento')

const getByCollaborator = asyncHandler(async (req, res) => {
  const { from, to } = req.query
  if (!from || !to) {
    return res.status(400).json({
      success: false,
      error: 'Parametros from e to sao obrigatorios'
    })
  }
  const data = await financialService._byCollaborator(req.user.company_id, from, to)
  return success(res, data)
}, 'Erro ao gerar relatorio por colaborador')

module.exports = { getSummary, getDre, getByPaymentMethod, getByCollaborator }
