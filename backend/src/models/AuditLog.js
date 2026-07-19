import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: 'unknown',
    },
    requestId: {
      type: String,
      default: null,
    },
    calculationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Calculation',
      default: null,
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
)

// TTL index — auto-expire after 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 })
// Query index for per-user audit history
auditLogSchema.index({ userId: 1, timestamp: -1 })

export const AuditLog = mongoose.model('AuditLog', auditLogSchema)
export default AuditLog
