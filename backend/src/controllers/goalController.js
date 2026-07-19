import { goalService } from '../services/goalService.js'
import { goalRepository } from '../repositories/goalRepository.js'
import { createGoalSchema } from '../validators/goalValidator.js'
import { ValidationError } from '../errors/customErrors.js'

export const goalController = {
  getGoals: async (req, res, next) => {
    try {
      const goals = await goalRepository.findByUserId(req.user.id)
      res.status(200).json({
        status: 'success',
        data: { goals },
      })
    } catch (error) {
      next(error)
    }
  },

  createGoal: async (req, res, next) => {
    try {
      const validate = createGoalSchema.safeParse(req.body)
      if (!validate.success) {
        const error = new ValidationError('Invalid goal configuration')
        error.errors = validate.error.format()
        throw error
      }

      const goal = await goalService.createGoal(req.user.id, validate.data)

      res.status(201).json({
        status: 'success',
        message: 'Reduction target configured successfully',
        data: { goal },
      })
    } catch (error) {
      next(error)
    }
  },
}
export default goalController
