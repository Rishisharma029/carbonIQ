export const WasteCalculator = {
  calculate: (inputs, factors) => {
    const bagFactor = factors['waste_landfill_bag'] || 0
    const annualBaseEmissions = inputs.landfillBags * 52 * bagFactor

    let reductionMultiplier = 0
    if (inputs.recycledPaper) reductionMultiplier += 0.04
    if (inputs.recycledPlastic) reductionMultiplier += 0.05
    if (inputs.recycledGlass) reductionMultiplier += 0.03

    const finalEmissions = annualBaseEmissions * (1 - reductionMultiplier)
    const emission = Math.round(finalEmissions * 100) / 100

    let confidenceLevel = 'HIGH'
    let confidenceReason = 'Trash bag output tracked periodically with specific recycling material offsets.'
    
    if (inputs.landfillBags === 0) {
      confidenceLevel = 'LOW'
      confidenceReason = 'Zero waste logging is unusual; requires confirmation of zero landfill profile.'
    }

    return {
      emission,
      formula: '(landfillBags * 52 * bagFactor) * (1 - reductionMultiplier)',
      inputs: {
        landfillBags: inputs.landfillBags,
        recycledPaper: inputs.recycledPaper,
        recycledPlastic: inputs.recycledPlastic,
        recycledGlass: inputs.recycledGlass,
      },
      factors: {
        bagFactor,
        reductionMultiplier,
      },
      confidence: {
        level: confidenceLevel,
        reason: confidenceReason,
      },
    }
  },
}
export default WasteCalculator
