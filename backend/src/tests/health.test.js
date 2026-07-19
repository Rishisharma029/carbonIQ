import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'

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
    // Expose connection.readyState so health route doesn't throw
    connection: { readyState: 1 },
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

vi.mock('../models/User.js', () => ({ User: {}, default: {} }))
vi.mock('../models/Calculation.js', () => ({ Calculation: {}, default: {} }))
vi.mock('../models/MonthlySummary.js', () => ({ MonthlySummary: {}, default: {} }))
vi.mock('../models/Goal.js', () => ({ Goal: {}, default: {} }))
vi.mock('../models/RefreshToken.js', () => ({ RefreshToken: {}, default: {} }))
vi.mock('../models/AuditLog.js', () => ({
  AuditLog: { create: async () => {} },
  default: { create: async () => {} },
}))
vi.mock('../models/Report.js', () => ({
  Report: { create: async () => {} },
  default: { create: async () => {} },
}))

import { app } from '../app.js'

describe('Health API Integration Tests', () => {
  it('GET /api/v1/health should return status ok', async () => {
    const res = await request(app).get('/api/v1/health').expect(200)
    expect(res.body.status).toBe('success')
  })
})
