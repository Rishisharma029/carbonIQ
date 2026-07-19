import { goalRepository } from '../repositories/goalRepository.js'
import { calculationRepository } from '../repositories/calculationRepository.js'

const computeProgress = (baselineEmission, currentEmission) => {
  if (!baselineEmission || baselineEmission <= 0) return 0
  const raw = (1 - currentEmission / baselineEmission) * 100
  return Math.round(Math.max(0, Math.min(100, raw)) * 100) / 100
}

const getCategoryEmission = (results, category) => {
  if (category === 'total') return results.totalEmission
  return results[`${category}Emission`] || 0
}

export const goalService = {
  createGoal: async (userId, data) => {
    const latest = await calculationRepository.findByUserId(userId, { limit: 1 })
    let currentEmission = 0
    if (latest.length > 0) {
      currentEmission = getCategoryEmission(latest[0].results, data.category)
    }

    const baselineEmission = data.baselineEmission ?? currentEmission
    const progress = computeProgress(baselineEmission, currentEmission)
    const status = currentEmission <= data.targetReduction ? 'achieved' : 'active'

    const goal = await goalRepository.create({
      userId,
      title: data.title,
      category: data.category,
      targetReduction: data.targetReduction,
      baselineEmission,
      currentEmission,
      progress,
      endDate: new Date(data.endDate),
      status,
    })
    return goal
  },

  syncGoalsOnCalculation: async (userId, results, session) => {
    const activeGoals = await goalRepository.findAllActive(userId, session)
    for (const goal of activeGoals) {
      const newCurrent = getCategoryEmission(results, goal.category)
      const progress = computeProgress(goal.baselineEmission, newCurrent)
      const status = newCurrent <= goal.targetReduction ? 'achieved' : 'active'
      await goalRepository.updateForUser(userId, goal._id, { currentEmission: newCurrent, progress, status }, session)
    }
  },

  syncGoalsOnDeletion: async (userId, session) => {
    const latest = await calculationRepository.findByUserId(userId, { limit: 1 })
    const nextCalc = latest.length > 0 ? latest[0] : null

    const goals = await goalRepository.findByUserId(userId)
    for (const goal of goals) {
      if (goal.status === 'active' || goal.status === 'achieved') {
        const newCurrent = nextCalc ? getCategoryEmission(nextCalc.results, goal.category) : 0
        const progress = computeProgress(goal.baselineEmission, newCurrent)
        const status = newCurrent <= goal.targetReduction ? 'achieved' : 'active'
        await goalRepository.updateForUser(userId, goal._id, { currentEmission: newCurrent, progress, status }, session)
      }
    }
  },
}
export default goalService
