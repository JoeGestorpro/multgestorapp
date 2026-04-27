const { createEmailProvider } = require('../../providers/email');
const {
  firstAccessEmail,
  passwordResetEmail,
  clientEmailVerificationEmail
} = require('../../templates/email/auth.templates');

function getFrontendUrl() {
  const appUrl = String(process.env.FRONTEND_URL || process.env.APP_URL || '')
    .trim()
    .replace(/\/+$/, '');

  if (!appUrl) {
    throw new Error('FRONTEND_URL nao configurada para gerar links de email');
  }

  return appUrl;
}

function buildFrontendLink(path, token) {
  return `${getFrontendUrl()}${path}?token=${encodeURIComponent(token)}`;
}

async function sendMail(message) {
  const provider = createEmailProvider();
  return provider.send(message);
}

async function sendFirstAccessEmail({ to, name, companyName, token, expiresAt }) {
  const link = buildFrontendLink('/set-password', token);
  const template = firstAccessEmail({
    name,
    companyName,
    link,
    expiresAt
  });

  return sendMail({
    to,
    subject: template.subject,
    text: template.text,
    html: template.html
  });
}

async function sendPasswordResetEmail({ to, name, token, expiresAt }) {
  const link = buildFrontendLink('/reset-password', token);
  const template = passwordResetEmail({
    name,
    link,
    expiresAt
  });

  return sendMail({
    to,
    subject: template.subject,
    text: template.text,
    html: template.html
  });
}

async function sendClientEmailVerificationEmail({ to, name, token, expiresAt }) {
  const confirmUrl = `${getFrontendUrl()}/confirmar-email?token=${encodeURIComponent(token)}`;
  const template = clientEmailVerificationEmail({
    name,
    link: confirmUrl,
    expiresAt
  });

  return sendMail({
    to,
    subject: template.subject,
    text: template.text,
    html: template.html
  });
}

module.exports = {
  buildFrontendLink,
  sendFirstAccessEmail,
  sendPasswordResetEmail,
  sendClientEmailVerificationEmail
};
