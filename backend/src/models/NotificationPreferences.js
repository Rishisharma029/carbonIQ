import mongoose from 'mongoose'

const notificationPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    weeklySummary: {
      type: Boolean,
      default: true,
    },
    goalReminder: {
      type: Boolean,
      default: true,
    },
    reportReady: {
      type: Boolean,
      default: true,
    },
    emailEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

export const NotificationPreferences = mongoose.model(
  'NotificationPreferences',
  notificationPreferencesSchema
)
export default NotificationPreferences
