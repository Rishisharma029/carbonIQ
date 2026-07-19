import { recommendationService } from '../services/recommendationService.js'

export const recommendationController = {
  getRecommendations: async (req, res, next) => {
    try {
      const recs = await recommendationService.getRecommendations(req.user.id)
      res.status(200).json({
        status: 'success',
        data: { recommendations: recs },
      })
    } catch (error) {
      next(error)
    }
  },

  toggleRecommendation: async (req, res, next) => {
    try {
      const { id } = req.body
      if (!id) {
        return res.status(400).json({
          status: 'fail',
          message: 'Recommendation ID is required',
        })
      }

      const result = await recommendationService.toggleRecommendation(req.user.id, id)

      res.status(200).json({
        status: 'success',
        message: 'Recommendation status toggled successfully',
        data: result,
      })
    } catch (error) {
      next(error)
    }
  },
}
export default recommendationController
