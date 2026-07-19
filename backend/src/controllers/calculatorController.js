import { calculatorService } from '../services/calculatorService.js'
import { calculatorSchema } from '../validators/calculatorValidator.js'
import { ValidationError } from '../errors/customErrors.js'

export const calculatorController = {
  createCalculation: async (req, res, next) => {
    try {
      const validate = calculatorSchema.safeParse(req.body)
      if (!validate.success) {
        const error = new ValidationError('Invalid calculator inputs')
        error.errors = validate.error.format()
        throw error
      }

      const calculation = await calculatorService.calculateAndSave(req.user.id, validate.data)

      res.status(201).json({
        status: 'success',
        message: 'Calculation completed and logged successfully',
        data: { calculation },
      })
    } catch (error) {
      next(error)
    }
  },
}
export default calculatorController
