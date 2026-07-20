'use strict';

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
// NOTA: dotenv.config() é carregado SOMENTE na execução direta (bloco
// require.main no fim). Sob require (testes), não há efeito colateral no
// process.env — o backend/.env aponta para o pooler de PRODUÇÃO, e carregá-lo
// em teste arriscaria conectar os testes à produção.

// ─────────────────────────────────────────────────────────────────────────────
// Runner de migrations — OPS-MIGRATIONS-03C (ADR-006 + Emenda 01).
//
// Garantias:
//   - trava de concorrência (pg_advisory_lock) numa SESSÃO estável;
//   - cada migration + seu registro em schema_migrations são ATÔMICOS
//     (uma transação: aplica e registra, ou nada);
//   - arquivo .sql ausente é ERRO (não warning) — interrompe;
//   - exit code ≠ 0 em qualquer falha → bloqueia o start do backend;
//   - idempotente (schema_migrations controla o que já foi aplicado);
//   - nunca imprime usuário, senha ou connection string.
//
// Endpoint (Emenda 01): usa MIGRATION_DATABASE_URL (pooler modo SESSION, 5432)
// se presente; senão cai em DATABASE_URL com aviso. A app NÃO é afetada — este
// runner tem pool próprio, dedicado, fora do wrapper tenant-aware da aplicação.
// ─────────────────────────────────────────────────────────────────────────────

// Chave da trava de concorrência (advisory lock). Constante estável do runner.
const MIGRATION_LOCK_KEY = 947110031;

// Ordem de execução. Adicionar novas migrations SEMPRE ao final.
// Formato do nome: YYYYMMDD_NNN_descricao.sql
const migrations = [
  { version: '20251231_000', file: 'base-schema.sql' },
  { version: '20260101_001', file: 'auth-security.sql' },
  { version: '20260101_002', file: 'master-dashboard.sql' },
  { version: '20260101_003', file: 'master-finance.sql' },
  { version: '20260101_004', file: 'master-admin.sql' },
  { version: '20260101_005', file: 'barber.sql' },
  { version: '20260101_006', file: 'client-booking.sql' },
  { version: '20260101_007', file: 'first-access.sql' },
  { version: '20260101_008', file: 'booking-landing.sql' },
  { version: '20260101_009', file: 'crm-tables.sql' },
  { version: '20260101_010', file: 'migrations-availability.sql' },
  { version: '20260101_011', file: 'outbox.sql' },
  { version: '20260101_012', file: 'integration-configs.sql' },
  { version: '20260101_013', file: 'migration-starts-at-ends-at.sql' },
  { version: '20260526_014', file: 'clima.sql' },
  { version: '20260526_015', file: 'clima_appointments.sql' },
  { version: '20260526_016', file: 'trial_email_log.sql' },
  { version: '20260526_017', file: 'rls_tenant_tables.sql' },

  // Fase 2 — PRD-008/009/010/011
  { version: '20260603_018', file: 'mg_prepaid_v1.sql' },
  { version: '20260603_019', file: 'mg_packages_v1.sql' },
  { version: '20260603_020', file: 'mg_loyalty_v1.sql' },
  { version: '20260603_021', file: 'mg_anamnese_v1.sql' },

  // Fase 1 — B2: Idempotência por handler no OutboxWorker
  { version: '20260604_022', file: 'outbox_message_handlers.sql' },

  // Fase 2 — Lembrete de agendamento via WhatsApp
  { version: '20260604_023', file: 'barber_appointments_reminder.sql' },

  // A-001 — RLS policies para companies + users (sem app.auth_scope)
  { version: '20260624_024', file: '20260624_024_rls_companies_users.sql' },

  // A-001, P2 — WITH CHECK explícito nas 22 policies tenant existentes
  { version: '20260624_025', file: '20260624_025_rls_with_check.sql' },

  // A-001, P3 — Role app_runtime NOBYPASSRLS + grants
  { version: '20260624_026', file: '20260624_026_rls_app_runtime_role.sql' },

  // RLS — policies de tenant_isolation para company_modules/modules
  { version: '20260625_027', file: '20260625_027_rls_company_modules.sql' },

  // RLS — policy de tenant_isolation para subscriptions
  { version: '20260625_028', file: '20260625_028_rls_subscriptions.sql' },

  // R-003 — Grants explícitos e reforço RLS para barber_working_hours e dependências
  { version: '20260626_029', file: '20260626_029_fix_barber_working_hours_grants.sql' },

  // Sessões de refresh token — rotação + revogação server-side no logout
  { version: '20260702_030', file: '20260702_030_refresh_tokens.sql' },

  // Fase 1 — IA Operacional: tabela ai_suggestions (previsão de demanda + churn)
  { version: '20260708_031', file: '20260708_031_ai_suggestions.sql' },
];

// ─── Modo estrito (OPS-MIGRATIONS-03D GATE 4) ────────────────────────────────
// Transforma a regra invariante da 03D — "o fallback para DATABASE_URL NÃO
// será aceito em produção" — de disciplina operacional em GARANTIA DE CÓDIGO.
//
// Sem modo estrito o comportamento é o de sempre (fallback com aviso), o que
// mantém o CI funcionando: lá o alvo é o Postgres efêmero via DATABASE_URL.
// Com modo estrito, o runner exige endpoint DEDICADO e de SESSÃO (porta 5432)
// e falha antes de abrir qualquer conexão.
//
// Ativação: flag `--strict` (multiplataforma) ou MIGRATION_STRICT=1.
const MIGRATION_SESSION_PORT = '5432';

function isStrictMode(env = process.env, argv = process.argv) {
  return String(env.MIGRATION_STRICT) === '1' || argv.includes('--strict');
}

// Falha ANTES de conectar se o endpoint não satisfizer a invariante.
function assertStrictEndpoint(connectionString, dedicated) {
  if (!dedicated) {
    const e = new Error('modo estrito exige MIGRATION_DATABASE_URL — fallback proibido');
    e.code = 'STRICT_REQUIRES_DEDICATED';
    throw e;
  }
  let parsed;
  try {
    parsed = new URL(connectionString);
  } catch {
    const e = new Error('MIGRATION_DATABASE_URL inválida');
    e.code = 'STRICT_INVALID_URL';
    throw e;
  }
  // A PORTA PRECISA SER EXPLÍCITA e igual a 5432.
  //  - porta 6543 → pooler em modo transaction, onde pg_advisory_lock (por
  //    sessão) é decorativo — exatamente o que a Emenda 01 proíbe;
  //  - porta AUSENTE → `parsed.port` é '' e também é recusada. É deliberado:
  //    num gate bloqueante, depender do default implícito do driver torna a
  //    intenção ambígua. Melhor falhar alto e exigir a porta escrita.
  if (parsed.port !== MIGRATION_SESSION_PORT) {
    const detalhe = parsed.port === '' ? 'porta ausente' : 'porta não é de sessão';
    const e = new Error(`modo estrito exige endpoint de SESSÃO explícito (${detalhe})`);
    e.code = 'STRICT_REQUIRES_SESSION_PORT';
    throw e;
  }
}

// Resolve o endpoint do runner. MIGRATION_DATABASE_URL tem precedência
// (Emenda 01: pooler modo session, 5432). Fallback: DATABASE_URL.
function resolveMigrationConnectionString(env = process.env) {
  const dedicated = String(env.MIGRATION_DATABASE_URL || '').trim();
  if (dedicated) return { connectionString: dedicated, dedicated: true };
  const fallback = String(env.DATABASE_URL || '').trim();
  return { connectionString: fallback, dedicated: false };
}

// Descreve o endpoint SEM identificar o ambiente — nunca host, porta,
// project ref, usuário, senha, IP, URL ou nome do banco (que revelaria prod x
// test). Apenas o booleano "dedicado" (LOG_TARGET_DISCLOSURE_PRE_EXISTENTE).
function describeEndpoint(dedicated) {
  return `dedicado=${dedicated === true}`;
}

// Códigos de erro seguros de expor. Qualquer coisa fora desta lista vira um
// rótulo genérico — a mensagem crua do pg/driver pode conter host, IP ou
// connection string (ex.: "connect ENETUNREACH <IPv6>:5432") e NUNCA é logada.
const SAFE_ERROR_CODES = new Set([
  // rede / sistema
  'ENOTFOUND', 'ENETUNREACH', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT',
  'EAI_AGAIN', 'EHOSTUNREACH', 'EPIPE',
  // TLS
  'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  // postgres (SQLSTATE)
  '28P01', '28000', '08P01', '08006', '08001', '3D000', '53300', '57P03',
  '42501', '42P01', '42P07',
  // internos do runner (sem detalhe de ambiente)
  'NO_CONFIG', 'LOCK_BUSY', 'INTEGRITY_FAIL', 'MIGRATION_FILE_MISSING',
  'MIGRATION_APPLY_FAILED',
  // modo estrito (03D GATE 4)
  'STRICT_REQUIRES_DEDICATED', 'STRICT_INVALID_URL', 'STRICT_REQUIRES_SESSION_PORT',
]);

// Reduz um erro a um CÓDIGO seguro. Jamais retorna err.message.
function sanitizeError(err) {
  const code = err && err.code != null ? String(err.code) : '';
  if (SAFE_ERROR_CODES.has(code)) return code;
  return code ? 'ERRO_NAO_MAPEADO' : 'ERRO_DESCONHECIDO';
}

// Linha final de erro — só código sanitizado e, quando houver, a VERSÃO da
// migration (identificador de migration, não de ambiente).
function formatFatal(err) {
  const mig = err && err.version ? ` migration=${err.version}` : '';
  return `[migrate] falha — codigo=${sanitizeError(err)}${mig}`;
}

// TLS: espelha backend/src/config/database.js. Com CA configurado, verifica o
// certificado; em teste, desliga; senão, cifra sem verificar (ver
// SEC-DATABASE-TLS-001). Injetável para permitir teste sem TLS.
function buildSslConfig(env = process.env) {
  if (env.NODE_ENV === 'test') return false;
  if (env.DATABASE_SSL_CA) {
    return { ca: env.DATABASE_SSL_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true };
  }
  if (env.DATABASE_SSL_CA_PATH) {
    return { ca: fs.readFileSync(env.DATABASE_SSL_CA_PATH, 'utf8'), rejectUnauthorized: true };
  }
  return { rejectUnauthorized: false };
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      duration_ms INTEGER
    )
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query('SELECT version FROM schema_migrations');
  return new Set(result.rows.map((r) => r.version));
}

function readMigrationSql(file) {
  const filePath = path.resolve(__dirname, '..', 'src', 'database', file);
  if (!fs.existsSync(filePath)) {
    // Arquivo ausente é ERRO — uma migration listada mas sumida jamais pode
    // passar silenciosamente (era o comportamento [warn]+continue anterior).
    const e = new Error('arquivo de migration não encontrado');
    e.code = 'MIGRATION_FILE_MISSING';
    throw e;
  }
  // Remove BOM UTF-8 — Postgres falha com "syntax error" se o BOM chegar
  // como primeiro caractere.
  return fs.readFileSync(filePath, 'utf8').replace(/^﻿/, '');
}

// Aplica UMA migration atomicamente: DDL + registro na MESMA transação.
// Crash entre aplicar e registrar é impossível — ou ambos, ou nenhum.
async function applyMigration(client, version, file, applied) {
  if (applied.has(version)) {
    console.log(`[skip]  ${version} — ${file} (já aplicada)`);
    return;
  }

  const sql = readMigrationSql(file);
  const start = Date.now();

  try {
    await client.query('BEGIN');
    await client.query(sql);
    const duration = Date.now() - start;
    await client.query(
      `INSERT INTO schema_migrations (version, name, duration_ms)
       VALUES ($1, $2, $3)
       ON CONFLICT (version) DO NOTHING`,
      [version, file.replace('.sql', ''), duration]
    );
    await client.query('COMMIT');
    console.log(`[ok]    ${version} — ${file} (${duration}ms)`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    // Re-lança preservando o CÓDIGO do erro original (para diagnóstico) e a
    // versão, mas NUNCA a mensagem crua — ela pode conter host/IP/URL.
    const e = new Error('falha ao aplicar migration');
    e.code = SAFE_ERROR_CODES.has(String(err && err.code)) ? String(err.code) : 'MIGRATION_APPLY_FAILED';
    e.version = version;
    throw e;
  }
}

// Executa todas as migrations pendentes sob trava de concorrência, num único
// client de sessão. Recebe o Pool por injeção (testável).
async function run({ PoolCtor = Pool, env = process.env, argv = process.argv } = {}) {
  const { connectionString, dedicated } = resolveMigrationConnectionString(env);

  if (!connectionString) {
    const e = new Error('endpoint não configurado');
    e.code = 'NO_CONFIG';
    throw e;
  }

  const strict = isStrictMode(env, argv);

  if (strict) {
    // Falha ANTES de qualquer conexão. Nenhum fallback é tolerado.
    assertStrictEndpoint(connectionString, dedicated);
    console.log('[migrate] modo estrito: endpoint dedicado de sessão exigido');
  } else if (!dedicated) {
    console.warn(
      '[migrate] MIGRATION_DATABASE_URL não configurada — usando DATABASE_URL. '
      + 'Em produção, a trava exige endpoint de SESSÃO estável (pooler 5432).'
    );
  }

  console.log(`\n[migrate] endpoint ${describeEndpoint(dedicated)}\n`);

  const pool = new PoolCtor({
    connectionString,
    ssl: buildSslConfig(env),
    max: 1,
  });

  // Um único client mantém a sessão viva durante toda a corrida — requisito da
  // trava: pg_advisory_lock é por SESSÃO, some se a conexão voltar ao pool.
  // client fica indefinido se o connect falhar; o finally trata os dois casos.
  let client;
  let lockAcquired = false;

  try {
    console.log('[migrate] conectando…');
    client = await pool.connect();
    console.log('[migrate] conexão estabelecida');

    const lock = await client.query('SELECT pg_try_advisory_lock($1) AS ok', [MIGRATION_LOCK_KEY]);
    lockAcquired = lock.rows[0].ok === true;
    if (!lockAcquired) {
      // Outra execução já detém a trava. Falha limpa — nunca aplica em paralelo.
      const e = new Error('outra execução de migrations em andamento');
      e.code = 'LOCK_BUSY';
      throw e;
    }

    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);
    const pendentes = migrations.filter((m) => !applied.has(m.version)).length;
    console.log(`[migrate] migrations pendentes: ${pendentes}`);

    for (const { version, file } of migrations) {
      await applyMigration(client, version, file, applied);
    }

    // Verificação de integridade pós-migration.
    const check = await client.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'pin_reset_tokens'`
    );
    if (check.rowCount === 0) {
      const e = new Error('verificação de integridade falhou');
      e.code = 'INTEGRITY_FAIL';
      throw e;
    }

    console.log('[migrate] todas as migrations aplicadas com sucesso.');
  } finally {
    if (client && lockAcquired) {
      await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]).catch(() => {});
    }
    if (client) client.release();
    await pool.end().catch(() => {});
  }
}

// Execução direta (npm run migrate). Sob require (testes), apenas exporta.
if (require.main === module) {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
  run().catch((err) => {
    console.error(formatFatal(err));
    process.exit(1);
  });
}

module.exports = {
  run,
  migrations,
  resolveMigrationConnectionString,
  isStrictMode,
  assertStrictEndpoint,
  describeEndpoint,
  sanitizeError,
  formatFatal,
  buildSslConfig,
  readMigrationSql,
  applyMigration,
  MIGRATION_LOCK_KEY,
};
