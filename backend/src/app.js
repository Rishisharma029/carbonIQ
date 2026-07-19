import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import mongoose from 'mongoose'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'

import { config } from './config/config.js'
import { swaggerSpec } from './docs/swagger.js'
import { requestIdMiddleware } from './middlewares/requestIdMiddleware.js'
import { requestLoggerMiddleware } from './middlewares/requestLoggerMiddleware.js'
import { contentTypeMiddleware } from './middlewares/contentTypeMiddleware.js'
import { prototypePollutionMiddleware } from './middlewares/prototypePollutionMiddleware.js'
import { errorMiddleware } from './middlewares/errorMiddleware.js'
import { AuthorizationError, NotFoundError } from './errors/customErrors.js'
import { globalLimiter } from './middlewares/rateLimit.js'
import { csrf } from './middlewares/csrf.js'
import { queryWhitelist } from './middlewares/queryWhitelist.js'
import { envelope } from './middlewares/envelope.js'
import { idempotency } from './middlewares/idempotency.js'
import mongoSanitize from 'express-mongo-sanitize'

// Route imports
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import calculatorRouter from './routes/calculator.js'
import dashboardRouter from './routes/dashboard.js'
import historyRouter from './routes/history.js'
import goalsRouter from './routes/goals.js'
import reportsRouter from './routes/reports.js'
import recommendationsRouter from './routes/recommendations.js'
import usersRouter from './routes/users.js'
import emissionFactorsRouter from './routes/emissionFactors.js'

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', config.TRUST_PROXY)

// Request tracing and metadata-safe logging
app.use(requestIdMiddleware)
app.use(requestLoggerMiddleware)

// Set security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
    frameguard: { action: 'deny' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'no-referrer' },
  })
)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})

// Configure CORS with an explicit allowlist
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true)
      }
      return callback(new AuthorizationError('CORS origin is not allowed'))
    },
    credentials: true,
  })
)

// Compression & Global Rate Limiting
app.use(compression())
app.use('/api/', globalLimiter)

// Cookie Parser & Body parsers (with 1MB maximum payload limits)
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Content-Type validation, NoSQL Injection & Prototype Pollution sanitizers
app.use(contentTypeMiddleware)
app.use(mongoSanitize())
app.use(prototypePollutionMiddleware)

// Query parameter whitelisting (applied globally to all API paths)
app.use('/api/', queryWhitelist)

// CSRF protection — applied globally to all v1 endpoints (excluding exempt paths)
app.use('/api/v1', csrf)

// Global envelope formatting for JSON success responses
app.use(envelope)

// Swagger Documentation Interface
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Root-level health aliases (standard for cloud orchestrators)
app.get('/live', (req, res) => res.status(200).json({ success: true, message: 'Process is alive.' }))
app.get('/ready', (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1
  const secretsOk = !!(config.MONGO_URI && config.JWT_SECRET && config.SMTP_HOST)
  const isReady = isMongoConnected && secretsOk
  res.status(isReady ? 200 : 503).json({
    success: isReady,
    message: isReady ? 'Database is connected and ready.' : 'Database connection or environment secrets are unavailable.',
  })
})
app.use('/health', healthRouter)

// Mount routes
app.use('/api/v1/health', healthRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/calculator', calculatorRouter)
app.use('/api/v1/dashboard', dashboardRouter)
app.use('/api/v1/history', historyRouter)
app.use('/api/v1/goals', goalsRouter)
app.use('/api/v1/reports', reportsRouter)
app.use('/api/v1/recommendations', recommendationsRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/emission-factors', emissionFactorsRouter)

// 404 Handler
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`))
})

// Central Global Error Handler
app.use(errorMiddleware)

export default app
export { app }
