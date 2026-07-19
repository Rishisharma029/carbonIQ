import { ValidationError } from '../errors/customErrors.js'

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH'])

export const contentTypeMiddleware = (req, res, next) => {
  if (!METHODS_WITH_BODY.has(req.method)) return next()

  const contentLength = Number(req.headers['content-length'] || 0)
  if (contentLength === 0) return next()

  if (!req.is('application/json')) {
    return next(new ValidationError('Content-Type must be application/json'))
  }

  next()
}

export default contentTypeMiddleware
