import { userRepository } from '../repositories/userRepository.js'
import { updateProfileSchema, updateSettingsSchema } from '../validators/userValidator.js'
import { ValidationError } from '../errors/customErrors.js'

export const userController = {
  getMe: async (req, res, next) => {
    try {
      res.status(200).json({
        status: 'success',
        data: { user: req.user },
      })
    } catch (error) {
      next(error)
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const validate = updateProfileSchema.safeParse(req.body)
      if (!validate.success) {
        const error = new ValidationError('Invalid profile updates')
        error.errors = validate.error.format()
        throw error
      }

      const updated = await userRepository.update(req.user.id, validate.data)

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: { user: updated },
      })
    } catch (error) {
      next(error)
    }
  },

  updateSettings: async (req, res, next) => {
    try {
      const validate = updateSettingsSchema.safeParse(req.body)
      if (!validate.success) {
        const error = new ValidationError('Invalid settings updates')
        error.errors = validate.error.format()
        throw error
      }

      const updated = await userRepository.update(req.user.id, validate.data)

      res.status(200).json({
        status: 'success',
        message: 'Settings updated successfully',
        data: { user: updated },
      })
    } catch (error) {
      next(error)
    }
  },
}
export default userController
