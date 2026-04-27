function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatExpiration(expiresAt) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Cuiaba'
  }).format(new Date(expiresAt));
}

function baseLayout({ title, intro, link, buttonText, expiresAt, footer }) {
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeLink = escapeHtml(link);
  const safeButtonText = escapeHtml(buttonText);
  const safeExpiresAt = escapeHtml(formatExpiration(expiresAt));
  const safeFooter = escapeHtml(footer);

  const text = [
    title,
    '',
    intro,
    '',
    `${buttonText}: ${link}`,
    '',
    `Este link expira em ${safeExpiresAt}.`,
    footer
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f6f7f9;padding:32px;color:#1f2937">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:28px">
        <h1 style="font-size:22px;margin:0 0 16px;color:#111827">${safeTitle}</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 24px">${safeIntro}</p>
        <p style="margin:0 0 24px">
          <a href="${safeLink}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700">
            ${safeButtonText}
          </a>
        </p>
        <p style="font-size:14px;line-height:1.6;margin:0 0 16px;color:#4b5563">
          Se o botao nao funcionar, copie e cole este link no navegador:<br>
          <a href="${safeLink}" style="color:#2563eb;word-break:break-all">${safeLink}</a>
        </p>
        <p style="font-size:14px;line-height:1.6;margin:0 0 16px;color:#4b5563">
          Este link expira em <strong>${safeExpiresAt}</strong>.
        </p>
        <p style="font-size:13px;line-height:1.6;margin:0;color:#6b7280">${safeFooter}</p>
      </div>
    </div>
  `;

  return { text, html };
}

function firstAccessEmail({ name, companyName, link, expiresAt }) {
  const title = 'Primeiro acesso ao MultGestor';
  const intro = `Ola, ${name}. Seu acesso ao MultGestor para ${companyName} foi criado. Defina sua senha para comecar a usar a plataforma.`;

  return {
    subject: title,
    ...baseLayout({
      title,
      intro,
      link,
      buttonText: 'Definir senha',
      expiresAt,
      footer: 'Se voce nao esperava este convite, ignore este email ou fale com o administrador da plataforma.'
    })
  };
}

function passwordResetEmail({ name, link, expiresAt }) {
  const title = 'Redefinicao de senha - MultGestor';
  const intro = `Ola, ${name}. Recebemos uma solicitacao para redefinir a senha da sua conta MultGestor.`;

  return {
    subject: title,
    ...baseLayout({
      title,
      intro,
      link,
      buttonText: 'Redefinir senha',
      expiresAt,
      footer: 'Se voce nao solicitou esta redefinicao, ignore este email. Sua senha atual continuara valida.'
    })
  };
}

function clientEmailVerificationEmail({ name, link, expiresAt }) {
  const title = 'Confirme seu e-mail para agendar seu horario';
  const intro = `Ola, ${name}. Clique no botao abaixo para confirmar seu e-mail e concluir seu cadastro.`;

  return {
    subject: title,
    ...baseLayout({
      title,
      intro,
      link,
      buttonText: 'Confirmar e-mail',
      expiresAt,
      footer: 'Se voce nao iniciou este cadastro, ignore esta mensagem.'
    })
  };
}

module.exports = {
  firstAccessEmail,
  passwordResetEmail,
  clientEmailVerificationEmail
};
