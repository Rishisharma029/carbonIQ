export interface TransportData {
  carDistance: number
  carFuelType: 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'none'
  transitHours: number
  flightHours: number
}

export interface ElectricityData {
  gridConsumption: number
  cleanEnergyShare: number
}

export interface FoodData {
  dietType: 'meat-heavy' | 'balanced' | 'vegetarian' | 'vegan'
  organicShare: number
}

export interface WasteData {
  landfillBags: number
  recycledPaper: boolean
  recycledPlastic: boolean
  recycledGlass: boolean
}

export interface CalculatorInput {
  transport: TransportData
  electricity: ElectricityData
  food: FoodData
  waste: WasteData
}

export interface CalculationResult {
  id: string
  createdAt: string
  totalEmissions: number // in tons CO2e / year
  breakdown: {
    transport: number // tons
    electricity: number // tons
    food: number // tons
    waste: number // tons
  }
}
