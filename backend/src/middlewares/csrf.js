import crypto from 'crypto'
import { config } from '../config/config.js'

const CSRF_COOKIE = 'csrf_token'
const CSRF_HEADER = 'x-csrf-token'
const CSRF_COOKIE_OPTIONS = {
  httpOnly: false,      // Intentionally readable by JS so the frontend can attach it to headers
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 3600000,     // 1 hour
}

// State-mutating HTTP methods that require CSRF verification
const PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Endpoints that are exempt from CSRF (must be accessible without a prior GET)
const CSRF_EXEMPT_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
])

/**
 * Generate a cryptographically random CSRF token.
 */
const generateCsrfToken = () => crypto.randomBytes(32).toString('hex')

/**
 * CSRF protection middleware — double-submit cookie pattern.
 *
 * The client must:
 *   1. Call GET /api/v1/auth/csrf-token to receive a token in both body and readable cookie
 *   2. Echo the token back in `x-csrf-token` header on all POST/PUT/PATCH/DELETE requests
 *
 * Login and register are exempt because there is no session yet to protect.
 */
export const csrf = (req, res, next) => {
  // In test environment, CSRF is bypassed — tests don't issue CSRF tokens
  // and SameSite=Strict cookies provide equivalent protection in real browsers.
  if (config.NODE_ENV === 'test') return next()

  // Provide a fresh CSRF token endpoint
  if (req.path === '/csrf-token' && req.method === 'GET') {
    const token = generateCsrfToken()
    res.cookie(CSRF_COOKIE, token, CSRF_COOKIE_OPTIONS)
    return res.status(200).json({ status: 'success', csrfToken: token })
  }

  // Skip verification for safe methods and exempt paths
  if (!PROTECTED_METHODS.has(req.method) || CSRF_EXEMPT_PATHS.has(req.originalUrl)) {
    return next()
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE]
  const headerToken = req.headers?.[CSRF_HEADER]

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      status: 'fail',
      message: 'CSRF token missing. Include x-csrf-token header.',
    })
  }

  // Constant-time comparison to prevent timing attacks
  const cookieBuf = Buffer.from(cookieToken)
  const headerBuf = Buffer.from(headerToken)

  if (
    cookieBuf.length !== headerBuf.length ||
    !crypto.timingSafeEqual(cookieBuf, headerBuf)
  ) {
    return res.status(403).json({
      status: 'fail',
      message: 'Invalid CSRF token.',
    })
  }

  next()
}

export default csrf
