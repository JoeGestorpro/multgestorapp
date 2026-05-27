// tests/unit/clima-core-service.test.js

const mockPool = { query: jest.fn() };
jest.mock('../../src/config/database', () => mockPool);

const ClimaGestor = require('../../src/services/clima-core.service');

describe('ClimaGestor', () => {
  let service;

  beforeEach(() => {
    service = new ClimaGestor({ pool: mockPool });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listProfessionals', () => {
    it('retorna lista de profissionais para a empresa', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'prof-1', name: 'Dra. Ana', role: 'professional' }]
      });

      const result = await service.listProfessionals('company-a');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('clima_professionals'),
        ['company-a']
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Dra. Ana');
    });

    it('lanca erro quando company_id nao fornecido', async () => {
      await expect(service.listProfessionals(null)).rejects.toThrow('company_id obrigatorio');
    });
  });

  describe('createProfessional', () => {
    it('cria profissional com dados validos', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'prof-2', name: 'Dr. Carlos', role: 'professional' }]
      });

      const result = await service.createProfessional('company-a', {
        name: 'Dr. Carlos',
        role: 'professional'
      });

      expect(result.name).toBe('Dr. Carlos');
    });

    it('lanca erro quando nome nao fornecido', async () => {
      await expect(service.createProfessional('company-a', { name: '' }))
        .rejects.toThrow('Nome e obrigatorio');
    });
  });

  describe('Booking Engine Capability', () => {
    it('getAppointmentStatuses retorna da capability compartilhada', () => {
      const statuses = service.getAppointmentStatuses();
      expect(statuses).toContain('scheduled');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('canceled');
    });

    it('addMinutesToDate usa utilitario da capability', () => {
      const base = new Date('2026-06-01T10:00:00Z');
      const result = service.addMinutesToDate(base, 60);
      expect(result.getTime()).toBe(base.getTime() + 60 * 60 * 1000);
    });
  });

  // ─── Testes de Agendamento ────────────────────────────────────────────────────

  describe('createAppointment', () => {
    it('cria agendamento quando slot esta disponivel', async () => {
      const companyId = 'company-1';
      const now = new Date();
      const futureStart = new Date(now.getTime() + 60 * 60_000); // +1h

      mockPool.query
        // busca servico
        .mockResolvedValueOnce({ rows: [{ duration_minutes: 60 }] })
        // verifica conflito -> sem conflito
        .mockResolvedValueOnce({ rows: [] })
        // insert
        .mockResolvedValueOnce({ rows: [{ id: 'apt-1', status: 'scheduled' }] });

      const result = await service.createAppointment(companyId, {
        professional_id: 'prof-1',
        service_id:      'svc-1',
        client_name:     'Ana Lima',
        start_at:        futureStart.toISOString(),
      });

      expect(result).toEqual({ id: 'apt-1', status: 'scheduled' });
      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    it('lanca erro 409 quando ha conflito de horario', async () => {
      const futureStart = new Date(Date.now() + 60 * 60_000);

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ duration_minutes: 60 }] })
        // conflito encontrado
        .mockResolvedValueOnce({ rows: [{ id: 'apt-conflito' }] });

      await expect(
        service.createAppointment('company-1', {
          professional_id: 'prof-1',
          service_id:      'svc-1',
          client_name:     'Joao Silva',
          start_at:        futureStart.toISOString(),
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('lanca erro 400 quando start_at e no passado', async () => {
      const pastStart = new Date(Date.now() - 60_000).toISOString();
      await expect(
        service.createAppointment('company-1', {
          professional_id: 'prof-1',
          service_id: 'svc-1',
          client_name: 'Maria',
          start_at: pastStart,
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('listAppointments', () => {
    it('retorna lista de agendamentos da empresa', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'apt-1', professional_name: 'Dr. Pedro', service_name: 'Consulta' }] });
      const result = await service.listAppointments('company-1');
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].professional_name).toBe('Dr. Pedro');
    });
  });

  describe('cancelAppointment', () => {
    it('cancela agendamento ativo', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'apt-1', status: 'cancelled' }] });
      const result = await service.cancelAppointment('company-1', 'apt-1');
      expect(result.status).toBe('cancelled');
    });

    it('lanca 404 quando agendamento nao encontrado', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      await expect(service.cancelAppointment('company-1', 'nao-existe'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getAppointment', () => {
    it('lanca 404 quando agendamento nao pertence a empresa', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      await expect(service.getAppointment('company-1', 'apt-outra-empresa'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
