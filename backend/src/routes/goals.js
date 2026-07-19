import express from 'express'
import { goalController } from '../controllers/goalController.js'
import { protect } from '../middlewares/authMiddleware.js'
import { idempotency } from '../middlewares/idempotency.js'
import { goalsLimiter } from '../middlewares/rateLimit.js'

const router = express.Router()

router.use(protect)

/**
 * @openapi
 * /api/v1/goals:
 *   get:
 *     summary: Retrieve user reduction goals
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', goalController.getGoals)

/**
 * @openapi
 * /api/v1/goals:
 *   post:
 *     summary: Create a new carbon footprint reduction target
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [transport, electricity, food, waste, total]
 *               targetValue:
 *                 type: number
 *               targetDate:
 *                 type: string
 *     responses:
 *       201:
 *         description: Success
 */
router.post('/', goalsLimiter, idempotency, goalController.createGoal)

export default router
export { router }
