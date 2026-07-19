import express from 'express'
import { historyController } from '../controllers/historyController.js'
import { protect } from '../middlewares/authMiddleware.js'
import { validateRequest } from '../middlewares/validationMiddleware.js'
import { historyIdParamsSchema, historyQuerySchema } from '../validators/historyValidator.js'
import { historyLimiter } from '../middlewares/rateLimit.js'

const router = express.Router()

router.use(protect)

/**
 * @openapi
 * /api/v1/history:
 *   get:
 *     summary: Retrieve paginated carbon calculation history entries
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           default: createdAt
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *           enum: [transport, electricity, food, waste]
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', historyLimiter, validateRequest({ query: historyQuerySchema }), historyController.getHistory)

/**
 * @openapi
 * /api/v1/history/{id}:
 *   delete:
 *     summary: Soft delete a history entry and deduct monthly summaries
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/:id', validateRequest({ params: historyIdParamsSchema }), historyController.deleteEntry)

export default router
export { router }
