import { sessionRepository } from '../../repositories/sessionRepository.js'
import { userRepository } from '../../repositories/userRepository.js'
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../utils/tokenUtils.js'
import { AuthenticationError, ForbiddenError } from '../../errors/customErrors.js'

export const sessionService = {
  /**
   * Rotate refresh token and issue a new access token.
   * Validates session is active, then rotates the stored token hash.
   */
  refresh: async (rawRefreshToken) => {
    // 1. Find active session by refresh token
    const session = await sessionRepository.findByRefreshToken(rawRefreshToken)
    if (!session) {
      throw new AuthenticationError('Invalid or expired refresh token. Please log in again.')
    }

    // 2. Verify JWT signature
    let payload
    try {
      payload = verifyToken(rawRefreshToken)
    } catch {
      await sessionRepository.revokeById(session.sessionId)
      throw new AuthenticationError('Invalid refresh token. Session revoked.')
    }

    // 3. Load user for role and tokenVersion
    const user = await userRepository.findById(payload.id)
    if (!user) {
      throw new AuthenticationError('User account no longer exists.')
    }

    // 4. Rotate — generate new token pair
    const newRefreshToken = generateRefreshToken(user._id, session.sessionId)
    const newAccessToken = generateAccessToken(user._id, user.role, session.sessionId, user.tokenVersion)

    await sessionRepository.rotateToken(session.sessionId, newRefreshToken)

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  },

  /**
   * Revoke the current session (logout).
   */
  revokeCurrentSession: async (rawRefreshToken) => {
    if (!rawRefreshToken) return
    const session = await sessionRepository.findByRefreshToken(rawRefreshToken)
    if (session) {
      await sessionRepository.revokeById(session.sessionId)
    }
  },

  /**
   * Revoke all sessions for a user and increment tokenVersion (logout-all).
   */
  revokeAllSessions: async (userId) => {
    await sessionRepository.revokeAllByUserId(userId)
    const user = await userRepository.findById(userId)
    await userRepository.update(userId, { tokenVersion: (user.tokenVersion || 0) + 1 })
  },

  /**
   * Revoke a specific session by ID (device management).
   * Enforces ownership — users may only revoke their own sessions.
   */
  revokeSessionById: async (sessionId, authenticatedUserId) => {
    const session = await sessionRepository.findBySessionId(sessionId)
    if (!session) {
      throw new AuthenticationError('Session not found or already expired.')
    }
    if (session.userId.toString() !== authenticatedUserId.toString()) {
      throw new ForbiddenError('You do not have permission to revoke this session.')
    }
    await sessionRepository.revokeById(sessionId)
  },

  /**
   * List all active sessions for a user (device management).
   */
  listSessions: async (userId) => {
    return sessionRepository.findAllActiveByUserId(userId)
  },
}

export default sessionService
