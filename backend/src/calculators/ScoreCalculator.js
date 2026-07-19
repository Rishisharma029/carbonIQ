import { TransportCalculator } from './TransportCalculator.js'
import { ElectricityCalculator } from './ElectricityCalculator.js'
import { FoodCalculator } from './FoodCalculator.js'
import { WasteCalculator } from './WasteCalculator.js'
import { WaterCalculator } from './WaterCalculator.js'
import { GasCalculator } from './GasCalculator.js'

// Global average total emission (tons CO2e/year) used as score baseline
const GLOBAL_AVERAGE_EMISSION = 4.8

/**
 * Compute a 0-100 sustainability score.
 * Score of 100 = zero emissions. Score of 0 = 2× the global average or worse.
 */
const computeScore = (totalEmission) => {
  const raw = 1 - totalEmission / (GLOBAL_AVERAGE_EMISSION * 2)
  return Math.round(Math.max(0, Math.min(1, raw)) * 100)
}

export const ScoreCalculator = {
  calculateAll: (inputs, factors) => {
    // 1. Run all synchronous category calculators
    const transportResult = TransportCalculator.calculate(inputs.transport || {}, factors)
    const electricityResult = ElectricityCalculator.calculate(inputs.electricity || {}, factors)
    const foodResult = FoodCalculator.calculate(inputs.food || {}, factors)
    const wasteResult = WasteCalculator.calculate(inputs.waste || {}, factors)
    const waterResult = WaterCalculator.calculate(inputs.water || {}, factors)
    const gasResult = GasCalculator.calculate(inputs.gas || {}, factors)

    // 2. Aggregate raw emissions
    const transportEmission = transportResult.emission
    const electricityEmission = electricityResult.emission
    const foodEmission = foodResult.emission
    const wasteEmission = wasteResult.emission
    const waterEmission = waterResult.emission
    const gasEmission = gasResult.emission

    const totalEmission =
      Math.round(
        (transportEmission + electricityEmission + foodEmission + wasteEmission + waterEmission + gasEmission) *
          100
      ) / 100

    // 3. Compute sustainability score
    const score = computeScore(totalEmission)

    // 4. Identify largest contributor and compile percentages
    const categories = [
      { name: 'transport', value: transportEmission },
      { name: 'electricity', value: electricityEmission },
      { name: 'food', value: foodEmission },
      { name: 'waste', value: wasteEmission },
      { name: 'water', value: waterEmission },
      { name: 'gas', value: gasEmission },
    ]

    const nonZeroCategories = categories.filter((c) => c.value > 0)
    let largestContributor = 'none'
    if (nonZeroCategories.length > 0) {
      largestContributor = nonZeroCategories.reduce((prev, current) =>
        prev.value > current.value ? prev : current
      ).name
    }

    const percentages = categories.reduce((acc, curr) => {
      acc[curr.name] = totalEmission > 0 ? Math.round((curr.value / totalEmission) * 100) : 0
      return acc
    }, {})

    // 5. Structure full explainability audit DTO
    const explainability = {
      formulaVersion: '2.0.0',
      formula: 'transport + electricity + food + waste + water + gas',
      largestContributor,
      percentages,
      categories: {
        transport: {
          emission: transportResult.emission,
          formula: transportResult.formula,
          inputs: transportResult.inputs,
          factors: transportResult.factors,
          confidence: transportResult.confidence,
        },
        electricity: {
          emission: electricityResult.emission,
          formula: electricityResult.formula,
          inputs: electricityResult.inputs,
          factors: electricityResult.factors,
          confidence: electricityResult.confidence,
        },
        food: {
          emission: foodResult.emission,
          formula: foodResult.formula,
          inputs: foodResult.inputs,
          factors: foodResult.factors,
          confidence: foodResult.confidence,
        },
        waste: {
          emission: wasteResult.emission,
          formula: wasteResult.formula,
          inputs: wasteResult.inputs,
          factors: wasteResult.factors,
          confidence: wasteResult.confidence,
        },
        water: {
          emission: waterResult.emission,
          formula: waterResult.formula,
          inputs: waterResult.inputs,
          factors: waterResult.factors,
          confidence: waterResult.confidence,
        },
        gas: {
          emission: gasResult.emission,
          formula: gasResult.formula,
          inputs: gasResult.inputs,
          factors: gasResult.factors,
          confidence: gasResult.confidence,
        },
      },
    }

    return {
      transportEmission,
      electricityEmission,
      foodEmission,
      wasteEmission,
      waterEmission,
      gasEmission,
      totalEmission,
      score,
      explainability,
    }
  },
}

export default ScoreCalculator
