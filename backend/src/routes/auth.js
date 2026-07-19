import express from 'express'
import { authController } from '../controllers/auth/authController.js'
import { authenticate } from '../middlewares/authenticate.js'
import {
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  registerLimiter,
  verifyEmailLimiter,
} from '../middlewares/rateLimit.js'
import { validateRequest } from '../middlewares/validationMiddleware.js'
import { idParamSchema } from '../validators/commonValidator.js'

const router = express.Router()

// ──────────── Public routes ────────────

// CSRF token endpoint — must be called before any state-mutating auth request
router.get('/csrf-token', (req, res, next) => {
  // Handled inline by csrf middleware mounted in app.js
  // This route stub exists for documentation purposes.
  // The csrf middleware intercepts /csrf-token before reaching here.
  next()
})

router.post('/register', registerLimiter, authController.register)
router.post('/login', loginLimiter, authController.login)
router.post('/refresh', authController.refresh)
router.post('/verify-email', verifyEmailLimiter, authController.verifyEmail)
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword)
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword)

// ──────────── Protected routes ────────────

router.get('/me', authenticate, authController.getMe)
router.post('/logout', authenticate, authController.logout)
router.post('/logout-all', authenticate, authController.logoutAll)
router.get('/sessions', authenticate, authController.getSessions)
router.delete('/sessions/:id', authenticate, validateRequest({ params: idParamSchema }), authController.revokeSession)

export default router
export { router }
