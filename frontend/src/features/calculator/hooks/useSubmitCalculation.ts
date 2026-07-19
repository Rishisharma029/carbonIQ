import { useMutation } from '@tanstack/react-query'
import { calculatorApi } from '../services/calculatorApi'
import { CalculatorInput, CalculationResult } from '../types'

export const useSubmitCalculation = () => {
  return useMutation<CalculationResult, Error, CalculatorInput>({
    mutationFn: calculatorApi.submitCalculation,
  })
}
