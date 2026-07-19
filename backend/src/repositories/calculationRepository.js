import { Calculation } from '../models/Calculation.js'

const resolveSort = (sort) => {
  if (!sort) return { createdAt: -1 }
  if (sort.totalEmission) return { 'results.totalEmission': sort.totalEmission }
  return sort
}

export const calculationRepository = {
  create: async (data, session) => {
    const options = session ? { session } : {}
    const calculation = new Calculation(data)
    await calculation.save(options)
    return calculation
  },
  findByIdForUser: async (userId, id, session) => {
    const options = session ? { session } : {}
    return Calculation.findOne({ _id: id, userId, deletedAt: null }, null, options)
  },
  findByUserId: async (userId, options = {}) => {
    const { limit = 10, skip = 0, sort = { createdAt: -1 }, filter = {}, session } = options
    const queryOptions = session ? { session } : {}
    return Calculation.find({ userId, deletedAt: null, ...filter }, null, queryOptions)
      .sort(resolveSort(sort))
      .skip(skip)
      .limit(limit)
  },
  countByUserId: async (userId, filter = {}) => {
    return Calculation.countDocuments({ userId, deletedAt: null, ...filter })
  },
  softDeleteForUser: async (userId, id, session) => {
    const options = session ? { session } : {}
    return Calculation.findOneAndUpdate(
      { _id: id, userId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true, ...options }
    )
  },
}
export default calculationRepository
