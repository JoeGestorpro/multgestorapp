'use strict';

const pool = require('../config/database');
const { sendTrialEmail } = require('../services/email/trial-emails.service');
const { appLogger } = require('../shared/core/logger');

/**
 * Job que envia emails de trial conforme o tempo desde o registro da empresa.
 * D+0: welcome (enviado no registro, nao aqui)
 * D+4: progress
 * D+6: expiring
 * D+7: expired
 */
async function runTrialEmailJob() {
  appLogger.info('[TrialEmailJob] Iniciando varredura');

  const client = await pool.connect();

  try {
    // Buscar empresas em trial (plan_type = 'trial' ou trial_ends_at no futuro)
    const companiesResult = await client.query(
      `SELECT c.id, c.name, c.email, c.created_at, u.email AS owner_email,
              EXTRACT(DAY FROM (NOW() - c.created_at)) AS days_since_created
       FROM companies c
       LEFT JOIN users u ON u.company_id = c.id AND u.role = 'admin'
       WHERE c.status = 'active'
         AND COALESCE(c.is_deleted, false) = false
         AND (
           c.plan_type = 'trial'
           OR c.trial_ends_at > NOW()
           OR c.trial_ends_at IS NULL
         )
       ORDER BY c.created_at ASC`
    );

    const companies = companiesResult.rows;
    let sentCount = 0;

    for (const company of companies) {
      const days = Math.floor(Number(company.days_since_created));

      // Mapear dia -> tipo de email
      const emailType = { 4: 'progress', 6: 'expiring', 7: 'expired' }[days];
      if (!emailType) continue;

      // Verificar se ja foi enviado
      const logResult = await client.query(
        `SELECT 1 FROM trial_email_log WHERE company_id = $1 AND email_type = $2 LIMIT 1`,
        [company.id, emailType]
      );

      if (logResult.rowCount > 0) {
        continue; // ja enviado
      }

      // Enviar email
      try {
        const result = await sendTrialEmail(emailType, company);
        if (result.sent) {
          // Registrar no log
          await client.query(
            `INSERT INTO trial_email_log (company_id, email_type) VALUES ($1, $2)`,
            [company.id, emailType]
          );
          sentCount++;
          appLogger.info({ companyId: company.id, emailType, days }, '[TrialEmailJob] Email enviado');
        }
      } catch (err) {
        appLogger.error({ err, companyId: company.id, emailType }, '[TrialEmailJob] Erro ao enviar email');
      }
    }

    appLogger.info({ sentCount }, '[TrialEmailJob] Varredura concluida');
  } finally {
    client.release();
  }
}

module.exports = { runTrialEmailJob };
