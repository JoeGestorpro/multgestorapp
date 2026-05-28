// tests/helpers/integration-app.js
// Creates a full Express app instance for integration tests with Supertest
// Uses real route modules but with test-safe configuration

const express = require('express')
const cors = require('cors')
const { correlationMiddleware, requestLogger, tenantContext, errorHandler } = require('../../src/shared')

function createIntegrationApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '3mb' }))
  app.use(correlationMiddleware)
  app.use(requestLogger)
  app.use(tenantContext)

  // NOTE: 404 and error handlers are added by registerRoutes() AFTER all routes
  // are mounted. Adding them here would intercept every request before routes run.

  return app
}

function registerRoute(app, path, router) {
  app.use(path, router)
  return app
}

function registerRoutes(app, routes) {
  for (const { path, router } of routes) {
    registerRoute(app, path, router)
  }

  // 404 handler — must come AFTER all routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Rota nao encontrada',
      traceId: req.traceId || null,
    })
  })

  // Error handler — must be last
  app.use(errorHandler)

  return app
}

module.exports = {
  createIntegrationApp,
  registerRoute,
  registerRoutes,
}
