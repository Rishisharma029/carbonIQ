import mongoose from 'mongoose'

const monthlySummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    transport: {
      type: Number,
      default: 0,
    },
    electricity: {
      type: Number,
      default: 0,
    },
    food: {
      type: Number,
      default: 0,
    },
    waste: {
      type: Number,
      default: 0,
    },
    totalEmission: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    calculationCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Unique compound index — one summary doc per user per month
monthlySummarySchema.index({ userId: 1, year: 1, month: 1 }, { unique: true })

export const MonthlySummary = mongoose.model('MonthlySummary', monthlySummarySchema)
export default MonthlySummary
