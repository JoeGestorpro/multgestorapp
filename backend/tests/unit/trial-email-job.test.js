'use strict';

const mockQuery = jest.fn();
const mockPool = { connect: jest.fn().mockResolvedValue({
  query: mockQuery,
  release: jest.fn()
}) };

jest.mock('../../src/config/database', () => mockPool);

jest.mock('../../src/services/email/trial-emails.service', () => ({
  sendTrialEmail: jest.fn().mockResolvedValue({ sent: true })
}));

jest.mock('../../src/shared/core/logger', () => ({
  appLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

const { sendTrialEmail } = require('../../src/services/email/trial-emails.service');
const { runTrialEmailJob } = require('../../src/jobs/trial-email-job');

describe('trial-email-job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envia email D+4 (progress) quando nao foi enviado antes', async () => {
    const companyId = 'comp-1';
    mockQuery
      // companies em trial
      .mockResolvedValueOnce({
        rows: [{ id: companyId, name: 'Barb', email: 'a@b.com', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), days_since_created: '4' }]
      })
      // log check — nao enviado
      .mockResolvedValueOnce({ rowCount: 0 })
      // insert log
      .mockResolvedValueOnce({});

    await runTrialEmailJob();

    expect(sendTrialEmail).toHaveBeenCalledWith('progress', expect.objectContaining({ id: companyId }));
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO trial_email_log'),
      [companyId, 'progress']
    );
  });

  it('nao reenvia email ja enviado (deduplicacao)', async () => {
    const companyId = 'comp-2';
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: companyId, name: 'Barb', email: 'a@b.com', created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), days_since_created: '6' }]
      })
      // log check — ja enviado
      .mockResolvedValueOnce({ rowCount: 1 });

    await runTrialEmailJob();

    expect(sendTrialEmail).not.toHaveBeenCalled();
  });

  it('nao envia email fora dos dias programados', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'comp-3', name: 'Barb', email: 'a@b.com', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), days_since_created: '2' }]
    });

    await runTrialEmailJob();

    expect(sendTrialEmail).not.toHaveBeenCalled();
  });
});
