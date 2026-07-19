import { z } from 'zod'
import { transportSchema } from './transport.schema'
import { electricitySchema } from './electricity.schema'
import { foodSchema } from './food.schema'
import { wasteSchema } from './waste.schema'

export const calculatorSchema = z.object({
  transport: transportSchema,
  electricity: electricitySchema,
  food: foodSchema,
  waste: wasteSchema,
})
