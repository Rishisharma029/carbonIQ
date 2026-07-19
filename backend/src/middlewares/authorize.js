import { hasPermission } from '../services/access/permissionService.js'
import { ForbiddenError, AuthenticationError } from '../errors/customErrors.js'

/**
 * Authorization middleware factory.
 * Usage: router.post('/route', authenticate, authorize('calculation:create'), controller)
 *
 * Checks that req.user.role has the specified permission.
 * Must be called AFTER authenticate middleware.
 *
 * @param {string} permission - The permission string to check (e.g. 'calculation:create')
 * @returns {Function} Express middleware
 */
export const authorize = (permission) => (req, res, next) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required.')
    }

    if (!hasPermission(req.user.role, permission)) {
      throw new ForbiddenError(
        `You do not have permission to perform this action. Required: '${permission}'.`
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}

export default authorize
