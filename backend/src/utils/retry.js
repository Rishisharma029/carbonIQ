import { logger } from '../config/logger.js'

/**
 * Check if an error is transient and should be retried.
 */
export function isTransientError(error) {
  if (!error) return false

  // Custom HTTP errors / application errors
  if (error.statusCode && error.statusCode < 500) {
    return false
  }

  // Mongoose / Zod validation or client-side errors
  if (
    error.name === 'ValidationError' ||
    error.name === 'CastError' ||
    error.name === 'ZodError' ||
    error.code === '11000' // Duplicate key error is not transient
  ) {
    return false
  }

  // Common network / connection errors are transient
  const transientCodes = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ENOTFOUND',
    'EADDRINUSE',
    'EPIPE',
    'EAI_AGAIN',
  ]
  if (error.code && transientCodes.includes(error.code)) {
    return true
  }

  const errorMessage = String(error.message || '').toLowerCase()
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('server error') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('504')
  ) {
    return true
  }

  // Default to non-transient for unknown safety
  return false
}

/**
 * Executes a function with retries, exponential backoff, and random jitter.
 * 
 * @param {Function} fn - Async function to run
 * @param {Object} options - Configuration options
 * @param {number} options.retries - Max retry attempts (default: 3)
 * @param {number} options.baseDelayMs - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelayMs - Max delay cap in ms (default: 15000)
 * @param {number} options.factor - Multiplier for backoff (default: 2)
 * @param {number} options.jitterRangeMs - Range for random jitter (default: 500)
 * @param {string} options.contextName - Label for logging context
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    retries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 15000,
    factor = 2,
    jitterRangeMs = 500,
    contextName = 'Operation',
  } = options

  let attempt = 0

  while (true) {
    try {
      return await fn()
    } catch (error) {
      attempt++

      if (attempt > retries || !isTransientError(error)) {
        logger.error({
          msg: `${contextName} failed permanently after ${attempt} attempt(s)`,
          error: error.message,
          code: error.code,
        })
        throw error
      }

      // Calculate exponential backoff: base * (factor ^ (attempt - 1))
      let delay = baseDelayMs * Math.pow(factor, attempt - 1)
      delay = Math.min(delay, maxDelayMs)

      // Add random jitter (± random value up to jitterRangeMs)
      const jitter = (Math.random() * 2 - 1) * jitterRangeMs
      const finalDelay = Math.max(0, Math.round(delay + jitter))

      logger.warn({
        msg: `${contextName} failed with transient error. Retrying in ${finalDelay}ms (Attempt ${attempt}/${retries})...`,
        error: error.message,
      })

      await new Promise((resolve) => setTimeout(resolve, finalDelay))
    }
  }
}
