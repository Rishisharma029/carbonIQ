/**
 * Permission Service — maps roles to permissions and answers authorization queries.
 * Never hardcode role checks in controllers. Always use this service.
 *
 * Permissions:
 *   calculation:create  — submit a new calculation
 *   calculation:read    — view calculation history and dashboard
 *   calculation:delete  — soft-delete a calculation entry
 *   goal:create         — create a new reduction goal
 *   goal:update         — update a goal (status, progress)
 *   report:generate     — export PDF or CSV reports
 *   admin:user:list     — list all users (admin only)
 *   admin:user:update   — update any user's profile or role (admin only)
 */

const ROLE_PERMISSIONS = {
  user: [
    'calculation:create',
    'calculation:read',
    'calculation:delete',
    'goal:create',
    'goal:update',
    'report:generate',
  ],
  admin: [
    'calculation:create',
    'calculation:read',
    'calculation:delete',
    'goal:create',
    'goal:update',
    'report:generate',
    'admin:user:list',
    'admin:user:update',
    'factor:import',
  ],
}

/**
 * Check whether a role has the given permission.
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

/**
 * Get the full list of permissions for a role.
 * @param {string} role
 * @returns {string[]}
 */
export const getPermissions = (role) => {
  return ROLE_PERMISSIONS[role] || []
}

export default { hasPermission, getPermissions }
