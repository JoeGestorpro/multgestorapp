const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
const pool = require('../src/config/database');

(async () => {
  try {
    await pool.query("UPDATE modules SET slug = 'barber' WHERE slug = 'barber-gestor'");
    console.log('Slug atualizado com sucesso.');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
