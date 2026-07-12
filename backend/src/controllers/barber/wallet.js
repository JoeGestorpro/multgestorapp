const { asyncHandler, success } = require('../../shared')
const WalletService = require('../../services/wallet.service')
const walletService = new WalletService()

const getWalletBalance = asyncHandler(async (req, res) => {
  const balance = await walletService.getBalance(req.user.company_id)
  return success(res, balance)
}, 'Erro ao carregar saldo da carteira')

const getTransactions = asyncHandler(async (req, res) => {
  const { page, limit } = req.query
  const transactions = await walletService.getTransactions(req.user.company_id, { page, limit })
  return success(res, transactions)
}, 'Erro ao listar transacoes da carteira')

const createTopup = asyncHandler(async (req, res) => {
  const { amount, purpose, customerId, referenceType, referenceId } = req.body
  const result = await walletService.createTopupRequest(req.user.company_id, {
    amount, purpose, customerId, referenceType, referenceId
  })
  return success(res, result, { statusCode: 201 })
}, 'Erro ao iniciar recarga')

const getDepositConfig = asyncHandler(async (req, res) => {
  const config = await walletService.getDepositConfig(req.user.company_id)
  return success(res, config)
}, 'Erro ao carregar configuracao de deposito')

const updateDepositConfig = asyncHandler(async (req, res) => {
  const config = await walletService.upsertDepositConfig(req.user.company_id, req.body)
  return success(res, config)
}, 'Erro ao atualizar configuracao de deposito')

module.exports = { getWalletBalance, getTransactions, createTopup, getDepositConfig, updateDepositConfig }
