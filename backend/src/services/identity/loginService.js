import { userRepository } from '../../repositories/userRepository.js'
import { sessionRepository } from '../../repositories/sessionRepository.js'
import { generateAccessToken, generateRefreshToken } from '../../utils/tokenUtils.js'
import { AuthenticationError } from '../../errors/customErrors.js'
import { config } from '../../config/config.js'

const LOCK_MINUTES = config.ACCOUNT_LOCK_MINUTES || 30
const MAX_ATTEMPTS = 5

export const loginService = {
  /**
   * Authenticate user credentials and create a new session.
   * - Checks account lock status
   * - Verifies password
   * - Clears failed attempts on success
   * - Creates session and returns token pair
   * - emailVerified = false: login allowed with warning flag
   */
  login: async (email, password, meta = {}) => {
    const user = await userRepository.findByEmail(email)

    // Generic error — never reveal whether email exists
    if (!user) {
      throw new AuthenticationError('Invalid email or password.')
    }

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000)
      throw new AuthenticationError(
        `Account temporarily locked. Try again in ${minutesLeft} minute(s).`
      )
    }

    // Verify password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      await loginService.recordFailedAttempt(user)
      throw new AuthenticationError('Invalid email or password.')
    }

    // Clear failed attempts on success
    await loginService.clearFailedAttempts(user)

    // Create session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    const sessionId = (await sessionRepository.create({
      userId: user._id,
      refreshToken: '__placeholder__', // replaced below
      device: meta.device || null,
      browser: meta.browser || null,
      operatingSystem: meta.operatingSystem || null,
      ipAddress: meta.ipAddress || null,
      expiresAt,
    })).sessionId

    // Generate tokens with session context
    const refreshToken = generateRefreshToken(user._id, sessionId)
    const accessToken = generateAccessToken(user._id, user.role, sessionId, user.tokenVersion)

    // Store real hash (overwrite placeholder)
    await sessionRepository.rotateToken(sessionId, refreshToken)

    return {
      accessToken,
      refreshToken,
      sessionId,
      emailVerified: user.emailVerified,
      user: {
        id: user._id,
        name: user.fullName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    }
  },

  recordFailedAttempt: async (user) => {
    const newAttempts = (user.failedLoginAttempts || 0) + 1
    const update = { failedLoginAttempts: newAttempts }
    if (newAttempts >= MAX_ATTEMPTS) {
      update.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
      update.failedLoginAttempts = 0
    }
    await userRepository.update(user._id, update)
  },

  clearFailedAttempts: async (user) => {
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await userRepository.update(user._id, { failedLoginAttempts: 0, lockedUntil: null })
    }
  },
}

export default loginService
