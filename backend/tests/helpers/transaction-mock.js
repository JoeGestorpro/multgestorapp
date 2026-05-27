// tests/helpers/transaction-mock.js
// Helper reutilizável para mocks de transação em services que usam:
// BEGIN → queries → COMMIT ou ROLLBACK
//
// Uso:
//   const { createTransactionMock } = require('../helpers/transaction-mock')
//   const { poolMock, clientMock } = createTransactionMock()
//   jest.mock('../../src/config/database', () => poolMock)

function createTransactionMock(options = {}) {
  const {
    defaultResponse = { rows: [], rowCount: 0 },
    queryResponses = {},
    failOnQuery = null, // índice da query que deve falhar (0-based)
    failWithError = new Error('Database error'),
    trackOrder = true,
  } = options

  const callLog = []
  let callIndex = 0

  const clientMock = {
    query: jest.fn().mockImplementation(async (sql, params) => {
      callIndex++
      if (trackOrder) {
        callLog.push({ sql, params, index: callIndex })
      }

      // Simular erro em query específica
      if (failOnQuery !== null && callIndex === failOnQuery + 1) {
        throw failWithError
      }

      // Verificar resposta customizada por SQL
      for (const [pattern, responseOrFn] of Object.entries(queryResponses)) {
        const matches = sql === pattern || (typeof pattern === 'string' && sql && sql.includes(pattern)) || (pattern instanceof RegExp && sql && pattern.test(sql))
        if (matches) {
          return typeof responseOrFn === 'function' ? responseOrFn(sql) : responseOrFn
        }
      }

      // Respostas padrão para transações
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
        return { rows: [], rowCount: 0 }
      }

      return defaultResponse
    }),
    release: jest.fn(),
  }

  const poolMock = {
    query: jest.fn().mockResolvedValue(defaultResponse),
    connect: jest.fn().mockReturnValue(clientMock),
    on: jest.fn(),
    getDatabaseTargetSummary: jest.fn(),
  }

  return {
    poolMock,
    clientMock,
    callLog,
    helpers: {
      getCallCount: () => callLog.length,
      getCalls: () => [...callLog],
      getCall: (index) => callLog[index] || null,
      findCall: (pattern) =>
        callLog.find((c) => c.sql === pattern || (typeof pattern === 'string' && c.sql && c.sql.includes(pattern))),
      findAllCalls: (pattern) =>
        callLog.filter((c) => c.sql === pattern || (typeof pattern === 'string' && c.sql && c.sql.includes(pattern))),
      wasCalled: (pattern) =>
        callLog.some((c) => c.sql === pattern || (typeof pattern === 'string' && c.sql && c.sql.includes(pattern))),
      verifyOrder: (expectedSequence) => {
        const actualSequence = callLog.map((c) => c.sql)
        let lastIndex = -1
        for (const expected of expectedSequence) {
          const idx = actualSequence.findIndex(
            (sql, i) => i > lastIndex && (sql === expected || sql.includes(expected))
          )
          if (idx === -1) return false
          lastIndex = idx
        }
        return true
      },
      verifyTransaction: () => {
        const hasBegin = callLog.some((c) => c.sql === 'BEGIN')
        const hasCommit = callLog.some((c) => c.sql === 'COMMIT')
        const hasRollback = callLog.some((c) => c.sql === 'ROLLBACK')
        return {
          hasBegin,
          hasCommit,
          hasRollback,
          wasCommitted: hasBegin && hasCommit && !hasRollback,
          wasRolledBack: hasBegin && hasRollback && !hasCommit,
        }
      },
      inspectPayloads: (pattern) => {
        return callLog
          .filter((c) => c.sql === pattern || (typeof pattern === 'string' && c.sql && c.sql.includes(pattern)))
          .map((c) => ({ sql: c.sql, params: c.params }))
      },
    },
  }
}

// Presets comuns para cenários frequentes

function createCollaboratorTransactionMock(overrides = {}) {
  const emailCheckResponse = overrides.emailCheck || { rows: [], rowCount: 0 }
  const duplicateEmailCheckResponse = overrides.duplicateEmailCheck || { rows: [], rowCount: 0 }

  return createTransactionMock({
    failOnQuery: overrides.failOnQuery,
    failWithError: overrides.failWithError,
    queryResponses: {
      // Duplicate check uses <> in SQL, so we check that pattern first
      'SELECT id FROM users WHERE email': (sql) => {
        if (sql && sql.includes('<>')) return duplicateEmailCheckResponse
        return emailCheckResponse
      },
      'INSERT INTO users': overrides.userInsert || { rows: [{ id: 'user-new' }], rowCount: 1 },
      'INSERT INTO barber_collaborators': overrides.collaboratorInsert || { rows: [{ id: 'col-new' }], rowCount: 1 },
      'UPDATE users': overrides.userUpdate || { rows: [], rowCount: 1 },
      'UPDATE barber_collaborators': overrides.collaboratorUpdate || { rows: [{ id: 'col-1' }], rowCount: 1 },
    },
  })
}

function createSupplierTransactionMock(overrides = {}) {
  return createTransactionMock({
    queryResponses: {
      'INSERT INTO barber_suppliers': overrides.supplierInsert || { rows: [{ id: 'sup-new' }], rowCount: 1 },
      'UPDATE barber_suppliers': overrides.supplierUpdate || { rows: [{ id: 'sup-1' }], rowCount: 1 },
    },
  })
}

function createAppointmentTransactionMock(overrides = {}) {
  return createTransactionMock({
    queryResponses: {
      'INSERT INTO barber_appointments': overrides.appointmentInsert || { rows: [{ id: 'apt-new' }], rowCount: 1 },
      'UPDATE barber_appointments': overrides.appointmentUpdate || { rows: [{ id: 'apt-1' }], rowCount: 1 },
    },
  })
}

module.exports = {
  createTransactionMock,
  createCollaboratorTransactionMock,
  createSupplierTransactionMock,
  createAppointmentTransactionMock,
}
