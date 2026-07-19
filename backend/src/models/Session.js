import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

/**
 * Session — represents one authenticated device session.
 * Replaces the RefreshToken model for all new auth flows.
 * Raw refresh tokens are NEVER stored — only SHA-256 hashes.
 */
const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    device: { type: String, default: null },
    browser: { type: String, default: null },
    operatingSystem: { type: String, default: null },
    ipAddress: { type: String, default: null },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
)

// TTL — MongoDB automatically removes expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const Session = mongoose.model('Session', sessionSchema)
export default Session
