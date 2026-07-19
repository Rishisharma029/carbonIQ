import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'
import { AuthenticationError } from '../errors/customErrors.js'

/**
 * Generate a short-lived access token (15 minutes).
 * Payload carries userId, role, sessionId, and tokenVersion for revocation checks.
 */
export const generateAccessToken = (userId, role = 'user', sessionId = null, tokenVersion = 0) => {
  return jwt.sign(
    { id: userId, role, sessionId, tokenVersion },
    config.JWT_SECRET,
    { expiresIn: '15m' }
  )
}

/**
 * Generate a long-lived refresh token (30 days).
 * Payload carries userId and sessionId for session-specific rotation.
 */
export const generateRefreshToken = (userId, sessionId = null) => {
  return jwt.sign(
    { id: userId, sessionId },
    config.JWT_SECRET,
    { expiresIn: '30d' }
  )
}

/**
 * Generate a short-lived purpose-scoped token (e.g. password reset, email verify).
 */
export const generateScopedToken = (userId, type, expiresIn = '15m') => {
  return jwt.sign({ id: userId, type }, config.JWT_SECRET, { expiresIn })
}

/**
 * Verify any JWT and return the decoded payload.
 * Throws AuthenticationError on invalid/expired tokens.
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET)
  } catch {
    throw new AuthenticationError('Invalid or expired token.')
  }
}

export default { generateAccessToken, generateRefreshToken, generateScopedToken, verifyToken }
