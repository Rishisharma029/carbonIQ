import mongoose from 'mongoose'
import { app } from './app.js'
import { config } from './config/config.js'
import { connectDB } from './config/db.js'
import { logger } from './config/logger.js'
import { seedFactors } from './config/seedFactors.js'
import { validateStartup } from './config/startupValidation.js'

// Handle uncaught processes exceptions
process.on('uncaughtException', (err) => {
  logger.error('❌ UNCAUGHT EXCEPTION! Shutting down server processes...')
  logger.error(err)
  process.exit(1)
})

let server

// Establish database connection and validate startup
connectDB()
  .then(async () => {
    await validateStartup()
    await seedFactors()

    server = app.listen(config.PORT, () => {
      logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}`)
    })
  })
  .catch((err) => {
    logger.error('❌ Critical startup sequence failed:', err.message)
    process.exit(1)
  })

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('❌ UNHANDLED REJECTION! Shutting down server processes gracefully...')
  logger.error(err)
  if (server) {
    server.close(() => {
      process.exit(1)
    })
  } else {
    process.exit(1)
  }
})

// ──────────── Graceful Shutdown Sequence ────────────

const gracefulShutdown = (signal) => {
  logger.info(`👋 Received ${signal}. Initiating graceful shutdown...`)
  
  const closeDbAndExit = async () => {
    try {
      // Disconnect database pool
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close()
        logger.info('🗄️ MongoDB connection pool closed successfully.')
      }
      
      // Stop background workers
      const { worker } = await import('./jobs/worker.js')
      await worker.stopWorker()
      
      logger.info('🔌 Shutdown complete. Goodbye.')
      process.exit(0)
    } catch (err) {
      logger.error('❌ Error during database disconnect during shutdown:', err)
      process.exit(1)
    }
  }

  // 1. Stop accepting new connections if HTTP server is running
  if (server) {
    server.close(async () => {
      logger.info('🛑 HTTP server closed. Active connections finished.')
      await closeDbAndExit()
    })
  } else {
    closeDbAndExit()
  }

  // Timeout shutdown after 15 seconds to prevent hung process on container termination
  setTimeout(() => {
    logger.error('❌ Graceful shutdown timed out. Forcing process exit.')
    process.exit(1)
  }, 15000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
