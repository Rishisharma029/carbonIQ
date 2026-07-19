import { create } from 'zustand'
import { CalculatorInput } from '@/features/calculator/types'

interface CalculatorState {
  currentStep: number
  draftData: CalculatorInput
  setStep: (step: number) => void
  setDraftData: (data: Partial<CalculatorInput>) => void
  resetCalculator: () => void
}

const initialDraftData: CalculatorInput = {
  transport: {
    carDistance: 0,
    carFuelType: 'none',
    transitHours: 0,
    flightHours: 0,
  },
  electricity: {
    gridConsumption: 0,
    cleanEnergyShare: 0,
  },
  food: {
    dietType: 'balanced',
    organicShare: 0,
  },
  waste: {
    landfillBags: 0,
    recycledPaper: false,
    recycledPlastic: false,
    recycledGlass: false,
  },
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  currentStep: 0,
  draftData: initialDraftData,
  setStep: (currentStep) => set({ currentStep }),
  setDraftData: (data) =>
    set((state) => ({
      draftData: {
        ...state.draftData,
        ...data,
      },
    })),
  resetCalculator: () =>
    set({
      currentStep: 0,
      draftData: initialDraftData,
    }),
}))
