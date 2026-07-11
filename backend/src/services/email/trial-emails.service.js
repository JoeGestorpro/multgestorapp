'use strict';

const { sendMail } = require('./email.service');

const TRIAL_EMAILS_ENABLED = process.env.TRIAL_EMAILS_ENABLED === 'true';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getAppBaseUrl() {
  return String(
    process.env.APP_BASE_URL ||
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    'http://localhost:5173'
  ).trim().replace(/\/+$/, '');
}

function buildTemplate(type, company) {
  const appUrl = getAppBaseUrl();
  const companyName = escapeHtml(company.name || 'Sua empresa');
  const dashboardLink = `${appUrl}/barber/dashboard`;
  const choosePlanLink = `${appUrl}/escolher-plano`;

  const templates = {
    welcome: {
      subject: `Bem-vindo ao MultGestor, ${companyName}!`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2933;">
          <h2 style="color: #0f766e;">Bem-vindo ao MultGestor!</h2>
          <p>Olá, ${companyName}!</p>
          <p>Seu periodo de teste de 7 dias comecou. Aproveite para explorar todas as funcionalidades do sistema.</p>
          <h3 style="margin-top: 24px;">3 dicas para comecar:</h3>
          <ol>
            <li><strong>Cadastre seus servicos</strong> — configure cortes, barbas e pacotes</li>
            <li><strong>Adicione colaboradores</strong> — vincule barbeiros a seus horarios</li>
            <li><strong>Ative o agendamento online</strong> — deixe clientes marcarem pelo site</li>
          </ol>
          <p style="margin-top: 24px;">
            <a href="${dashboardLink}" style="background: #0f766e; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Acessar o painel</a>
          </p>
          <p style="color: #667085; font-size: 14px; margin-top: 32px;">Equipe MultGestor</p>
        </div>
      `
    },
    progress: {
      subject: `${companyName} — Voce esta na metade do seu teste gratuito`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2933;">
          <h2 style="color: #0f766e;">Voce esta na metade do seu teste!</h2>
          <p>Olá, ${companyName}!</p>
          <p>Faltam 3 dias para o fim do seu periodo de teste gratuito. Aproveite para explorar funcionalidades que ainda nao usou:</p>
          <ul>
            <li>Relatorios de vendas e comissoes</li>
            <li>Controle de caixa integrado</li>
            <li>Personalizacao da pagina de agendamento</li>
          </ul>
          <p style="margin-top: 24px;">
            <a href="${dashboardLink}" style="background: #0f766e; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Continuar usando o sistema</a>
          </p>
          <p style="color: #667085; font-size: 14px; margin-top: 32px;">Equipe MultGestor</p>
        </div>
      `
    },
    expiring: {
      subject: `URGENTE: Seu teste gratuito expira amanha, ${companyName}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2933;">
          <h2 style="color: #b42318;">Seu teste gratuito expira amanha!</h2>
          <p>Olá, ${companyName}!</p>
          <p>Amanha e o ultimo dia do seu periodo de teste gratuito. Para nao perder o acesso ao sistema, escolha um plano agora.</p>
          <p style="margin-top: 24px;">
            <a href="${choosePlanLink}" style="background: #b42318; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Escolher plano</a>
          </p>
          <p style="color: #667085; font-size: 14px; margin-top: 32px;">Equipe MultGestor</p>
        </div>
      `
    },
    expired: {
      subject: `Seu teste gratuito expirou, ${companyName}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2933;">
          <h2 style="color: #1f2933;">Seu teste gratuito expirou</h2>
          <p>Olá, ${companyName}!</p>
          <p>O periodo de teste de 7 dias chegou ao fim. Para continuar usando o MultGestor, escolha um plano que se encaixe no seu negocio.</p>
          <p style="margin-top: 24px;">
            <a href="${choosePlanLink}" style="background: #0f766e; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Ver planos disponiveis</a>
          </p>
          <p style="color: #667085; font-size: 14px; margin-top: 32px;">Equipe MultGestor</p>
        </div>
      `
    }
  };

  return templates[type] || templates.welcome;
}

async function sendTrialEmail(type, company) {
  if (!TRIAL_EMAILS_ENABLED) {
    return { sent: false, reason: 'TRIAL_EMAILS_ENABLED is false' };
  }

  const template = buildTemplate(type, company);
  const to = company.email || company.owner_email;

  if (!to) {
    return { sent: false, reason: 'No email address for company' };
  }

  await sendMail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.subject
  });

  return { sent: true };
}

module.exports = { sendTrialEmail, TRIAL_EMAILS_ENABLED };
