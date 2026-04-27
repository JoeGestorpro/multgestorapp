const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('[supabase] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente. Upload de avatar usara fallback local.');
} else {
  console.log('[supabase] Configurado com sucesso.');
  console.log('[supabase] URL:', supabaseUrl);
  console.log('[supabase] KEY (partial):', supabaseServiceRoleKey.slice(0, 10) + '...');
  console.log('[supabase] BUCKET:', process.env.ICE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'barber-collaborators');
}

const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

module.exports = supabase;
