import { IdempotentRequest } from '../models/IdempotentRequest.js'
import { logger } from '../config/logger.js'
import { config } from '../config/config.js'
import { metrics } from '../utils/metrics.js'

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/
const REDIS_TTL_SECONDS = 24 * 60 * 60 // 24 hours

export const idempotency = async (req, res, next) => {
  // Only apply to POST mutation requests
  if (req.method !== 'POST') {
    return next()
  }

  const key = req.headers['idempotency-key']

  // If no Idempotency-Key is present, proceed normally
  if (!key) {
    return next()
  }

  // Validate header format to prevent arbitrary payload injection
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid Idempotency-Key format. Must be alphanumeric (1-128 chars).',
      },
    })
  }

  const userId = req.user?._id ? req.user._id.toString() : 'anonymous'
  const endpoint = req.originalUrl
  const redisKey = `carboniq:idempotency:${userId}:${endpoint}:${key}`

  let queueService = null
  let isRedisActive = false

  if (config.REDIS_ENABLED) {
    try {
      queueService = (await import('../services/queueService.js')).queueService
      isRedisActive = queueService.isRedisActive()
    } catch (err) {
      // Degrade gracefully
    }
  }

  // 1. Try Redis first (if enabled and active)
  if (config.REDIS_ENABLED && isRedisActive) {
    try {
      const { default: Redis } = await import('ioredis')
      const redisOptions = config.REDIS_URL
        ? config.REDIS_URL
        : {
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
            password: config.REDIS_PASSWORD,
          }
      
      const redis = new Redis(redisOptions)
      const cached = await redis.get(redisKey)
      await redis.quit()

      if (cached) {
        const record = JSON.parse(cached)

        if (record.status === 'processing') {
          logger.warn({ msg: 'Idempotency conflict (Redis) — request already processing', key, userId, endpoint })
          metrics.incrementDuplicateRequests()
          return res.status(409).json({
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'A duplicate request is already being processed.',
            },
          })
        }

        logger.info({ msg: 'Idempotency match (Redis) — returning cached response', key, userId, endpoint })
        metrics.incrementIdempotencyHits()
        return res.status(record.statusCode).json(record.responseBody)
      }

      // Claim key in 'processing' state in Redis
      const redisClaim = new Redis(redisOptions)
      await redisClaim.set(redisKey, JSON.stringify({ status: 'processing' }), 'EX', REDIS_TTL_SECONDS)
      await redisClaim.quit()

      // Set flags on request to capture response
      req.idempotencyProvider = 'redis'
      req.idempotencyKey = redisKey
    } catch (err) {
      logger.warn({ msg: 'Redis idempotency check failed, degrading to MongoDB', error: err.message })
    }
  }

  // 2. MongoDB Fallback / Primary (if Redis is disabled or connection failed)
  if (!req.idempotencyProvider) {
    try {
      const mongoUserId = req.user?._id || null
      const existing = await IdempotentRequest.findOne({ key, userId: mongoUserId, endpoint })

      if (existing) {
        if (existing.status === 'processing') {
          logger.warn({ msg: 'Idempotency conflict (MongoDB) — request already processing', key, userId, endpoint })
          metrics.incrementDuplicateRequests()
          return res.status(409).json({
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'A duplicate request is already being processed.',
            },
          })
        }

        logger.info({ msg: 'Idempotency match (MongoDB) — returning cached response', key, userId, endpoint })
        metrics.incrementIdempotencyHits()
        return res.status(existing.statusCode).json(existing.responseBody)
      }

      // Claim key in MongoDB
      const record = await IdempotentRequest.create({
        key,
        userId: mongoUserId,
        endpoint,
        status: 'processing',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })

      req.idempotencyProvider = 'mongodb'
      req.idempotencyRecordId = record._id
      req.idempotencyRecord = record
    } catch (err) {
      logger.error({ msg: 'Idempotency middleware db exception', error: err.message, key })
      return next(err)
    }
  }

  // Intercept response methods to save final response body
  const originalJson = res.json
  const originalSend = res.send

  const saveResponse = async (body, statusCode) => {
    try {
      if (req.idempotencyProvider === 'redis') {
        const { default: Redis } = await import('ioredis')
        const redisOptions = config.REDIS_URL
          ? config.REDIS_URL
          : {
              host: config.REDIS_HOST,
              port: config.REDIS_PORT,
              password: config.REDIS_PASSWORD,
            }
        const redis = new Redis(redisOptions)
        await redis.set(
          req.idempotencyKey,
          JSON.stringify({ status: 'completed', statusCode, responseBody: body }),
          'EX',
          REDIS_TTL_SECONDS
        )
        await redis.quit()
      } else if (req.idempotencyProvider === 'mongodb') {
        const record = req.idempotencyRecord
        if (record) {
          record.status = 'completed'
          record.statusCode = statusCode
          record.responseBody = body
          await record.save()
        }
      }
    } catch (err) {
      logger.error({ msg: 'Failed to persist completed idempotency record', error: err.message, key })
    }
  }

  const deleteResponse = async () => {
    try {
      if (req.idempotencyProvider === 'redis') {
        const { default: Redis } = await import('ioredis')
        const redisOptions = config.REDIS_URL
          ? config.REDIS_URL
          : {
              host: config.REDIS_HOST,
              port: config.REDIS_PORT,
              password: config.REDIS_PASSWORD,
            }
        const redis = new Redis(redisOptions)
        await redis.del(req.idempotencyKey)
        await redis.quit()
      } else if (req.idempotencyProvider === 'mongodb') {
        if (req.idempotencyRecordId) {
          await IdempotentRequest.deleteOne({ _id: req.idempotencyRecordId })
        }
      }
    } catch (err) {
      logger.error({ msg: 'Failed to delete failed idempotency record', error: err.message, key })
    }
  }

  res.json = function (body) {
    if (res.statusCode < 500) {
      saveResponse(body, res.statusCode)
    } else {
      deleteResponse()
    }
    res.json = originalJson
    return res.json(body)
  }

  res.send = function (body) {
    if (res.statusCode < 500) {
      let parsedBody = body
      try {
        parsedBody = JSON.parse(body)
      } catch {
        // Leave as string
      }
      saveResponse(parsedBody, res.statusCode)
    } else {
      deleteResponse()
    }
    res.send = originalSend
    return res.send(body)
  }

  next()
}

export default idempotency
