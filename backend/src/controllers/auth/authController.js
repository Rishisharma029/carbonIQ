import { registrationService } from '../../services/identity/registrationService.js'
import { loginService } from '../../services/identity/loginService.js'
import { sessionService } from '../../services/identity/sessionService.js'
import { passwordService } from '../../services/identity/passwordService.js'
import { verificationService } from '../../services/identity/verificationService.js'
import { auditLogRepository } from '../../repositories/auditLogRepository.js'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../validators/authValidator.js'
import { ValidationError } from '../../errors/customErrors.js'
import { config } from '../../config/config.js'

/** Cookie options — HTTP-only by default, secure in production */
const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
}

const setTokenCookies = (res, accessToken, refreshToken) => {
  const accessExpiry = new Date(Date.now() + 15 * 60 * 1000)        // 15 min
  const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  res.cookie('access_token', accessToken, { ...cookieOptions, expires: accessExpiry })
  res.cookie('refresh_token', refreshToken, { ...cookieOptions, expires: refreshExpiry })
}

const clearTokenCookies = (res) => {
  res.clearCookie('access_token', cookieOptions)
  res.clearCookie('refresh_token', cookieOptions)
}

export const authController = {
  // ──────────── Registration ────────────

  register: async (req, res, next) => {
    try {
      const validate = registerSchema.safeParse(req.body)
      if (!validate.success) {
        const error = new ValidationError('Validation failed')
        error.errors = validate.error.format()
        throw error
      }

      const result = await registrationService.register(validate.data)

      await auditLogRepository.logAction({
        userId: result.user.id,
        action: 'user_register',
        resource: 'user',
        requestId: req.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })

      res.status(201).json({
        status: 'success',
        message: 'Registration successful. Please verify your email.',
        data: {
          user: result.user,
          ...(result.verifyToken && { verifyToken: result.verifyToken }),
        },
      })
    } catch (error) {
      next(error)
    }
  },

  // ──────────── Login ────────────

  login: async (req, res, next) => {
    try {
      const validate = loginSchema.safeParse(req.body)
      if (!validate.success) {
        const error = new ValidationError('Validation failed')
        error.errors = validate.error.format()
        throw error
      }

      const result = await loginService.login(validate.data.email, validate.data.password, {
        device: req.headers['x-device'] || null,
        browser: req.headers['x-browser'] || null,
        operatingSystem: req.headers['x-os'] || null,
        ipAddress: req.ip,
      })

      setTokenCookies(res, result.accessToken, result.refreshToken)

      await auditLogRepository.logAction({
        userId: result.user.id,
        action: 'user_login_success',
        resource: 'session',
        requestId: req.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { sessionId: result.sessionId },
      })

      res.status(200).json({
        status: 'success',
        message: 'Login successful.',
        data: {
          user: result.user,
          emailVerified: result.emailVerified,
          ...(!result.emailVerified && {
            warning: 'Email address not yet verified. Some features may be limited.',
          }),
        },
      })
    } catch (error) {
      await auditLogRepository.logAction({
        action: 'user_login_failed',
        resource: 'session',
        requestId: req.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { email: req.body?.email || 'unknown' },
      }).catch(() => {})
      next(error)
    }
  },

  // ──────────── Token Refresh ────────────

  refresh: async (req, res, next) => {
    try {
      const rawRefreshToken = req.cookies?.refresh_token
      if (!rawRefreshToken) {
        throw new ValidationError('Refresh token cookie missing.')
      }

      const { accessToken, refreshToken } = await sessionService.refresh(rawRefreshToken)
      setTokenCookies(res, accessToken, refreshToken)

      res.status(200).json({
        status: 'success',
        message: 'Tokens refreshed successfully.',
      })
    } catch (error) {
      next(error)
    }
  },

  // ──────────── Logout (current session) ────────────

  logout: async (req, res, next) => {
    try {
      const rawRefreshToken = req.cookies?.refresh_token
      await sessionService.revokeCurrentSession(rawRefreshToken)

      clearTokenCookies(res)

      await auditLogRepository.logAction({
        userId: req.user?._id,
        action: 'user_logout',
        resource: 'session',
        requestId: req.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { sessionId: req.sessionId },
      }).catch(() => {})

      res.status(200).json({ status: 'success', message: 'Logged out successfully.' })
    } catch (error) {
      next(error)
    }
  },

  // ──────────── Logout All Sessions ────────────

  logoutAll: async (req, res, next) => {
    try {
      await sessionService.revokeAllSessions(req.user._id)

      clearTokenCookies(res)

      await auditLogRepository.logAction({
        userId: req.user._id,
        action: 'user_logout_all',
        resource: 'session',
        requestId: req.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch(() => {})

      res.status(200).json({
        status: 'success',
        message: 'All sessions have been revoked. Please log in again.',
      })
    } catch (error) {
      next(error)
    }
  },

  // ──────────── Password Reset ────────────

  forgotPassword: async (req, res, next) => {
    try {
      const validate = forgotPasswordSchema.safeParse(req.body)
      if (!validate.success) {
        const error = new ValidationError('Validation failed')
        error.errors = validate.error.format()
        throw error
      }

      const result = await passwordService.requestReset(validate.data.email)

      await auditLogRepository.logAction({
        action: 'password_reset_request',
        resource: 'user',
        requestId: req.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { email: validate.data.email },
      }).catch(() => {})

      res.status(200).json({
        status: 'success',
        message: result.message,
        ...(result.resetToken && { data: { resetToken: result.resetToken } }),
      })
    } catch (error) {
      next(error)
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const validate = resetPasswordSchema.safeParse(req.body)
      if (!validate.success) {
        const error = new ValidationError('Validation failed')
        error.errors = validate.error.format()
        throw error
      }

      await passwordService.resetPassword(validate.data.token, validate.data.password)

      await auditLogRepository.logAction({
        action: 'password_reset_success',
        resource: 'user',
        requestId: req.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch(() => {})

      res.status(200).json({ status: 'success', message: 'Password reset successful.' })
    } catch (error) {
      next(error)
    }
  },

  // ──────────── Email Verification ────────────

  verifyEmail: async (req, res, next) => {
    try {
      const { token } = req.body
      if (!token) {
        throw new ValidationError('Verification token is required.')
      }

      const result = await verificationService.verifyEmail(token)

      await auditLogRepository.logAction({
        action: 'email_verified',
        resource: 'user',
        requestId: req.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch(() => {})

      res.status(200).json({ status: 'success', message: result.message })
    } catch (error) {
      next(error)
    }
  },

  // ──────────── Session Management ────────────

  getMe: async (req, res, next) => {
    try {
      res.status(200).json({
        status: 'success',
        data: { user: req.user },
      })
    } catch (error) {
      next(error)
    }
  },

  getSessions: async (req, res, next) => {
    try {
      const sessions = await sessionService.listSessions(req.user._id)
      res.status(200).json({
        status: 'success',
        data: { sessions },
      })
    } catch (error) {
      next(error)
    }
  },

  revokeSession: async (req, res, next) => {
    try {
      await sessionService.revokeSessionById(req.params.id, req.user._id)

      await auditLogRepository.logAction({
        userId: req.user._id,
        action: 'session_revoked',
        resource: 'session',
        requestId: req.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { revokedSessionId: req.params.id },
      }).catch(() => {})

      res.status(200).json({ status: 'success', message: 'Session revoked.' })
    } catch (error) {
      next(error)
    }
  },
}

export default authController
