import { config } from '../config/config.js'
import { logger } from '../config/logger.js'
import { QueueJob } from '../models/QueueJob.js'
import { metrics } from '../utils/metrics.js'

let bullQueue = null
let redisClient = null
let isRedisHealthy = false

// Dynamically initialize BullMQ and Redis connection if enabled
if (config.REDIS_ENABLED) {
  try {
    // We import dynamically to avoid loading issues if Redis is disabled
    const { Queue } = await import('bullmq')
    const { default: Redis } = await import('ioredis')

    const redisOptions = config.REDIS_URL
      ? config.REDIS_URL
      : {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          password: config.REDIS_PASSWORD,
          maxRetriesPerRequest: null, // Required by BullMQ
        }

    redisClient = new Redis(redisOptions)

    redisClient.on('connect', () => {
      isRedisHealthy = true
      logger.info('🚀 Redis connection established for Queue Service')
    })

    redisClient.on('error', (err) => {
      isRedisHealthy = false
      logger.error('❌ Redis connection error in Queue Service:', err.message)
    })

    bullQueue = new Queue('carboniq-jobs', {
      connection: redisClient,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
    })
  } catch (err) {
    logger.error('❌ Failed to initialize Redis/BullMQ Queue:', err.message)
    isRedisHealthy = false
  }
}

export const queueService = {
  /**
   * Enqueues a background job.
   * Falls back to MongoDB if Redis/BullMQ is down or disabled.
   * 
   * @param {string} type - Job type (e.g. 'send-email', 'generate-report')
   * @param {Object} payload - Payload to pass to the worker
   * @param {Object} options - Job options
   * @param {number} options.maxAttempts - Maximum retry attempts (default: 3)
   * @returns {Promise<Object>} Job status metadata
   */
  enqueueJob: async (type, payload = {}, options = {}) => {
    const maxAttempts = options.maxAttempts || 3

    if (config.REDIS_ENABLED && isRedisHealthy && bullQueue) {
      try {
        const job = await bullQueue.add(type, payload, {
          attempts: maxAttempts,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        })
        logger.info({ msg: 'Job enqueued via BullMQ (Redis)', type, jobId: job.id })
        return { success: true, provider: 'redis', jobId: job.id }
      } catch (err) {
        logger.warn({
          msg: 'BullMQ enqueue failed, falling back to MongoDB',
          type,
          error: err.message,
        })
      }
    }

    // Fallback: Store job in MongoDB
    try {
      if (process.env.NODE_ENV === 'test') {
        logger.info({ msg: 'Mocking job enqueue in test environment', type })
        return { success: true, provider: 'mongodb', jobId: 'mock-job-id' }
      }
      const job = await QueueJob.create({
        type,
        payload,
        maxAttempts,
        status: 'pending',
        nextAttemptAt: new Date(),
      })
      metrics.incrementDlq(1) // Increment virtual active queue size
      logger.info({ msg: 'Job enqueued via MongoDB (Fallback)', type, jobId: job._id })
      return { success: true, provider: 'mongodb', jobId: job._id.toString() }
    } catch (err) {
      logger.error({ msg: 'Failed to enqueue job in MongoDB', type, error: err.message })
      throw err
    }
  },

  /**
   * Returns whether the Redis queue provider is active.
   */
  isRedisActive: () => {
    return config.REDIS_ENABLED && isRedisHealthy
  },

  /**
   * Closes connections (useful for testing/graceful shutdown).
   */
  close: async () => {
    if (bullQueue) {
      await bullQueue.close()
    }
    if (redisClient) {
      await redisClient.quit()
    }
  },
}

export default queueService
