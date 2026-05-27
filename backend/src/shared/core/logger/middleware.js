const { createReqLogger } = require('./index')

function requestLogger(req, res, next) {
  req.log = createReqLogger(req)

  req.log.info('request start')

  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now())

    const logData = {
      statusCode: res.statusCode,
      duration,
    }

    if (res.statusCode >= 500) {
      req.log.error(logData, 'request end')
    } else if (res.statusCode >= 400) {
      req.log.warn(logData, 'request end')
    } else {
      req.log.info(logData, 'request end')
    }
  })

  next()
}

module.exports = { requestLogger }
