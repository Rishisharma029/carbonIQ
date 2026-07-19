import { z } from 'zod'

export const factorQuerySchema = z
  .object({
    category: z.string().optional(),
    subCategory: z.string().optional(),
    state: z.string().optional(),
    version: z.string().optional(),
  })
  .strict()

export const factorSearchSchema = z
  .object({
    q: z.string().min(1, 'Search query must be at least 1 character long'),
  })
  .strict()

export const singleFactorImportSchema = z
  .object({
    category: z.string().min(1),
    subCategory: z.string().min(1),
    activity: z.string().min(1),
    key: z.string().min(1),
    fuelType: z.enum(['petrol', 'diesel', 'cng', 'electric', 'lpg', 'png', 'kerosene', 'coal', 'firewood', 'biomass', 'hybrid', 'gasoline']).nullable().optional(),
    vehicleClass: z.enum(['suv', 'hatchback', 'sedan', 'motorcycle', 'scooter', 'auto_rickshaw', 'taxi']).nullable().optional(),
    state: z.string().nullable().optional(),
    country: z.string().default('IN'),
    factor: z.number().nonnegative(),
    unit: z.string().min(1),
    confidence: z.enum(['High', 'Medium', 'Low']),
    methodology: z.string().min(1),
  })
  .strict()

export const datasetImportSchema = z
  .object({
    version: z.string().min(2),
    source: z.string().min(2),
    publicationYear: z.number().int().min(1990).max(2050),
    factors: z.array(singleFactorImportSchema).min(1, 'At least one factor must be provided in the import array'),
  })
  .strict()
