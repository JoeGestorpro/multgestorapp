// jest.config.js — CommonJS compatible
// MultGestor Core Test Foundation

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: [
    'node_modules',
    'src/tests/',
    'tests/auth-flows.test.js',
    'tests/email-flows.test.js',
  ],
  setupFiles: ['./tests/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/database.js',
    '!src/config/supabase.js',
    '!src/server.js',
    '!src/tests/**',
    '!src/templates/**',
    '!src/database/**',
    '!node_modules/**',
  ],
  coverageThreshold: {
    global: {
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0,
    },
  },
}
