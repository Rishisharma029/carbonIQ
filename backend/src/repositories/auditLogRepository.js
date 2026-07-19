import { AuditLog } from '../models/AuditLog.js'

export const auditLogRepository = {
  logAction: async (data) => {
    return AuditLog.create({
      userId: data.userId || null,
      action: data.action,
      resource: data.resource || null,
      metadata: data.metadata || null,
      ipAddress: data.ipAddress || 'unknown',
      requestId: data.requestId || null,
      calculationId: data.calculationId || null,
      userAgent: data.userAgent || 'unknown',
      timestamp: new Date(),
    })
  },
}
export default auditLogRepository
