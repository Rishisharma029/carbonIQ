import { Report } from '../models/Report.js'

export const reportRepository = {
  createForUser: async (userId, data) => {
    return Report.create({
      userId,
      ...data,
    })
  },
  findByUserId: async (userId, options = {}) => {
    const { limit = 50, skip = 0, sort = { generatedAt: -1 } } = options
    return Report.find({ userId }).sort(sort).skip(skip).limit(limit)
  },
  findByIdForUser: async (userId, id) => {
    return Report.findOne({ _id: id, userId })
  },
}

export default reportRepository
