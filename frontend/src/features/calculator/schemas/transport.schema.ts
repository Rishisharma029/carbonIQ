import { z } from 'zod'

export const transportSchema = z.object({
  carDistance: z
    .number({ invalid_type_error: 'Distance must be a number' })
    .min(0, 'Distance must be positive or zero'),
  carFuelType: z.enum(['gasoline', 'diesel', 'hybrid', 'electric', 'none'], {
    invalid_type_error: 'Selected fuel type is invalid',
  }),
  transitHours: z
    .number({ invalid_type_error: 'Transit hours must be a number' })
    .min(0, 'Transit hours must be positive or zero'),
  flightHours: z
    .number({ invalid_type_error: 'Flight hours must be a number' })
    .min(0, 'Flight hours must be positive or zero'),
})
