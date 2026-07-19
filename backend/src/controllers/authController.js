import { authService } from '../services/authService.js'
import { auditLogRepository } from '../repositories/auditLogRepository.js'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/authValidator.js'
import { ValidationError } from '../errors/customErrors.js'

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
}

const setCookies = (res, accessToken, refreshToken) => {
  const accessExpiry = new Date()
  accessExpiry.setMinutes(accessExpiry.getMinutes() + 15)

  const refreshExpiry = new Date()
  refreshExpiry.setDate(refreshExpiry.getDate() + 7)

  res.cookie('access_token', accessToken, { ...cookieOptions, expires: accessExpiry })
  res.cookie('refresh_token', refreshToken, { ...cookieOptions, expires: refreshExpiry })
}

const clearCookies = (res) => {
  res.clearCookie('access_token', { ...cookieOptions })
  res.clearCookie('refresh_token', { ...cookieOptions })
}

export const authController = {
  register: async (req, res, next) => {
    try {
      const validate = registerSchema.safeParse(req.body)
      if (!validate.success) {
        const error = new ValidationError('Validation failed')
        error.errors = validate.error.format()
        throw error
      }

      const user = await authService.register(validate.data)

      await auditLogRepository.logAction({
        userId: user.id,
        action: 'user_register',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })

      res.status(201).json({
        status: 'success',
        message: 'Registration successful',
        data: { user },
      })
    } catch (error) {
      next(error)
    }
  },

  login: async (req, res, next) => {
    try {
      const validate = loginSchema.safeParse(req.body)
      if (!validate.success) {
        const error = new ValidationError('Validation failed')
        error.errors = validate.error.format()
        throw error
      }

      const { accessToken, refreshToken, user } = await authService.login(
        validate.data.email,
        validate.data.password
      )

      setCookies(res, accessToken, refreshToken)

      await auditLogRepository.logAction({
        userId: user.id,
        action: 'user_login_success',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: { user },
      })
    } catch (error) {
      await auditLogRepository.logAction({
        action: `user_login_failed: ${req.body.email || 'unknown'}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })
      next(error)
    }
  },

  refresh: async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refresh_token
      if (!refreshToken) {
        throw new ValidationError('Refresh token cookie missing')
      }

      const { accessToken: newAccess, refreshToken: newRefresh } =
        await authService.refresh(refreshToken)
      setCookies(res, newAccess, newRefresh)

      res.status(200).json({
        status: 'success',
        message: 'Tokens refreshed successfully',
      })
    } catch (error) {
      next(error)
    }
  },

  logout: async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refresh_token
      await authService.logout(refreshToken)

      clearCookies(res)

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      })
    } catch (error) {
      next(error)
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      const validate = forgotPasswordSchema.safeParse(req.body)
      if (!validate.success) {
        const error = new ValidationError('Validation failed')
        error.errors = validate.error.format()
        throw error
      }

      const { resetToken } = await authService.requestPasswordReset(validate.data.email)

      res.status(200).json({
        status: 'success',
        message: 'If the email matches an account, a password reset token has been generated.',
        data: process.env.NODE_ENV !== 'production' ? { resetToken } : undefined,
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

      await authService.resetPassword(validate.data.token, validate.data.password)

      res.status(200).json({
        status: 'success',
        message: 'Password reset successful',
      })
    } catch (error) {
      next(error)
    }
  },
}
export default authController
