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
let testGoals = []

vi.mock('../models/User.js', () => {
  const mockUser = {
    findOne: (q) => testUsers.find((u) => u._id === q._id) || null,
    findById: (id) => testUsers.find((u) => u._id === id) || null,
  }
  return { User: mockUser, default: mockUser }
})

vi.mock('../models/Calculation.js', () => {
  const mockCalc = {
    find: (q) => {
      const list = testCalculations.filter((c) => c.userId === q.userId && c.deletedAt === null)
      const chain = { sort: () => chain, skip: () => chain, limit: () => list }
      return chain
    },
    findOne: (q) => testCalculations.find((c) => c._id === q._id) || null,
  }
  return { Calculation: mockCalc, default: mockCalc }
})

vi.mock('../models/Goal.js', () => {
  const mockGoal = {
    create: async (data) => {
      const g = { _id: `goal_${Math.random().toString(36).substring(2, 9)}`, ...data }
      testGoals.push(g)
      return g
    },
    find: (q) => {
      let list = testGoals.filter((g) => g.userId === q.userId)
      if (q.status === 'active') list = list.filter((g) => g.status === 'active')
      return list
    },
    findOneAndUpdate: async (q, update) => {
      const g = testGoals.find((g) => g._id === q._id)
      if (g) Object.assign(g, update)
      return g
    },
  }
  return { Goal: mockGoal, default: mockGoal }
})

vi.mock('../models/MonthlySummary.js', () => ({
  MonthlySummary: { findOneAndUpdate: async () => ({}) },
  default: { findOneAndUpdate: async () => ({}) },
}))

vi.mock('../models/AuditLog.js', () => ({
  AuditLog: { create: async (d) => d },
  default: { create: async (d) => d },
}))

vi.mock('../models/Report.js', () => ({
  Report: { create: async (d) => d },
  default: { create: async (d) => d },
}))

import { app } from '../app.js'

describe('Reports & Goals API Integration Tests', () => {
  let mockUser, authToken

  beforeEach(() => {
    testUsers = []
    testCalculations = []
    testGoals = []

    mockUser = {
      _id: 'usr_test123', id: 'usr_test123', fullName: 'John Doe',
      email: 'john@example.com', role: 'user',
      tokenVersion: 0,
      implementedRecommendations: [],
      save: async function () { return this },
    }
    testUsers.push(mockUser)
    authToken = jwt.sign({ id: mockUser._id, role: 'user', tokenVersion: 0 }, config.JWT_SECRET, { expiresIn: '1h' })

    testCalculations.push({
      _id: 'calc_001', userId: mockUser._id, inputs: {},
      results: { transportEmission: 4.5, electricityEmission: 2.0, foodEmission: 1.5, wasteEmission: 0.5, totalEmission: 8.5 },
      score: 11, createdAt: new Date().toISOString(), deletedAt: null,
    })
  })

  it('POST /api/v1/goals should configure new target goal and initialize currentEmission', async () => {
    const res = await request(app)
      .post('/api/v1/goals')
      .set('Cookie', [`access_token=${authToken}`])
      .send({
        title: 'Reduce transport footprint',
        category: 'transport',
        targetReduction: 3.0,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201)

    expect(res.body.status).toBe('success')
    expect(res.body.data.goal.currentEmission).toBe(4.5)
    expect(res.body.data.goal.status).toBe('active')
    expect(res.body.data.goal.title).toBe('Reduce transport footprint')
  })

  it('POST /api/v1/recommendations/toggle should apply offsets and update goal', async () => {
    // 1. Create food goal (current: 1.5, target: 1.0)
    await request(app)
      .post('/api/v1/goals')
      .set('Cookie', [`access_token=${authToken}`])
      .send({
        title: 'Eat more plants',
        category: 'food',
        targetReduction: 1.0,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

    // 2. Toggle "Adopt a plant-based diet" (rec_5: offset 0.8 tons)
    const res = await request(app)
      .post('/api/v1/recommendations/toggle')
      .set('Cookie', [`access_token=${authToken}`])
      .send({ id: 'rec_5' })
      .expect(200)

    expect(res.body.status).toBe('success')
    expect(res.body.data.implemented).toBe(true)

    // 3. Food goal currentEmission 1.5 - 0.8 = 0.7 <= 1.0 → achieved
    const goal = testGoals.find((g) => g.category === 'food')
    expect(goal.currentEmission).toBeCloseTo(0.7)
    expect(goal.status).toBe('achieved')
  })

  it('GET /api/v1/reports/csv should return CSV with correct headers', async () => {
    const res = await request(app)
      .get('/api/v1/reports/csv')
      .set('Cookie', [`access_token=${authToken}`])
      .expect('Content-Type', /text\/csv/)
      .expect(200)

    expect(res.text).toContain('DATE')
    expect(res.text).toContain('TRANSPORT')
    expect(res.text).toContain('TOTAL EMISSION')
    expect(res.text).toContain('SCORE')
  })

  it('GET /api/v1/reports/pdf should stream a PDF document', async () => {
    const res = await request(app)
      .get('/api/v1/reports/pdf')
      .set('Cookie', [`access_token=${authToken}`])
      .expect('Content-Type', /application\/pdf/)
      .expect(200)

    expect(res.body).toBeDefined()
  })
})
