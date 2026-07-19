import { z } from 'zod'

export const transportSchema = z.object({
  carDistance: z.number().min(0, 'Car distance cannot be negative'),
  carFuelType: z.enum(['gasoline', 'diesel', 'hybrid', 'electric', 'none']),
  transitHours: z.number().min(0, 'Transit hours cannot be negative'),
  flightHours: z.number().min(0, 'Flight hours cannot be negative'),
}).strict()

export const electricitySchema = z.object({
  gridConsumption: z.number().min(0, 'Grid consumption cannot be negative'),
  cleanEnergyShare: z.number().min(0).max(100, 'Clean energy percentage must be between 0 and 100'),
}).strict()

export const foodSchema = z.object({
  dietType: z.enum(['meat-heavy', 'balanced', 'vegetarian', 'vegan']),
  organicShare: z.number().min(0).max(100, 'Organic share percentage must be between 0 and 100'),
}).strict()

export const wasteSchema = z.object({
  landfillBags: z.number().min(0, 'Landfill bags cannot be negative'),
  recycledPaper: z.boolean().default(false),
  recycledPlastic: z.boolean().default(false),
  recycledGlass: z.boolean().default(false),
}).strict()

export const waterSchema = z.object({
  consumptionLitres: z.number().min(0, 'Water consumption cannot be negative').default(0),
}).strict()

export const gasSchema = z.object({
  consumptionM3: z.number().min(0, 'Gas consumption cannot be negative').default(0),
}).strict()

export const calculatorSchema = z.object({
  transport: transportSchema,
  electricity: electricitySchema,
  food: foodSchema,
  waste: wasteSchema,
  water: waterSchema.default({ consumptionLitres: 0 }),
  gas: gasSchema.default({ consumptionM3: 0 }),
  state: z.string().optional().nullable(),
  version: z.string().optional().nullable(),
}).strict()
