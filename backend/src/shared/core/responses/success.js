function success(res, data, options = {}) {
  const { statusCode = 200, message, meta } = options
  const body = { success: true, data }
  if (message) body.message = message
  if (meta) body.meta = meta
  return res.status(statusCode).json(body)
}

module.exports = { success }
