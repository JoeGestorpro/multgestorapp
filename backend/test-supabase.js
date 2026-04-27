require('dotenv').config();
const supabase = require('./src/config/supabase');

console.log('--- Supabase Config Test ---');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_BUCKET:', process.env.SUPABASE_STORAGE_BUCKET);
console.log('Supabase Client Initialized:', !!supabase);

if (!supabase) {
  console.log('RESULT: Supabase is NOT active. Fallback to LOCAL will be used.');
} else {
  console.log('RESULT: Supabase is ACTIVE. Ready for storage operations.');
}
console.log('---------------------------');
