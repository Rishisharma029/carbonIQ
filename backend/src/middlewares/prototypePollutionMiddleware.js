import { ValidationError } from '../errors/customErrors.js'

const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

const containsForbiddenKey = (value) => {
  if (!value || typeof value !== 'object') return false

  if (Array.isArray(value)) {
    return value.some((item) => containsForbiddenKey(item))
  }

  return Object.keys(value).some(
    (key) => FORBIDDEN_KEYS.has(key) || containsForbiddenKey(value[key])
  )
}

export const prototypePollutionMiddleware = (req, res, next) => {
  if (
    containsForbiddenKey(req.body) ||
    containsForbiddenKey(req.query) ||
    containsForbiddenKey(req.params)
  ) {
    return next(new ValidationError('Request contains forbidden object keys'))
  }

  next()
}

export default prototypePollutionMiddleware
