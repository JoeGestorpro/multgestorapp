// Garante que o logger fique silencioso em todos os testes
process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV  = 'test';

// Se TEST_DATABASE_URL estiver definida, usar como DATABASE_URL nos testes
// Isto permite que integration tests rodem contra banco Docker sem afetar
// unit tests (que mockam pool/database)
if (process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Proteção: impedir conexão com produção durante testes
const dbUrl = process.env.DATABASE_URL || '';
const PRODUCTION_INDICATORS = ['supabase.co', 'supabase.com', 'production', 'prod-db'];
const isProduction = PRODUCTION_INDICATORS.some((ind) => dbUrl.toLowerCase().includes(ind));
if (isProduction) {
  throw new Error(
    'FATAL: Test attempted to connect to production database. ' +
    'Set TEST_DATABASE_URL to an isolated test database. ' +
    'URL: ' + dbUrl.replace(/\/\/[^@]+@/, '//[REDACTED]@')
  );
}
