import mongoose from 'mongoose'
import dns from 'dns'
import { config } from './config.js'
import { logger } from './logger.js'
import { retryWithBackoff } from '../utils/retry.js'

// Workaround for Windows DNS resolution issues with MongoDB SRV records in c-ares (Node.js)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1'])
} catch (err) {
  // Ignore
}


export const connectDB = async () => {
  const connectFn = async () => {
    return await mongoose.connect(config.MONGO_URI)
  }

  try {
    const conn = await retryWithBackoff(connectFn, {
      retries: 5,
      baseDelayMs: 2000,
      maxDelayMs: 30000,
      factor: 2,
      jitterRangeMs: 1000,
      contextName: 'MongoDB Connection',
    })
    logger.info(`💾 MongoDB Connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}
