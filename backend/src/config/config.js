import dotenv from 'dotenv'
import path from 'path'
import { z } from 'zod'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const splitCsv = (value, fallback = '') =>
  (value || fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_RESET_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_RESET_EXPIRES_IN: z.string().default('15m'),
  JWT_ISSUER: z.string().default('carboniq-api'),
  JWT_AUDIENCE: z.string().default('carboniq-app'),
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://127.0.0.1:5173')
    .transform((value) => splitCsv(value))
    .refine((origins) => !origins.includes('*'), 'ALLOWED_ORIGINS cannot contain *'),
  TRUST_PROXY: z
    .union([z.literal('true'), z.literal('false'), z.coerce.number()])
    .default('false')
    .transform((value) => {
      if (value === 'true') return 1
      if (value === 'false') return false
      return value
    }),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.coerce.number().default(2525),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  SMTP_FROM: z.string().email('SMTP_FROM must be a valid email'),
  SMTP_TIMEOUT_MS: z.coerce.number().default(5000),
  // Redis Settings
  REDIS_ENABLED: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .default(false)
    .transform((val) => val === 'true' || val === true),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  // Storage Settings
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  // Auth v1
  EMAIL_VERIFY_EXPIRY_MINUTES: z.coerce.number().default(1440),   // 24 hours
  ACCOUNT_LOCK_MINUTES: z.coerce.number().default(30),
  CSRF_SECRET: z.string().optional(),
})

const parseResult = envSchema.safeParse(process.env)

if (!parseResult.success) {
  console.error('❌ Invalid environment configuration:')
  console.error(JSON.stringify(parseResult.error.format(), null, 2))
  process.exit(1)
}

const parsed = parseResult.data

export const config = {
  ...parsed,
  JWT_ACCESS_SECRET: parsed.JWT_ACCESS_SECRET || parsed.JWT_SECRET,
  JWT_REFRESH_SECRET: parsed.JWT_REFRESH_SECRET || parsed.JWT_SECRET,
  JWT_RESET_SECRET: parsed.JWT_RESET_SECRET || parsed.JWT_SECRET,
}
