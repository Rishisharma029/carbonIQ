import mongoose from 'mongoose'

const calculationSchema = new mongoose.Schema(
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
    inputs: {
      transport: {
        carDistance: { type: Number, default: 0 },
        carFuelType: { type: String, default: 'none' },
        transitHours: { type: Number, default: 0 },
        flightHours: { type: Number, default: 0 },
      },
      electricity: {
        gridConsumption: { type: Number, default: 0 },
        cleanEnergyShare: { type: Number, default: 0 },
      },
      food: {
        dietType: { type: String, default: 'balanced' },
        organicShare: { type: Number, default: 0 },
      },
      waste: {
        landfillBags: { type: Number, default: 0 },
        recycledPaper: { type: Boolean, default: false },
        recycledPlastic: { type: Boolean, default: false },
        recycledGlass: { type: Boolean, default: false },
      },
      water: {
        consumptionLitres: { type: Number, default: 0 },
      },
      gas: {
        consumptionM3: { type: Number, default: 0 },
      },
    },
    results: {
      transportEmission: { type: Number, required: true },
      electricityEmission: { type: Number, required: true },
      foodEmission: { type: Number, required: true },
      wasteEmission: { type: Number, required: true },
      waterEmission: { type: Number, default: 0 },
      gasEmission: { type: Number, default: 0 },
      totalEmission: { type: Number, required: true },
      recommendationSummary: { type: String, default: null },
    },
    explainability: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    score: {
      type: Number,
      default: null,
    },
    factorVersion: {
      type: String,
      default: null,
    },
    schemaVersion: {
      type: Number,
      default: 2,
    },
    createdByVersion: {
      type: String,
      default: '1.0.0',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Index catalog per v2 spec
calculationSchema.index({ userId: 1, createdAt: -1 })
calculationSchema.index({ userId: 1, factorVersion: 1 })
calculationSchema.index({ userId: 1, deletedAt: 1 })

export const Calculation = mongoose.model('Calculation', calculationSchema)
export default Calculation
