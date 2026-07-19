export interface HistoryEntry {
  id: string
  date: string
  total: number
  transport: number
  electricity: number
  food: number
  waste: number
}

export interface ReductionGoal {
  id: string
  title: string
  targetPercentage: number
  startValue: number // tons CO2e / year
  currentValue: number // tons CO2e / year
  targetValue: number // tons CO2e / year
  deadline: string
  status: 'active' | 'completed' | 'abandoned'
}

export interface Recommendation {
  id: string
  title: string
  category: 'transport' | 'electricity' | 'food' | 'waste'
  description: string
  potentialSaving: number // tons CO2e / year
  difficulty: 'easy' | 'medium' | 'hard'
  implemented: boolean
}

export interface DashboardData {
  totalEmissions: number // annual tons CO2e
  monthlyAverage: number // monthly kg CO2e
  highestCategory: string
  completedGoalsCount: number
  emissionsTrend: { month: string; co2e: number }[]
  categoryDistribution: { name: string; value: number }[]
  recentHistory: HistoryEntry[]
  activeGoals: ReductionGoal[]
  recommendations: Recommendation[]
}
