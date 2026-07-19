import { config } from '../config/config.js'
import { logger } from '../config/logger.js'
import { QueueJob } from '../models/QueueJob.js'
import { emailService } from '../services/emailService.js'
import { storageService } from '../services/storageService.js'
import { reportService } from '../services/reportService.js'
import { Report } from '../models/Report.js'
import { metrics } from '../utils/metrics.js'

let bullWorker = null
let mongoIntervalId = null
let isWorkerRunning = false

/**
 * Core job execution handler.
 */
export async function processJob(type, payload) {
  logger.info({ msg: 'Processing background job', type, payload })
  const startTime = Date.now()

  try {
    switch (type) {
      case 'send-email': {
        const { to, subject, text, html } = payload
        await emailService.sendEmail({ to, subject, text, html })
        break
      }
      case 'generate-report': {
        const { userId, reportId, reportType } = payload
        
        let buffer
        let mimeType
        let ext
        
        if (reportType === 'pdf') {
          buffer = await reportService.generatePDFBuffer(userId)
          mimeType = 'application/pdf'
          ext = 'pdf'
        } else if (reportType === 'csv') {
          const csvString = await reportService.generateCSV(userId)
          buffer = Buffer.from(csvString, 'utf-8')
          mimeType = 'text/csv'
          ext = 'csv'
        } else {
          throw new Error(`Unsupported report type: ${reportType}`)
        }

        const key = `reports/${userId}/${reportId}.${ext}`
        const storagePath = await storageService.upload(key, buffer, mimeType)
        
        // Update report metadata
        await Report.findByIdAndUpdate(reportId, {
          storagePath,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
        })
        break
      }
      default:
        throw new Error(`Unknown job type: ${type}`)
    }

    metrics.recordRecovery(Date.now() - startTime)
    metrics.recordRetry(true) // Track success
    logger.info({ msg: 'Job completed successfully', type })
  } catch (err) {
    logger.error({ msg: 'Job processing failure', type, error: err.message })
    metrics.recordRetry(false) // Track failure
    throw err
  }
}

/**
 * Polling loop for MongoDB-backed fallback jobs.
 * Uses atomic findOneAndUpdate to prevent duplicate processing by multiple server instances.
 */
async function pollMongoJobs() {
  try {
    // Find jobs that are due for execution
    const now = new Date()
    const jobs = await QueueJob.find({
      status: { $in: ['pending', 'failed'] },
      nextAttemptAt: { $lte: now },
    }).limit(5)

    if (jobs.length === 0) return

    logger.debug(`Found ${jobs.length} pending MongoDB jobs to process.`)

    for (const job of jobs) {
      // Concurrency check: atomically transition status to 'processing' and increment attempts
      const lockedJob = await QueueJob.findOneAndUpdate(
        {
          _id: job._id,
          status: job.status, // Ensure it hasn't changed
        },
        {
          $set: { status: 'processing' },
          $inc: { attempts: 1 },
        },
        { new: true }
      )

      if (!lockedJob) {
        // Job was claimed by another worker instance
        continue
      }

      try {
        await processJob(lockedJob.type, lockedJob.payload)
        
        // Job succeeded
        lockedJob.status = 'completed'
        lockedJob.error = null
        await lockedJob.save()

        // Decrement active queue metrics size
        metrics.decrementDlq(1)
      } catch (err) {
        // Job failed
        if (lockedJob.attempts >= lockedJob.maxAttempts) {
          lockedJob.status = 'dlq'
          lockedJob.error = err.message
          await lockedJob.save()
          // Update actual size of DLQ metrics
          metrics.incrementDlq(1)
          logger.error({ msg: 'Job exhausted all attempts. Moved to DLQ.', jobId: lockedJob._id })
        } else {
          // Exponential backoff with jitter: 5s, 10s, 20s...
          const baseDelay = 5000 * Math.pow(2, lockedJob.attempts - 1)
          const jitter = (Math.random() * 2 - 1) * 1500 // ±1.5s jitter
          const delay = Math.max(1000, Math.round(baseDelay + jitter))

          lockedJob.status = 'failed'
          lockedJob.nextAttemptAt = new Date(Date.now() + delay)
          lockedJob.error = err.message
          await lockedJob.save()
          logger.warn({ msg: `Job failed. Scheduled retry in ${delay}ms`, jobId: lockedJob._id })
        }
      }
    }
  } catch (err) {
    logger.error('Error in MongoDB queue polling loop:', err.message)
  }
}

export const worker = {
  startWorker: async () => {
    if (isWorkerRunning) return
    isWorkerRunning = true
    logger.info('⚙️ Starting CarbonIQ background workers...')

    // Initialize BullMQ worker if enabled and Redis is active
    const { queueService } = await import('../services/queueService.js')
    if (config.REDIS_ENABLED && queueService.isRedisActive()) {
      try {
        const { Worker } = await import('bullmq')
        const { default: Redis } = await import('ioredis')
        
        const redisOptions = config.REDIS_URL
          ? config.REDIS_URL
          : {
              host: config.REDIS_HOST,
              port: config.REDIS_PORT,
              password: config.REDIS_PASSWORD,
              maxRetriesPerRequest: null,
            }

        const connection = new Redis(redisOptions)

        bullWorker = new Worker(
          'carboniq-jobs',
          async (job) => {
            await processJob(job.name, job.data)
          },
          {
            connection,
            concurrency: 5,
          }
        )

        bullWorker.on('completed', (job) => {
          logger.info(`⚙️ BullMQ Job completed: ${job.id}`)
        })

        bullWorker.on('failed', (job, err) => {
          logger.error(`⚙️ BullMQ Job failed: ${job ? job.id : 'unknown'}, error: ${err.message}`)
          metrics.incrementDlq(1) // Treat BullMQ failures as DLQ additions
        })

        logger.info('⚙️ BullMQ Worker started (Redis mode).')
      } catch (err) {
        logger.error('⚙️ Failed to start BullMQ worker, falling back to MongoDB poll:', err.message)
      }
    }

    // Always run the MongoDB polling worker as a fallback/primary when Redis is down
    mongoIntervalId = setInterval(pollMongoJobs, 5000)
    logger.info('⚙️ MongoDB Queue polling loop started (5s interval).')
  },

  stopWorker: async () => {
    if (!isWorkerRunning) return
    isWorkerRunning = false
    logger.info('⚙️ Stopping CarbonIQ background workers...')

    if (mongoIntervalId) {
      clearInterval(mongoIntervalId)
      mongoIntervalId = null
    }

    if (bullWorker) {
      await bullWorker.close()
      bullWorker = null
    }

    logger.info('⚙️ CarbonIQ background workers stopped.')
  },
}

export default worker
