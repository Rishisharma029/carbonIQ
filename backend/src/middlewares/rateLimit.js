import rateLimit from 'express-rate-limit'
import { config } from '../config/config.js'
import { logger } from '../config/logger.js'

// Centralized configurations
import globalConfig from '../config/rateLimit/global.js'
import authConfig from '../config/rateLimit/auth.js'
import calculatorConfig from '../config/rateLimit/calculator.js'
import reportsConfig from '../config/rateLimit/reports.js'
import adminConfig from '../config/rateLimit/admin.js'
import dashboardConfig from '../config/rateLimit/dashboard.js'
import historyConfig from '../config/rateLimit/history.js'
import goalsConfig from '../config/rateLimit/goals.js'

// Setup RedisStore if enabled
let store = undefined
if (config.REDIS_ENABLED) {
  try {
    const { default: Redis } = await import('ioredis')
    const { RedisStore } = await import('rate-limit-redis')

    const redisOptions = config.REDIS_URL
      ? config.REDIS_URL
      : {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          password: config.REDIS_PASSWORD,
        }

    const client = new Redis(redisOptions)
    store = new RedisStore({
      sendCommand: (...args) => client.call(...args),
    })
    logger.info('Rate limiting configured to use RedisStore')
  } catch (err) {
    logger.error({
      msg: 'Failed to configure RedisStore for rate limiting, falling back to MemoryStore',
      error: err.message,
    })
  }
}

/**
 * Helper to get key generator based on keyType.
 *
 * @param {string} keyType
 * @returns {Function}
 */
export const getRateLimitKey = (keyType) => {
  return keyType === 'user'
    ? (req) => req.user?.id || req.user?._id?.toString() || req.ip
    : (req) => req.ip
}

/**
 * Helper to build custom rate limiters.
 *
 * @param {object} policy - { windowMs, max } config
 * @param {string} keyType - 'ip' | 'user'
 * @returns {Function} Express rate limit middleware
 */
const makeLimiter = (policy, keyType = 'ip') => {
  const keyGenerator = getRateLimitKey(keyType)

  return rateLimit({
    windowMs: policy.windowMs,
    max: policy.max,
    skip: (req) => config.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
    standardHeaders: true,
    legacyHeaders: false,
    store,
    keyGenerator,
    handler: (req, res, next, options) => {
      logger.warn({
        msg: 'Rate limit exceeded',
        path: req.originalUrl,
        ip: req.ip,
        userId: req.user?.id || req.user?._id?.toString() || null,
        limit: policy.max,
      })
      res.status(options.statusCode).json({
        status: 'fail',
        message: 'Too many requests. Please try again later.',
      })
    },
  })
}

// Global Limiter
export const globalLimiter = makeLimiter(globalConfig, 'ip')

// Authentication Limiters
export const loginLimiter = makeLimiter(authConfig.login, 'ip')
export const registerLimiter = makeLimiter(authConfig.register, 'ip')
export const forgotPasswordLimiter = makeLimiter(authConfig.forgotPassword, 'ip')
export const verifyEmailLimiter = makeLimiter(authConfig.verifyEmail, 'ip')

// Authenticated Routes Limiters
export const calculatorLimiter = makeLimiter(calculatorConfig, 'user')
export const pdfReportLimiter = makeLimiter(reportsConfig.pdf, 'user')
export const csvReportLimiter = makeLimiter(reportsConfig.csv, 'user')
export const dashboardLimiter = makeLimiter(dashboardConfig, 'user')
export const historyLimiter = makeLimiter(historyConfig, 'user')
export const goalsLimiter = makeLimiter(goalsConfig, 'user')

// Administrative Limiter
export const adminLimiter = makeLimiter(adminConfig, 'user')

// Legacy alias for backward compatibility
export const reportLimiter = pdfReportLimiter
export const resetPasswordLimiter = forgotPasswordLimiter

export default {
  globalLimiter,
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  verifyEmailLimiter,
  calculatorLimiter,
  pdfReportLimiter,
  csvReportLimiter,
  dashboardLimiter,
  historyLimiter,
  goalsLimiter,
  adminLimiter,
  reportLimiter,
  resetPasswordLimiter,
}
