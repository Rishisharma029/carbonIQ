import { AuthorizationError } from '../errors/customErrors.js'
import { hasPermission } from '../config/permissions.js'

export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    const missingPermission = permissions.find(
      (permission) => !hasPermission(req.securityContext, permission)
    )

    if (missingPermission) {
      return next(new AuthorizationError('You do not have permission to perform this action'))
    }

    next()
  }
}

export default requirePermission
