const ScheduleService = require('./schedule.service');
const SaleService = require('./sale.service');
const DashboardService = require('./dashboard.service');
const CompanyService = require('./company.service');
const AdvanceSettlementService = require('./advance-settlement.service');
const CustomerService = require('./customer.service');
const CollaboratorService = require('./collaborator.service');
const CashFlowService = require('./cash-flow.service');
const CollaboratorRepository = require('../repositories/collaborator.repository');

/**
 * BarberCoreService — Facade com Injeção de Dependência
 *
 * Aceita serviços via constructor para permitir mocking em testes.
 * Se nenhum serviço for fornecido, instancia os defaults.
 *
 * @example
 * // Uso padrao (producao)
 * const barberCore = new BarberCoreService();
 *
 * // Uso com mocks (testes)
 * const barberCore = new BarberCoreService({
 *   saleService: mockSaleService,
 *   dashboardService: mockDashboardService
 * });
 */
class BarberCoreService {
  constructor(deps = {}) {
    this.scheduleService = deps.scheduleService || new ScheduleService();
    this.saleService = deps.saleService || new SaleService();
    this.dashboardService = deps.dashboardService || new DashboardService();
    this.companyService = deps.companyService || new CompanyService();
    this.advanceSettlementService = deps.advanceSettlementService || new AdvanceSettlementService();
    this.customerService = deps.customerService || new CustomerService();
    this.collaboratorService = deps.collaboratorService || new CollaboratorService(new CollaboratorRepository());
    this.cashFlowService = deps.cashFlowService || new CashFlowService();
  }

  // --- Perfil / Company ---
  async getBarberMe(companyId, user) {
    return this.companyService.getBarberMe(companyId, user);
  }

  async getCompanyPlanProfile(companyId) {
    return this.companyService.getCompanyPlanProfile(companyId);
  }

  // --- PIN ---
  async forgotPin(companyId, user, data) {
    return this.companyService.forgotPin(companyId, user, data);
  }

  async resetPin(companyId, user, data) {
    return this.companyService.resetPin(companyId, user, data);
  }

  // --- Dashboard Pessoal ---
  async getMyDashboard(companyId, user) {
    return this.dashboardService.getMyDashboard(companyId, user);
  }

  async getMySales(companyId, user) {
    return this.dashboardService.getMySales(companyId, user);
  }

  async getMyReport(companyId, user, query) {
    return this.dashboardService.getMyReport(companyId, user, query);
  }

  // --- Dashboard Geral ---
  async getDashboard(companyId, user) {
    return this.dashboardService.getDashboard(companyId, user);
  }

  // --- Caixa ---
  async openCash(companyId, user, data) {
    return this.cashFlowService.openCash(companyId, user, data);
  }

  async getTodayCash(companyId, user) {
    return this.cashFlowService.getTodayCash(companyId, user);
  }

  async getDailyCash(companyId, user, cashDate) {
    return this.cashFlowService.getDailyCash(companyId, user, cashDate);
  }

  async listCashHistory(companyId, user, query) {
    return this.cashFlowService.listCashHistory(companyId, user, query);
  }

  async getWeeklyCash(companyId, user, query) {
    return this.cashFlowService.getWeeklyCash(companyId, user, query);
  }

  async getMonthlyCash(companyId, user, query) {
    return this.cashFlowService.getMonthlyCash(companyId, user, query);
  }

  async preCloseCash(companyId, user, data) {
    return this.cashFlowService.preCloseCash(companyId, user, data);
  }

  async closeCash(companyId, user, data) {
    return this.cashFlowService.closeCash(companyId, user, data);
  }

  async reopenCash(companyId, user, data) {
    return this.cashFlowService.reopenCash(companyId, user, data);
  }

  // --- Colaborador ---
  async listCollaboratorFinancialSummary(companyId, user, query) {
    return this.collaboratorService.listCollaboratorFinancialSummary(companyId, user, query);
  }

  async saveCollaboratorAvatar(companyId, user, collaboratorId, file) {
    return this.collaboratorService.saveCollaboratorAvatar(companyId, user, collaboratorId, file);
  }

  async removeCollaboratorAvatar(companyId, user, collaboratorId) {
    return this.collaboratorService.removeCollaboratorAvatar(companyId, user, collaboratorId);
  }

  // --- Vales ---
  async listAdvances(companyId, user) {
    return this.advanceSettlementService.listAdvances(companyId, user);
  }

  async createAdvance(companyId, data, user) {
    return this.advanceSettlementService.createAdvance(companyId, data, user);
  }

  async updateAdvanceStatus(companyId, userId, advanceId, status, data) {
    return this.advanceSettlementService.updateAdvanceStatus(companyId, userId, advanceId, status, data);
  }

  // --- Fechamentos ---
  async listSettlements(companyId, collaboratorId, user, options) {
    return this.advanceSettlementService.listSettlements(companyId, collaboratorId, user, options);
  }

  async createSettlement(companyId, user, data) {
    return this.advanceSettlementService.createSettlement(companyId, user, data);
  }

  // --- Vendas ---
  async listSales(companyId, user, query) {
    return this.saleService.listSales(companyId, user, query);
  }

  async getSalesSummary(companyId, user, query) {
    return this.saleService.getSalesSummary(companyId, user, query);
  }

  async createSale(companyId, user, data) {
    return this.saleService.createSale(companyId, user, data);
  }

  async deleteSale(companyId, user, saleId, data) {
    return this.saleService.deleteSale(companyId, user, saleId, data);
  }

  async cancelSale(companyId, user, saleId, data) {
    return this.saleService.cancelSale(companyId, user, saleId, data);
  }

  // --- Bloqueios de Agenda ---
  async listScheduleBlocks(companyId, user, query) {
    return this.scheduleService.listScheduleBlocks(companyId, user, query);
  }

  async createScheduleBlock(companyId, user, data) {
    return this.scheduleService.createScheduleBlock(companyId, user, data);
  }

  async deleteScheduleBlock(companyId, user, blockId) {
    return this.scheduleService.deleteScheduleBlock(companyId, user, blockId);
  }

  // --- Horarios de Funcionamento ---
  async listWorkingHours(companyId, user) {
    return this.scheduleService.listWorkingHours(companyId, user);
  }

  async updateWorkingHours(companyId, user, data) {
    return this.scheduleService.updateWorkingHours(companyId, user, data);
  }

  // --- Disponibilidade ---
  async getAvailability(companyId, user) {
    return this.scheduleService.getAvailability(companyId, user);
  }

  async updateAvailability(companyId, user, data) {
    return this.scheduleService.updateAvailability(companyId, user, data);
  }

  // --- Clientes ---
  async listCustomers(companyId, user, query) {
    return this.customerService.listCustomers(companyId, user, query);
  }

  async getCustomerById(companyId, customerId) {
    return this.customerService.getCustomerById(companyId, customerId);
  }

  // --- Onboarding ---
  async getOnboardingStatus(companyId) {
    return this.companyService.getOnboardingStatus(companyId);
  }

  async saveOnboardingSetup(companyId, data) {
    return this.companyService.saveOnboardingSetup(companyId, data);
  }

  // --- Analytics ---
  async getServicesAnalytics(companyId, query) {
    return this.dashboardService.getServicesAnalytics(companyId, query);
  }

  // --- Validacao ---
  async validateApprovalCredential(companyId, userId, data) {
    return this.companyService.validateApprovalCredential(companyId, userId, data);
  }
}

module.exports = BarberCoreService;
