import { useState } from 'react'
import PageHeader from '@/shared/components/PageHeader'
import StepTracker from '../components/StepTracker'
import TransportForm from '../components/TransportForm'
import ElectricityForm from '../components/ElectricityForm'
import FoodForm from '../components/FoodForm'
import WasteForm from '../components/WasteForm'
import ReviewStep from '../components/ReviewStep'
import ResultsStep from '../components/ResultsStep'
import { useCalculatorStore } from '@/store/calculatorStore'
import { useSubmitCalculation } from '../hooks/useSubmitCalculation'
import { CalculationResult } from '../types'
import ErrorState from '@/shared/components/ErrorState'

export default function CalculatorPage() {
  const { currentStep, draftData, setStep, setDraftData, resetCalculator } = useCalculatorStore()
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null)
  const submitMutation = useSubmitCalculation()

  // Step movement handlers
  const handleTransportNext = (data: any) => {
    setDraftData({ transport: data })
    setStep(1)
  }

  const handleElectricityNext = (data: any) => {
    setDraftData({ electricity: data })
    setStep(2)
  }

  const handleFoodNext = (data: any) => {
    setDraftData({ food: data })
    setStep(3)
  }

  const handleWasteNext = (data: any) => {
    setDraftData({ waste: data })
    setStep(4)
  }

  const handleSubmit = () => {
    submitMutation.mutate(draftData, {
      onSuccess: (res) => {
        setCalculationResult(res)
        setStep(5)
      },
    })
  }

  const handleReset = () => {
    setCalculationResult(null)
    submitMutation.reset()
    resetCalculator()
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Carbon Calculator"
        description="Verify and log emissions variables across transportation, utilities, food consumption, and waste."
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Calculator' }]}
      />

      <StepTracker currentStep={currentStep} />

      {submitMutation.isError && (
        <ErrorState
          message="Failed to compute footprint emissions. Please verify your connection."
          onRetry={handleSubmit}
        />
      )}

      <div className="transition-all duration-200">
        {currentStep === 0 && (
          <TransportForm defaultValues={draftData.transport} onNext={handleTransportNext} />
        )}
        {currentStep === 1 && (
          <ElectricityForm
            defaultValues={draftData.electricity}
            onNext={handleElectricityNext}
            onBack={() => setStep(0)}
          />
        )}
        {currentStep === 2 && (
          <FoodForm
            defaultValues={draftData.food}
            onNext={handleFoodNext}
            onBack={() => setStep(1)}
          />
        )}
        {currentStep === 3 && (
          <WasteForm
            defaultValues={draftData.waste}
            onNext={handleWasteNext}
            onBack={() => setStep(2)}
          />
        )}
        {currentStep === 4 && (
          <ReviewStep
            data={draftData}
            onJumpToStep={setStep}
            onBack={() => setStep(3)}
            onSubmit={handleSubmit}
            isSubmitting={submitMutation.isPending}
          />
        )}
        {currentStep === 5 && calculationResult && (
          <ResultsStep result={calculationResult} onReset={handleReset} />
        )}
      </div>
    </div>
  )
}
