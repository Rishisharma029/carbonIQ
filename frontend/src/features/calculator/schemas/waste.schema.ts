import { z } from 'zod'

export const wasteSchema = z.object({
  landfillBags: z
    .number({ invalid_type_error: 'Bags count must be a number' })
    .min(0, 'Bags count must be positive or zero'),
  recycledPaper: z.boolean(),
  recycledPlastic: z.boolean(),
  recycledGlass: z.boolean(),
})
