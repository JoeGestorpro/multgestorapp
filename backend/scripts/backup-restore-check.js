'use strict';

/**
 * backup-restore-check.js — Rotina segura de backup/restore-check do MultGestor.
 *
 * Faz um pg_dump do banco de ORIGEM (somente leitura), restaura num projeto Supabase
 * DESCARTÁVEL e valida que o schema `public` (tabelas, policies, RLS) e as contagens das
 * tabelas críticas batem entre origem e destino.
 *
 * REGRAS DE SEGURANÇA (invioláveis):
 *  1. A ORIGEM é SOMENTE leitura/dump. A sessão de validação roda READ ONLY; nunca há
 *     pg_restore/escrita contra a origem.
 *  2. O RESTORE só vai para o TARGET descartável e exige a flag --target-is-disposable.
 *  3. Aborta se origem e destino forem o mesmo endpoint (host:port/db).
 *  4. Aborta se o host do destino estiver na denylist (BRCHK_PROTECTED_HOSTS). A própria
 *     origem é sempre adicionada à denylist automaticamente.
 *  5. Erros de objetos internos do Supabase (auth/storage/realtime/vault/extensions/event
 *     triggers) são WARNING, não falha fatal.
 *  6. Aprova SOMENTE se: dump legível + restore executado + public_tables, public_policies,
 *     rls_on, rls_off e as contagens das tabelas críticas baterem entre origem e destino.
 *  7. NUNCA loga connection string, host, usuário, senha, service_role key nem conteúdo do
 *     dump — só labels e métricas.
 *
 * NÃO automatiza restore em produção. Uso manual, ambiente descartável/teste apenas.
 *
 * Uso (PowerShell):
 *   $env:BRCHK_SOURCE_DB_URL = '<conn principal>'    # só leitura/dump
 *   $env:BRCHK_TARGET_DB_URL = '<conn descartável>'  # restore
 *   npm run backup-restore-check -- --target-is-disposable
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Client } = require('pg');

const DEFAULT_CRITICAL_TABLES = ['companies', 'users', 'modules', 'plans', 'subscriptions', 'company_modules'];
const MANAGED_SCHEMAS = ['auth', 'storage', 'realtime', 'vault', 'extensions', 'graphql', 'graphql_public', 'supabase_migrations', 'cron', 'net', 'pgsodium'];
const IDENT_RE = /^[a-z_][a-z0-9_]*$/;
const BAR = '━'.repeat(56);

// ───────────────────────── helpers puros (testáveis, sem DB) ─────────────────────────

function parseArgs(argv) {
  const args = {};
  for (const a of argv || []) {
    if (typeof a === 'string' && a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      args[k] = v === undefined ? true : v;
    }
  }
  return args;
}

function parseEndpoint(connStr) {
  if (!connStr || typeof connStr !== 'string') {
    throw new Error('connection string ausente');
  }
  let u;
  try {
    u = new URL(connStr);
  } catch (_) {
    throw new Error('connection string inválida (não é uma URL postgres)');
  }
  return {
    host: (u.hostname || '').toLowerCase(),
    port: u.port || '5432',
    database: decodeURIComponent((u.pathname || '').replace(/^\//, '')) || 'postgres',
    user: decodeURIComponent(u.username || ''),
    password: decodeURIComponent(u.password || ''),
  };
}

function sameEndpoint(a, b) {
  return a.host === b.host && String(a.port) === String(b.port) && a.database === b.database;
}

/** Guard de topologia: garante que o restore só pode ir para um descartável distinto da origem. */
function assertSafeTopology({ source, target, disposableFlag, protectedHosts }) {
  if (sameEndpoint(source, target)) {
    throw new Error('ABORTADO: origem e destino são o mesmo endpoint (host:port/db). O restore só pode ir para um alvo descartável distinto.');
  }
  if (!disposableFlag) {
    throw new Error('ABORTADO: faltou --target-is-disposable. O restore só é permitido contra um projeto descartável/teste, confirmado explicitamente.');
  }
  const denylist = (protectedHosts || []).map((h) => String(h).trim().toLowerCase()).filter(Boolean);
  if (denylist.includes(target.host)) {
    throw new Error('ABORTADO: host de destino está na denylist de produção. Restore proibido nesse alvo.');
  }
}

/** Classifica uma linha de saída do pg_restore: 'warning' (objeto gerenciado) | 'error' | null. */
function classifyRestoreError(line) {
  const l = String(line).toLowerCase();
  if (!l.includes('error') && !l.includes('warning')) return null;
  const managedHit = MANAGED_SCHEMAS.some(
    (s) => l.includes(` ${s}.`) || l.includes(`schema "${s}"`) || l.includes(`"${s}".`) || l.includes(`for schema ${s}`)
  );
  const permHit =
    l.includes('must be owner') ||
    l.includes('must be superuser') ||
    l.includes('permission denied') ||
    l.includes('event trigger') ||
    l.includes('errors ignored on restore');
  if (managedHit || permHit) return 'warning';
  return 'error';
}

/** Lógica de aprovação (regra #6). Pura — não toca em DB. */
function computeVerdict({ dumpReadable, restoreExecuted, sourceStats, targetStats, sourceCounts, targetCounts, criticalTables }) {
  const reasons = [];
  if (!dumpReadable) reasons.push('dump não é legível (pg_restore -l falhou)');
  if (!restoreExecuted) reasons.push('restore não foi executado');
  for (const k of ['public_tables', 'public_policies', 'rls_on', 'rls_off']) {
    const s = sourceStats ? sourceStats[k] : undefined;
    const t = targetStats ? targetStats[k] : undefined;
    if (s === undefined || t === undefined || s !== t) {
      reasons.push(`${k} divergente (origem=${s ?? '?'} destino=${t ?? '?'})`);
    }
  }
  for (const tbl of criticalTables || []) {
    const s = sourceCounts ? sourceCounts[tbl] : undefined;
    const t = targetCounts ? targetCounts[tbl] : undefined;
    if (s === undefined || t === undefined || s !== t) {
      reasons.push(`contagem ${tbl} divergente (origem=${s ?? '?'} destino=${t ?? '?'})`);
    }
  }
  return { verdict: reasons.length === 0 ? 'APPROVED' : 'BLOCKED', reasons };
}

/** Monta o registro de log. NUNCA inclui connection string, host, usuário, senha, key ou conteúdo do dump. */
function buildLogRecord({
  startedAt, finishedAt, sourceLabel, targetLabel, dumpFile, dumpStatus,
  restoreStatus, restoreWarnings, sourceStats, targetStats, sourceCounts, targetCounts, verdict,
}) {
  return {
    tool: 'backup-restore-check',
    started_at: startedAt,
    finished_at: finishedAt,
    source: sourceLabel, // label, nunca host/URL
    target: targetLabel, // label, nunca host/URL
    dump_file: dumpFile ? path.basename(dumpFile) : null, // só o nome, nunca caminho/conteúdo
    dump_status: dumpStatus,
    restore_status: restoreStatus,
    restore_managed_warnings: restoreWarnings, // contagem, não o texto
    public_tables: { source: sourceStats?.public_tables ?? null, target: targetStats?.public_tables ?? null },
    public_policies: { source: sourceStats?.public_policies ?? null, target: targetStats?.public_policies ?? null },
    rls_on: { source: sourceStats?.rls_on ?? null, target: targetStats?.rls_on ?? null },
    rls_off: { source: sourceStats?.rls_off ?? null, target: targetStats?.rls_off ?? null },
    critical_counts: { source: sourceCounts ?? null, target: targetCounts ?? null },
    verdict: verdict.verdict,
    reasons: verdict.reasons,
  };
}

function loadConfig(args, env = process.env) {
  const sourceUrl = env.BRCHK_SOURCE_DB_URL;
  const targetUrl = env.BRCHK_TARGET_DB_URL;
  if (!sourceUrl) throw new Error('BRCHK_SOURCE_DB_URL ausente (origem — só leitura/dump).');
  if (!targetUrl) throw new Error('BRCHK_TARGET_DB_URL ausente (destino — projeto descartável).');
  const source = parseEndpoint(sourceUrl);
  const target = parseEndpoint(targetUrl);
  const protectedHosts = String(env.BRCHK_PROTECTED_HOSTS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  // A origem NUNCA pode ser destino — adiciona-se sempre à denylist (defesa em profundidade).
  if (!protectedHosts.includes(source.host)) protectedHosts.push(source.host);
  const criticalTables = env.BRCHK_CRITICAL_TABLES
    ? String(env.BRCHK_CRITICAL_TABLES).split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_CRITICAL_TABLES;
  for (const t of criticalTables) {
    if (!IDENT_RE.test(t)) throw new Error(`nome de tabela crítica inválido: "${t}"`);
  }
  const backupDir = env.BRCHK_BACKUP_DIR || path.join(os.homedir(), 'backups');
  return {
    sourceUrl, targetUrl, source, target,
    disposableFlag: !!args['target-is-disposable'],
    protectedHosts,
    sourceLabel: env.BRCHK_SOURCE_LABEL || 'source',
    targetLabel: env.BRCHK_TARGET_LABEL || 'target',
    backupDir,
    logDir: env.BRCHK_LOG_DIR || backupDir,
    criticalTables,
  };
}

// ───────────────────────── partes que tocam o ambiente (não unit-testadas) ─────────────────────────

function pgBinary(name, env = process.env) {
  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  return env.BRCHK_PG_BIN ? path.join(env.BRCHK_PG_BIN, exe) : exe;
}

function pgChildEnv(endpoint) {
  return {
    ...process.env,
    PGHOST: endpoint.host,
    PGPORT: String(endpoint.port),
    PGUSER: endpoint.user,
    PGPASSWORD: endpoint.password, // passa via env, nunca em argv/log
    PGDATABASE: endpoint.database,
    PGSSLMODE: 'require',
  };
}

function sslOption(env = process.env) {
  return env.BRCHK_SSL_REJECT_UNAUTHORIZED === 'true' ? { rejectUnauthorized: true } : { rejectUnauthorized: false };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function runPgDump(source, dumpPath) {
  execFileSync(pgBinary('pg_dump'), ['-Fc', '-b', '-f', dumpPath], {
    env: pgChildEnv(source),
    stdio: ['ignore', 'inherit', 'inherit'],
  });
}

function verifyDumpReadable(dumpPath) {
  try {
    execFileSync(pgBinary('pg_restore'), ['-l', dumpPath], { stdio: ['ignore', 'pipe', 'pipe'] });
    return true;
  } catch (_) {
    return false;
  }
}

function runPgRestore(target, dumpPath) {
  let executed = false;
  let output = '';
  try {
    execFileSync(pgBinary('pg_restore'), ['--no-owner', '--no-privileges', '-d', target.database, dumpPath], {
      env: pgChildEnv(target),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    executed = true;
  } catch (e) {
    // pg_restore retorna exit != 0 quando há erros de objetos gerenciados — isso é ESPERADO.
    executed = true;
    output = `${e.stderr ? e.stderr.toString() : ''}\n${e.stdout ? e.stdout.toString() : ''}`;
  }
  const warnings = [];
  const errors = [];
  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cls = classifyRestoreError(line);
    if (cls === 'warning') warnings.push(line.trim());
    else if (cls === 'error') errors.push(line.trim());
  }
  return { executed, warnings, errors };
}

async function connectSafe(url, label, { readOnly } = {}) {
  const client = new Client({ connectionString: url, ssl: sslOption() });
  try {
    await client.connect();
  } catch (_) {
    // Nunca propaga a mensagem crua do pg (pode conter host/usuário).
    throw new Error(`falha ao conectar em "${label}" (verifique a connection string e o SSL).`);
  }
  if (readOnly) {
    await client.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');
  }
  return client;
}

async function gatherPublicStats(client) {
  const tables = await client.query(
    "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );
  const policies = await client.query("SELECT count(*)::int AS n FROM pg_policies WHERE schemaname='public'");
  const rls = await client.query(
    `SELECT count(*) FILTER (WHERE c.relrowsecurity)::int AS rls_on,
            count(*) FILTER (WHERE NOT c.relrowsecurity)::int AS rls_off
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'`
  );
  return {
    public_tables: tables.rows[0].n,
    public_policies: policies.rows[0].n,
    rls_on: rls.rows[0].rls_on,
    rls_off: rls.rows[0].rls_off,
  };
}

async function gatherCriticalCounts(client, tables) {
  const out = {};
  for (const t of tables) {
    if (!IDENT_RE.test(t)) throw new Error(`nome de tabela crítica inválido: "${t}"`);
    const r = await client.query(`SELECT count(*)::int AS n FROM public.${t}`);
    out[t] = r.rows[0].n;
  }
  return out;
}

function printSummary(record, restore, logPath) {
  const ok = record.verdict === 'APPROVED';
  const line = (label, pair) => {
    const match = pair.source !== null && pair.source === pair.target ? '✓' : '✗';
    console.log(`  ${match} ${label.padEnd(16)} origem=${pair.source}  destino=${pair.target}`);
  };
  console.log(`\n${BAR}\n  BACKUP / RESTORE CHECK\n  ${record.started_at}\n${BAR}\n`);
  console.log(`  origem (label):   ${record.source}`);
  console.log(`  destino (label):  ${record.target}`);
  console.log(`  dump:             ${record.dump_status} (${record.dump_file || '—'})`);
  console.log(`  restore:          ${record.restore_status} (${record.restore_managed_warnings} warning(s) de objetos gerenciados)\n`);
  line('public_tables', record.public_tables);
  line('public_policies', record.public_policies);
  line('rls_on', record.rls_on);
  line('rls_off', record.rls_off);
  console.log('');
  for (const t of Object.keys(record.critical_counts.source || {})) {
    line(t, { source: record.critical_counts.source[t], target: record.critical_counts.target?.[t] ?? null });
  }
  if (restore && restore.warnings.length) {
    console.log(`\n  ℹ️  ${restore.warnings.length} aviso(s) de objetos gerenciados (esperado — auth/storage/realtime/vault/extensions/event triggers).`);
  }
  if (!ok) {
    console.log('\n  Motivos do bloqueio:');
    for (const r of record.reasons) console.log(`    ✗ ${r}`);
  }
  console.log(`\n${BAR}\n  ${ok ? '✓ APROVADO — schema public, RLS, policies e dados críticos batem.' : '✗ BLOQUEADO — ver motivos acima.'}\n  log: ${path.basename(logPath)}\n${BAR}\n`);
}

async function main(argv) {
  const config = loadConfig(parseArgs(argv));
  // Guards de segurança ANTES de qualquer operação.
  assertSafeTopology({
    source: config.source,
    target: config.target,
    disposableFlag: config.disposableFlag,
    protectedHosts: config.protectedHosts,
  });

  const startedAt = new Date().toISOString();
  const stamp = startedAt.replace(/[:.]/g, '-');
  ensureDir(config.backupDir);
  const dumpPath = path.join(config.backupDir, `${config.sourceLabel}-${stamp}.dump`);

  // 1. Dump da origem (somente leitura).
  let dumpStatus = 'ok';
  try {
    runPgDump(config.source, dumpPath);
  } catch (_) {
    dumpStatus = 'failed';
  }

  // 2. Dump é legível?
  const dumpReadable = dumpStatus === 'ok' && verifyDumpReadable(dumpPath);

  // 3. Restore no destino descartável (só se o dump é legível).
  let restore = { executed: false, warnings: [], errors: [] };
  if (dumpReadable) restore = runPgRestore(config.target, dumpPath);

  // 4. Validação read-only (origem) + leitura (destino).
  let sourceStats = null;
  let targetStats = null;
  let sourceCounts = null;
  let targetCounts = null;
  let src;
  try {
    src = await connectSafe(config.sourceUrl, config.sourceLabel, { readOnly: true });
    sourceStats = await gatherPublicStats(src);
    sourceCounts = await gatherCriticalCounts(src, config.criticalTables);
  } finally {
    if (src) await src.end();
  }
  let tgt;
  try {
    tgt = await connectSafe(config.targetUrl, config.targetLabel, { readOnly: false });
    targetStats = await gatherPublicStats(tgt);
    targetCounts = await gatherCriticalCounts(tgt, config.criticalTables);
  } finally {
    if (tgt) await tgt.end();
  }

  // 5. Veredito.
  const verdict = computeVerdict({
    dumpReadable,
    restoreExecuted: restore.executed,
    sourceStats, targetStats, sourceCounts, targetCounts,
    criticalTables: config.criticalTables,
  });

  const record = buildLogRecord({
    startedAt,
    finishedAt: new Date().toISOString(),
    sourceLabel: config.sourceLabel,
    targetLabel: config.targetLabel,
    dumpFile: dumpPath,
    dumpStatus,
    restoreStatus: restore.executed ? (restore.errors.length ? 'executed_with_errors' : 'executed') : 'skipped',
    restoreWarnings: restore.warnings.length,
    sourceStats, targetStats, sourceCounts, targetCounts, verdict,
  });

  ensureDir(config.logDir);
  const logPath = path.join(config.logDir, `backup-restore-check-${stamp}.json`);
  fs.writeFileSync(logPath, JSON.stringify(record, null, 2));
  printSummary(record, restore, logPath);

  return verdict.verdict === 'APPROVED' ? 0 : 1;
}

module.exports = {
  parseArgs,
  parseEndpoint,
  sameEndpoint,
  assertSafeTopology,
  classifyRestoreError,
  computeVerdict,
  buildLogRecord,
  loadConfig,
};

if (require.main === module) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(`\n✗ backup-restore-check abortado: ${err.message}\n`);
      process.exit(2);
    });
}
