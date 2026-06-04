const { asyncHandler, success } = require('../../shared')
const AnamnesisService = require('../../services/anamnesis.service')
const anamnesisService = new AnamnesisService()

const listTemplates = asyncHandler(async (req, res) => {
  const templates = await anamnesisService.listTemplates(req.user.company_id)
  return success(res, templates)
}, 'Erro ao listar templates')

const createTemplate = asyncHandler(async (req, res) => {
  const template = await anamnesisService.createTemplate(req.user.company_id, req.body)
  return success(res, template, { statusCode: 201 })
}, 'Erro ao criar template')

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await anamnesisService.updateTemplate(req.user.company_id, req.params.id, req.body)
  return success(res, template)
}, 'Erro ao atualizar template')

const removeTemplate = asyncHandler(async (req, res) => {
  await anamnesisService.deleteTemplate(req.user.company_id, req.params.id)
  return success(res, null, { message: 'Template excluído' })
}, 'Erro ao excluir template')

const getResponse = asyncHandler(async (req, res) => {
  const response = await anamnesisService.getResponse(req.user.company_id, req.params.id)
  return success(res, response)
}, 'Erro ao carregar anamnese do cliente')

const updateResponse = asyncHandler(async (req, res) => {
  const data = { ...req.body, consent_ip: req.ip }
  const response = await anamnesisService.upsertResponse(req.user.company_id, req.params.id, data)
  return success(res, response)
}, 'Erro ao salvar anamnese do cliente')

const requestDelete = asyncHandler(async (req, res) => {
  const result = await anamnesisService.requestDelete(req.user.company_id, req.params.id)
  return success(res, result)
}, 'Erro ao solicitar exclusão de anamnese')

const exportData = asyncHandler(async (req, res) => {
  const data = await anamnesisService.exportData(req.user.company_id, req.params.id)
  return success(res, data)
}, 'Erro ao exportar dados de anamnese')

module.exports = { listTemplates, createTemplate, updateTemplate, removeTemplate, getResponse, updateResponse, exportData, requestDelete }
