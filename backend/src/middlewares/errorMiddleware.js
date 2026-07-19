import { logger } from '../config/logger.js'

/**
 * Global Error Handler Middleware.
 * Standardizes all error payloads per the CarbonIQ API Spec (v1):
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human readable message",
 *     "details": [...]
 *   },
 *   "requestId": "req_..."
 * }
 */
export const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500
  
  // Resolve standard error code names
  let errorCode = err.code || err.name || 'INTERNAL_SERVER_ERROR'
  if (statusCode === 400 && errorCode === 'Error') errorCode = 'BAD_REQUEST'
  if (statusCode === 401) errorCode = 'UNAUTHORIZED'
  if (statusCode === 403) errorCode = 'FORBIDDEN'
  if (statusCode === 404) errorCode = 'NOT_FOUND'
  if (statusCode === 409) errorCode = 'CONFLICT'
  if (statusCode === 429) errorCode = 'RATE_LIMIT_EXCEEDED'

  let errorMessage = err.message || 'An unexpected error occurred'
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorMessage = 'Internal Server Error'
  }

  logger.error({
    msg: err.message || 'An error occurred',
    statusCode,
    errorCode,
    requestId: req.id,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  })

  const status = err.status || (statusCode >= 500 ? 'error' : 'fail')

  res.status(statusCode).json({
    success: false,
    status, // preserve backward compatibility with existing tests
    message: errorMessage, // preserve backward compatibility with existing tests
    errors: err.errors, // preserve backward compatibility with existing tests
    error: {
      code: errorCode,
      message: errorMessage,
      details: err.errors || [],
    },
    requestId: req.id || null,
  })
}

export default errorMiddleware
