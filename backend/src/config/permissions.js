export const PERMISSIONS = Object.freeze({
  CALCULATION_CREATE: 'calculation:create',
  CALCULATION_READ: 'calculation:read',
  CALCULATION_DELETE: 'calculation:delete',
  GOAL_CREATE: 'goal:create',
  GOAL_UPDATE: 'goal:update',
  REPORT_GENERATE: 'report:generate',
  ADMIN_USER_LIST: 'admin:user:list',
  ADMIN_USER_UPDATE: 'admin:user:update',
})

const USER_PERMISSIONS = [
  PERMISSIONS.CALCULATION_CREATE,
  PERMISSIONS.CALCULATION_READ,
  PERMISSIONS.CALCULATION_DELETE,
  PERMISSIONS.GOAL_CREATE,
  PERMISSIONS.GOAL_UPDATE,
  PERMISSIONS.REPORT_GENERATE,
]

const ADMIN_PERMISSIONS = [
  ...USER_PERMISSIONS,
  PERMISSIONS.ADMIN_USER_LIST,
  PERMISSIONS.ADMIN_USER_UPDATE,
]

export const ROLE_PERMISSIONS = Object.freeze({
  user: USER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
})

export const getPermissionsForRole = (role) => ROLE_PERMISSIONS[role] || []

export const hasPermission = (securityContext, permission) => {
  return securityContext?.permissions?.includes(permission) || false
}
