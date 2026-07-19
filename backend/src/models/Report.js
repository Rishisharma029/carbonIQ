import mongoose from 'mongoose'

/**
 * Report — stores only metadata. Generated file binaries live in object storage.
 * The storagePath field holds the object storage key or file path.
 */
const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerId: {
      type: String,
      default: null,
    },
    ownerType: {
      type: String,
      enum: ['User', 'Organization'],
      default: 'User',
    },
    type: {
      type: String,
      enum: ['pdf', 'csv'],
      required: true,
    },
    period: {
      type: String,
      default: null,
    },
    storagePath: {
      type: String,
      default: null,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
  }
)

reportSchema.index({ userId: 1, generatedAt: -1 })

export const Report = mongoose.model('Report', reportSchema)
export default Report
