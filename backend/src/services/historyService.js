import mongoose from 'mongoose'
import { calculationRepository } from '../repositories/calculationRepository.js'
import { summaryRepository } from '../repositories/summaryRepository.js'
import { goalService } from './goalService.js'
import { NotFoundError } from '../errors/customErrors.js'

const buildHistoryFilter = (filters) => {
  const queryFilter = {}

  if (filters.category) {
    queryFilter[`results.${filters.category}Emission`] = { $gt: 0 }
  }

  if (filters.from || filters.to) {
    queryFilter.createdAt = {}
    if (filters.from) queryFilter.createdAt.$gte = new Date(filters.from)
    if (filters.to) queryFilter.createdAt.$lte = new Date(filters.to)
  }

  return queryFilter
}

const resolveSort = (sortBy, sortOrder) => {
  const direction = sortOrder === 'asc' ? 1 : -1
  if (sortBy === 'totalEmission') return { totalEmission: direction }
  return { [sortBy]: direction }
}

export const historyService = {
  getHistory: async (userId, filters) => {
    const page = filters.page || 1
    const limit = filters.limit || 10
    const skip = (page - 1) * limit
    const filter = buildHistoryFilter(filters)
    const sort = resolveSort(filters.sortBy || 'createdAt', filters.sortOrder || 'desc')

    const calculations = await calculationRepository.findByUserId(userId, {
      limit,
      skip,
      sort,
      filter,
    })
    const total = await calculationRepository.countByUserId(userId, filter)

    return {
      calculations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  },

  deleteEntry: async (userId, calculationId) => {
    const calc = await calculationRepository.findByIdForUser(userId, calculationId)
    if (!calc) {
      throw new NotFoundError('Calculation entry not found')
    }

    let session = null
    try {
      session = await mongoose.startSession()
      session.startTransaction()
    } catch {
      session = null
    }

    try {
      const deleted = await calculationRepository.softDeleteForUser(userId, calculationId, session)
      if (!deleted) {
        throw new NotFoundError('Calculation entry not found')
      }

      const calcDate = new Date(calc.createdAt)
      const year = calcDate.getUTCFullYear()
      const month = calcDate.getUTCMonth() + 1
      await summaryRepository.decrementSummary(userId, year, month, calc.results, calc.score, session)

      await goalService.syncGoalsOnDeletion(userId, session)

      if (session) {
        await session.commitTransaction()
      }
    } catch (error) {
      if (session) {
        await session.abortTransaction()
      }
      throw error
    } finally {
      if (session) {
        session.endSession()
      }
    }
  },
}
export default historyService
