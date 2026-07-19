import express from 'express'
import { dashboardController } from '../controllers/dashboardController.js'
import { protect } from '../middlewares/authMiddleware.js'
import { dashboardLimiter } from '../middlewares/rateLimit.js'

const router = express.Router()

router.use(protect)

/**
 * @openapi
 * /api/v1/dashboard:
 *   get:
 *     summary: Retrieve aggregated dashboard footprint analytics
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', dashboardLimiter, dashboardController.getDashboardData)

export default router
export { router }
