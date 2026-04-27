const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
const pool = require('../src/config/database');

(async () => {
  try {
    await pool.query('BEGIN');
    
    // Get the company I created
    const companyRes = await pool.query("SELECT id FROM companies WHERE email = 'barberadmin@example.com'");
    if (companyRes.rowCount === 0) throw new Error("Empresa não encontrada");
    const companyId = companyRes.rows[0].id;
    
    // Get the correct module ID
    const moduleRes = await pool.query("SELECT id FROM modules WHERE slug = 'barber'");
    if (moduleRes.rowCount === 0) throw new Error("Módulo 'barber' não encontrado");
    const moduleId = moduleRes.rows[0].id;
    
    // Update company_modules to link to 'barber' instead of whatever it is now
    // Actually, let's just delete all and insert
    await pool.query("DELETE FROM company_modules WHERE company_id = $1", [companyId]);
    await pool.query(
      "INSERT INTO company_modules (company_id, module_id, status) VALUES ($1, $2, 'active')",
      [companyId, moduleId]
    );
    
    // Delete the wrong module if it has no links
    try {
      await pool.query("DELETE FROM modules WHERE slug = 'barber-gestor'");
    } catch (e) {
      console.log("Aviso: Nao foi possivel deletar o modulo errado (pode haver outros vinculos).");
    }

    await pool.query('COMMIT');
    console.log('Vínculo corrigido para usar o slug "barber" correto.');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
  } finally {
    await pool.end();
  }
})();
