'use strict';

// PROBE TEMPORÁRIO — OPS-MIGRATIONS-03D GATE 3.
//
// Invariantes:
// - exige MIGRATION_DATABASE_URL e nunca lê DATABASE_URL como fallback;
// - executa somente SELECT 1 e advisory lock/unlock com chave dedicada;
// - não carrega dotenv, o runner ou qualquer migration;
// - falha com código não zero em qualquer erro;
// - nunca registra URL, host, usuário, senha, banco, IP ou project ref.

const { Client } = require('pg');

const TAG = '[probe-migv]';
const PROBE_LOCK_KEY = 947110303;
const CONNECT_TIMEOUT_MS = 8000;
const QUERY_TIMEOUT_MS = 5000;

const SAFE_ERROR_CODES = new Set([
  'ENOTFOUND', 'ENETUNREACH', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT',
  'EAI_AGAIN', 'EHOSTUNREACH', 'EPIPE',
  'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  '28P01', '28000', '08P01', '08006', '08001', '3D000', '53300', '57P03',
  'NO_MIGRATION_URL', 'ENDPOINT_INVALIDO', 'LOCK_NOT_ACQUIRED',
  'LOCK_RELEASE_FAILED',
]);

function probeError(code) {
  const error = new Error('probe failed');
  error.code = code;
  return error;
}

function sanitizeError(error) {
  const code = error && error.code != null ? String(error.code) : '';
  if (SAFE_ERROR_CODES.has(code)) return code;
  return code ? 'ERRO_NAO_MAPEADO' : 'ERRO_DESCONHECIDO';
}

function validateEndpoint(raw) {
  let endpoint;
  try {
    endpoint = new URL(String(raw || ''));
  } catch {
    return { ok: false, motivo: 'URL_INVALIDA' };
  }

  if (endpoint.protocol !== 'postgres:' && endpoint.protocol !== 'postgresql:') {
    return { ok: false, motivo: 'PROTOCOLO_INVALIDO' };
  }
  if (endpoint.port !== '5432') {
    return { ok: false, motivo: 'PORTA_NAO_5432' };
  }
  return { ok: true };
}

function buildSslConfig(env = process.env) {
  if (env.NODE_ENV === 'test') return false;
  if (env.DATABASE_SSL_CA) {
    return { ca: env.DATABASE_SSL_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true };
  }
  return { rejectUnauthorized: false };
}

function withTimeout(promise, timeoutMs) {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(probeError('ETIMEDOUT')), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function writeLog(logger, message) {
  logger.log(`${TAG} ${message}`);
}

async function runProbe({ ClientCtor = Client, env = process.env, logger = console } = {}) {
  const raw = String(env.MIGRATION_DATABASE_URL || '').trim();
  writeLog(logger, `MIGRATION_DATABASE_URL presente: ${raw.length > 0}`);
  if (!raw) throw probeError('NO_MIGRATION_URL');

  const validation = validateEndpoint(raw);
  writeLog(
    logger,
    `endpoint válido (protocolo + porta 5432): ${validation.ok}`
      + (validation.ok ? '' : ` motivo=${validation.motivo}`)
  );
  if (!validation.ok) throw probeError('ENDPOINT_INVALIDO');

  const client = new ClientCtor({
    connectionString: raw,
    ssl: buildSslConfig(env),
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    statement_timeout: QUERY_TIMEOUT_MS,
  });

  let locked = false;
  let failure;

  try {
    writeLog(logger, 'conectando');
    await withTimeout(client.connect(), CONNECT_TIMEOUT_MS);
    writeLog(logger, 'conexão estabelecida');

    await withTimeout(client.query('SELECT 1'), QUERY_TIMEOUT_MS);
    writeLog(logger, 'SELECT 1: ok');

    const lockResult = await withTimeout(
      client.query('SELECT pg_try_advisory_lock($1) AS ok', [PROBE_LOCK_KEY]),
      QUERY_TIMEOUT_MS
    );
    locked = lockResult.rows[0].ok === true;
    writeLog(logger, `advisory lock adquirido: ${locked}`);
    if (!locked) throw probeError('LOCK_NOT_ACQUIRED');

    writeLog(logger, 'validação concluída: endpoint dedicado/session OK');
  } catch (error) {
    failure = error;
  } finally {
    if (locked) {
      try {
        const unlockResult = await withTimeout(
          client.query('SELECT pg_advisory_unlock($1) AS ok', [PROBE_LOCK_KEY]),
          QUERY_TIMEOUT_MS
        );
        if (unlockResult.rows[0].ok !== true) throw probeError('LOCK_RELEASE_FAILED');
        writeLog(logger, 'advisory lock liberado: true');
      } catch (error) {
        if (!failure) failure = error;
      }
    }

    try {
      await withTimeout(client.end(), CONNECT_TIMEOUT_MS);
    } catch (error) {
      if (!failure) failure = error;
    }
  }

  if (failure) throw failure;
}

async function main(options = {}) {
  const logger = options.logger || console;
  try {
    await runProbe({ ...options, logger });
    writeLog(logger, 'OK');
    return 0;
  } catch (error) {
    logger.error(`${TAG} falha — codigo=${sanitizeError(error)}`);
    return 1;
  }
}

if (require.main === module) {
  main().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

module.exports = {
  main,
  runProbe,
  validateEndpoint,
  sanitizeError,
  buildSslConfig,
  PROBE_LOCK_KEY,
};
