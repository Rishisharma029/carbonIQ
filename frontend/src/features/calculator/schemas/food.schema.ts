import { z } from 'zod'

export const foodSchema = z.object({
  dietType: z.enum(['meat-heavy', 'balanced', 'vegetarian', 'vegan'], {
    invalid_type_error: 'Selected diet option is invalid',
  }),
  organicShare: z
    .number({ invalid_type_error: 'Organic percentage must be a number' })
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage cannot exceed 100'),
})
