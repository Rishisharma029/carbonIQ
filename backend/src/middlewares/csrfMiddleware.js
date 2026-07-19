import crypto from 'crypto'
import { config } from '../config/config.js'
import { AuthorizationError } from '../errors/customErrors.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const PUBLIC_AUTH_MUTATIONS = new Set([
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
])

export const createCsrfToken = () => crypto.randomBytes(32).toString('hex')

export const csrfCookieOptions = {
  httpOnly: false,
  secure: config.NODE_ENV === 'production',
  sameSite: config.COOKIE_SAME_SITE,
  path: '/',
}

export const setCsrfCookie = (res, token = createCsrfToken()) => {
  res.cookie('csrf_token', token, csrfCookieOptions)
  return token
}

const isAllowedOrigin = (origin) => {
  if (!origin) return config.NODE_ENV !== 'production'
  return config.ALLOWED_ORIGINS.includes(origin)
}

export const csrfMiddleware = (req, res, next) => {
  req.issueCsrfToken = () => setCsrfCookie(res)

  const token = req.cookies?.csrf_token || setCsrfCookie(res)

  if (SAFE_METHODS.has(req.method)) {
    req.csrfToken = token
    return next()
  }

  const origin = req.headers.origin
  if (!isAllowedOrigin(origin)) {
    return next(new AuthorizationError('Request origin is not allowed'))
  }

  if (!origin && config.NODE_ENV !== 'production') {
    req.csrfToken = token
    return next()
  }

  const isPublicAuthMutation = PUBLIC_AUTH_MUTATIONS.has(req.path)
  const hasAuthCookie = Boolean(req.cookies?.access_token || req.cookies?.refresh_token)

  if (isPublicAuthMutation && !hasAuthCookie) {
    req.csrfToken = token
    return next()
  }

  const submittedToken = req.headers['x-csrf-token']
  if (!submittedToken || submittedToken !== req.cookies?.csrf_token) {
    return next(new AuthorizationError('Invalid CSRF token'))
  }

  req.csrfToken = token
  next()
}

export default csrfMiddleware
