'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// SONDA TEMPORÁRIA — OPS-MIGRATIONS-03B (prova de conectividade do build).
//
// ⚠️ REMOVER APÓS A COLETA DAS EVIDÊNCIAS. Commit de rollback já preparado na
// branch `revert/probe-build-connectivity-03b`.
//
// Responde três perguntas dentro do build container do Render:
//   1. DATABASE_URL existe em tempo de build?
//   2. O build alcança o banco (porta de origem)?
//   3. O pooler em modo session (5432) responde e oferece SESSÃO ESTÁVEL?
//
// INVARIANTES (não relaxar sem nova autorização):
//   - NUNCA reprova o build: exit code 0 incondicional, inclusive em erro.
//   - Somente leitura: SELECT 1, pg_try_advisory_lock, pg_advisory_unlock.
//     Nenhum DDL, nenhum write, nenhuma tabela/schema/dado tocado.
//   - Nenhuma URL, hostname, IP, usuário, project ref, senha ou parâmetro de
//     conexão em log. Só booleanos, portas, latências e códigos genéricos.
//   - Timeout global e por conexão.
// ─────────────────────────────────────────────────────────────────────────────

const TAG = '[probe]';
const GLOBAL_TIMEOUT_MS = 25000;
const CONNECT_TIMEOUT_MS = 8000;
const QUERY_TIMEOUT_MS = 5000;

// Chave arbitrária de advisory lock. Namespace da aplicação; não toca dados.
const LOCK_KEY = 8123400001;

const log = (msg) => console.log(`${TAG} ${msg}`);

// Classifica falhas em código genérico. NUNCA propaga err.message nem stack:
// ambos podem carregar host, usuário ou parâmetros de conexão.
const SAFE_CODES = new Set([
  'ENOTFOUND', 'ENETUNREACH', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT',
  'EAI_AGAIN', 'EHOSTUNREACH', 'EPIPE', 'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  '28P01', '28000', '08P01', '08006', '08001', '3D000', '53300', '57P03',
]);

function classify(err) {
  const code = err && err.code != null ? String(err.code) : '';
  if (SAFE_CODES.has(code)) return code;
  if (code) return 'OUTRO';
  return 'DESCONHECIDO';
}

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => {
      const e = new Error(label);
      e.code = 'ETIMEDOUT';
      reject(e);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

// Deriva o endpoint de sessão via parser de URL — nunca por substituição textual.
// Só reconhece a troca quando a origem é comprovadamente pooler Supabase em 6543.
function derivarEndpointSession(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, motivo: 'URL_INVALIDA' };
  }

  const ehPooler = u.hostname.endsWith('.pooler.supabase.com');
  const ehPorta6543 = u.port === '6543';

  if (!ehPooler || !ehPorta6543) {
    return { ok: false, motivo: 'ORIGEM_NAO_RECONHECIDA_COMO_POOLER_6543' };
  }

  u.port = '5432';
  return { ok: true, url: u.toString() };
}

// ssl: default espelha o comportamento atual da app (ver SEC-DATABASE-TLS-001).
// Injetável apenas para permitir teste contra Postgres sem TLS (efêmero do CI).
async function abrirCliente(Pool, connectionString, ssl = { rejectUnauthorized: false }) {
  const pool = new Pool({
    connectionString,
    ssl,
    max: 1,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    idleTimeoutMillis: 5000,
    statement_timeout: QUERY_TIMEOUT_MS,
  });
  const client = await withTimeout(pool.connect(), CONNECT_TIMEOUT_MS, 'connect');
  return { pool, client };
}

async function fechar(recurso) {
  if (!recurso) return;
  try { recurso.client.release(); } catch { /* noop */ }
  try { await recurso.pool.end(); } catch { /* noop */ }
}

// Prova de sessão estável com DOIS CLIENTES INDEPENDENTES, ambos mantidos
// adquiridos durante toda a prova (pool.connect(), não pool.query()):
//   A adquire a trava            → true
//   B tenta a mesma trava        → false   (a sessão de A persiste)
//   A libera                     → true
//   B tenta de novo              → true    (a liberação propagou)
// Qualquer desvio = sessão NÃO estável.
async function provarSessaoEstavel(Pool, connectionString, ssl) {
  let a = null;
  let b = null;
  try {
    a = await abrirCliente(Pool, connectionString, ssl);
    b = await abrirCliente(Pool, connectionString, ssl);

    const aPegou = (await withTimeout(a.client.query('SELECT pg_try_advisory_lock($1) AS v', [LOCK_KEY]), QUERY_TIMEOUT_MS, 'q')).rows[0].v;
    if (aPegou !== true) return { estavel: false, etapa: 'A_NAO_ADQUIRIU' };

    const bBloqueado = (await withTimeout(b.client.query('SELECT pg_try_advisory_lock($1) AS v', [LOCK_KEY]), QUERY_TIMEOUT_MS, 'q')).rows[0].v;
    if (bBloqueado !== false) {
      // B conseguiu a trava que A detém: a sessão de A não se sustenta.
      try { await b.client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]); } catch { /* noop */ }
      try { await a.client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]); } catch { /* noop */ }
      return { estavel: false, etapa: 'B_ADQUIRIU_TRAVA_DE_A' };
    }

    const aLiberou = (await withTimeout(a.client.query('SELECT pg_advisory_unlock($1) AS v', [LOCK_KEY]), QUERY_TIMEOUT_MS, 'q')).rows[0].v;
    if (aLiberou !== true) return { estavel: false, etapa: 'A_NAO_LIBEROU' };

    const bPegouDepois = (await withTimeout(b.client.query('SELECT pg_try_advisory_lock($1) AS v', [LOCK_KEY]), QUERY_TIMEOUT_MS, 'q')).rows[0].v;
    if (bPegouDepois !== true) return { estavel: false, etapa: 'B_NAO_ADQUIRIU_APOS_LIBERACAO' };

    await withTimeout(b.client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]), QUERY_TIMEOUT_MS, 'q');
    return { estavel: true, etapa: 'COMPLETA' };
  } finally {
    await fechar(a);
    await fechar(b);
  }
}

async function sondarEndpoint(Pool, connectionString, rotulo, comProvaDeSessao) {
  const inicio = Date.now();
  let recurso = null;
  try {
    recurso = await abrirCliente(Pool, connectionString);
    const msConnect = Date.now() - inicio;
    log(`connect ${rotulo}: ok — ${msConnect}ms`);

    const t1 = Date.now();
    await withTimeout(recurso.client.query('SELECT 1'), QUERY_TIMEOUT_MS, 'q');
    log(`SELECT 1 ${rotulo}: ok — ${Date.now() - t1}ms`);
  } catch (err) {
    log(`connect ${rotulo}: FALHA — codigo=${classify(err)}`);
    return false;
  } finally {
    await fechar(recurso);
  }

  if (!comProvaDeSessao) return true;

  try {
    const r = await provarSessaoEstavel(Pool, connectionString);
    log(`advisory lock 2 clientes ${rotulo}: estavel=${r.estavel} etapa=${r.etapa}`);
  } catch (err) {
    log(`advisory lock 2 clientes ${rotulo}: FALHA — codigo=${classify(err)}`);
  }
  return true;
}

async function main() {
  if (process.env.RENDER !== 'true') {
    log('fora do Render — sonda ignorada (no-op)');
    return;
  }

  log('inicio — OPS-MIGRATIONS-03B');

  let Pool;
  try {
    ({ Pool } = require('pg'));
  } catch {
    log('modulo pg indisponivel — sonda abortada');
    return;
  }

  const raw = String(process.env.DATABASE_URL || '').trim();
  log(`DATABASE_URL presente: ${raw.length > 0}`);
  if (!raw) {
    log('sem DATABASE_URL em tempo de build — nada a sondar');
    return;
  }

  let portaOrigem = 'desconhecida';
  try {
    portaOrigem = new URL(raw).port || '(padrao)';
  } catch {
    log('DATABASE_URL nao parseavel — sonda abortada');
    return;
  }
  log(`porta de origem: ${portaOrigem}`);

  await sondarEndpoint(Pool, raw, `origem(${portaOrigem})`, false);

  const session = derivarEndpointSession(raw);
  if (!session.ok) {
    log(`endpoint session 5432: NAO TESTADO — ${session.motivo}`);
    return;
  }

  log('origem reconhecida como pooler Supabase 6543 — testando 5432 (session)');
  await sondarEndpoint(Pool, session.url, 'session(5432)', true);
}

// Execução só quando invocado diretamente (postinstall). Sob require (testes),
// apenas exporta — sem efeito colateral, sem process.exit.
if (require.main === module) {
  const hardStop = setTimeout(() => {
    log('abortada — TIMEOUT_GLOBAL');
    process.exit(0);
  }, GLOBAL_TIMEOUT_MS);
  hardStop.unref();

  main()
    .catch((err) => log(`erro nao tratado — codigo=${classify(err)}`))
    .finally(() => {
      clearTimeout(hardStop);
      log('fim');
      process.exit(0);
    });
}

module.exports = { derivarEndpointSession, provarSessaoEstavel, classify, LOCK_KEY };
