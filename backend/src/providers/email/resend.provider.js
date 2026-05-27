const { appLogger } = require('../../shared/core/logger');
const { Resend } = require('resend');

function resolveFromAddress() {
  const emailFrom = String(process.env.EMAIL_FROM || '').trim();
  const emailName = String(process.env.EMAIL_NAME || 'MultGestor').trim();

  if (!emailFrom) {
    return '';
  }

  return `${emailName} <${emailFrom}>`.trim();
}

function isValidFromAddress(value) {
  return /^.+<[^<>@\s]+@[^<>@\s]+>$/.test(value) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function createResendProvider() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveFromAddress();

  if (!apiKey) {
    throw new Error('RESEND_API_KEY deve estar configurada para envio de e-mail');
  }

  if (!from || !isValidFromAddress(from)) {
    throw new Error('EMAIL_FROM invalido para envio de e-mail');
  }

  const resend = new Resend(apiKey);

  return {
    name: 'resend',
    async send(message) {
      const isTestMode = process.env.RESEND_TEST_MODE === 'true';
      const finalTo = message.to;

      appLogger.debug({ testMode: isTestMode, from: process.env.EMAIL_FROM || '', to: finalTo }, '[RESEND DEBUG]');

      const response = await resend.emails.send({
        from,
        to: finalTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo || message.reply_to
          ? { reply_to: message.replyTo || message.reply_to }
          : {})
      });

      if (response.error) {
        appLogger.error({ error: response.error.message, to: finalTo }, '[resend] Erro ao enviar e-mail');
        const error = new Error(response.error.message || 'Falha ao enviar email via Resend');
        error.statusCode = response.error.statusCode;
        error.name = response.error.name;
        throw error;
      }

      return {
        provider: 'resend',
        messageId: response.data?.id,
        to: finalTo
      };
    }
  };
}

module.exports = createResendProvider;
