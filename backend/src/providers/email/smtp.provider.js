const nodemailer = require('nodemailer');

function createSmtpProvider() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM;

  if (!host || !from) {
    throw new Error('SMTP_HOST e SMTP_FROM ou EMAIL_FROM devem estar configurados');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined
  });

  return {
    name: 'smtp',
    async send(message) {
      const result = await transporter.sendMail({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html
      });

      return {
        provider: 'smtp',
        messageId: result.messageId
      };
    }
  };
}

module.exports = createSmtpProvider;
