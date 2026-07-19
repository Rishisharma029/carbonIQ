import express from 'express'
import { recommendationController } from '../controllers/recommendationController.js'
import { protect } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.use(protect)

/**
 * @openapi
 * /api/v1/recommendations:
 *   get:
 *     summary: Retrieve actionable vetted recommendations catalog
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', recommendationController.getRecommendations)

/**
 * @openapi
 * /api/v1/recommendations/toggle:
 *   post:
 *     summary: Toggle implemented status of a recommendation
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/toggle', recommendationController.toggleRecommendation)

export default router
export { router }
