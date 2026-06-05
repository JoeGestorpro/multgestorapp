'use strict';

const { requireTenant } = require('../shared/tenant');
const pool = require('../config/database');
const { runWithTenantClient } = require('../config/database');
const { appLogger } = require('../shared/core/logger');

const STATEMENT_TIMEOUT_MS = Number(process.env.TENANT_STATEMENT_TIMEOUT_MS || 30000);
const IDLE_TXN_TIMEOUT_MS = Number(process.env.TENANT_IDLE_TXN_TIMEOUT_MS || 60000);

module.exports = function requireCompany(req, res, next) {
  let tenant;
  try {
    tenant = requireTenant(req);
  } catch {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }
    return res.status(403).json({ success: false, error: 'Empresa não identificada' });
  }

  (async () => {
    let client = null;
    let released = false;

    async function release(commit) {
      if (released || !client) return;
      released = true;
      try {
        if (commit) {
          await client.query('COMMIT');
        } else {
          await client.query('ROLLBACK');
        }
      } catch (err) {
        appLogger.warn({ err: err.message }, '[requireCompany] erro no COMMIT/ROLLBACK');
      }
      try {
        client.release();
      } catch (_) {}
      client = null;
    }

    try {
      client = await pool.connect();
      await client.query(`SET statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
      await client.query(`SET idle_in_transaction_session_timeout = ${IDLE_TXN_TIMEOUT_MS}`);
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(tenant.companyId)]);
    } catch (err) {
      appLogger.error({ err: err.message }, '[requireCompany] falha ao abrir contexto tenant');
      if (client) {
        try { client.release(); } catch (_) {}
      }
      return res.status(500).json({ success: false, error: 'Falha ao inicializar contexto da empresa' });
    }

    let hasError = false;

    res.on('close', () => {
      if (!res.writableFinished) hasError = true;
      release(!hasError);
    });

    res.on('finish', () => {
      release(!hasError);
    });

    res.on('error', () => {
      hasError = true;
    });

    runWithTenantClient(client, tenant.companyId, () => next());
  })();
};
