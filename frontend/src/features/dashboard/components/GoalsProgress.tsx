import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card'
import { ReductionGoal } from '../types'
import { Target, Calendar } from 'lucide-react'

interface GoalsProgressProps {
  goals: ReductionGoal[]
}

export default function GoalsProgress({ goals }: GoalsProgressProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
          <Target className="w-5 h-5 text-primary" />
          <span>Active Goals</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {goals.length > 0 ? (
          goals.map((goal) => {
            const totalReductionNeeded = goal.startValue - goal.targetValue
            const currentReductionDone = goal.startValue - goal.currentValue

            let progress = 0
            if (totalReductionNeeded > 0) {
              progress = Math.round((currentReductionDone / totalReductionNeeded) * 100)
              progress = Math.max(0, Math.min(100, progress))
            }

            return (
              <div key={goal.id} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground leading-tight">{goal.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Deadline: {goal.deadline}</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-primary">{progress}%</span>
                </div>

                {/* Custom Progress bar */}
                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>Start: {goal.startValue} t</span>
                  <span>Current: {goal.currentValue} t</span>
                  <span>Target: {goal.targetValue} t</span>
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">No active reduction goals.</p>
        )}
      </CardContent>
    </Card>
  )
}
