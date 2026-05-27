// tests/unit/company-service.test.js
// Tests para CompanyService (getBarberMe, onboarding, PIN)

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

  describe('getBarberMe', () => {
    it('deve retornar perfil do usuario com dados da empresa e colaborador', async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 'user-1',
          name: 'Joao',
          email: 'joao@test.com',
          role: 'admin',
          company_id: COMPANY_ID,
          is_active: true,
          company_name: 'Barbearia Teste',
          collaborator_id: 'collab-1',
          nickname: 'Joao Barber',
          commission_type: 'percentage',
          commission_rate: 30
        }]
      });

      const result = await service.getBarberMe(COMPANY_ID, ADMIN_USER);

      expect(result).toMatchObject({
        id: 'user-1',
        name: 'Joao',
        company_name: 'Barbearia Teste',
        collaborator_id: 'collab-1',
        nickname: 'Joao Barber'
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM users'),
        ['user-1', COMPANY_ID]
      );
    });

    it('deve lancar erro 403 quando companyId ausente', async () => {
      await expect(service.getBarberMe(null, ADMIN_USER))
        .rejects
        .toThrow('Usuario sem empresa vinculada');
    });

    it('deve lancar erro 404 quando usuario nao encontrado', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await expect(service.getBarberMe(COMPANY_ID, ADMIN_USER))
        .rejects
        .toThrow('Usuario nao encontrado');
    });
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
