import { verifyToken } from '../utils/tokenUtils.js'
import { userRepository } from '../repositories/userRepository.js'
import { AuthenticationError } from '../errors/customErrors.js'

/**
 * Authentication middleware (auth v1).
 *
 * Validates the access_token cookie and enforces:
 * 1. Token signature validity
 * 2. tokenVersion match — detects revoked tokens after logout-all / password change
 * 3. User still exists and is not soft-deleted
 *
 * Sets req.user and req.sessionId for downstream middleware/controllers.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.access_token
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      throw new AuthenticationError('You are not logged in. Please log in to gain access.')
    }

    // 1. Verify JWT signature and expiry
    const decoded = verifyToken(token)

    // 2. Load current user
    const currentUser = await userRepository.findById(decoded.id)
    if (!currentUser) {
      throw new AuthenticationError('The account belonging to this token no longer exists.')
    }

    // 3. Token version check — rejects tokens issued before logout-all or password change
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== currentUser.tokenVersion) {
      throw new AuthenticationError('Your session has been invalidated. Please log in again.')
    }

    req.user = currentUser
    req.sessionId = decoded.sessionId || null
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Backward-compatible alias for existing route files that import `protect`.
 */
export const protect = authenticate

export default authenticate
