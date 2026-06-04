'use strict';

const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockPool = { connect: jest.fn().mockResolvedValue({
  query: mockQuery,
  release: mockRelease
}) };

jest.mock('../../src/config/database', () => mockPool);

const mockPublish = jest.fn();
jest.mock('../../src/shared/core/events', () => ({
  eventBus: { publish: mockPublish }
}));

jest.mock('../../src/shared/core/logger', () => ({
  appLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

const { runAppointmentReminderJob } = require('../../src/jobs/appointment-reminder-job');

describe('appointment-reminder-job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('seleciona apenas confirmed com telefone dentro da janela e reminder_sent_at IS NULL', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] });

    await runAppointmentReminderJob();

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringMatching(/reminder_sent_at IS NULL.*status\s*=\s*'confirmed'/s),
      expect.any(Array)
    );
  });

  it('emite appointment.reminder e marca reminder_sent_at', async () => {
    const appt = {
      id: 'appt-1',
      company_id: 'comp-1',
      customer_name: 'João',
      customer_phone: '11999990000',
      starts_at: new Date('2026-06-04T15:00:00Z')
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [appt] })
      .mockResolvedValueOnce({ rowCount: 1 });

    await runAppointmentReminderJob();

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE barber_appointments SET reminder_sent_at = NOW()'),
      [appt.id]
    );
    expect(mockPublish).toHaveBeenCalledWith(
      'appointment.reminder',
      expect.objectContaining({
        appointment_id: appt.id,
        company_id: appt.company_id,
        customer_phone: appt.customer_phone,
        starts_at: appt.starts_at
      }),
      expect.objectContaining({
        company_id: appt.company_id,
        aggregate_type: 'appointment',
        aggregate_id: appt.id
      })
    );
  });

  it('idempotencia: 2a execucao nao reenvia (UPDATE retorna 0 linhas)', async () => {
    const appt = {
      id: 'appt-2',
      company_id: 'comp-1',
      customer_name: 'Maria',
      customer_phone: '11999991111',
      starts_at: new Date('2026-06-04T16:00:00Z')
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [appt] })
      .mockResolvedValueOnce({ rowCount: 0 });

    await runAppointmentReminderJob();

    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('nao emite quando nenhum agendamento elegivel', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await runAppointmentReminderJob();

    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('libera o client do pool mesmo com erro', async () => {
    mockQuery.mockRejectedValueOnce(new Error('db fail'));

    await expect(runAppointmentReminderJob()).rejects.toThrow('db fail');
    expect(mockRelease).toHaveBeenCalled();
  });
});

describe('appointment.reminder contract', () => {
  it('contrato presente com required_fields', () => {
    const { AppointmentReminder } = require('../../src/shared/core/events/contracts');
    expect(AppointmentReminder).toBeDefined();
    expect(AppointmentReminder.event_name).toBe('appointment.reminder');
    expect(AppointmentReminder.required_fields).toEqual(
      expect.arrayContaining(['appointment_id', 'company_id', 'customer_phone', 'starts_at'])
    );
  });
});
