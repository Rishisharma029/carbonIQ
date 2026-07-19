import { userRepository } from '../../repositories/userRepository.js'
import { sessionRepository } from '../../repositories/sessionRepository.js'
import { assertPasswordPolicy } from '../../utils/passwordPolicy.js'
import { generateScopedToken, verifyToken } from '../../utils/tokenUtils.js'
import { ValidationError, NotFoundError, AuthenticationError } from '../../errors/customErrors.js'
import { config } from '../../config/config.js'
import { queueService } from '../queueService.js'

export const passwordService = {
  /**
   * Generate a 15-minute password reset token.
   * Returns generic success to avoid user enumeration.
   */
  requestReset: async (email) => {
    const user = await userRepository.findByEmail(email)
    // Always return the same shape — never reveal whether email exists
    if (!user) {
      return { message: 'If the email matches an account, a reset link has been sent.' }
    }

    const resetToken = generateScopedToken(user._id, 'password_reset', '15m')

    // Queue password reset email
    const resetLink = `${config.ALLOWED_ORIGINS[0] || 'http://localhost:5173'}/reset-password?token=${resetToken}`
    await queueService.enqueueJob('send-email', {
      to: user.email,
      subject: 'Reset your CarbonIQ Password',
      text: `Hello ${user.fullName},\n\nYou requested a password reset. Please click this link to reset it: ${resetLink}\n\nThis link is valid for 15 minutes.`,
      html: `<p>Hello ${user.fullName},</p><p>You requested a password reset. Please click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link is valid for 15 minutes.</p>`,
    })

    return {
      message: 'If the email matches an account, a reset link has been sent.',
      // Only returned in non-production for testing
      resetToken: config.NODE_ENV !== 'production' ? resetToken : undefined,
    }
  },

  /**
   * Reset password using a scoped reset token.
   * - Validates token type and expiry
   * - Enforces password policy
   * - Updates passwordHash
   * - Revokes ALL sessions (force re-login everywhere)
   * - Increments tokenVersion (invalidates all existing access tokens)
   */
  resetPassword: async (token, newPassword) => {
    let payload
    try {
      payload = verifyToken(token)
      if (payload.type !== 'password_reset') throw new Error('Wrong token type')
    } catch {
      throw new ValidationError('Invalid or expired password reset token.')
    }

    assertPasswordPolicy(newPassword, ValidationError)

    const user = await userRepository.findById(payload.id)
    if (!user) {
      throw new NotFoundError('User not found.')
    }

    user.passwordHash = newPassword
    user.tokenVersion = (user.tokenVersion || 0) + 1
    await user.save()

    await sessionRepository.revokeAllByUserId(user._id)
  },

  /**
   * Change password for an already-authenticated user.
   * Requires current password verification before updating.
   */
  changePassword: async (userId, currentPassword, newPassword) => {
    const user = await userRepository.findByEmail(
      (await userRepository.findById(userId)).email
    )
    if (!user) throw new NotFoundError('User not found.')

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      throw new AuthenticationError('Current password is incorrect.')
    }

    assertPasswordPolicy(newPassword, ValidationError)

    user.passwordHash = newPassword
    user.tokenVersion = (user.tokenVersion || 0) + 1
    await user.save()

    await sessionRepository.revokeAllByUserId(userId)
  },
}

export default passwordService
