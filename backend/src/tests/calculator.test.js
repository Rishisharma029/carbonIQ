import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'

vi.mock('../config/db.js', () => ({
  connectDB: async () => ({ connection: { host: 'mock-localhost' } }),
}))

vi.mock('mongoose', () => {
  const mockMongoose = {
    Schema: class {
      constructor() {}
      index() {}
      static Types = { ObjectId: 'ObjectId' }
    },
    Types: { ObjectId: 'ObjectId' },
    model: () => ({}),
    startSession: async () => ({
      startTransaction: () => {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession: () => {},
    }),
  }
  mockMongoose.Schema.Types = { ObjectId: 'ObjectId' }
  return { default: mockMongoose, ...mockMongoose }
})

let testUsers = []
let testCalculations = []

const testFactors = [
  { _id: 'f1', category: 'transport', key: 'transport_car_gasoline', value: 0.000411, unit: 'tons/mile', source: 'US EPA', version: '2026.1' },
  { _id: 'f1_d', category: 'transport', key: 'transport_car_diesel', value: 0.000452, unit: 'tons/mile', source: 'US EPA', version: '2026.1' },
  { _id: 'f1_h', category: 'transport', key: 'transport_car_hybrid', value: 0.000247, unit: 'tons/mile', source: 'US EPA', version: '2026.1' },
  { _id: 'f1_e', category: 'transport', key: 'transport_car_electric', value: 0.000082, unit: 'tons/mile', source: 'US EPA', version: '2026.1' },
  { _id: 'f2', category: 'transport', key: 'transport_transit', value: 0.00008, unit: 'tons/hour', source: 'US EPA', version: '2026.1' },
  { _id: 'f3', category: 'transport', key: 'transport_flight', value: 0.09, unit: 'tons/hour', source: 'UK DEFRA', version: '2026.1' },
  { _id: 'f4', category: 'electricity', key: 'electricity_grid', value: 0.00038, unit: 'tons/kWh', source: 'US EPA', version: '2026.1' },
  { _id: 'f5', category: 'food', key: 'food_diet_balanced', value: 2.2, unit: 'tons/year', source: 'IPCC', version: '2026.1' },
  { _id: 'f5_mh', category: 'food', key: 'food_diet_meat-heavy', value: 3.3, unit: 'tons/year', source: 'IPCC', version: '2026.1' },
  { _id: 'f5_vg', category: 'food', key: 'food_diet_vegan', value: 1.5, unit: 'tons/year', source: 'IPCC', version: '2026.1' },
  { _id: 'f5_vt', category: 'food', key: 'food_diet_vegetarian', value: 1.7, unit: 'tons/year', source: 'IPCC', version: '2026.1' },
  { _id: 'f6', category: 'waste', key: 'waste_landfill_bag', value: 0.052, unit: 'tons/bag', source: 'IPCC', version: '2026.1' },
  { _id: 'f7', category: 'water', key: 'water_consumption', value: 0.0003, unit: 'tons/Litre', source: 'US EPA', version: '2026.1' },
  { _id: 'f8', category: 'gas', key: 'gas_combustion', value: 0.002, unit: 'tons/m3', source: 'US EPA', version: '2026.1' },
]

vi.mock('../models/User.js', () => {
  const mockUser = {
    findOne: (query) => testUsers.find((u) => u._id === query._id) || null,
  }
  return { User: mockUser, default: mockUser }
})

vi.mock('../models/EmissionFactor.js', () => {
  const mockFactor = {
    find: async () => testFactors,
    countDocuments: async () => testFactors.length,
    findOne: (q) => {
      const found = testFactors.find((f) => f.key === q.key)
      const match = found ? { ...found, factor: found.factor ?? found.value } : null
      return {
        sort: () => ({ then: (resolve) => resolve(match) }),
        then: (resolve) => resolve(match),
      }
    },
  }
  return { EmissionFactor: mockFactor, default: mockFactor }
})

vi.mock('../models/Calculation.js', () => {
  function MockCalculation(data) {
    this._id = `calc_${Math.random().toString(36).substring(2, 9)}`
    Object.assign(this, data)
    this.save = async function () {
      testCalculations.push(this)
      return this
    }
  }
  return { Calculation: MockCalculation, default: MockCalculation }
})

vi.mock('../models/MonthlySummary.js', () => ({
  MonthlySummary: { findOneAndUpdate: async () => ({}) },
  default: { findOneAndUpdate: async () => ({}) },
}))

vi.mock('../models/Goal.js', () => {
  const mockGoal = {
    find: () => {
      const chain = { sort: () => chain, skip: () => chain, limit: () => chain, then: (r) => r([]) }
      return chain
    },
  }
  return { Goal: mockGoal, default: mockGoal }
})

vi.mock('../models/AuditLog.js', () => ({
  AuditLog: { create: async (d) => d },
  default: { create: async (d) => d },
}))

vi.mock('../models/Report.js', () => ({
  Report: { create: async (d) => d },
  default: { create: async (d) => d },
}))

import { app } from '../app.js'

describe('Calculator API Integration Tests', () => {
  let mockUser
  let authToken

  beforeEach(() => {
    testUsers = []
    testCalculations = []

    mockUser = { _id: 'usr_test123', id: 'usr_test123', fullName: 'John Doe', email: 'john@example.com', role: 'user', tokenVersion: 0 }
    testUsers.push(mockUser)
    authToken = jwt.sign({ id: mockUser._id, role: 'user', tokenVersion: 0 }, config.JWT_SECRET, { expiresIn: '1h' })
  })

  it('POST /api/v1/calculator should fail without authentication cookie', async () => {
    await request(app).post('/api/v1/calculator').send({
      transport: { carDistance: 100, carFuelType: 'gasoline', transitHours: 5, flightHours: 10 },
      electricity: { gridConsumption: 300, cleanEnergyShare: 0 },
      food: { dietType: 'balanced', organicShare: 0 },
      waste: { landfillBags: 2, recycledPaper: false, recycledPlastic: false, recycledGlass: false },
    }).expect(401)
  })

  it('POST /api/v1/calculator should perform calculations and persist entries successfully', async () => {
    const payload = {
      transport: { carDistance: 100, carFuelType: 'gasoline', transitHours: 5, flightHours: 10 },
      electricity: { gridConsumption: 300, cleanEnergyShare: 50 },
      food: { dietType: 'balanced', organicShare: 20 },
      waste: { landfillBags: 2, recycledPaper: true, recycledPlastic: true, recycledGlass: false },
      water: { consumptionLitres: 1500 },
      gas: { consumptionM3: 50 },
    }

    const res = await request(app)
      .post('/api/v1/calculator')
      .set('Cookie', [`access_token=${authToken}`])
      .send(payload)
      .expect(201)

    expect(res.body.status).toBe('success')
    const { results, score, explainability } = res.body.data.calculation
    expect(results.totalEmission).toBeGreaterThan(0)
    expect(results.transportEmission).toBeDefined()
    expect(results.electricityEmission).toBeDefined()
    expect(results.foodEmission).toBeDefined()
    expect(results.wasteEmission).toBeDefined()
    expect(results.waterEmission).toBe(0.45) // 1500 * 0.0003 = 0.45
    expect(results.gasEmission).toBe(0.1) // 50 * 0.002 = 0.1
    expect(typeof score).toBe('number')
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
    expect(explainability).toBeDefined()
    expect(explainability.largestContributor).toBeDefined()
    expect(explainability.categories.water.confidence.level).toBe('HIGH')
  })
})
