export const ElectricityCalculator = {
  calculate: (inputs, factors) => {
    const gridFactor = factors['electricity_grid'] || 0
    const annualBaseEmissions = inputs.gridConsumption * 12 * gridFactor

    const offset = inputs.cleanEnergyShare / 100
    const finalEmissions = annualBaseEmissions * (1 - offset)
    const emission = Math.round(finalEmissions * 100) / 100

    let confidenceLevel = 'HIGH'
    let confidenceReason = 'Utility consumption metrics evaluated against regional grid emission factors.'
    
    if (inputs.cleanEnergyShare > 50) {
      confidenceLevel = 'MEDIUM'
      confidenceReason = 'Self-reported clean energy share is high; requires green supplier certification.'
    }

    return {
      emission,
      formula: '(gridConsumption * 12 * gridFactor) * (1 - cleanEnergyShare / 100)',
      inputs: {
        gridConsumption: inputs.gridConsumption,
        cleanEnergyShare: inputs.cleanEnergyShare,
      },
      factors: {
        gridFactor,
      },
      confidence: {
        level: confidenceLevel,
        reason: confidenceReason,
      },
    }
  },
}
export default ElectricityCalculator
