const { asyncHandler, success } = require('../../shared')
const LoyaltyService = require('../../services/loyalty.service')
const loyaltyService = new LoyaltyService()

const getProgram = asyncHandler(async (req, res) => {
  const program = await loyaltyService.getProgram(req.user.company_id)
  return success(res, program)
}, 'Erro ao carregar programa de fidelidade')

const updateProgram = asyncHandler(async (req, res) => {
  const program = await loyaltyService.upsertProgram(req.user.company_id, req.body)
  return success(res, program)
}, 'Erro ao atualizar programa de fidelidade')

const getBalance = asyncHandler(async (req, res) => {
  const loyalty = await loyaltyService.getCustomerLoyalty(req.user.company_id, req.params.id)
  return success(res, loyalty)
}, 'Erro ao carregar pontos do cliente')

const listTransactions = asyncHandler(async (req, res) => {
  const transactions = await loyaltyService.listTransactions(req.user.company_id, req.params.id)
  return success(res, transactions)
}, 'Erro ao listar transacoes de fidelidade')

const redeem = asyncHandler(async (req, res) => {
  const { points, description } = req.body
  if (!points || points < 1) {
    return res.status(400).json({ success: false, error: 'points deve ser maior que zero' })
  }
  const result = await loyaltyService.redeemPoints(req.user.company_id, req.params.id, points, {
    description,
    createdBy: req.user.id
  })
  return success(res, result)
}, 'Erro ao resgatar pontos')

module.exports = { getProgram, updateProgram, getBalance, listTransactions, redeem }
