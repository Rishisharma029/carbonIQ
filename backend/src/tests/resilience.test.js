import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retryWithBackoff, isTransientError } from '../utils/retry.js'
import { metrics } from '../utils/metrics.js'

// Simple mock logger to avoid cluttering test outputs
vi.mock('../config/logger.js', () => ({
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
  default: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  }
}))

describe('Resilience Utilities Tests', () => {
  describe('isTransientError', () => {
    it('should mark connection timeouts and network resets as transient', () => {
      const timeoutError = { code: 'ETIMEDOUT', message: 'Connection timed out' }
      const resetError = { code: 'ECONNRESET', message: 'Connection reset' }
      const dnsError = { code: 'ENOTFOUND', message: 'DNS not found' }
      const server502Error = { message: 'Server error 502 Bad Gateway' }

      expect(isTransientError(timeoutError)).toBe(true)
      expect(isTransientError(resetError)).toBe(true)
      expect(isTransientError(dnsError)).toBe(true)
      expect(isTransientError(server502Error)).toBe(true)
    })

    it('should mark validation and authentication errors as non-transient', () => {
      const validationError = { name: 'ValidationError', message: 'Invalid field' }
      const duplicateKeyError = { code: '11000', message: 'Duplicate key error' }
      const http400Error = { statusCode: 400, message: 'Bad request' }
      const http401Error = { statusCode: 401, message: 'Unauthorized' }

      expect(isTransientError(validationError)).toBe(false)
      expect(isTransientError(duplicateKeyError)).toBe(false)
      expect(isTransientError(http400Error)).toBe(false)
      expect(isTransientError(http401Error)).toBe(false)
    })
  })

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    it('should return the result on a successful first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await retryWithBackoff(fn, { retries: 2, baseDelayMs: 10 })
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should throw immediately on non-transient errors without retrying', async () => {
      const validationError = new Error('Validation failed')
      validationError.name = 'ValidationError'
      const fn = vi.fn().mockRejectedValue(validationError)

      await expect(retryWithBackoff(fn, { retries: 3, baseDelayMs: 10 })).rejects.toThrow('Validation failed')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on transient errors and eventually succeed', async () => {
      const transientError = new Error('Connection timeout')
      transientError.code = 'ETIMEDOUT'

      const fn = vi.fn()
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockResolvedValue('success')

      // Use a promise wrapper because fake timers will need to be advanced inside the retry loop
      const retryPromise = retryWithBackoff(fn, {
        retries: 3,
        baseDelayMs: 10,
        factor: 2,
        jitterRangeMs: 0, // Disable jitter to make delay calculations deterministic
      })

      // Fast-forward timers to resolve retry delays
      await vi.advanceTimersByTimeAsync(10)
      await vi.advanceTimersByTimeAsync(20)

      const result = await retryPromise
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should exhaust retry attempts and fail permanently', async () => {
      const transientError = new Error('Connection timeout')
      transientError.code = 'ETIMEDOUT'
      const fn = vi.fn().mockRejectedValue(transientError)

      const retryPromise = retryWithBackoff(fn, {
        retries: 2,
        baseDelayMs: 10,
        factor: 2,
        jitterRangeMs: 0,
      })
      // Avoid unhandled rejection warning by attaching a no-op catch
      retryPromise.catch(() => {})

      await vi.advanceTimersByTimeAsync(10)
      await vi.advanceTimersByTimeAsync(20)

      await expect(retryPromise).rejects.toThrow('Connection timeout')
      expect(fn).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    })
  })
})

describe('Metrics Tracker Tests', () => {
  it('should calculate availability percent correctly', () => {
    metrics.incrementRequests(false) // 1 successful
    metrics.incrementRequests(false) // 2 successful
    metrics.incrementRequests(true)  // 3 (failed)
    metrics.incrementRequests(false) // 4 successful

    const report = metrics.getMetrics()
    expect(report.availabilityPercent).toBe(75.0)
  })

  it('should track idempotency cache hits and DLQ size changes', () => {
    metrics.incrementIdempotencyHits()
    metrics.incrementIdempotencyHits()
    metrics.setDlqSize(5)
    metrics.incrementDlq(2)
    metrics.decrementDlq(1)

    const report = metrics.getMetrics()
    expect(report.idempotencyCacheHits).toBe(2)
    expect(report.dlqSize).toBe(6)
  })
})
