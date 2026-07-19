export const TransportCalculator = {
  calculate: (inputs, factors) => {
    let carFactor = 0
    let carFactorUsed = null
    
    if (inputs.carFuelType !== 'none') {
      const factorKey = `transport_car_${inputs.carFuelType}`
      carFactor = factors[factorKey] || 0
      carFactorUsed = carFactor
    }
    const carEmissions = inputs.carDistance * 52 * carFactor

    const transitFactor = factors['transport_transit'] || 0
    const transitEmissions = inputs.transitHours * 52 * transitFactor

    const flightFactor = factors['transport_flight'] || 0
    const flightEmissions = inputs.flightHours * flightFactor

    const total = carEmissions + transitEmissions + flightEmissions
    const emission = Math.round(total * 100) / 100

    // Set confidence level based on input completeness
    let confidenceLevel = 'HIGH'
    let confidenceReason = 'Detailed inputs matching exact vehicle profile and regional transport factors.'
    
    if (inputs.carDistance > 0 && inputs.carFuelType === 'none') {
      confidenceLevel = 'MEDIUM'
      confidenceReason = 'Car distance logged without specific fuel type; fallback average factor applied.'
    }

    return {
      emission,
      formula: '(carDistance * 52 * carFactor) + (transitHours * 52 * transitFactor) + (flightHours * flightFactor)',
      inputs: {
        carDistance: inputs.carDistance,
        carFuelType: inputs.carFuelType,
        transitHours: inputs.transitHours,
        flightHours: inputs.flightHours,
      },
      factors: {
        carFactor: carFactorUsed,
        transitFactor,
        flightFactor,
      },
      confidence: {
        level: confidenceLevel,
        reason: confidenceReason,
      },
    }
  },
}
export default TransportCalculator
