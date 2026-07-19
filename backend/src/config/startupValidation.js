import mongoose from 'mongoose'
import { config } from './config.js'
import { logger } from './logger.js'
import { storageService } from '../services/storageService.js'
import { worker } from '../jobs/worker.js'

export const validateStartup = async () => {
  logger.info('🔍 Starting CarbonIQ startup validation sequence...')

  // 1. Environment variables (already validated by config.js zod parsing)
  logger.info('✅ Environment variables validated.')

  // 2. Validate MongoDB Connectivity
  if (mongoose.connection.readyState !== 1) {
    logger.error('❌ Critical Startup Failure: MongoDB is not connected.')
    process.exit(1)
  }
  try {
    await mongoose.connection.db.admin().ping()
    logger.info('✅ MongoDB connection verified (Ping successful).')
  } catch (err) {
    logger.error(`❌ Critical Startup Failure: MongoDB ping failed: ${err.message}`)
    process.exit(1)
  }

  // 3. Validate Redis (if enabled)
  if (config.REDIS_ENABLED) {
    try {
      const { default: Redis } = await import('ioredis')
      const tempRedis = new Redis(config.REDIS_URL || {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        connectTimeout: 3000,
      })
      
      await new Promise((resolve, reject) => {
        tempRedis.ping((err) => {
          if (err) reject(err)
          else resolve()
        })
      })
      
      await tempRedis.quit()
      logger.info('✅ Redis connection verified (Ping successful).')
    } catch (err) {
      logger.error(`❌ Critical Startup Failure: Redis connection failed: ${err.message}`)
      process.exit(1)
    }
  } else {
    logger.info('ℹ️ Redis is disabled. MongoDB/Local fallbacks will be used.')
  }

  // 4. Validate Storage Configuration
  if (config.STORAGE_PROVIDER === 'local') {
    const isWriteable = await storageService.checkLocalWriteable()
    if (!isWriteable) {
      logger.error('❌ Critical Startup Failure: Local storage directory is not writeable.')
      process.exit(1)
    }
    logger.info(`✅ Local storage path verified writeable: ${config.STORAGE_LOCAL_PATH}`)
  } else if (config.STORAGE_PROVIDER === 's3') {
    if (!config.AWS_ACCESS_KEY_ID || !config.AWS_SECRET_ACCESS_KEY || !config.AWS_S3_BUCKET) {
      logger.error('❌ Critical Startup Failure: S3 storage provider configured but credentials/bucket missing.')
      process.exit(1)
    }
    logger.info(`✅ AWS S3 storage configuration parameters validated for bucket: ${config.AWS_S3_BUCKET}`)
  }

  // 5. Start Background Workers
  try {
    await worker.startWorker()
    logger.info('✅ Background workers initialized.')
  } catch (err) {
    logger.error(`❌ Critical Startup Failure: Workers initialization failed: ${err.message}`)
    process.exit(1)
  }

  logger.info('🚀 CarbonIQ Startup Validation Passed Successfully.')
}

export default validateStartup
