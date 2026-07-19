import { z } from 'zod'

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long').optional(),
    email: z.string().email('Invalid email address format').optional(),
    country: z.string().trim().max(100).optional(),
    timezone: z.string().trim().max(100).optional(),
  })
  .strict()

export const updateSettingsSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    preferredUnit: z.enum(['metric', 'imperial']).optional(),
  })
  .strict()
