import { calculationRepository } from '../repositories/calculationRepository.js'
import { summaryRepository } from '../repositories/summaryRepository.js'

export const dashboardService = {
  getMetrics: async (userId) => {
    const latest = await calculationRepository.findByUserId(userId, { limit: 5 })
    const summaries = await summaryRepository.findByUserId(userId)

    let averages = { transport: 0, electricity: 0, food: 0, waste: 0, totalEmission: 0, averageScore: 0 }

    if (summaries.length > 0) {
      const sum = summaries.reduce(
        (acc, curr) => {
          acc.transport += curr.transport
          acc.electricity += curr.electricity
          acc.food += curr.food
          acc.waste += curr.waste
          acc.totalEmission += curr.totalEmission
          acc.averageScore += curr.averageScore
          return acc
        },
        { transport: 0, electricity: 0, food: 0, waste: 0, totalEmission: 0, averageScore: 0 }
      )

      const numMonths = summaries.length
      averages = {
        transport: Math.round((sum.transport / numMonths) * 100) / 100,
        electricity: Math.round((sum.electricity / numMonths) * 100) / 100,
        food: Math.round((sum.food / numMonths) * 100) / 100,
        waste: Math.round((sum.waste / numMonths) * 100) / 100,
        totalEmission: Math.round((sum.totalEmission / numMonths) * 100) / 100,
        averageScore: Math.round((sum.averageScore / numMonths) * 100) / 100,
      }
    }

    return {
      latestCalculations: latest,
      monthlySummaries: summaries,
      averages,
    }
  },
}
export default dashboardService
