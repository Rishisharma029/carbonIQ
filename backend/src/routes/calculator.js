import express from 'express'
import { calculatorController } from '../controllers/calculatorController.js'
import { protect } from '../middlewares/authMiddleware.js'
import { idempotency } from '../middlewares/idempotency.js'
import { calculatorLimiter } from '../middlewares/rateLimit.js'

const router = express.Router()

router.use(protect)

/**
 * @openapi
 * /api/v1/calculator:
 *   post:
 *     summary: Calculate and log a new carbon footprint entry
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transport:
 *                 type: object
 *                 properties:
 *                   carDistance:
 *                     type: number
 *                   carFuelType:
 *                     type: string
 *                     enum: [gasoline, diesel, hybrid, electric, none]
 *                   transitHours:
 *                     type: number
 *                   flightHours:
 *                     type: number
 *               electricity:
 *                 type: object
 *                 properties:
 *                   gridConsumption:
 *                     type: number
 *                   cleanEnergyShare:
 *                     type: number
 *               food:
 *                 type: object
 *                 properties:
 *                   dietType:
 *                     type: string
 *                     enum: [meat-heavy, balanced, vegetarian, vegan]
 *                   organicShare:
 *                     type: number
 *               waste:
 *                 type: object
 *                 properties:
 *                   landfillBags:
 *                     type: number
 *                   recycledPaper:
 *                     type: boolean
 *                   recycledPlastic:
 *                     type: boolean
 *                   recycledGlass:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Success
 */
router.post('/', calculatorLimiter, idempotency, calculatorController.createCalculation)

export default router
export { router }
