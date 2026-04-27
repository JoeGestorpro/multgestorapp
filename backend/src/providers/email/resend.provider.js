const { Resend } = require('resend');

function resolveFromAddress() {
  return String(
    process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || (process.env.NODE_ENV !== 'production' ? 'MultGestor <onboarding@resend.dev>' : '')
  ).trim();
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
    throw new Error('RESEND_FROM_EMAIL invalido para envio de e-mail');
  }

  const resend = new Resend(apiKey);

  return {
    name: 'resend',
    async send(message) {
      const isTestMode = process.env.RESEND_TEST_MODE === 'true';
      const testEmail = process.env.RESEND_TEST_EMAIL;
      const originalTo = message.to;
      const finalTo = isTestMode && testEmail ? testEmail : originalTo;

      // PASSO 4 — Log de validação (somente debug)
      console.log('[RESEND DEBUG]', {
        testMode: process.env.RESEND_TEST_MODE,
        toEmail: finalTo,
        from: resolveFromAddress()
      });

      if (isTestMode) {
        console.log(`[resend] RESEND_TEST_MODE ativo: e-mail redirecionado de <${originalTo}> para <${finalTo}>`);
      }

      const htmlContent = isTestMode
        ? `<div style="background: #fff3cd; color: #856404; border: 1px solid #ffeeba; padding: 10px; margin-bottom: 20px; font-family: sans-serif;">
             <strong>Modo Teste Ativo:</strong> Este e-mail seria enviado originalmente para: <code>${originalTo}</code>
           </div>${message.html}`
        : message.html;

      const response = await resend.emails.send({
        from,
        to: finalTo,
        subject: message.subject,
        html: htmlContent,
        text: message.text
      });

      if (response.error) {
        console.error('[resend] Erro ao enviar e-mail:', {
          error: response.error.message,
          to: finalTo,
          originalTo: originalTo
        });
        const error = new Error(response.error.message || 'Falha ao enviar email via Resend');
        error.statusCode = response.error.statusCode;
        error.name = response.error.name;
        throw error;
      }

      return {
        provider: 'resend',
        messageId: response.data?.id,
        to: finalTo,
        originalTo
      };
    }
  };
}

module.exports = createResendProvider;
