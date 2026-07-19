import express from 'express'
import { userController } from '../controllers/userController.js'
import { protect } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.use(protect)

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     summary: Get currently logged in user profile details
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/me', userController.getMe)

/**
 * @openapi
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile parameters (name, email)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/profile', userController.updateProfile)

/**
 * @openapi
 * /api/v1/users/settings:
 *   put:
 *     summary: Update user configurations settings (theme, unitSystem)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *               unitSystem:
 *                 type: string
 *                 enum: [metric, imperial]
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/settings', userController.updateSettings)

export default router
export { router }
