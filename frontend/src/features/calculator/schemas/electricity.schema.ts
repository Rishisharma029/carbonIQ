import { z } from 'zod'

export const electricitySchema = z.object({
  gridConsumption: z
    .number({ invalid_type_error: 'Consumption must be a number' })
    .min(0, 'Consumption must be positive or zero'),
  cleanEnergyShare: z
    .number({ invalid_type_error: 'Percentage must be a number' })
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage cannot exceed 100'),
})
