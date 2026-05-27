const pino = require('pino')

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const SERVICE_NAME = process.env.SERVICE_NAME || 'multgestor-core'

const appLogger = pino({
  level: LOG_LEVEL,
  transport: IS_PRODUCTION
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss.l' } },
  base: { service: SERVICE_NAME },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.pin',
      'req.body.password_hash',
      'req.body.confirmPassword',
      'req.body.confirm_password',
      'req.body.code',
      'DATABASE_URL',
      'TEST_DATABASE_URL',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_ANON_KEY',
      'RESEND_API_KEY',
      'JWT_SECRET',
      'OPENROUTER_API_KEY',
      'WHATSAPP_TOKEN_ENCRYPTION_KEY',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
})

function createReqLogger(req) {
  const ctx = {
    traceId: req.traceId || null,
    route: req.originalUrl || req.url,
    method: req.method,
  }

  if (req.user) {
    ctx.companyId = req.user.company_id || null
    ctx.userId = req.user.id || null
    ctx.authScope = req.user.auth_scope || null
  }

  if (req.tenantContext) {
    ctx.companyId = ctx.companyId || req.tenantContext.companyId || null
  }

  return appLogger.child(ctx)
}

module.exports = { appLogger, createReqLogger, SERVICE_NAME }
