import pino from 'pino'
import { config } from './config.js'

const transport =
  config.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined

export const logger = pino({
  level: config.NODE_ENV === 'test' ? 'silent' : 'info',
  base: { env: config.NODE_ENV },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'headers.cookie',
      'body.password',
      'body.confirmPassword',
      'body.token',
      'cookies.access_token',
      'cookies.refresh_token',
      'accessToken',
      'refreshToken',
      'resetToken',
    ],
    censor: '[REDACTED]',
  },
  transport,
})
export default logger
