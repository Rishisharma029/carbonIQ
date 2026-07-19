import { userRepository } from '../../repositories/userRepository.js'
import { verificationTokenRepository } from '../../repositories/verificationTokenRepository.js'
import { assertPasswordPolicy } from '../../utils/passwordPolicy.js'
import { generateScopedToken } from '../../utils/tokenUtils.js'
import { ValidationError } from '../../errors/customErrors.js'
import { config } from '../../config/config.js'
import { queueService } from '../queueService.js'

export const registrationService = {
  /**
   * Register a new user.
   * - Enforces password policy
   * - Creates user with emailVerified = false
   * - Generates a 24h email verification token
   * - In production: send email. In dev: return token for testing.
   */
  register: async (data) => {
    // 1. Validate password strength
    assertPasswordPolicy(data.password, ValidationError)

    // 2. Check for duplicate email
    const existing = await userRepository.findByEmail(data.email)
    if (existing) {
      throw new ValidationError('Email is already registered.')
    }

    // 3. Create user (unverified)
    const user = await userRepository.create({
      fullName: data.fullName,
      email: data.email,
      passwordHash: data.password,
      emailVerified: false,
    })

    // 4. Generate verification token (24h)
    const rawVerifyToken = generateScopedToken(user._id, 'email_verify', '24h')
    const expiresAt = new Date(Date.now() + (config.EMAIL_VERIFY_EXPIRY_MINUTES || 1440) * 60 * 1000)
    await verificationTokenRepository.create(user._id, rawVerifyToken, expiresAt)

    // Queue verification email
    const verificationLink = `${config.ALLOWED_ORIGINS[0] || 'http://localhost:5173'}/verify-email?token=${rawVerifyToken}`
    await queueService.enqueueJob('send-email', {
      to: user.email,
      subject: 'Verify your CarbonIQ Account',
      text: `Hello ${user.fullName},\n\nPlease verify your account by clicking this link: ${verificationLink}`,
      html: `<p>Hello ${user.fullName},</p><p>Please verify your account by clicking the link below:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`,
    })

    return {
      user: {
        id: user._id,
        name: user.fullName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      // Only returned in non-production environments
      verifyToken: config.NODE_ENV !== 'production' ? rawVerifyToken : undefined,
    }
  },
}

export default registrationService
