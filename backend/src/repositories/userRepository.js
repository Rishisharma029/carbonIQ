import { User } from '../models/User.js'

export const userRepository = {
  create: async (data) => {
    return User.create(data)
  },
  findByEmail: async (email) => {
    return User.findOne({ email, deletedAt: null }).select('+passwordHash')
  },
  findById: async (id) => {
    return User.findOne({ _id: id, deletedAt: null })
  },
  update: async (id, updateData) => {
    return User.findOneAndUpdate({ _id: id, deletedAt: null }, updateData, {
      new: true,
      runValidators: true,
    })
  },
}
export default userRepository
