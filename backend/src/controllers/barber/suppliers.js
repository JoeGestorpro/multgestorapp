const { asyncHandler, success } = require('../../shared');
const SupplierRepository = require('../../repositories/supplier.repository');
const SupplierService = require('../../services/supplier.service');
const supplierService = new SupplierService(new SupplierRepository());

const listSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await supplierService.list(req.user.company_id, req.user, req.query);

  return success(res, suppliers);
}, 'Erro ao listar fornecedores');

const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getById(req.user.company_id, req.user, req.params.id);

  return success(res, supplier);
}, 'Erro ao buscar fornecedor');

const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.create(req.user.company_id, req.user, req.body);

  return success(res, supplier, { statusCode: 201 });
}, 'Erro ao criar fornecedor');

const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.update(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, supplier);
}, 'Erro ao atualizar fornecedor');

const updateSupplierStatus = asyncHandler(async (req, res) => {
  const supplier = await supplierService.updateStatus(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, supplier);
}, 'Erro ao atualizar status do fornecedor');

const deleteSupplier = asyncHandler(async (req, res) => {
  await supplierService.delete(req.user.company_id, req.user, req.params.id);

  return success(res, null, { message: 'Fornecedor excluido com sucesso' });
}, 'Erro ao excluir fornecedor');

module.exports = { listSuppliers, getSupplierById, createSupplier, updateSupplier, updateSupplierStatus, deleteSupplier };
