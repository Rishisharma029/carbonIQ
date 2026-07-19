import { userRepository } from '../../repositories/userRepository.js'
import { verificationTokenRepository } from '../../repositories/verificationTokenRepository.js'
import { generateScopedToken, verifyToken } from '../../utils/tokenUtils.js'
import { ValidationError, NotFoundError } from '../../errors/customErrors.js'
import { config } from '../../config/config.js'
import { queueService } from '../queueService.js'

export const verificationService = {
  /**
   * Generate and store a new 24h email verification token.
   * In production: send email. In dev: return token in response.
   */
  sendVerificationEmail: async (userId) => {
    const user = await userRepository.findById(userId)
    if (!user) throw new NotFoundError('User not found.')
    if (user.emailVerified) {
      throw new ValidationError('Email address is already verified.')
    }

    const rawToken = generateScopedToken(userId, 'email_verify', '24h')
    const expiresAt = new Date(Date.now() + (config.EMAIL_VERIFY_EXPIRY_MINUTES || 1440) * 60 * 1000)
    await verificationTokenRepository.create(userId, rawToken, expiresAt)

    // Queue verification email
    const verificationLink = `${config.ALLOWED_ORIGINS[0] || 'http://localhost:5173'}/verify-email?token=${rawToken}`
    await queueService.enqueueJob('send-email', {
      to: user.email,
      subject: 'Verify your CarbonIQ Account',
      text: `Hello ${user.fullName},\n\nPlease verify your account by clicking this link: ${verificationLink}`,
      html: `<p>Hello ${user.fullName},</p><p>Please verify your account by clicking the link below:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`,
    })

    return {
      message: 'Verification email sent.',
      verifyToken: config.NODE_ENV !== 'production' ? rawToken : undefined,
    }
  },

  /**
   * Consume a verification token and mark the user's email as verified.
   * Tokens are single-use — marked usedAt immediately after validation.
   */
  verifyEmail: async (rawToken) => {
    // Validate token type first
    let payload
    try {
      payload = verifyToken(rawToken)
      if (payload.type !== 'email_verify') throw new Error('Wrong token type')
    } catch {
      throw new ValidationError('Invalid or expired verification token.')
    }

    const tokenDoc = await verificationTokenRepository.findByToken(rawToken)
    if (!tokenDoc) {
      throw new ValidationError('Verification token has already been used or has expired.')
    }

    // Mark consumed (single-use enforcement)
    await verificationTokenRepository.markUsed(tokenDoc._id)

    // Mark user as verified
    await userRepository.update(payload.id, { emailVerified: true })

    return { message: 'Email verified successfully.' }
  },
}

export default verificationService
