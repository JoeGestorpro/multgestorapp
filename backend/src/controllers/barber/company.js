const { asyncHandler, success } = require('../../shared');

const SettingsService = require('../../services/settings.service');
const SettingsRepository = require('../../repositories/settings.repository');
const settingsService = new SettingsService(new SettingsRepository());

const BrandingService = require('../../services/branding.service');
const BrandingRepository = require('../../repositories/branding.repository');
const brandingService = new BrandingService(new BrandingRepository());

const BarberCoreService = require('../../services/barber-core.service');
const ScheduleService = require('../../services/schedule.service');
const SaleService = require('../../services/sale.service');
const DashboardService = require('../../services/dashboard.service');
const CompanyService = require('../../services/company.service');
const AdvanceSettlementService = require('../../services/advance-settlement.service');
const CustomerService = require('../../services/customer.service');
const CollaboratorService = require('../../services/collaborator.service');
const CashFlowService = require('../../services/cash-flow.service');
const CollaboratorRepository = require('../../repositories/collaborator.repository');

const collaboratorService = new CollaboratorService(new CollaboratorRepository());
const cashFlowService = new CashFlowService();
const barberCoreService = new BarberCoreService({
  scheduleService: new ScheduleService(),
  saleService: new SaleService(),
  dashboardService: new DashboardService(),
  companyService: new CompanyService(),
  advanceSettlementService: new AdvanceSettlementService(),
  customerService: new CustomerService(),
  collaboratorService,
  cashFlowService
});

const barberMe = asyncHandler(async (req, res) => {
  const profile = await barberCoreService.getBarberMe(req.user.company_id, req.user);

  return success(res, profile);
}, 'Erro ao carregar perfil');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.get(req.user.company_id, req.user);

  return success(res, settings);
}, 'Erro ao carregar configuracoes');

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.update(req.user.company_id, req.user, req.body);

  return success(res, settings);
}, 'Erro ao atualizar configuracoes');

const getCompanyPlan = asyncHandler(async (req, res) => {
  const companyPlan = await barberCoreService.getCompanyPlanProfile(req.user.company_id);

  return success(res, companyPlan);
}, 'Erro ao carregar plano da empresa');

const forgotPin = asyncHandler(async (req, res) => {
  const result = await barberCoreService.forgotPin(req.user.company_id, req.user, req.body);

  return success(res, result);
}, 'Erro ao iniciar recuperacao de PIN');

const resetPin = asyncHandler(async (req, res) => {
  const result = await barberCoreService.resetPin(req.user.company_id, req.user, req.body);

  return success(res, result);
}, 'Erro ao redefinir PIN');

const getCompanyTheme = asyncHandler(async (req, res) => {
  const theme = await brandingService.getTheme(req.user.company_id);

  return success(res, theme);
}, 'Erro ao carregar tema');

const updateCompanyTheme = asyncHandler(async (req, res) => {
  const theme = await brandingService.updateTheme(req.user.company_id, req.body);

  return success(res, theme);
}, 'Erro ao atualizar tema');

const getCompanyBranding = asyncHandler(async (req, res) => {
  const branding = await brandingService.getBranding(req.user.company_id);

  return success(res, branding);
}, 'Erro ao carregar branding');

const updateCompanyBranding = asyncHandler(async (req, res) => {
  const branding = await brandingService.updateBranding(req.user.company_id, req.body);

  return success(res, branding);
}, 'Erro ao atualizar branding');

const getBookingLanding = asyncHandler(async (req, res) => {
  const landing = await brandingService.getBookingLanding(req.user.company_id);

  return success(res, landing);
}, 'Erro ao carregar configuracao da landing');

const updateBookingLanding = asyncHandler(async (req, res) => {
  const landing = await brandingService.updateBookingLanding(req.user.company_id, req.body);

  return success(res, landing);
}, 'Erro ao atualizar configuracao da landing');

const uploadBookingBanner = asyncHandler(async (req, res) => {
  const landing = await brandingService.uploadBanner(req.user.company_id, req.file);

  return success(res, landing);
}, 'Erro ao enviar banner');

const removeBookingBanner = asyncHandler(async (req, res) => {
  const landing = await brandingService.removeBanner(req.user.company_id);

  return success(res, landing);
}, 'Erro ao remover banner');

const addBookingGalleryImage = asyncHandler(async (req, res) => {
  const landing = await brandingService.addGalleryImage(req.user.company_id, req.file);

  return success(res, landing);
}, 'Erro ao adicionar imagem na galeria');

const removeBookingGalleryImage = asyncHandler(async (req, res) => {
  const landing = await brandingService.removeGalleryImage(req.user.company_id, req.params.imageId);

  return success(res, landing);
}, 'Erro ao remover imagem da galeria');

const getOnboardingStatus = asyncHandler(async (req, res) => {
  const status = await barberCoreService.getOnboardingStatus(req.user.company_id);

  return success(res, status);
}, 'Erro ao carregar status');

const saveOnboardingSetup = asyncHandler(async (req, res) => {
  const data = await barberCoreService.saveOnboardingSetup(req.user.company_id, req.body);

  return success(res, data);
}, 'Erro ao salvar setup');

const updateCompanyProfile = asyncHandler(async (req, res) => {
  const result = await settingsService.updateCompanyProfile(req.user.company_id, req.user, req.body);

  return success(res, result);
}, 'Erro ao atualizar perfil');

module.exports = {
  barberMe,
  getSettings,
  updateSettings,
  getCompanyPlan,
  forgotPin,
  resetPin,
  getCompanyTheme,
  updateCompanyTheme,
  getCompanyBranding,
  updateCompanyBranding,
  getBookingLanding,
  updateBookingLanding,
  uploadBookingBanner,
  removeBookingBanner,
  addBookingGalleryImage,
  removeBookingGalleryImage,
  getOnboardingStatus,
  saveOnboardingSetup,
  updateCompanyProfile
};
