import { dashboardService } from '../services/dashboardService.js'

export const dashboardController = {
  getDashboardData: async (req, res, next) => {
    try {
      const data = await dashboardService.getMetrics(req.user.id)
      res.status(200).json({
        status: 'success',
        data,
      })
    } catch (error) {
      next(error)
    }
  },
}
export default dashboardController
