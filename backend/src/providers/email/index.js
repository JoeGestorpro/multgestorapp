const createMockProvider = require('./mock.provider');
const createResendProvider = require('./resend.provider');
const createSmtpProvider = require('./smtp.provider');

function resolveProviderName() {
  if (process.env.EMAIL_PROVIDER) {
    return process.env.EMAIL_PROVIDER.trim().toLowerCase();
  }

  if (process.env.RESEND_API_KEY) {
    return 'resend';
  }

  if (process.env.SMTP_HOST) {
    return 'smtp';
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('EMAIL_PROVIDER deve ser configurado em producao');
  }

  return 'mock';
}

function createEmailProvider() {
  const providerName = resolveProviderName();

  if (providerName === 'smtp') {
    return createSmtpProvider();
  }

  if (providerName === 'resend') {
    return createResendProvider();
  }

  if (providerName === 'mock') {
    return createMockProvider();
  }

  throw new Error(`EMAIL_PROVIDER invalido: ${providerName}`);
}

module.exports = {
  createEmailProvider
};
