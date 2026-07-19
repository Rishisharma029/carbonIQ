import mongoose from 'mongoose'

/**
 * SystemSettings — global singleton key/value store.
 * Stores configuration such as default factor version, maintenance mode flag, etc.
 */
const systemSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

export const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema)
export default SystemSettings
