import { api } from '@/services/api'
import { DashboardData } from '../types'

export const dashboardApi = {
  getDashboardData: async (): Promise<DashboardData> => {
    // 1. Fetch dashboard metrics, goals, and recommendations concurrently
    //    Goals and recommendations failures are soft — we degrade gracefully
    const [dashRes, goalsRes, recsRes] = await Promise.all([
      api.get('/v1/dashboard'),
      api.get('/v1/goals').catch(() => ({ data: { data: { goals: [] } } })),
      api.get('/v1/recommendations').catch(() => ({ data: { data: { recommendations: [] } } })),
    ])

    const dashData = dashRes.data?.data || {}
    const latestCalculations = dashData.latestCalculations || []
    const monthlySummaries = dashData.monthlySummaries || []

    // Goals can come back as { goals: [...] } or as a raw array
    const goalsRaw = goalsRes.data?.data?.goals || goalsRes.data?.data || []
    const goalsList = Array.isArray(goalsRaw) ? goalsRaw : []
    const activeGoals = goalsList.filter((g: any) => g.status === 'active' || g.status === 'in-progress' || g.status === 'achieved')
    const completedGoalsCount = goalsList.filter((g: any) => g.status === 'achieved' || g.status === 'completed').length

    const recsList = recsRes.data?.data?.recommendations || []
    // Map recommendations to match frontend format
    const recommendations = recsList.map((r: any) => ({
      id: r.id,
      title: r.text || r.title || 'Vetted carbon offset strategy',
      category: r.category,
      description: r.description || `Adopt this ${r.category} reduction strategy to decrease your co2 footprint.`,
      potentialSaving: r.offset,
      difficulty: r.offset > 1.0 ? 'medium' : 'easy',
      implemented: !!r.implemented,
    }))

    // 2. Perform real data analysis on latest calculation
    const latestCalc = latestCalculations[0]
    let totalEmissions = 0
    let highestCategory = 'None'
    const categoryDistribution = [
      { name: 'Transportation', value: 0 },
      { name: 'Electricity', value: 0 },
      { name: 'Food', value: 0 },
      { name: 'Waste', value: 0 },
    ]

    if (latestCalc) {
      totalEmissions = latestCalc.results?.totalEmission || 0

      const transport = latestCalc.results?.transportEmission || 0
      const electricity = latestCalc.results?.electricityEmission || 0
      const food = latestCalc.results?.foodEmission || 0
      const waste = latestCalc.results?.wasteEmission || 0

      categoryDistribution[0].value = Math.round(transport * 100) / 100
      categoryDistribution[1].value = Math.round(electricity * 100) / 100
      categoryDistribution[2].value = Math.round(food * 100) / 100
      categoryDistribution[3].value = Math.round(waste * 100) / 100

      const maxVal = Math.max(transport, electricity, food, waste)
      if (maxVal > 0) {
        if (maxVal === transport) highestCategory = 'Transportation'
        else if (maxVal === electricity) highestCategory = 'Electricity'
        else if (maxVal === food) highestCategory = 'Food'
        else if (maxVal === waste) highestCategory = 'Waste'
      }
    }

    // 3. Compute emissions trend
    let emissionsTrend: { month: string; co2e: number }[] = []
    if (monthlySummaries.length > 0) {
      const sortedSummaries = [...monthlySummaries].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.month - b.month
      })
      emissionsTrend = sortedSummaries.map((s: any) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return {
          month: monthNames[s.month - 1] || `${s.month}`,
          co2e: Math.round(s.totalEmission * 1000), // convert to kg for trend area chart
        }
      })
    } else if (latestCalculations.length > 0) {
      // Fallback trend line from calculations if summaries are empty
      const sortedCalcs = [...latestCalculations].reverse()
      emissionsTrend = sortedCalcs.map((c: any) => {
        const date = new Date(c.createdAt)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return {
          month: monthNames[date.getMonth()],
          co2e: Math.round((c.results?.totalEmission || 0) * 1000),
        }
      })
    }

    if (emissionsTrend.length === 0) {
      emissionsTrend = [
        { month: 'Jan', co2e: 0 },
        { month: 'Feb', co2e: 0 },
        { month: 'Mar', co2e: 0 },
        { month: 'Apr', co2e: 0 },
        { month: 'May', co2e: 0 },
        { month: 'Jun', co2e: 0 },
      ]
    }

    // 4. Compute monthly average (in kg)
    let monthlyAverage = 0
    if (monthlySummaries.length > 0) {
      const sum = monthlySummaries.reduce((acc: number, curr: any) => acc + curr.totalEmission, 0)
      monthlyAverage = Math.round((sum / monthlySummaries.length) * 1000)
    } else if (latestCalc) {
      monthlyAverage = Math.round((totalEmissions / 12) * 1000)
    }

    // 5. Recent history table mapping — safe fallback for null results
    const recentHistory = latestCalculations.map((c: any) => ({
      id: c._id,
      date: new Date(c.createdAt).toLocaleDateString('en-CA'),
      total: Math.round((c.results?.totalEmission || 0) * 100) / 100,
      transport: Math.round((c.results?.transportEmission || 0) * 100) / 100,
      electricity: Math.round((c.results?.electricityEmission || 0) * 100) / 100,
      food: Math.round((c.results?.foodEmission || 0) * 100) / 100,
      waste: Math.round((c.results?.wasteEmission || 0) * 100) / 100,
    }))

    // 6. Map active goals from the goals API response to the ReductionGoal interface
    const mappedActiveGoals = activeGoals.map((g: any) => ({
      id: g._id || g.id,
      title: g.title,
      targetPercentage: g.baselineEmission > 0
        ? Math.round((1 - g.targetReduction / g.baselineEmission) * 100)
        : 0,
      startValue: Math.round((g.baselineEmission || 0) * 100) / 100,
      currentValue: Math.round((g.currentEmission || 0) * 100) / 100,
      targetValue: Math.round((g.targetReduction || 0) * 100) / 100,
      deadline: g.endDate ? new Date(g.endDate).toLocaleDateString('en-CA') : '',
      status: (g.status === 'achieved' ? 'completed' : 'active') as 'active' | 'completed' | 'abandoned',
    }))

    return {
      totalEmissions: Math.round(totalEmissions * 100) / 100,
      monthlyAverage,
      highestCategory,
      completedGoalsCount,
      emissionsTrend,
      categoryDistribution,
      recentHistory,
      activeGoals: mappedActiveGoals,
      recommendations,
    }
  },
}
