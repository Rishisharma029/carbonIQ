import { describe, it, expect, beforeEach } from 'vitest'
import { useCalculatorStore } from '../calculatorStore'

describe('Calculator Store', () => {
  beforeEach(() => {
    useCalculatorStore.getState().resetCalculator()
  })

  it('should initialise with step 0 and default data', () => {
    const { currentStep, draftData } = useCalculatorStore.getState()
    expect(currentStep).toBe(0)
    expect(draftData.transport.carDistance).toBe(0)
    expect(draftData.electricity.gridConsumption).toBe(0)
  })

  it('should transition steps', () => {
    const { setStep } = useCalculatorStore.getState()
    setStep(2)
    expect(useCalculatorStore.getState().currentStep).toBe(2)
  })

  it('should update draft data and merge state', () => {
    const { setDraftData } = useCalculatorStore.getState()
    setDraftData({
      transport: {
        carDistance: 150,
        carFuelType: 'hybrid',
        transitHours: 2,
        flightHours: 5,
      },
    })

    const state = useCalculatorStore.getState()
    expect(state.draftData.transport.carDistance).toBe(150)
    expect(state.draftData.transport.carFuelType).toBe('hybrid')
    expect(state.draftData.electricity.gridConsumption).toBe(0)
  })

  it('should reset store back to initial parameters', () => {
    const { setStep, setDraftData, resetCalculator } = useCalculatorStore.getState()
    setStep(3)
    setDraftData({
      electricity: {
        gridConsumption: 400,
        cleanEnergyShare: 30,
      },
    })

    resetCalculator()
    const state = useCalculatorStore.getState()
    expect(state.currentStep).toBe(0)
    expect(state.draftData.electricity.gridConsumption).toBe(0)
  })
})
