'use strict';

const pool = require('../config/database');
const { appLogger } = require('../shared/core/logger');

// Retenção pós-expiração/revogação: mantém a trilha replaced_by por alguns
// dias para investigação e depois remove (a tabela não pode crescer sem
// limite — 1 linha nova por login e por rotação de refresh).
const RETENTION_DAYS = Number(process.env.REFRESH_TOKEN_RETENTION_DAYS || 14);

async function runRefreshTokenPurgeJob() {
  const result = await pool.query(
    `DELETE FROM refresh_tokens
     WHERE (expires_at < NOW() - ($1 || ' days')::interval)
        OR (revoked_at IS NOT NULL AND revoked_at < NOW() - ($1 || ' days')::interval)`,
    [RETENTION_DAYS]
  );

  if (result.rowCount > 0) {
    appLogger.info({ purged: result.rowCount, retentionDays: RETENTION_DAYS }, '[RefreshTokenPurgeJob] Sessões expiradas removidas');
  }

  return result.rowCount;
}

module.exports = { runRefreshTokenPurgeJob };
