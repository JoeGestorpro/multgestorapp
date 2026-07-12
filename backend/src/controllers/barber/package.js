const { asyncHandler, success } = require('../../shared')
const PackageService = require('../../services/package.service')
const packageService = new PackageService()

const list = asyncHandler(async (req, res) => {
  const packages = await packageService.listPackages(req.user.company_id)
  return success(res, packages)
}, 'Erro ao listar pacotes')

const create = asyncHandler(async (req, res) => {
  const pkg = await packageService.createPackage(req.user.company_id, req.body)
  return success(res, pkg, { statusCode: 201 })
}, 'Erro ao criar pacote')

const update = asyncHandler(async (req, res) => {
  const pkg = await packageService.updatePackage(req.user.company_id, req.params.id, req.body)
  return success(res, pkg)
}, 'Erro ao atualizar pacote')

const remove = asyncHandler(async (req, res) => {
  await packageService.deletePackage(req.user.company_id, req.params.id)
  return success(res, null, { message: 'Pacote excluído' })
}, 'Erro ao excluir pacote')

const purchase = asyncHandler(async (req, res) => {
  const { customerId } = req.body
  if (!customerId) {
    return res.status(400).json({ success: false, error: 'customerId é obrigatório' })
  }
  const result = await packageService.purchasePackage(req.user.company_id, customerId, req.params.id, req.body)
  return success(res, result, { statusCode: 201 })
}, 'Erro ao comprar pacote')

const customerPackages = asyncHandler(async (req, res) => {
  const packages = await packageService.getCustomerPackages(req.user.company_id, req.params.id)
  return success(res, packages)
}, 'Erro ao listar pacotes do cliente')

module.exports = { list, create, update, remove, purchase, customerPackages }
