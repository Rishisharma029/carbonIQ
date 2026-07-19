import { z } from 'zod'

export const createGoalSchema = z
  .object({
    title: z.string().trim().min(1, 'Goal title is required'),
    category: z.enum(['transport', 'electricity', 'food', 'waste', 'total']),
    targetReduction: z.number().min(0, 'Target reduction cannot be negative'),
    baselineEmission: z.number().min(0, 'Baseline emission cannot be negative').optional(),
    endDate: z.string().datetime('End date must be a valid ISO date'),
  })
  .strict()
