export const WaterCalculator = {
  calculate: (inputs = { consumptionLitres: 0 }, factors) => {
    const consumptionLitres = inputs?.consumptionLitres || 0
    const waterFactor = factors['water_consumption'] || 0.0003
    
    const total = consumptionLitres * waterFactor
    const emission = Math.round(total * 100) / 100

    let confidenceLevel = 'HIGH'
    let confidenceReason = 'Volumetric water consumption evaluated against standard filtration energy factors.'
    
    if (consumptionLitres === 0) {
      confidenceLevel = 'MEDIUM'
      confidenceReason = 'No water usage logged; falling back to zero-consumption baseline.'
    }

    return {
      emission,
      formula: 'consumptionLitres * waterFactor',
      inputs: {
        consumptionLitres,
      },
      factors: {
        waterFactor,
      },
      confidence: {
        level: confidenceLevel,
        reason: confidenceReason,
      },
    }
  },
}
export default WaterCalculator
