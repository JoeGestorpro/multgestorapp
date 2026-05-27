const { appLogger } = require('../shared/core/logger');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  appLogger.warn('[supabase] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente. Upload de avatar usara fallback local.');
} else {
  appLogger.info({ url: supabaseUrl, keyPartial: supabaseServiceRoleKey.slice(0, 10) + '...', bucket: process.env.ICE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'barber-collaborators' }, '[supabase] Configurado com sucesso');
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
