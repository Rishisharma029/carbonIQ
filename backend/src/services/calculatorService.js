import mongoose from 'mongoose'
import { factorRepository } from '../repositories/factorRepository.js'
import { calculationRepository } from '../repositories/calculationRepository.js'
import { summaryRepository } from '../repositories/summaryRepository.js'
import { goalService } from './goalService.js'
import { ScoreCalculator } from '../calculators/ScoreCalculator.js'
import { CalculationError } from '../errors/customErrors.js'

export const calculatorService = {
  calculateAndSave: async (userId, inputs) => {
    // 1. Resolve state and version parameters
    const state = inputs.state || null
    const version = inputs.version || 'IN-2023-V1.0'

    // Define keys needed by ScoreCalculator
    const keysToLookup = [
      { category: 'transport', key: 'transport_car_gasoline' },
      { category: 'transport', key: 'transport_car_diesel' },
      { category: 'transport', key: 'transport_car_hybrid' },
      { category: 'transport', key: 'transport_car_electric' },
      { category: 'transport', key: 'transport_transit' },
      { category: 'transport', key: 'transport_flight' },
      { category: 'electricity', key: 'electricity_grid' },
      { category: 'food', key: 'food_diet_meat-heavy' },
      { category: 'food', key: 'food_diet_balanced' },
      { category: 'food', key: 'food_diet_vegetarian' },
      { category: 'food', key: 'food_diet_vegan' },
      { category: 'waste', key: 'waste_landfill_bag' },
      { category: 'water', key: 'water_consumption' },
      { category: 'gas', key: 'gas_combustion' },
    ]

    const factorMap = {}
    const confidenceMap = {}

    for (const item of keysToLookup) {
      const resolved = await factorRepository.findWithFallback(item.category, item.key, state, version)
      if (!resolved) {
        throw new CalculationError(`Emission factor not found for key: ${item.key} under version: ${version}`)
      }
      factorMap[item.key] = resolved.factor.factor
      confidenceMap[item.key] = resolved.confidence
    }

    const factorVersion = version

    // 2. Calculate emissions + sustainability score
    const {
      transportEmission,
      electricityEmission,
      foodEmission,
      wasteEmission,
      waterEmission,
      gasEmission,
      totalEmission,
      score,
      explainability,
    } = ScoreCalculator.calculateAll(inputs, factorMap)

    // Override category confidence from our fallback resolution
    const categoriesMap = {
      transport: 'transport',
      electricity: 'electricity',
      food: 'food',
      waste: 'waste',
      water: 'water',
      gas: 'gas',
    }

    for (const [calcKey, explainKey] of Object.entries(categoriesMap)) {
      const cat = explainability.categories[explainKey]
      const associatedKeys = Object.keys(confidenceMap).filter((k) => k.startsWith(calcKey))
      if (associatedKeys.length > 0 && cat) {
        const resolvedConfidence = confidenceMap[associatedKeys[0]]
        cat.confidence = {
          level: resolvedConfidence.toUpperCase(),
          reason: `Resolved via ${resolvedConfidence}-confidence fallback cascade.`,
        }
      }
    }

    const results = {
      transportEmission,
      electricityEmission,
      foodEmission,
      wasteEmission,
      waterEmission,
      gasEmission,
      totalEmission,
    }

    // 3. Persist transactionally
    let session = null
    try {
      session = await mongoose.startSession()
      session.startTransaction()
    } catch {
      session = null
    }

    try {
      const calculation = await calculationRepository.create(
        {
          userId,
          inputs,
          results,
          score,
          explainability,
          factorVersion,
          schemaVersion: 2,
          createdByVersion: '1.0.0',
        },
        session
      )

      const now = new Date()
      const year = now.getUTCFullYear()
      const month = now.getUTCMonth() + 1
      await summaryRepository.incrementSummary(userId, year, month, results, score, session)

      await goalService.syncGoalsOnCalculation(userId, results, session)

      if (session) {
        await session.commitTransaction()
      }
      return calculation
    } catch (error) {
      if (session) {
        await session.abortTransaction()
      }
      throw error
    } finally {
      if (session) {
        session.endSession()
      }
    }
  },
}
export default calculatorService
