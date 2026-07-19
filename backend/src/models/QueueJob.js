import mongoose from 'mongoose'

const queueJobSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'dlq'],
      required: true,
      default: 'pending',
      index: true,
    },
    attempts: {
      type: Number,
      required: true,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      required: true,
      default: 3,
    },
    nextAttemptAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Index for polling pending jobs efficiently
queueJobSchema.index({ status: 1, nextAttemptAt: 1 })

export const QueueJob = mongoose.model('QueueJob', queueJobSchema)
export default QueueJob
