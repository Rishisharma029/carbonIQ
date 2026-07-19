import { z } from 'zod'

export const toggleRecommendationSchema = z
  .object({
    id: z.enum(['rec_1', 'rec_2', 'rec_3', 'rec_4', 'rec_5', 'rec_6']),
  })
  .strict()
