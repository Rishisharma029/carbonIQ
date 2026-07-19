import { ForbiddenError } from '../../errors/customErrors.js'

/**
 * Ownership Service — enforces resource ownership rules.
 * Never trust resource IDs from the client. Always verify ownership server-side.
 */
export const ownershipService = {
  /**
   * Assert that the resource belongs to the authenticated user.
   * Throws ForbiddenError if ownership check fails.
   *
   * @param {object} resource - Mongoose document with a userId field
   * @param {string|ObjectId} authenticatedUserId - The ID from req.user
   */
  assertOwner: (resource, authenticatedUserId) => {
    if (!resource) {
      throw new ForbiddenError('Resource not found or access denied.')
    }
    const resourceOwner = resource.userId?.toString() || resource.userId
    const requestor = authenticatedUserId?.toString()
    if (resourceOwner !== requestor) {
      throw new ForbiddenError('You do not have permission to access this resource.')
    }
  },

  /**
   * Check ownership without throwing — useful for conditional logic.
   * @returns {boolean}
   */
  isOwner: (resource, authenticatedUserId) => {
    if (!resource) return false
    const resourceOwner = resource.userId?.toString()
    const requestor = authenticatedUserId?.toString()
    return resourceOwner === requestor
  },
}

export default ownershipService
