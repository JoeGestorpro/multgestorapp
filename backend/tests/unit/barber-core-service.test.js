// tests/unit/barber-core-service.test.js
// Tests para BarberCoreService com DI via mocks

const mockPool = {
  query: jest.fn()
};

jest.mock('../../src/config/database', () => mockPool);

const BarberCoreService = require('../../src/services/barber-core.service');

describe('BarberCoreService — Unit Tests with DI', () => {
  let service;
  let mockDeps;

  beforeEach(() => {
    mockDeps = {
      scheduleService: {
        listScheduleBlocks: jest.fn(),
        createScheduleBlock: jest.fn(),
        deleteScheduleBlock: jest.fn()
      },
      saleService: {
        createSale: jest.fn(),
        listSales: jest.fn(),
        getSalesSummary: jest.fn()
      },
      dashboardService: {
        getDashboard: jest.fn(),
        getMyDashboard: jest.fn(),
        getMySales: jest.fn(),
        getMyReport: jest.fn(),
        getServicesAnalytics: jest.fn()
      },
      companyService: {
        getBarberMe: jest.fn(),
        getCompanyPlanProfile: jest.fn(),
        forgotPin: jest.fn(),
        resetPin: jest.fn(),
        getOnboardingStatus: jest.fn(),
        saveOnboardingSetup: jest.fn(),
        validateApprovalCredential: jest.fn()
      },
      advanceSettlementService: {
        listAdvances: jest.fn(),
        createAdvance: jest.fn(),
        updateAdvanceStatus: jest.fn(),
        listSettlements: jest.fn(),
        createSettlement: jest.fn()
      },
      customerService: {
        listCustomers: jest.fn(),
        getCustomerById: jest.fn()
      },
      collaboratorService: {
        listCollaborators: jest.fn(),
        create: jest.fn(),
        listCollaboratorFinancialSummary: jest.fn(),
        saveCollaboratorAvatar: jest.fn(),
        removeCollaboratorAvatar: jest.fn()
      },
      cashFlowService: {
        openCash: jest.fn(),
        getTodayCash: jest.fn(),
        getDailyCash: jest.fn(),
        listCashHistory: jest.fn(),
        getWeeklyCash: jest.fn(),
        getMonthlyCash: jest.fn(),
        preCloseCash: jest.fn(),
        closeCash: jest.fn(),
        reopenCash: jest.fn()
      }
    };
    service = new BarberCoreService(mockDeps);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve inicializar com dependencias default quando nenhuma passada', () => {
    const defaultService = new BarberCoreService();
    expect(defaultService).toBeDefined();
  });

  it('deve delegar listScheduleBlocks para scheduleService', async () => {
    mockDeps.scheduleService.listScheduleBlocks.mockResolvedValue([{ id: 'block-1' }]);

    const result = await service.listScheduleBlocks('company-a', { id: 'user-1' }, {});

    expect(mockDeps.scheduleService.listScheduleBlocks).toHaveBeenCalledWith('company-a', { id: 'user-1' }, {});
    expect(result).toEqual([{ id: 'block-1' }]);
  });

  it('deve delegar createSale para saleService', async () => {
    mockDeps.saleService.createSale.mockResolvedValue({ id: 'sale-1' });

    const result = await service.createSale('company-a', { id: 'user-1' }, { total: 100 });

    expect(mockDeps.saleService.createSale).toHaveBeenCalledWith('company-a', { id: 'user-1' }, { total: 100 });
    expect(result).toEqual({ id: 'sale-1' });
  });

  it('deve delegar getDashboard para dashboardService', async () => {
    mockDeps.dashboardService.getDashboard.mockResolvedValue({ today_revenue: 500 });

    const result = await service.getDashboard('company-a', { id: 'user-1' });

    expect(mockDeps.dashboardService.getDashboard).toHaveBeenCalledWith('company-a', { id: 'user-1' });
    expect(result).toEqual({ today_revenue: 500 });
  });

  it('deve delegar getBarberMe para companyService', async () => {
    mockDeps.companyService.getBarberMe.mockResolvedValue({ name: 'Joao' });

    const result = await service.getBarberMe('company-a', { id: 'user-1' });

    expect(mockDeps.companyService.getBarberMe).toHaveBeenCalledWith('company-a', { id: 'user-1' });
    expect(result).toEqual({ name: 'Joao' });
  });

  it('deve delegar listAdvances para advanceSettlementService', async () => {
    mockDeps.advanceSettlementService.listAdvances.mockResolvedValue([{ id: 'adv-1' }]);

    const result = await service.listAdvances('company-a', { id: 'user-1' });

    expect(mockDeps.advanceSettlementService.listAdvances).toHaveBeenCalledWith('company-a', { id: 'user-1' });
    expect(result).toEqual([{ id: 'adv-1' }]);
  });

  it('deve delegar listCustomers para customerService', async () => {
    mockDeps.customerService.listCustomers.mockResolvedValue({ items: [], total: 0 });

    const result = await service.listCustomers('company-a', { id: 'user-1' }, {});

    expect(mockDeps.customerService.listCustomers).toHaveBeenCalledWith('company-a', { id: 'user-1' }, {});
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('deve delegar listCollaboratorFinancialSummary para collaboratorService', async () => {
    mockDeps.collaboratorService.listCollaboratorFinancialSummary.mockResolvedValue({ summary: [] });

    const result = await service.listCollaboratorFinancialSummary('company-a', { id: 'user-1' }, {});

    expect(mockDeps.collaboratorService.listCollaboratorFinancialSummary).toHaveBeenCalledWith('company-a', { id: 'user-1' }, {});
    expect(result).toEqual({ summary: [] });
  });

  it('validateApprovalCredential deve delegar para companyService', async () => {
    mockDeps.companyService.validateApprovalCredential.mockResolvedValue(true);

    const result = await service.validateApprovalCredential('company-a', 'user-1', { pin: '123456' });

    expect(mockDeps.companyService.validateApprovalCredential).toHaveBeenCalledWith('company-a', 'user-1', { pin: '123456' });
    expect(result).toBe(true);
  });

  it('deve delegar getServicesAnalytics para dashboardService', async () => {
    mockDeps.dashboardService.getServicesAnalytics.mockResolvedValue({ services: [] });

    const result = await service.getServicesAnalytics('company-a', {});

    expect(mockDeps.dashboardService.getServicesAnalytics).toHaveBeenCalledWith('company-a', {});
    expect(result).toEqual({ services: [] });
  });

  it('deve delegar openCash para cashFlowService', async () => {
    mockDeps.cashFlowService.openCash.mockResolvedValue({ id: 'cash-1' });

    const result = await service.openCash('company-a', { id: 'user-1' }, { amount: 100 });

    expect(mockDeps.cashFlowService.openCash).toHaveBeenCalledWith('company-a', { id: 'user-1' }, { amount: 100 });
    expect(result).toEqual({ id: 'cash-1' });
  });

  it('deve delegar getTodayCash para cashFlowService', async () => {
    mockDeps.cashFlowService.getTodayCash.mockResolvedValue({ total: 500 });

    const result = await service.getTodayCash('company-a', { id: 'user-1' });

    expect(mockDeps.cashFlowService.getTodayCash).toHaveBeenCalledWith('company-a', { id: 'user-1' });
    expect(result).toEqual({ total: 500 });
  });

  it('deve delegar getDailyCash para cashFlowService', async () => {
    mockDeps.cashFlowService.getDailyCash.mockResolvedValue({ total: 300 });

    const result = await service.getDailyCash('company-a', { id: 'user-1' }, '2025-06-01');

    expect(mockDeps.cashFlowService.getDailyCash).toHaveBeenCalledWith('company-a', { id: 'user-1' }, '2025-06-01');
    expect(result).toEqual({ total: 300 });
  });

  it('deve delegar listCashHistory para cashFlowService', async () => {
    mockDeps.cashFlowService.listCashHistory.mockResolvedValue([]);

    const result = await service.listCashHistory('company-a', { id: 'user-1' }, {});

    expect(mockDeps.cashFlowService.listCashHistory).toHaveBeenCalledWith('company-a', { id: 'user-1' }, {});
    expect(result).toEqual([]);
  });

  it('deve delegar closeCash para cashFlowService', async () => {
    mockDeps.cashFlowService.closeCash.mockResolvedValue({ success: true });

    const result = await service.closeCash('company-a', { id: 'user-1' }, { pin: '1234' });

    expect(mockDeps.cashFlowService.closeCash).toHaveBeenCalledWith('company-a', { id: 'user-1' }, { pin: '1234' });
    expect(result).toEqual({ success: true });
  });
});
