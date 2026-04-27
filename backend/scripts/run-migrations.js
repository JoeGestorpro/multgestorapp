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

(async () => {
  for (const migration of migrations) {
    const filePath = path.resolve(__dirname, '..', 'src', 'database', migration);

    if (fs.existsSync(filePath)) {
      await pool.query(fs.readFileSync(filePath, 'utf8'));
      console.log(`Migration aplicada: ${migration}`);
    }
  }

  await pool.end();
})().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
