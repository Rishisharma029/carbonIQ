import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    preferredUnit: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric',
    },
    country: {
      type: String,
      trim: true,
      default: null,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    implementedRecommendations: {
      type: [String],
      default: [],
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // Auth v1 — token versioning and account protection
    tokenVersion: {
      type: Number,
      default: 0,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    // OAuth-ready fields (future)
    provider: {
      type: String,
      enum: ['local', 'google', 'github', 'microsoft'],
      default: 'local',
    },
    providerId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Partial unique index: email uniqueness only among non-deleted users
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  const salt = await bcryptjs.genSalt(10)
  this.passwordHash = await bcryptjs.hash(this.passwordHash, salt)
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.passwordHash)
}

export const User = mongoose.model('User', userSchema)
export default User
