const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
const pool = require('../src/config/database');

const migrations = [
  'auth-security.sql',
  'master-dashboard.sql',
  'master-finance.sql',
  'master-admin.sql',
  'barber.sql',
  'client-booking.sql',
  'first-access.sql'
];

async function verifyPinRecoverySchema() {
  const tableResult = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = 'pin_reset_tokens'
     LIMIT 1`
  );

  const userColumnsResult = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'users'
     ORDER BY ordinal_position`
  );

  const pinTokenColumnsResult = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'pin_reset_tokens'
     ORDER BY ordinal_position`
  );

  const requiredPinResetColumns = [
    'id',
    'company_id',
    'user_id',
    'email',
    'token_hash',
    'expires_at',
    'used_at',
    'created_at'
  ];

  const userColumns = new Set(userColumnsResult.rows.map((row) => row.column_name));
  const pinResetColumns = new Set(pinTokenColumnsResult.rows.map((row) => row.column_name));

  if (!userColumns.has('pin_hash')) {
    throw new Error('Migration incompleta: coluna users.pin_hash nao existe no banco alvo.');
  }

  if (tableResult.rowCount === 0) {
    throw new Error('Migration incompleta: tabela pin_reset_tokens nao existe no banco alvo.');
  }

  const missingPinResetColumns = requiredPinResetColumns.filter((columnName) => !pinResetColumns.has(columnName));

  if (missingPinResetColumns.length > 0) {
    throw new Error(`Migration incompleta: faltam colunas em pin_reset_tokens: ${missingPinResetColumns.join(', ')}`);
  }

  console.log('[migrate] schema de recuperacao de PIN confirmado com sucesso');
}

(async () => {
  const target = typeof pool.getDatabaseTargetSummary === 'function'
    ? pool.getDatabaseTargetSummary()
    : { label: 'banco desconhecido' };

  console.log(`[migrate] banco alvo: ${target.label}`);

  for (const migration of migrations) {
    const filePath = path.resolve(__dirname, '..', 'src', 'database', migration);

    if (fs.existsSync(filePath)) {
      await pool.query(fs.readFileSync(filePath, 'utf8'));
      console.log(`Migration aplicada: ${migration}`);
    }
  }

  await verifyPinRecoverySchema();

  await pool.end();
})().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
