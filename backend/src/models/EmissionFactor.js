import mongoose from 'mongoose'

const emissionFactorSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      index: true,
    },
    subCategory: {
      type: String,
      required: true,
      index: true,
    },
    activity: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
      index: true,
    },
    fuelType: {
      type: String,
      default: null,
      enum: ['petrol', 'diesel', 'cng', 'electric', 'lpg', 'png', 'kerosene', 'coal', 'firewood', 'biomass', 'hybrid', 'gasoline', null],
    },
    vehicleClass: {
      type: String,
      default: null,
      enum: ['suv', 'hatchback', 'sedan', 'motorcycle', 'scooter', 'auto_rickshaw', 'taxi', null],
    },
    state: {
      type: String,
      default: null,
      index: true,
    },
    country: {
      type: String,
      required: true,
      default: 'IN',
      index: true,
    },
    factor: {
      type: Number,
      required: true,
    },
    // Backwards-compatibility field mapping to factor
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    publicationYear: {
      type: Number,
      required: true,
    },
    version: {
      type: String,
      required: true,
      index: true,
    },
    confidence: {
      type: String,
      required: true,
      enum: ['High', 'Medium', 'Low'],
    },
    methodology: {
      type: String,
      required: true,
    },
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Compound indexes for fast, targeted runtime lookup & uniqueness enforcement
emissionFactorSchema.index(
  { category: 1, subCategory: 1, key: 1, state: 1, version: 1, isActive: 1 },
  { name: 'idx_lookup_active_factor' }
)

emissionFactorSchema.index(
  { category: 1, subCategory: 1, activity: 1, fuelType: 1, vehicleClass: 1, state: 1, version: 1, isActive: 1 },
  { name: 'idx_lookup_detailed_factor' }
)

export const EmissionFactor = mongoose.model('EmissionFactor', emissionFactorSchema)
export default EmissionFactor
