import { historyService } from '../services/historyService.js'

export const historyController = {
  getHistory: async (req, res, next) => {
    try {
      const history = await historyService.getHistory(req.user.id, req.validated.query)

      res.status(200).json({
        status: 'success',
        data: history,
      })
    } catch (error) {
      next(error)
    }
  },

  deleteEntry: async (req, res, next) => {
    try {
      await historyService.deleteEntry(req.user.id, req.validated.params.id)

      res.status(200).json({
        status: 'success',
        message: 'Calculation entry deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  },
}
export default historyController
