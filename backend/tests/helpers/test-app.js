// tests/helpers/test-app.js
// Creates Express app instance for Supertest without opening a real port

const express = require('express')
const cors = require('cors')
const { correlationMiddleware, requestLogger, tenantContext, errorHandler } = require('../../src/shared')

function createTestApp(routes = []) {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '3mb' }))
  app.use(correlationMiddleware)
  app.use(requestLogger)
  app.use(tenantContext)

  // Register test routes
  for (const route of routes) {
    if (typeof route === 'function') {
      app.use(route)
    } else if (route.path && route.router) {
      app.use(route.path, route.router)
    }
  }

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Rota nao encontrada',
      traceId: req.traceId || null,
    })
  })

  // Error handler
  app.use(errorHandler)

  return app
}

function createMockReq(options = {}) {
  return {
    body: options.body || {},
    query: options.query || {},
    params: options.params || {},
    headers: {
      'user-agent': 'test-agent',
      ...options.headers,
    },
    ip: '127.0.0.1',
    user: options.user || null,
    traceId: options.traceId || 'test-trace-id',
    startTime: Date.now(),
  }
}

function createMockRes() {
  const res = {
    statusCode: 200,
    payload: null,
    headers: {},
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.payload = payload
      return this
    },
    setHeader(key, value) {
      this.headers[key] = value
      return this
    },
    on() {},
  }
  return res
}

module.exports = {
  createTestApp,
  createMockReq,
  createMockRes,
}
