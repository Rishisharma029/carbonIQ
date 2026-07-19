import { Goal } from '../models/Goal.js'

export const goalRepository = {
  create: async (data) => {
    return Goal.create(data)
  },
  findByUserId: async (userId) => {
    return Goal.find({ userId }).sort({ createdAt: -1 })
  },
  findActiveByCategory: async (userId, category, session) => {
    const options = session ? { session } : {}
    return Goal.find({ userId, category, status: 'active' }, null, options)
  },
  findAllActive: async (userId, session) => {
    const options = session ? { session } : {}
    return Goal.find({ userId, status: 'active' }, null, options)
  },
  updateForUser: async (userId, id, updateData, session) => {
    const options = session ? { session } : {}
    return Goal.findOneAndUpdate({ _id: id, userId }, updateData, {
      new: true,
      runValidators: true,
      ...options,
    })
  },
}
export default goalRepository
