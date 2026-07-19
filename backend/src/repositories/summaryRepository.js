import { MonthlySummary } from '../models/MonthlySummary.js'

export const summaryRepository = {
  incrementSummary: async (userId, year, month, results, score, session) => {
    const options = session ? { session } : {}
    const scoreInc = score || 0
    return MonthlySummary.findOneAndUpdate(
      { userId, year, month },
      {
        $inc: {
          transport: results.transportEmission,
          electricity: results.electricityEmission,
          food: results.foodEmission,
          waste: results.wasteEmission,
          totalEmission: results.totalEmission,
          averageScore: scoreInc,
          calculationCount: 1,
        },
        $setOnInsert: { userId, year, month },
      },
      { upsert: true, new: true, ...options }
    )
  },

  decrementSummary: async (userId, year, month, results, score, session) => {
    const options = session ? { session } : {}
    const scoreInc = score || 0
    return MonthlySummary.findOneAndUpdate(
      { userId, year, month },
      {
        $inc: {
          transport: -results.transportEmission,
          electricity: -results.electricityEmission,
          food: -results.foodEmission,
          waste: -results.wasteEmission,
          totalEmission: -results.totalEmission,
          averageScore: -scoreInc,
          calculationCount: -1,
        },
      },
      { new: true, ...options }
    )
  },

  findByUserId: async (userId) => {
    return MonthlySummary.find({ userId }).sort({ year: -1, month: -1 })
  },
}
export default summaryRepository
