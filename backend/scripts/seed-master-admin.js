const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
const pool = require('../src/config/database');

(async () => {
  const email = String(process.env.MASTER_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.MASTER_ADMIN_PASSWORD || '');
  const name = String(process.env.MASTER_ADMIN_NAME || 'Master Admin').trim();

  if (!email || !password) {
    throw new Error('Defina MASTER_ADMIN_EMAIL e MASTER_ADMIN_PASSWORD no .env para criar o master_admin.');
  }

  if (password.length < 8) {
    throw new Error('MASTER_ADMIN_PASSWORD deve ter pelo menos 8 caracteres.');
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);

  if (existing.rowCount > 0) {
    await pool.query(
      `UPDATE users
       SET role = 'master_admin',
           company_id = NULL,
           is_active = true
       WHERE email = $1`,
      [email]
    );
    console.log('Master admin ja existia. Registro atualizado de forma idempotente.');
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, company_id, is_active)
       VALUES ($1, $2, $3, 'master_admin', NULL, true)`,
      [name, email, passwordHash]
    );
    console.log('Master admin criado.');
  }

  await pool.end();
})().catch(async (error) => {
  console.error(error.message);
  await pool.end();
  process.exit(1);
});
