const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
const pool = require('../src/config/database');

(async () => {
  const email = 'barberadmin@example.com';
  const password = 'Password123!';
  const name = 'Admin Barbearia';
  const companyName = 'Barbearia Teste';

  try {
    await pool.query('BEGIN');

    // 1. Ensure Module Exists
    let moduleRes = await pool.query("SELECT id FROM modules WHERE slug = 'barber-gestor'");
    let moduleId;
    if (moduleRes.rowCount === 0) {
      const res = await pool.query(
        "INSERT INTO modules (name, slug, description, is_active) VALUES ('BarberGestor', 'barber-gestor', 'Módulo para barbearias', true) RETURNING id"
      );
      moduleId = res.rows[0].id;
      console.log('Módulo BarberGestor criado.');
    } else {
      moduleId = moduleRes.rows[0].id;
      console.log('Módulo BarberGestor já existe.');
    }

    // 2. Create Company
    let companyRes = await pool.query("SELECT id FROM companies WHERE email = $1", [email]);
    let companyId;
    if (companyRes.rowCount === 0) {
      const res = await pool.query(
        "INSERT INTO companies (name, email, niche, niche_type, status) VALUES ($1, $2, 'barbearia', 'barbearia', 'active') RETURNING id",
        [companyName, email]
      );
      companyId = res.rows[0].id;
      console.log('Empresa Barbearia criada.');
    } else {
      companyId = companyRes.rows[0].id;
      console.log('Empresa Barbearia já existe.');
    }

    // 3. Create User
    let userRes = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userRes.rowCount === 0) {
      const passwordHash = await bcrypt.hash(password, 10);
      const res = await pool.query(
        "INSERT INTO users (name, email, password_hash, role, company_id, is_active) VALUES ($1, $2, $3, 'admin', $4, true) RETURNING id",
        [name, email, passwordHash, companyId]
      );
      
      // Update company owner
      await pool.query("UPDATE companies SET owner_user_id = $1 WHERE id = $2", [res.rows[0].id, companyId]);
      console.log('Usuário Admin da Barbearia criado.');
    } else {
      // Update password just in case
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password_hash = $1 WHERE email = $2", [passwordHash, email]);
      console.log('Usuário Admin da Barbearia já existe (senha atualizada).');
    }

    // 4. Link Module to Company
    let companyModuleRes = await pool.query("SELECT id FROM company_modules WHERE company_id = $1 AND module_id = $2", [companyId, moduleId]);
    if (companyModuleRes.rowCount === 0) {
      await pool.query(
        "INSERT INTO company_modules (company_id, module_id, status) VALUES ($1, $2, 'active')",
        [companyId, moduleId]
      );
      console.log('Módulo vinculado à empresa.');
    } else {
      await pool.query("UPDATE company_modules SET status = 'active' WHERE company_id = $1 AND module_id = $2", [companyId, moduleId]);
      console.log('Módulo já estava vinculado à empresa.');
    }

    // 5. Create Subscription
    let subRes = await pool.query("SELECT id FROM subscriptions WHERE company_id = $1", [companyId]);
    if (subRes.rowCount === 0) {
      await pool.query(
        "INSERT INTO subscriptions (company_id, plan_name, price, status, billing_cycle) VALUES ($1, 'Plano Pro Barber', 99.90, 'active', 'monthly')",
        [companyId]
      );
      console.log('Assinatura criada.');
    } else {
       await pool.query("UPDATE subscriptions SET status = 'active' WHERE company_id = $1", [companyId]);
       console.log('Assinatura já existe.');
    }

    await pool.query('COMMIT');
    console.log('\n--- ACESSO BARBERGESTOR CRIADO COM SUCESSO ---');
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro ao semear:', error);
  } finally {
    await pool.end();
  }
})();
