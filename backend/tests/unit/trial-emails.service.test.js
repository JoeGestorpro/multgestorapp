'use strict';

const mockSendMail = jest.fn().mockResolvedValue({});

jest.mock('../../src/services/email/email.service', () => ({
  sendMail: (...args) => mockSendMail(...args)
}));

describe('trial-emails.service', () => {
  let sendTrialEmail;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TRIAL_EMAILS_ENABLED = 'true';
    jest.resetModules();
    const mod = require('../../src/services/email/trial-emails.service');
    sendTrialEmail = mod.sendTrialEmail;
  });

  it('nao envia email quando TRIAL_EMAILS_ENABLED=false', async () => {
    process.env.TRIAL_EMAILS_ENABLED = 'false';
    jest.resetModules();
    const mod = require('../../src/services/email/trial-emails.service');
    const result = await mod.sendTrialEmail('welcome', { id: 'c1', name: 'Teste', email: 'a@b.com' });
    expect(result.sent).toBe(false);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('envia welcome email com dados corretos', async () => {
    const result = await sendTrialEmail('welcome', { id: 'c1', name: 'Barbearia X', email: 'x@barb.com' });
    expect(result.sent).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe('x@barb.com');
    expect(call.subject).toContain('Bem-vindo');
    expect(call.html).toContain('Barbearia X');
  });

  it('envia progress email', async () => {
    await sendTrialEmail('progress', { id: 'c1', name: 'Barb', email: 'a@b.com' });
    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toContain('metade');
  });

  it('envia expiring email com link de escolher plano', async () => {
    await sendTrialEmail('expiring', { id: 'c1', name: 'Barb', email: 'a@b.com' });
    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toContain('expira amanha');
    expect(call.html).toContain('/escolher-plano');
  });

  it('envia expired email', async () => {
    await sendTrialEmail('expired', { id: 'c1', name: 'Barb', email: 'a@b.com' });
    const call = mockSendMail.mock.calls[0][0];
    expect(call.subject).toContain('expirou');
  });

  it('nao envia quando nao ha email da empresa', async () => {
    const result = await sendTrialEmail('welcome', { id: 'c1', name: 'Barb' });
    expect(result.sent).toBe(false);
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
