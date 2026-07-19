import { logger } from '../config/logger.js'

export const requestLoggerMiddleware = (req, res, next) => {
  const startedAt = Date.now()

  res.on('finish', () => {
    logger.info({
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    })
  })

  next()
}

export default requestLoggerMiddleware
