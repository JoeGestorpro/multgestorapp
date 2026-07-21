// tests/helpers/test-db.js
// Database utilities for tests — with PRODUCTION PROTECTION
//
// ATENÇÃO — duplicação conhecida: esta função replica a mesma política de
// tests/jest.setup.js (identificação de produção por project ref Supabase,
// não por domínio). Os dois arquivos foram corrigidos juntos, na mesma
// missão (TENANT-003A), para não ficarem divergentes. Dívida técnica
// registrada para consolidar isto num único módulo compartilhado — ver
// tests/jest.setup.js para o comentário completo da lógica.

// "supabase.co"/"supabase.com" sozinho não identifica produção — identifica
// apenas "é um projeto Supabase". Identificar produção pelo project ref real:
//
//   produção conhecida (ref abaixo)        -> BLOQUEAR sempre
//   projeto Supabase desconhecido           -> BLOQUEAR (default-deny)
//   projeto de teste aprovado (ref abaixo)  -> PERMITIR
//   Postgres não-Supabase (Docker, etc.)    -> PERMITIR (inalterado)
//
// Esta lista não deve crescer por conveniência. Adicionar um ref aqui é
// autorizar aquele banco a ser apagado por testes de integração.
const KNOWN_PRODUCTION_SUPABASE_REFS = ['fjxqvohrnnxgqeaimdup']
const APPROVED_TEST_SUPABASE_REFS = ['ofyznjgfeqyadaeghtpc']
const GENERIC_PRODUCTION_INDICATORS = ['production', 'prod-db']

function extractSupabaseProjectRef(connectionString) {
  try {
    const parsed = new URL(connectionString)

    // Formato do pooler (Supavisor): usuário = "postgres.<ref>"
    if (parsed.username && parsed.username.includes('.')) {
      const ref = parsed.username.split('.')[1]
      if (ref) return ref.toLowerCase()
    }

    // Formato de conexão direta: host = "db.<ref>.supabase.co"
    const hostMatch = parsed.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)
    if (hostMatch) return hostMatch[1].toLowerCase()
  } catch (_) {
    // URL malformada — cai no default-deny abaixo (ref indeterminado).
  }
  return null
}

function guardAgainstProduction() {
  const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || ''

  if (!dbUrl) {
    throw new Error(
      'TEST_DATABASE_URL or DATABASE_URL is not set. ' +
      'Tests require an isolated database. ' +
      'Set TEST_DATABASE_URL to a dedicated test database.'
    )
  }

  const lower = dbUrl.toLowerCase()
  const redactedUrl = dbUrl.replace(/\/\/[^@]+@/, '//[REDACTED]@')
  const isSupabaseHost = lower.includes('supabase.co') || lower.includes('supabase.com')

  let isBlocked = false
  let blockReason = ''

  if (GENERIC_PRODUCTION_INDICATORS.some((indicator) => lower.includes(indicator))) {
    isBlocked = true
    blockReason = 'a URL contém um indicador explícito de produção (production/prod-db).'
  } else if (isSupabaseHost) {
    const ref = extractSupabaseProjectRef(dbUrl)

    if (ref && KNOWN_PRODUCTION_SUPABASE_REFS.includes(ref)) {
      isBlocked = true
      blockReason = `o project ref '${ref}' é o projeto de produção do MultGestor — nunca utilizável em testes.`
    } else if (ref && APPROVED_TEST_SUPABASE_REFS.includes(ref)) {
      isBlocked = false // projeto de teste aprovado explicitamente
    } else {
      isBlocked = true
      blockReason = ref
        ? `o project ref '${ref}' não está na lista de projetos de teste aprovados.`
        : 'não foi possível determinar o project ref da string de conexão Supabase (default-deny).'
    }
  }

  if (isBlocked) {
    throw new Error(
      'FATAL: Test attempted to connect to a disallowed database. ' + blockReason + ' ' +
      'Set TEST_DATABASE_URL to an isolated test database (an approved Supabase test project or a non-Supabase Postgres). ' +
      'URL: ' + redactedUrl
    )
  }
}

async function cleanupCompany(pool, companyId) {
  if (!companyId) return

  const tables = [
    'barber_sales',
    'barber_appointments',
    'barber_services',
    'barber_collaborators',
    'barber_suppliers',
    'barber_products',
    'barber_cash_sessions',
    'barber_cash_movements',
    'barber_advances',
    'barber_settlements',
    'barber_booking_settings',
    'barber_booking_blocks',
    'barber_booking_landing',
    'barber_client_notes',
    'barber_client_events',
    'barber_client_tags',
    'company_modules',
    'first_access_tokens',
    'password_reset_tokens',
    'pin_reset_tokens',
    'email_verification_tokens',
    'booking_customers',
    'auth_audit_logs',
    'barber_audit_logs',
    'users',
    'companies',
  ]

  for (const table of tables) {
    try {
      // "companies" identifica a própria empresa por "id", não "company_id".
      // Usar a coluna errada aqui fazia o DELETE falhar sempre (silenciosamente,
      // pelo catch abaixo) e a empresa nunca era removida entre execuções.
      const column = table === 'companies' ? 'id' : 'company_id'
      await pool.query(
        `DELETE FROM ${table} WHERE ${column} = $1`,
        [companyId]
      )
    } catch {
      // Table may not exist — skip silently
    }
  }
}

async function cleanupEmails(pool, emails) {
  if (!emails || emails.length === 0) return

  try {
    await pool.query('DELETE FROM auth_audit_logs WHERE email = ANY($1)', [emails])
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [emails])
  } catch {
    // Tables may not exist
  }
}

async function cleanupModules(pool, slugs) {
  if (!slugs || slugs.length === 0) return

  for (const slug of slugs) {
    try {
      await pool.query('DELETE FROM modules WHERE slug = $1', [slug])
    } catch {
      // Module may not exist
    }
  }
}

module.exports = {
  guardAgainstProduction,
  cleanupCompany,
  cleanupEmails,
  cleanupModules,
}
