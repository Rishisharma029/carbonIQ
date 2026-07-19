import mongoose from 'mongoose'

const goalSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['transport', 'electricity', 'food', 'waste', 'total'],
      required: true,
    },
    targetReduction: {
      type: Number,
      required: true,
    },
    baselineEmission: {
      type: Number,
      required: true,
    },
    currentEmission: {
      type: Number,
      required: true,
    },
    // Stored progress percentage: (1 - currentEmission/baselineEmission) * 100
    progress: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'achieved', 'failed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
)

goalSchema.index({ userId: 1, status: 1 })

export const Goal = mongoose.model('Goal', goalSchema)
export default Goal
