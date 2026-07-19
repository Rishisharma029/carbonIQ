import mongoose from 'mongoose'

const idempotentRequestSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    endpoint: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ['processing', 'completed'],
      required: true,
      default: 'processing',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Compound unique index to scope idempotency by user, endpoint, and key
idempotentRequestSchema.index({ userId: 1, endpoint: 1, key: 1 }, { unique: true })

// TTL index — MongoDB automatically deletes records when expiresAt is reached (24-hour default)
idempotentRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const IdempotentRequest = mongoose.model('IdempotentRequest', idempotentRequestSchema)
export default IdempotentRequest
