import { z } from 'zod'
import { objectIdSchema } from './commonValidator.js'

export const historyQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.enum(['createdAt', 'totalEmission', 'score']).default('createdAt'),
    sortBy: z.enum(['createdAt', 'totalEmission', 'score']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    category: z.enum(['transport', 'electricity', 'food', 'waste']).optional(),
  })
  .strict()
  .transform((value) => ({
    page: value.page,
    limit: value.limit,
    sortBy: value.sortBy || value.sort,
    sortOrder: value.sortOrder,
    from: value.from || value.startDate,
    to: value.to || value.endDate,
    category: value.category,
  }))

export const historyIdParamsSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict()
