export const FoodCalculator = {
  calculate: (inputs, factors) => {
    const dietFactorKey = `food_diet_${inputs.dietType}`
    const dietBase = factors[dietFactorKey] || 2.2

    const offset = (inputs.organicShare / 100) * 0.1
    const finalEmissions = dietBase * (1 - offset)
    const emission = Math.round(finalEmissions * 100) / 100

    return {
      emission,
      formula: 'dietBase * (1 - (organicShare / 100) * 0.1)',
      inputs: {
        dietType: inputs.dietType,
        organicShare: inputs.organicShare,
      },
      factors: {
        dietBase,
      },
      confidence: {
        level: 'MEDIUM',
        reason: 'Dietary habits are self-reported profiles; standard IPCC proxy factors applied.',
      },
    }
  },
}
export default FoodCalculator
