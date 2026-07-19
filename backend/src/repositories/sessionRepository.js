import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { Session } from '../models/Session.js'

const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex')

export const sessionRepository = {
  /**
   * Create a new session document. Raw refresh token is hashed before storage.
   */
  create: async ({ userId, refreshToken, device, browser, operatingSystem, ipAddress, expiresAt }) => {
    const sessionId = uuidv4()
    return Session.create({
      sessionId,
      userId,
      refreshTokenHash: hashToken(refreshToken),
      device: device || null,
      browser: browser || null,
      operatingSystem: operatingSystem || null,
      ipAddress: ipAddress || null,
      lastUsedAt: new Date(),
      expiresAt,
    })
  },

  /**
   * Find an active (non-revoked, non-expired) session by its UUID.
   */
  findBySessionId: async (sessionId) => {
    return Session.findOne({
      sessionId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
  },

  /**
   * Find an active session by raw refresh token (hashed internally).
   */
  findByRefreshToken: async (rawToken) => {
    return Session.findOne({
      refreshTokenHash: hashToken(rawToken),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
  },

  /**
   * Rotate refresh token hash on a session (token rotation pattern).
   */
  rotateToken: async (sessionId, newRawToken) => {
    return Session.findOneAndUpdate(
      { sessionId },
      {
        refreshTokenHash: hashToken(newRawToken),
        lastUsedAt: new Date(),
      },
      { new: true }
    )
  },

  /**
   * Soft-revoke a single session by sessionId.
   */
  revokeById: async (sessionId) => {
    return Session.findOneAndUpdate(
      { sessionId },
      { revokedAt: new Date() },
      { new: true }
    )
  },

  /**
   * Soft-revoke all active sessions for a user (logout-all).
   */
  revokeAllByUserId: async (userId) => {
    return Session.updateMany(
      { userId, revokedAt: null },
      { revokedAt: new Date() }
    )
  },

  /**
   * List all currently active (non-revoked, non-expired) sessions for a user.
   */
  findAllActiveByUserId: async (userId) => {
    return Session.find(
      { userId, revokedAt: null, expiresAt: { $gt: new Date() } },
      { refreshTokenHash: 0 } // never expose hashes
    ).sort({ lastUsedAt: -1 })
  },

  /**
   * Update the lastUsedAt timestamp on a session.
   */
  updateLastUsed: async (sessionId) => {
    return Session.findOneAndUpdate(
      { sessionId },
      { lastUsedAt: new Date() },
      { new: true }
    )
  },
}
export default sessionRepository
