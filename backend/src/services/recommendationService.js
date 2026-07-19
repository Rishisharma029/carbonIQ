import { userRepository } from '../repositories/userRepository.js'
import { goalRepository } from '../repositories/goalRepository.js'
import { NotFoundError } from '../errors/customErrors.js'

const recommendations = [
  { id: 'rec_1', text: 'Switch to LED lightbulbs', category: 'electricity', offset: 0.1 },
  { id: 'rec_2', text: 'Install smart thermostat', category: 'electricity', offset: 0.2 },
  { id: 'rec_3', text: 'Use public transit weekly', category: 'transport', offset: 0.5 },
  { id: 'rec_4', text: 'Transition to electric vehicle', category: 'transport', offset: 1.5 },
  { id: 'rec_5', text: 'Adopt a plant-based diet', category: 'food', offset: 0.8 },
  { id: 'rec_6', text: 'Implement full recycling', category: 'waste', offset: 0.1 },
]

export const recommendationService = {
  getRecommendations: async (userId) => {
    const user = await userRepository.findById(userId)
    if (!user) throw new NotFoundError('User not found')

    const implementedSet = new Set(user.implementedRecommendations || [])
    return recommendations.map((r) => ({
      ...r,
      implemented: implementedSet.has(r.id),
    }))
  },

  toggleRecommendation: async (userId, recommendationId) => {
    const user = await userRepository.findById(userId)
    if (!user) throw new NotFoundError('User not found')

    const rec = recommendations.find((r) => r.id === recommendationId)
    if (!rec) throw new NotFoundError('Recommendation not found')

    const implementedList = user.implementedRecommendations || []
    const isImplemented = implementedList.includes(recommendationId)

    let offsetDirection = 1
    if (isImplemented) {
      user.implementedRecommendations = implementedList.filter((id) => id !== recommendationId)
      offsetDirection = -1
    } else {
      user.implementedRecommendations.push(recommendationId)
      offsetDirection = 1
    }

    await user.save()

    const activeGoals = await goalRepository.findAllActive(userId)
    for (const goal of activeGoals) {
      if (goal.category === 'total' || goal.category === rec.category) {
        const change = rec.offset * offsetDirection
        const newCurrent = Math.max(0, goal.currentEmission - change)
        const progress =
          goal.baselineEmission > 0
            ? Math.round(Math.max(0, Math.min(100, (1 - newCurrent / goal.baselineEmission) * 100)) * 100) / 100
            : 0
        const status = newCurrent <= goal.targetReduction ? 'achieved' : 'active'
        await goalRepository.updateForUser(userId, goal._id, { currentEmission: newCurrent, progress, status })
      }
    }

    return {
      recommendationId,
      implemented: !isImplemented,
    }
  },
}
export default recommendationService
