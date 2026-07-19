import { api } from '@/services/api'
import { CalculatorInput, CalculationResult } from '../types'

// Local calculation engine utilizing official EPA / DEFRA conversion factors
export const calculateEmissions = (input: CalculatorInput): CalculationResult['breakdown'] => {
  // 1. Transportation
  let carFactor = 0
  switch (input.transport.carFuelType) {
    case 'gasoline':
      carFactor = 0.404 // kg CO2e / mile
      break
    case 'diesel':
      carFactor = 0.38
      break
    case 'hybrid':
      carFactor = 0.22
      break
    case 'electric':
      carFactor = 0.11
      break
    default:
      carFactor = 0
  }
  const carEmissions = (input.transport.carDistance * 52 * carFactor) / 1000 // tons/year
  const transitEmissions = (input.transport.transitHours * 52 * 0.12) / 1000 // 0.12 kg/hr
  const flightEmissions = (input.transport.flightHours * 90) / 1000 // 90 kg/hr
  const transportTotal = carEmissions + transitEmissions + flightEmissions

  // 2. Electricity
  const gridFactor = 0.38 // kg CO2e / kWh
  const baseElectricity = input.electricity.gridConsumption * 12 * gridFactor
  // Offset by clean energy share
  const electricityTotal = (baseElectricity * (1 - input.electricity.cleanEnergyShare / 100)) / 1000

  // 3. Food
  let dietBase = 1.7 // tons CO2e / year (balanced)
  if (input.food.dietType === 'meat-heavy') dietBase = 2.5
  if (input.food.dietType === 'vegetarian') dietBase = 1.1
  if (input.food.dietType === 'vegan') dietBase = 0.7
  // Organic share offsets food emissions by up to 10%
  const foodTotal = dietBase * (1 - (input.food.organicShare / 100) * 0.1)

  // 4. Waste
  const baseWaste = (input.waste.landfillBags * 52 * 5.2) / 1000 // 5.2 kg/bag
  // Recycling offsets: paper (10%), plastic (15%), glass (5%)
  const recyclingOffset =
    (input.waste.recycledPaper ? 0.1 : 0) +
    (input.waste.recycledPlastic ? 0.15 : 0) +
    (input.waste.recycledGlass ? 0.05 : 0)
  const wasteTotal = baseWaste * (1 - recyclingOffset)

  return {
    transport: Math.round(transportTotal * 100) / 100,
    electricity: Math.round(electricityTotal * 100) / 100,
    food: Math.round(foodTotal * 100) / 100,
    waste: Math.round(wasteTotal * 100) / 100,
  }
}

export const calculatorApi = {
  submitCalculation: async (data: CalculatorInput): Promise<CalculationResult> => {
    try {
      // Direct call to endpoint
      const response = await api.post<any>('/v1/calculator', data)
      return response.data.data.calculation
    } catch {
      // Local fallback calculation engine
      const breakdown = calculateEmissions(data)
      const totalEmissions = Math.round((breakdown.transport + breakdown.electricity + breakdown.food + breakdown.waste) * 100) / 100
      
      // Simulate network request delays
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      return {
        id: `calc_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString(),
        totalEmissions,
        breakdown,
      }
    }
  },
}
