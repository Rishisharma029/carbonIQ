export const GasCalculator = {
  calculate: (inputs = { consumptionM3: 0 }, factors) => {
    const consumptionM3 = inputs?.consumptionM3 || 0
    const gasFactor = factors['gas_combustion'] || 0.002
    
    const total = consumptionM3 * gasFactor
    const emission = Math.round(total * 100) / 100

    let confidenceLevel = 'HIGH'
    let confidenceReason = 'Volumetric gas combustion evaluated against EPA chemical heat content factors.'
    
    if (consumptionM3 === 0) {
      confidenceLevel = 'MEDIUM'
      confidenceReason = 'No LPG/gas consumption logged; falling back to zero-consumption baseline.'
    }

    return {
      emission,
      formula: 'consumptionM3 * gasFactor',
      inputs: {
        consumptionM3,
      },
      factors: {
        gasFactor,
      },
      confidence: {
        level: confidenceLevel,
        reason: confidenceReason,
      },
    }
  },
}
export default GasCalculator
