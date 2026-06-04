const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
const pool = require('../src/config/database');

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
];

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      duration_ms INTEGER
    )
  `);
}

async function getAppliedMigrations() {
  const result = await pool.query('SELECT version FROM schema_migrations');
  return new Set(result.rows.map(r => r.version));
}

async function applyMigration(version, file, applied) {
  if (applied.has(version)) {
    console.log(`[skip]  ${version} — ${file} (já aplicada)`);
    return;
  }

  const filePath = path.resolve(__dirname, '..', 'src', 'database', file);

  if (!fs.existsSync(filePath)) {
    console.warn(`[warn]  ${version} — arquivo não encontrado: ${filePath}`);
    return;
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  const start = Date.now();

  await pool.query(sql);

  const duration = Date.now() - start;

  await pool.query(
    `INSERT INTO schema_migrations (version, name, duration_ms)
     VALUES ($1, $2, $3)
     ON CONFLICT (version) DO NOTHING`,
    [version, file.replace('.sql', ''), duration]
  );

  console.log(`[ok]    ${version} — ${file} (${duration}ms)`);
}

(async () => {
  const target = typeof pool.getDatabaseTargetSummary === 'function'
    ? pool.getDatabaseTargetSummary()
    : { label: 'banco desconhecido' };

  console.log(`\n[migrate] banco alvo: ${target.label}\n`);

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  for (const { version, file } of migrations) {
    await applyMigration(version, file, applied);
  }

  // Verificação de integridade pós-migration
  const result = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'pin_reset_tokens'`
  );

  if (result.rowCount === 0) {
    throw new Error('Verificação falhou: tabela pin_reset_tokens não encontrada.');
  }

  console.log('\n[migrate] todas as migrations aplicadas com sucesso.\n');
  await pool.end();
})().catch(async (err) => {
  console.error('[migrate] ERRO:', err.message);
  await pool.end();
  process.exit(1);
});
