const { createEmailProvider } = require('../../providers/email');
const {
  firstAccessEmail,
  passwordResetEmail,
  clientEmailVerificationEmail,
  pinResetCodeEmail
} = require('../../templates/email/auth.templates');

function getAppBaseUrl() {
  const appUrl = String(
    process.env.APP_BASE_URL ||
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    'http://localhost:5173'
  )
    .trim()
    .replace(/\/+$/, '');

  if (!appUrl) {
    throw new Error('APP_BASE_URL nao configurada para gerar links de email');
  }

  return appUrl;
}

function buildFrontendLink(path, token) {
  const normalizedPath = String(path || '').startsWith('/') ? String(path) : `/${String(path || '')}`;
  return `${getAppBaseUrl()}${normalizedPath}?token=${encodeURIComponent(token)}`;
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
  const confirmUrl = buildFrontendLink('/confirmar-email', token);
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

async function sendBarberPinResetEmail({ to, name, companyName, code, expiresAt }) {
  const template = pinResetCodeEmail({
    name,
    companyName,
    code,
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
  getAppBaseUrl,
  buildFrontendLink,
  sendFirstAccessEmail,
  sendPasswordResetEmail,
  sendClientEmailVerificationEmail,
  sendBarberPinResetEmail
};
