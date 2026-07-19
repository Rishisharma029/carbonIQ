import { z } from 'zod'
import { isValidObjectId } from '../utils/objectId.js'

export const objectIdSchema = z
  .string()
  .refine((value) => isValidObjectId(value), 'Invalid ObjectId')

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict()

export const idParamSchema = z
  .object({
    id: objectIdSchema,
  })
  .strict()
