import { CalculatorInput } from '../types'
import Button from '@/shared/components/Button'
import { Card, CardContent } from '@/shared/components/Card'
import { Leaf, Zap, Apple, Trash2 } from 'lucide-react'

interface ReviewStepProps {
  data: CalculatorInput
  onJumpToStep: (stepIdx: number) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

export default function ReviewStep({
  data,
  onJumpToStep,
  onSubmit,
  onBack,
  isSubmitting,
}: ReviewStepProps) {
  return (
    <div className="space-y-6 bg-card border border-border p-6 rounded-xl">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Review Inputs</h2>
        <p className="text-xs text-muted-foreground">
          Verify your entered information before submitting the assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Section 1: Transportation */}
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Leaf className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <h4 className="font-bold text-foreground">Transportation</h4>
                <p className="text-muted-foreground">
                  Car distance: {data.transport.carDistance} miles/week (
                  {data.transport.carFuelType}) | Transit: {data.transport.transitHours} hrs/week |
                  Flights: {data.transport.flightHours} hrs/year
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onJumpToStep(0)}>
              Edit
            </Button>
          </CardContent>
        </Card>

        {/* Section 2: Electricity */}
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <h4 className="font-bold text-foreground">Electricity</h4>
                <p className="text-muted-foreground">
                  Grid usage: {data.electricity.gridConsumption} kWh/month | Green energy:{' '}
                  {data.electricity.cleanEnergyShare}%
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onJumpToStep(1)}>
              Edit
            </Button>
          </CardContent>
        </Card>

        {/* Section 3: Food */}
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Apple className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <h4 className="font-bold text-foreground">Food & Diet</h4>
                <p className="text-muted-foreground">
                  Diet: {data.food.dietType} | Local/Organic share: {data.food.organicShare}%
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onJumpToStep(2)}>
              Edit
            </Button>
          </CardContent>
        </Card>

        {/* Section 4: Waste */}
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <h4 className="font-bold text-foreground">Waste & Recycling</h4>
                <p className="text-muted-foreground">
                  Trash bags: {data.waste.landfillBags}/week | Recycles:{' '}
                  {[
                    data.waste.recycledPaper && 'Paper',
                    data.waste.recycledPlastic && 'Plastic',
                    data.waste.recycledGlass && 'Glass',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'None'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onJumpToStep(3)}>
              Edit
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onSubmit} isLoading={isSubmitting}>
          Calculate Total Footprint
        </Button>
      </div>
    </div>
  )
}
