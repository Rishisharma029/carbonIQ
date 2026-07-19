import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PageHeader from '@/shared/components/PageHeader'
import Skeleton from '@/shared/components/Skeleton'
import ErrorState from '@/shared/components/ErrorState'
import Button from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card'
import Badge from '@/shared/components/Badge'
import {
  useGoalsQuery,
  useCreateGoalMutation,
  useRecommendationsQuery,
  useToggleRecommendationMutation,
} from '../hooks/useGoals'
import { Leaf, Zap, Apple, Trash2, Award, Calendar, Check, CircleAlert, Target } from 'lucide-react'

// Schema for goal creation form validation
const goalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  targetPercentage: z.number().min(1, 'Target percentage must be at least 1%').max(100),
  startValue: z.number().min(0.1, 'Current annual footprint must be greater than 0'),
  deadline: z.string().min(1, 'Deadline date is required'),
})

type GoalFormValues = z.infer<typeof goalSchema>

const icons = {
  transport: Leaf,
  electricity: Zap,
  food: Apple,
  waste: Trash2,
}

export default function GoalsPage() {
  const { data: goals, isLoading: goalsLoading, isError: goalsError, refetch: refetchGoals } = useGoalsQuery()
  const { data: recs, isLoading: recsLoading, isError: recsError, refetch: refetchRecs } = useRecommendationsQuery()

  const createGoalMutation = useCreateGoalMutation()
  const toggleMutation = useToggleRecommendationMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: '',
      targetPercentage: 15,
      startValue: 8.4,
      deadline: '2026-12-31',
    },
  })

  const onSubmitGoal = (data: GoalFormValues) => {
    // Target Value = Start Value * (1 - Target Percentage / 100)
    const targetValue = Math.round(data.startValue * (1 - data.targetPercentage / 100) * 100) / 100
    createGoalMutation.mutate(
      {
        title: data.title,
        targetPercentage: data.targetPercentage,
        startValue: data.startValue,
        targetValue,
        deadline: data.deadline,
      },
      {
        onSuccess: () => {
          reset()
        },
      }
    )
  }

  const isLoading = goalsLoading || recsLoading
  const isError = goalsError || recsError

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reduction Goals" description="Loading carbon targets..." />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Goals"
        message="An error occurred retrieval goals and recommendations databases."
        onRetry={() => {
          refetchGoals()
          refetchRecs()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reduction Goals"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Goals' }]}
        description="Set new emissions limits, toggle verified mitigation actions, and check progress."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active goals list */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Target className="w-5 h-5 text-primary" />
                <span>Active Targets</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {goals && goals.length > 0 ? (
                goals.map((goal) => {
                  const totalReductionNeeded = goal.startValue - goal.targetValue
                  const currentReductionDone = goal.startValue - goal.currentValue

                  let progress = 0
                  if (totalReductionNeeded > 0) {
                    progress = Math.round((currentReductionDone / totalReductionNeeded) * 100)
                    progress = Math.max(0, Math.min(100, progress))
                  }

                  return (
                    <div key={goal.id} className="p-4 border border-border bg-card/40 rounded-xl space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-foreground leading-tight">
                            {goal.title} ({goal.targetPercentage}% Reduction)
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Deadline: {goal.deadline}</span>
                          </div>
                        </div>
                        <span className="text-sm font-extrabold text-primary">{progress}% Met</span>
                      </div>

                      <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
                        <span>Baseline: {goal.startValue} tons</span>
                        <span>Current: {goal.currentValue} tons</span>
                        <span>Target Limit: {goal.targetValue} tons</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground font-medium">
                  No active goals set. Fill out the target form to get started.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vetted actions toggle list */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Award className="w-5 h-5 text-primary" />
                <span>Verify Mitigation Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recs && recs.length > 0 ? (
                recs.map((rec) => {
                  const Icon = icons[rec.category] || Award
                  return (
                    <div
                      key={rec.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl transition-all duration-150
                        ${
                          rec.implemented
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border/60 bg-card hover:bg-muted/10'
                        }
                      `}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`p-2 rounded-lg h-fit ${
                            rec.implemented ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-foreground">{rec.title}</h5>
                            <Badge
                              variant={
                                rec.difficulty === 'easy'
                                  ? 'success'
                                  : rec.difficulty === 'medium'
                                    ? 'warning'
                                    : 'danger'
                              }
                            >
                              {rec.difficulty}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed max-w-lg">
                            {rec.description}
                          </p>
                          <span className="font-bold text-primary block mt-1">
                            Potential Savings: -{rec.potentialSaving} tons CO2e / yr
                          </span>
                        </div>
                      </div>

                      <Button
                        variant={rec.implemented ? 'primary' : 'outline'}
                        size="sm"
                        leftIcon={rec.implemented ? <Check className="w-4 h-4" /> : undefined}
                        onClick={() => toggleMutation.mutate(rec.id)}
                        isLoading={toggleMutation.isPending && toggleMutation.variables === rec.id}
                        className="cursor-pointer font-bold w-full sm:w-auto"
                      >
                        {rec.implemented ? 'Implemented' : 'Mark Active'}
                      </Button>
                    </div>
                  )
                })
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No recommendations found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Set goal form sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <CircleAlert className="w-5 h-5 text-primary" />
                <span>Add Goal Target</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitGoal)} className="space-y-4">
                <Input
                  id="title"
                  label="Goal Title"
                  placeholder="e.g. Save 20% on grid utilities"
                  error={errors.title?.message}
                  {...register('title')}
                />

                <Input
                  id="targetPercentage"
                  label="Target Reduction Percentage (%)"
                  type="number"
                  error={errors.targetPercentage?.message}
                  {...register('targetPercentage', { valueAsNumber: true })}
                />

                <Input
                  id="startValue"
                  label="Baseline Annual Footprint (tons)"
                  type="number"
                  step="0.1"
                  error={errors.startValue?.message}
                  {...register('startValue', { valueAsNumber: true })}
                />

                <Input
                  id="deadline"
                  label="Target Deadline"
                  type="date"
                  error={errors.deadline?.message}
                  {...register('deadline')}
                />

                <Button
                  type="submit"
                  className="w-full font-bold cursor-pointer mt-2"
                  isLoading={createGoalMutation.isPending}
                >
                  Create Goal Limit
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
