const { ValidationError } = require('../errors')

function formatZodErrors(zodErrors) {
  return zodErrors.map(e => ({
    field: e.path.join('.'),
    message: e.message,
    code: e.code,
  }))
}

function validateRequest(schema) {
  return function validationMiddleware(req, _res, next) {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const fields = formatZodErrors(result.error.issues)
      throw new ValidationError('Dados inválidos', fields)
    }
    req.validatedBody = result.data
    next()
  }
}

function validateQuery(schema) {
  return function validationMiddleware(req, _res, next) {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      const fields = formatZodErrors(result.error.issues)
      throw new ValidationError('Parâmetros de consulta inválidos', fields)
    }
    req.validatedQuery = result.data
    next()
  }
}

function validateParams(schema) {
  return function validationMiddleware(req, _res, next) {
    const result = schema.safeParse(req.params)
    if (!result.success) {
      const fields = formatZodErrors(result.error.issues)
      throw new ValidationError('Parâmetros de rota inválidos', fields)
    }
    req.validatedParams = result.data
    next()
  }
}

module.exports = { validateRequest, validateQuery, validateParams }
