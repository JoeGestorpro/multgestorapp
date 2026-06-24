const { asyncHandler, success } = require('../../shared');
const ProductRepository = require('../../repositories/product.repository');
const ProductService = require('../../services/product.service');
const productService = new ProductService(new ProductRepository());

const listProducts = asyncHandler(async (req, res) => {
  const products = await productService.list(req.user.company_id, req.user, req.query);

  return success(res, products);
}, 'Erro ao listar produtos');

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.user.company_id, req.user, req.params.id);

  return success(res, product);
}, 'Erro ao buscar produto');

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.create(req.user.company_id, req.user, req.body);

  return success(res, product, { statusCode: 201 });
}, 'Erro ao criar produto');

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.update(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, product);
}, 'Erro ao atualizar produto');

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.delete(req.user.company_id, req.user, req.params.id);

  return success(res, null, { message: 'Produto excluido com sucesso' });
}, 'Erro ao excluir produto');

const updateProductStatus = asyncHandler(async (req, res) => {
  const product = await productService.updateStatus(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, product);
}, 'Erro ao atualizar status do produto');

const getFridgeReport = asyncHandler(async (req, res) => {
  const report = await productService.getFridgeReport(req.user.company_id, req.user, req.query);

  return success(res, report);
}, 'Erro ao carregar relatorio de geladeira');

const toggleFridgeFavorite = asyncHandler(async (req, res) => {
  const result = await productService.toggleFridgeFavorite(req.user.company_id, req.user, req.params.id);

  return success(res, result);
}, 'Erro ao atualizar favorito de geladeira');

module.exports = {
  listProducts, getProductById, createProduct, updateProduct,
  deleteProduct, updateProductStatus,
  getFridgeReport, toggleFridgeFavorite
};
