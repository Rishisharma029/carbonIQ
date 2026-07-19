import { api } from '@/services/api'
import { ReductionGoal, Recommendation } from '@/features/dashboard/types'

export const goalsApi = {
  getGoals: async (): Promise<ReductionGoal[]> => {
    try {
      const response = await api.get<any>('/v1/goals')
      const goals = response.data?.data?.goals || []

      return goals.map((g: any) => ({
        id: g._id,
        title: g.title,
        targetPercentage: g.baselineEmission > 0 
          ? Math.round((1 - g.targetReduction / g.baselineEmission) * 100)
          : 0,
        startValue: Math.round(g.baselineEmission * 100) / 100,
        currentValue: Math.round(g.currentEmission * 100) / 100,
        targetValue: Math.round(g.targetReduction * 100) / 100,
        deadline: new Date(g.endDate).toLocaleDateString('en-CA'),
        status: g.status === 'achieved' ? 'completed' : 'active',
      }))
    } catch {
      return []
    }
  },

  createGoal: async (
    goal: Omit<ReductionGoal, 'id' | 'currentValue' | 'status'>
  ): Promise<ReductionGoal> => {
    try {
      const payload = {
        title: goal.title,
        category: 'total',
        targetReduction: goal.targetValue,
        baselineEmission: goal.startValue,
        endDate: goal.deadline,
      }

      const response = await api.post<any>('/v1/goals', payload)
      const g = response.data?.data?.goal || {}

      return {
        id: g._id,
        title: g.title,
        targetPercentage: g.baselineEmission > 0 
          ? Math.round((1 - g.targetReduction / g.baselineEmission) * 100)
          : 0,
        startValue: g.baselineEmission,
        currentValue: g.currentEmission,
        targetValue: g.targetReduction,
        deadline: new Date(g.endDate).toLocaleDateString('en-CA'),
        status: g.status === 'achieved' ? 'completed' : 'active',
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to configure reduction target')
    }
  },

  getRecommendations: async (): Promise<Recommendation[]> => {
    try {
      const response = await api.get<any>('/v1/recommendations')
      const recs = response.data?.data?.recommendations || []

      return recs.map((r: any) => ({
        id: r.id,
        title: r.text || r.title || 'Vetted carbon offset strategy',
        category: r.category,
        description: r.description || `Adopt this ${r.category} reduction strategy to decrease your co2 footprint.`,
        potentialSaving: r.offset,
        difficulty: r.offset > 1.0 ? 'medium' : 'easy',
        implemented: !!r.implemented,
      }))
    } catch {
      return []
    }
  },

  toggleRecommendation: async (id: string): Promise<Recommendation> => {
    const response = await api.post<any>('/v1/recommendations/toggle', { id })
    const { recommendationId, implemented } = response.data?.data || {}

    const recs = await goalsApi.getRecommendations()
    const match = recs.find((r) => r.id === recommendationId)

    if (match) {
      return match
    }

    return {
      id: recommendationId,
      title: 'Actionable offset recommendation',
      category: 'electricity',
      description: 'Offset recommendation updated.',
      potentialSaving: 0.1,
      difficulty: 'easy',
      implemented,
    }
  },
}
