// tests/unit/company-service.test.js
// Tests para CompanyService (onboarding, PIN) — Core, sem tabelas de nicho.
// getBarberMe (join com barber_collaborators) vive em barber-core.service.js
// desde a auditoria Core x Nicho de 2026-07-03 — ver barber-core-service.test.js

const mockPool = {
  query: jest.fn(),
  connect: jest.fn()
};

jest.mock('../../src/config/database', () => mockPool);

const CompanyService = require('../../src/services/company.service');
const { AppError } = require('../../src/shared');

const COMPANY_ID = 'company-a';
const ADMIN_USER = { id: 'user-1', role: 'admin', company_id: COMPANY_ID };

function createMockClient() {
  return {
    query: jest.fn(),
    release: jest.fn()
  };
}

describe('CompanyService — Unit Tests', () => {
  let service;

  beforeEach(() => {
    service = new CompanyService();
    mockPool.query.mockReset();
    mockPool.connect.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('nao deve expor getBarberMe (fronteira Core x Nicho — vive em barber-core.service.js)', () => {
    expect(service.getBarberMe).toBeUndefined();
  });

  describe('getOnboardingStatus', () => {
    it('deve retornar onboarding_completed e setup_progress da empresa', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ column_name: 'onboarding_completed' }]
      });
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ onboarding_completed: true, setup_progress: 75 }]
      });

      const result = await service.getOnboardingStatus(COMPANY_ID);

      expect(result).toEqual({ onboarding_completed: true, setup_progress: 75 });
    });

    it('deve retornar valores default quando colunas nao existem', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const result = await service.getOnboardingStatus(COMPANY_ID);

      expect(result).toEqual({ onboarding_completed: false, setup_progress: 0 });
    });
  });

  describe('saveOnboardingSetup', () => {
    it('deve atualizar campos permitidos e retornar tema atualizado', async () => {
      // getCompanyTheme faz 2 columnExists + 1 SELECT; saveOnboardingSetup faz 1 columnExists + UPDATE + getCompanyTheme
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ column_name: 'onboarding_completed' }] }) // saveOnboardingSetup: columnExists
        .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE companies
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ column_name: 'logo_url' }] }) // getCompanyTheme: columnExists logo_url
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ column_name: 'onboarding_completed' }] }) // getCompanyTheme: columnExists onboarding
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            company_id: COMPANY_ID,
            company_name: 'Barbearia Teste',
            logo_url: null,
            primary_color: '#a3ff12',
            secondary_color: '#0c1017',
            accent_color: '#7fe11e',
            wallpaper_url: null,
            onboarding_completed: true,
            setup_progress: 80
          }]
        });

      const result = await service.saveOnboardingSetup(COMPANY_ID, {
        company_name: 'Barbearia Teste',
        primary_color: '#a3ff12',
        onboarding_completed: true,
        setup_progress: 80
      });

      expect(result.company_name).toBe('Barbearia Teste');
      expect(result.onboarding_completed).toBe(true);
      expect(result.setup_progress).toBe(80);
    });

    it('deve ignorar cores invalidas e nao atualizar nada se nenhum campo valido', async () => {
      // saveOnboardingSetup: columnExists onboarding
      // getCompanyTheme: columnExists logo_url, columnExists onboarding, SELECT
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ column_name: 'onboarding_completed' }] }) // saveOnboardingSetup
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ column_name: 'logo_url' }] }) // getCompanyTheme logo
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ column_name: 'onboarding_completed' }] }) // getCompanyTheme onboarding
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            company_id: COMPANY_ID,
            company_name: 'Barbearia',
            logo_url: null,
            primary_color: '#a3ff12',
            secondary_color: '#0c1017',
            accent_color: '#7fe11e',
            wallpaper_url: null,
            onboarding_completed: false,
            setup_progress: 0
          }]
        });

      const result = await service.saveOnboardingSetup(COMPANY_ID, {
        primary_color: 'invalid-color' // deve ser ignorado
      });

      expect(result.company_name).toBe('Barbearia');
    });
  });

  describe('validateApprovalCredential', () => {
    it('deve retornar true quando PIN via env bate', async () => {
      process.env.ADMIN_APPROVAL_PIN = '123456';
      mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // columnExists pin_hash

      const result = await service.validateApprovalCredential(COMPANY_ID, 'user-1', { pin: '123456' });

      expect(result).toBe(true);
      delete process.env.ADMIN_APPROVAL_PIN;
    });

    it('deve validar via password_hash quando nao tem PIN', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // columnExists pin_hash = false
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ password_hash: '$2b$10$hashedpassword' }]
      });

      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValueOnce(true);

      const result = await service.validateApprovalCredential(COMPANY_ID, 'user-1', {
        adminPassword: 'senha123'
      });

      expect(result).toBe(true);
    });
  });
});
