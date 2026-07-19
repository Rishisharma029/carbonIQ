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
let testSummaries = []

vi.mock('../models/User.js', () => {
  const mockUser = { findOne: (q) => testUsers.find((u) => u._id === q._id) || null }
  return { User: mockUser, default: mockUser }
})

vi.mock('../models/Calculation.js', () => {
  const mockCalc = {
    find: (query) => {
      let list = testCalculations.filter((c) => {
        if (c.deletedAt !== null) return false
        if (query.userId && c.userId !== query.userId) return false
        const catKey = Object.keys(query).find((k) => k.startsWith('results.'))
        if (catKey) {
          const val = query[catKey]?.$gt
          if (val !== undefined && (c.results[catKey.split('.')[1]] || 0) <= val) return false
        }
        return true
      })
      const chain = { sort: () => chain, skip: () => chain, limit: () => list }
      return chain
    },
    findOne: (q) => testCalculations.find((c) => c._id === q._id) || null,
    findOneAndUpdate: async (q, update) => {
      const c = testCalculations.find((c) => c._id === q._id)
      if (c && update.deletedAt) c.deletedAt = update.deletedAt
      return c
    },
    countDocuments: async () => testCalculations.filter((c) => c.deletedAt === null).length,
  }
  return { Calculation: mockCalc, default: mockCalc }
})

vi.mock('../models/MonthlySummary.js', () => {
  const mockSummary = {
    find: (q) => {
      const list = testSummaries.filter((s) => s.userId === q.userId)
      return { sort: () => list }
    },
    findOneAndUpdate: async (q, update) => {
      let s = testSummaries.find((x) => x.userId === q.userId && x.year === q.year && x.month === q.month)
      if (!s) {
        s = { userId: q.userId, year: q.year, month: q.month, transport: 0, electricity: 0, food: 0, waste: 0, totalEmission: 0, averageScore: 0, calculationCount: 0 }
        testSummaries.push(s)
      }
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) s[k] = (s[k] || 0) + v
      }
      return s
    },
  }
  return { MonthlySummary: mockSummary, default: mockSummary }
})

vi.mock('../models/Goal.js', () => {
  const mockGoal = {
    find: () => {
      const chain = { sort: () => chain, skip: () => chain, limit: () => chain, then: (r) => r([]) }
      return chain
    },
    findOneAndUpdate: async () => ({}),
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

describe('History & Dashboard API Integration Tests', () => {
  let mockUser, authToken

  beforeEach(() => {
    testUsers = []
    testCalculations = []
    testSummaries = []

    mockUser = { _id: 'usr_test123', id: 'usr_test123', fullName: 'John Doe', email: 'john@example.com', role: 'user', tokenVersion: 0 }
    testUsers.push(mockUser)
    authToken = jwt.sign({ id: mockUser._id, role: 'user', tokenVersion: 0 }, config.JWT_SECRET, { expiresIn: '1h' })

    testCalculations.push(
      { _id: '507f1f77bcf86cd799439011', userId: mockUser._id, inputs: {}, results: { transportEmission: 2.0, electricityEmission: 1.0, foodEmission: 1.5, wasteEmission: 0.5, totalEmission: 5.0 }, score: 48, createdAt: new Date().toISOString(), deletedAt: null },
      { _id: '507f1f77bcf86cd799439012', userId: mockUser._id, inputs: {}, results: { transportEmission: 1.2, electricityEmission: 0.8, foodEmission: 2.2, wasteEmission: 0.8, totalEmission: 5.0 }, score: 48, createdAt: new Date().toISOString(), deletedAt: null }
    )

    testSummaries.push({
      userId: mockUser._id,
      year: new Date().getUTCFullYear(),
      month: new Date().getUTCMonth() + 1,
      transport: 3.2, electricity: 1.8, food: 3.7, waste: 1.3,
      totalEmission: 10.0, averageScore: 96, calculationCount: 2,
    })
  })

  it('GET /api/v1/history should return paginated logs', async () => {
    const res = await request(app)
      .get('/api/v1/history')
      .set('Cookie', [`access_token=${authToken}`])
      .expect(200)

    expect(res.body.status).toBe('success')
    expect(res.body.data.calculations).toHaveLength(2)
    expect(res.body.data.pagination.total).toBe(2)
  })

  it('GET /api/v1/dashboard should return metrics averages and summaries', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard')
      .set('Cookie', [`access_token=${authToken}`])
      .expect(200)

    expect(res.body.status).toBe('success')
    expect(res.body.data.averages.totalEmission).toBe(10.0)
    expect(res.body.data.monthlySummaries).toHaveLength(1)
  })

  it('DELETE /api/v1/history/:id should soft-delete calculation and adjust summary values', async () => {
    const res = await request(app)
      .delete('/api/v1/history/507f1f77bcf86cd799439011')
      .set('Cookie', [`access_token=${authToken}`])
      .expect(200)

    expect(res.body.status).toBe('success')

    const summary = testSummaries[0]
    expect(summary.totalEmission).toBeCloseTo(5.0)
    expect(summary.calculationCount).toBe(1)

    const deleted = testCalculations.find((c) => c._id === '507f1f77bcf86cd799439011')
    expect(deleted.deletedAt).not.toBeNull()
  })
})
