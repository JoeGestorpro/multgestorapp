// Garante que o logger fique silencioso em todos os testes
process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV  = 'test';

// Se TEST_DATABASE_URL estiver definida, usar como DATABASE_URL nos testes
// Isto permite que integration tests rodem contra banco Docker sem afetar
// unit tests (que mockam pool/database)
if (process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Proteção: impedir conexão com produção durante testes.
//
// "supabase.co"/"supabase.com" sozinho não identifica produção — identifica
// apenas "é um projeto Supabase". A checagem original bloqueava qualquer
// projeto Supabase, incluindo um projeto de teste dedicado e sem dados reais.
// Correção (autorização restrita, 2026-07-20): identificar produção pelo
// project ref real, não pelo domínio do provedor.
//
//   produção conhecida (ref abaixo)        -> BLOQUEAR sempre, mesmo se
//                                              alguém apontar TEST_DATABASE_URL
//                                              para ela por engano
//   projeto Supabase desconhecido           -> BLOQUEAR (default-deny)
//   projeto de teste aprovado (ref abaixo)  -> PERMITIR
//   Postgres não-Supabase (Docker, etc.)    -> PERMITIR (comportamento já
//                                              existente, inalterado)
//
// Esta lista não deve crescer por conveniência. Adicionar um ref aqui é
// autorizar aquele banco a ser apagado por testes de integração.
const KNOWN_PRODUCTION_SUPABASE_REFS = ['fjxqvohrnnxgqeaimdup'];
const APPROVED_TEST_SUPABASE_REFS = ['ofyznjgfeqyadaeghtpc'];

function extractSupabaseProjectRef(connectionString) {
  try {
    const parsed = new URL(connectionString);

    // Formato do pooler (Supavisor): usuário = "postgres.<ref>"
    if (parsed.username && parsed.username.includes('.')) {
      const ref = parsed.username.split('.')[1];
      if (ref) return ref.toLowerCase();
    }

    // Formato de conexão direta: host = "db.<ref>.supabase.co"
    const hostMatch = parsed.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    if (hostMatch) return hostMatch[1].toLowerCase();
  } catch (_) {
    // URL malformada — cai no default-deny abaixo (ref indeterminado).
  }
  return null;
}

const dbUrl = process.env.DATABASE_URL || '';
const lowerDbUrl = dbUrl.toLowerCase();
const redactedUrl = dbUrl.replace(/\/\/[^@]+@/, '//[REDACTED]@');

const GENERIC_PRODUCTION_INDICATORS = ['production', 'prod-db'];
const isSupabaseHost = lowerDbUrl.includes('supabase.co') || lowerDbUrl.includes('supabase.com');

let isBlocked = false;
let blockReason = '';

if (GENERIC_PRODUCTION_INDICATORS.some((ind) => lowerDbUrl.includes(ind))) {
  isBlocked = true;
  blockReason = 'a URL contém um indicador explícito de produção (production/prod-db).';
} else if (isSupabaseHost) {
  const ref = extractSupabaseProjectRef(dbUrl);

  if (ref && KNOWN_PRODUCTION_SUPABASE_REFS.includes(ref)) {
    isBlocked = true;
    blockReason = `o project ref '${ref}' é o projeto de produção do MultGestor — nunca utilizável em testes.`;
  } else if (ref && APPROVED_TEST_SUPABASE_REFS.includes(ref)) {
    isBlocked = false; // projeto de teste aprovado explicitamente
  } else {
    isBlocked = true;
    blockReason = ref
      ? `o project ref '${ref}' não está na lista de projetos de teste aprovados.`
      : 'não foi possível determinar o project ref da string de conexão Supabase (default-deny).';
  }
}

if (isBlocked) {
  throw new Error(
    'FATAL: Test attempted to connect to a disallowed database. ' + blockReason + ' ' +
    'Set TEST_DATABASE_URL to an isolated test database (an approved Supabase test project or a non-Supabase Postgres). ' +
    'URL: ' + redactedUrl
  );
}
