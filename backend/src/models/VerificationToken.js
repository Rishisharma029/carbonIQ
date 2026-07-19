import mongoose from 'mongoose'

/**
 * VerificationToken — single-use email verification tokens.
 * Raw tokens are never stored — only SHA-256 hashes.
 */
const verificationTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// TTL — MongoDB automatically removes expired tokens
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const VerificationToken = mongoose.model('VerificationToken', verificationTokenSchema)
export default VerificationToken
