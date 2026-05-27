function fail(res, error, options = {}) {
  const statusCode = error.statusCode || options.statusCode || 500
  const code = error.code || options.code || 'INTERNAL_ERROR'
  const message = error.message || options.message || 'Erro interno do servidor'
  const traceId = options.traceId || error.traceId || null

  const body = { success: false, error: message, code }
  if (traceId) body.traceId = traceId
  return res.status(statusCode).json(body)
}

module.exports = { fail }
