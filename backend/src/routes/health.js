import express from 'express'
import mongoose from 'mongoose'
import { config } from '../config/config.js'
import { logger } from '../config/logger.js'
import { QueueJob } from '../models/QueueJob.js'
import { metrics } from '../utils/metrics.js'

const router = express.Router()

/**
 * @openapi
 * /api/v1/health/live:
 *   get:
 *     summary: Liveness check
 *     description: Verifies if the process is running.
 *     responses:
 *       200:
 *         description: Process is alive
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Process is alive.',
  })
})

/**
 * @openapi
 * /api/v1/health/ready:
 *   get:
 *     summary: Readiness check
 *     description: "Verifies critical requirements: MongoDB connection and key secrets."
 *     responses:
 *       200:
 *         description: Database is connected and ready
 *       503:
 *         description: Database connection or secrets unavailable
 */
router.get('/ready', (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1
  const secretsOk = !!(config.MONGO_URI && config.JWT_SECRET && config.SMTP_HOST)
  const isReady = isMongoConnected && secretsOk

  if (!isReady) {
    logger.error({
      msg: 'Readiness check failed',
      mongoConnected: isMongoConnected,
      secretsConfigured: secretsOk,
    })
    return res.status(503).json({
      success: false,
      message: 'System is not ready to serve traffic.',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Database is connected and ready.',
  })
})

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     summary: Diagnostic health check
 *     description: Retrieve system uptime, memory metrics, node version, connection status of DB/Redis/SMTP, storage health, and queue metrics.
 *     responses:
 *       200:
 *         description: Health diagnostics retrieved successfully
 */
router.get('/', async (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1
  let dbLatencyMs = null

  if (isMongoConnected) {
    try {
      const start = Date.now()
      await mongoose.connection.db.admin().ping()
      dbLatencyMs = Date.now() - start
    } catch (err) {
      logger.error({ msg: 'Failed to ping database during health diagnostic', error: err.message })
    }
  }

  // 1. Verify Redis connectivity if enabled
  let redisConnected = false
  if (config.REDIS_ENABLED) {
    try {
      const { queueService } = await import('../services/queueService.js')
      redisConnected = queueService.isRedisActive()
    } catch (err) {
      // Degrade gracefully
    }
  }

  // 2. Verify SMTP connection status
  let smtpConnected = false
  try {
    const { emailService } = await import('../services/emailService.js')
    smtpConnected = await emailService.verifyConnection()
  } catch (err) {
    // Degrade gracefully
  }

  // 3. Verify Local Storage Writeability
  let storageOk = false
  try {
    const { storageService } = await import('../services/storageService.js')
    if (config.STORAGE_PROVIDER === 'local') {
      storageOk = await storageService.checkLocalWriteable()
    } else {
      storageOk = true // Assume healthy if startup validation passed
    }
  } catch (err) {
    // Degrade gracefully
  }

  // 4. Retrieve Fallback Queue Size
  let pendingMongoJobs = 0
  try {
    pendingMongoJobs = await QueueJob.countDocuments({ status: { $in: ['pending', 'failed'] } })
  } catch (err) {
    // Degrade gracefully
  }

  const currentMetrics = metrics.getMetrics()
  const isSystemHealthy = isMongoConnected

  res.status(isSystemHealthy ? 200 : 503).json({
    success: isSystemHealthy,
    status: isSystemHealthy ? 'success' : 'error',
    message: isSystemHealthy ? 'System is healthy' : 'System is degraded',
    data: {
      uptimeSeconds: process.uptime(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      database: {
        status: isMongoConnected ? 'connected' : 'disconnected',
        latencyMs: dbLatencyMs,
      },
      redis: {
        enabled: config.REDIS_ENABLED,
        status: redisConnected ? 'connected' : 'disconnected',
      },
      smtp: {
        status: smtpConnected ? 'connected' : 'disconnected',
      },
      storage: {
        provider: config.STORAGE_PROVIDER,
        status: storageOk ? 'healthy' : 'error',
      },
      queue: {
        mongoPendingJobs: pendingMongoJobs,
        dlqSize: currentMetrics.dlqSize,
      },
      metrics: currentMetrics,
    },
  })
})

export default router
export { router }
