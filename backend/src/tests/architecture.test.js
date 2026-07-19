import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'
import { app } from '../app.js'

// ──────────── Core Mocks ────────────

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
    connection: {
      readyState: 1,
      db: {
        admin: () => ({
          ping: async () => true,
        }),
      },
    },
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

// Mocks for database lists
let testIdempotentRequests = []

vi.mock('../models/IdempotentRequest.js', () => {
  function MockIdempotentRequest(data) {
    Object.assign(this, data)
    this._id = `idemp_${Math.random().toString(36).substring(2, 9)}`
    this.save = async function () {
      const idx = testIdempotentRequests.findIndex((r) => r.key === this.key)
      if (idx !== -1) testIdempotentRequests[idx] = this
      else testIdempotentRequests.push(this)
      return this
    }
  }

  MockIdempotentRequest.create = async (data) => {
    const doc = new MockIdempotentRequest(data)
    testIdempotentRequests.push(doc)
    return doc
  }

  MockIdempotentRequest.findOne = async (query) => {
    return testIdempotentRequests.find((r) => r.key === query.key) || null
  }

  MockIdempotentRequest.deleteOne = async (query) => {
    testIdempotentRequests = testIdempotentRequests.filter((r) => r.key !== query.key && r._id !== query._id)
    return { deletedCount: 1 }
  }

  return { IdempotentRequest: MockIdempotentRequest, default: MockIdempotentRequest }
})

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  id: '507f1f77bcf86cd799439011',
  email: 'arch_test@carboniq.com',
  role: 'user',
  tokenVersion: 0,
}

vi.mock('../models/User.js', () => ({
  User: {
    findOne: async (q) => mockUser,
    findById: async (id) => mockUser,
  },
  default: {
    findOne: async (q) => mockUser,
    findById: async (id) => mockUser,
  },
}))
vi.mock('../models/Calculation.js', () => ({
  Calculation: { findOne: async () => null, find: () => ({ sort: () => ({ skip: () => ({ limit: async () => [] }) }) }) },
  default: { findOne: async () => null, find: () => ({ sort: () => ({ skip: () => ({ limit: async () => [] }) }) }) },
}))
vi.mock('../models/Goal.js', () => ({
  Goal: { findOne: async () => null, find: async () => [] },
  default: { findOne: async () => null, find: async () => [] },
}))
vi.mock('../models/MonthlySummary.js', () => ({
  MonthlySummary: { findOne: async () => null, find: async () => [] },
  default: { findOne: async () => null, find: async () => [] },
}))
vi.mock('../models/AuditLog.js', () => ({
  AuditLog: { create: async (d) => d },
  default: { create: async (d) => d },
}))
vi.mock('../models/Report.js', () => ({
  Report: { create: async (d) => d },
  default: { create: async (d) => d },
}))
vi.mock('../models/RefreshToken.js', () => ({
  RefreshToken: { create: async (d) => d },
  default: { create: async (d) => d },
}))

// ──────────────────────────────────────────────────────────────────────────────
// TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe('Architecture & Integration Tests', () => {
  let token

  beforeEach(() => {
    testIdempotentRequests = []
    token = jwt.sign(
      { id: mockUser._id, role: 'user', tokenVersion: 0 },
      config.JWT_ACCESS_SECRET,
      { expiresIn: '1h', issuer: config.JWT_ISSUER, audience: config.JWT_AUDIENCE }
    )
  })

  // ──────────── Health & Diagnostics ────────────

  it('GET /live should return liveness payload', async () => {
    const res = await request(app)
      .get('/live')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.message).toContain('Process is alive')
  })

  it('GET /ready should return readiness payload when DB connected', async () => {
    const res = await request(app)
      .get('/ready')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.message).toContain('connected and ready')
  })

  it('GET /health should return full system diagnostics', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.uptimeSeconds).toBeDefined()
    expect(res.body.data.database.latencyMs).toBeDefined()
  })

  // ──────────── Standard Response Envelopes ────────────

  it('should wrap successful JSON endpoints in the standard envelope', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200)

    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('message')
    expect(res.body).toHaveProperty('data')
    expect(res.body).toHaveProperty('requestId')
  })

  it('should format all exceptions in the standard error envelope', async () => {
    const res = await request(app)
      .get('/api/v1/invalid-route-name-123')
      .expect(404)

    expect(res.body.success).toBe(false)
    expect(res.body.error).toBeDefined()
    expect(res.body.error.code).toBe('NOT_FOUND')
    expect(res.body.error.message).toContain("Can't find")
    expect(res.body.requestId).toBeDefined()
  })

  // ──────────── Idempotency-Key Protocol ────────────

  it('POST with same Idempotency-Key should return cached response on duplicate', async () => {
    // 1. Mock a route endpoint that returns some random value
    // We will POST to /api/v1/calculator which matches our idempotency registration.
    // However, it will fail schema validation if the body is empty, giving a 400.
    // 400 is < 500, so the bad request will be cached.
    const key = 'test-idemp-key-1'

    const res1 = await request(app)
      .post('/api/v1/calculator')
      .set('Cookie', [`access_token=${token}`])
      .set('idempotency-key', key)
      .send({}) // Invalid body leads to Zod validation error (400)
      .expect(400)

    const initialResponse = res1.body

    // 2. Resend request with same key
    const res2 = await request(app)
      .post('/api/v1/calculator')
      .set('Cookie', [`access_token=${token}`])
      .set('idempotency-key', key)
      .send({})
      .expect(400)

    expect(res2.body).toEqual(initialResponse)
  })

  it('POST with duplicate key while processing should return 409 Conflict', async () => {
    const key = 'test-idemp-key-2'

    // Mock active processing record in store
    testIdempotentRequests.push({
      key,
      status: 'processing',
      endpoint: '/api/v1/calculator',
      expiresAt: new Date(Date.now() + 10000),
    })

    const res = await request(app)
      .post('/api/v1/calculator')
      .set('Cookie', [`access_token=${token}`])
      .set('idempotency-key', key)
      .send({})
      .expect(409)

    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('CONFLICT')
  })
})
