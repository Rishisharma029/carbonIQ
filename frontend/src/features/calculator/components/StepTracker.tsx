import { Leaf, Zap, Apple, Trash2, ShieldCheck, Award } from 'lucide-react'

export interface StepTrackerProps {
  currentStep: number
}

const steps = [
  { label: 'Transportation', icon: Leaf },
  { label: 'Electricity', icon: Zap },
  { label: 'Food', icon: Apple },
  { label: 'Waste', icon: Trash2 },
  { label: 'Review', icon: ShieldCheck },
  { label: 'Results', icon: Award },
]

export default function StepTracker({ currentStep }: StepTrackerProps) {
  return (
    <div className="w-full py-4 border-b border-border bg-card/30 mb-8 rounded-xl px-4 overflow-x-auto scrollbar-none">
      <div className="flex items-center justify-between min-w-[500px] max-w-3xl mx-auto">
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isActive = currentStep === idx
          const isCompleted = currentStep > idx

          return (
            <div key={idx} className="flex items-center flex-1 last:flex-initial">
              {/* Step Bubble */}
              <div className="flex flex-col items-center gap-1.5 relative">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200
                    ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary font-bold scale-110 shadow-xs'
                        : ''
                    }
                    ${isCompleted ? 'border-primary bg-primary text-primary-foreground' : ''}
                    ${!isActive && !isCompleted ? 'border-border bg-card text-muted-foreground' : ''}
                  `}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-tight whitespace-nowrap
                    ${isActive ? 'text-primary' : 'text-muted-foreground'}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line */}
              {idx < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-4 bg-border relative -mt-3.5">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
