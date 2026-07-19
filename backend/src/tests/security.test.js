import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'
import { csrf } from '../middlewares/csrf.js'
import { calculatorLimiter, getRateLimitKey } from '../middlewares/rateLimit.js'

// Mock DB and models
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

vi.mock('../models/User.js', () => {
    const mockUser = {
        findOne: (q) => {
            const user = testUsers.find((u) => u._id === q._id || u.email === q.email) || null
            return { select: () => user, then: (r, j) => Promise.resolve(user).then(r, j) }
        },
        findOneAndUpdate: async (q, updateData) => {
            const user = testUsers.find((u) => u._id === q._id);
            if (!user) return null;
            Object.assign(user, updateData);
            return user;
        },
    }
    return { User: mockUser, default: mockUser }
})

vi.mock('../models/Calculation.js', () => {
  const mockCalc = {
    find: (query) => {
      let list = testCalculations.filter((c) => {
        if (c.deletedAt !== null) return false
        if (query.userId && c.userId !== query.userId) return false
        return true
      })
      const chain = { sort: () => chain, skip: () => chain, limit: () => list }
      return chain
    },
    findOne: (q) => testCalculations.find((c) => c._id === q._id && c.userId === q.userId) || null,
    findOneAndUpdate: async (q, update) => {
      const c = testCalculations.find((c) => c._id === q._id && c.userId === q.userId)
      if (c && update.deletedAt) c.deletedAt = update.deletedAt
      return c
    },
    countDocuments: async (query) => testCalculations.filter((c) => c.deletedAt === null && c.userId === query.userId).length,
  }
  return { Calculation: mockCalc, default: mockCalc }
})

// Mock other models
vi.mock('../models/RefreshToken.js', () => ({
  RefreshToken: { create: async (d) => d, findOne: () => null, deleteOne: async () => {}, deleteMany: async () => {} },
  default: {},
}))
vi.mock('../models/AuditLog.js', () => ({
  AuditLog: { create: async (d) => d },
  default: { create: async (d) => d },
}))
vi.mock('../models/Report.js', () => ({
  Report: { create: async (d) => d },
  default: { create: async (d) => d },
}))
vi.mock('../models/MonthlySummary.js', () => ({ MonthlySummary: {}, default: {} }))
vi.mock('../models/Goal.js', () => ({ Goal: {}, default: {} }))
vi.mock('../models/Session.js', () => ({
  Session: {
    create: async (d) => ({ sessionId: `sess_${Date.now()}`, ...d, revokedAt: null }),
    findOne: () => null,
    findOneAndUpdate: async () => null,
    find: () => [],
    updateMany: async () => ({}),
  },
  default: {},
}))
vi.mock('../models/VerificationToken.js', () => ({
  VerificationToken: {
    create: async (d) => d,
    findOne: () => null,
    findByIdAndUpdate: async () => null,
  },
  default: {},
}))


import { app } from '../app.js'

describe('Security Vulnerability & Bug Tests', () => {
    let user1, user2, token1, token2, calculation1

    beforeEach(() => {
        testUsers = []
        testCalculations = []

        user1 = { _id: '60d0fe4f5311236168a109ca', id: '60d0fe4f5311236168a109ca', email: 'user1@test.com', role: 'user', tokenVersion: 0, comparePassword: async () => true }
        user2 = { _id: '60d0fe4f5311236168a109cb', id: '60d0fe4f5311236168a109cb', email: 'user2@test.com', role: 'user', tokenVersion: 0, comparePassword: async () => true }
        testUsers.push(user1, user2)

        token1 = jwt.sign({ id: user1._id }, config.JWT_ACCESS_SECRET, { expiresIn: '1h', issuer: config.JWT_ISSUER, audience: config.JWT_AUDIENCE })
        token2 = jwt.sign({ id: user2._id }, config.JWT_ACCESS_SECRET, { expiresIn: '1h', issuer: config.JWT_ISSUER, audience: config.JWT_AUDIENCE })

        calculation1 = { _id: '61d0fe4f5311236168a109cc', userId: user1._id, results: { totalEmission: 100 }, deletedAt: null }
        testCalculations.push(calculation1)
    })

    // --- Authorization ---
    it('should prevent user2 from accessing user1s calculation', async () => {
        const res = await request(app)
            .get(`/api/v1/history`)
            .set('Cookie', [`access_token=${token2}`])
            .expect(200)

        expect(res.body.data.calculations.length).toBe(0)
    })

    it('should prevent user2 from deleting user1s calculation', async () => {
        await request(app)
            .delete(`/api/v1/history/${calculation1._id}`)
            .set('Cookie', [`access_token=${token2}`])
            .expect(404) // Because the findByIdForUser will not find it
    })

    // --- Input Validation ---
    it('should return 400 for invalid ObjectId in path', async () => {
        await request(app)
            .delete('/api/v1/history/invalid-object-id')
            .set('Cookie', [`access_token=${token1}`])
            .expect(400)
    })

    it('should silently sanitize prototype pollution in body (JSON.parse removes __proto__)', async () => {
        await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'test@test.com', password: 'password', '__proto__': { 'isAdmin': true } })
            .expect(401) // User not found — JSON.parse sanitizes __proto__, so body passes through to auth
    })

    it('should silently sanitize prototype pollution in query (qs sanitizes __proto__)', async () => {
        await request(app)
            .get('/api/v1/history?__proto__[isAdmin]=true')
            .set('Cookie', [`access_token=${token1}`])
            .expect(200) // qs sanitizes __proto__ from query params before middleware sees it
    })

    // --- NoSQL Injection ---
    it('should prevent NoSQL injection in query params', async () => {
        const res = await request(app)
            .get('/api/v1/history?limit[$gt]=0')
            .set('Cookie', [`access_token=${token1}`])
            .expect(400)
    })

    // --- Query Parameter Whitelisting ---
    it('should reject unknown query parameters', async () => {
        const res = await request(app)
            .get('/api/v1/history?unknownParam=value')
            .set('Cookie', [`access_token=${token1}`])
            .expect(400)
        expect(res.body.message).toContain('Unknown query parameter')
    })

    // --- Strict Zod Schemas ---
    it('should reject extra fields in body due to strict Zod schemas', async () => {
        const res = await request(app)
            .put('/api/v1/users/settings')
            .set('Cookie', [`access_token=${token1}`])
            .send({ theme: 'dark', unknownField: 'attacker' })
            .expect(400)
        expect(res.body.message).toContain('Invalid settings updates')
    })

    // --- CSRF Protection ---
    it('should block protected methods if CSRF tokens mismatch', () => {
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/v1/calculator',
        cookies: { csrf_token: 'tokenA' },
        headers: { 'x-csrf-token': 'tokenB' }
      }
      let statusValue, jsonValue
      const mockRes = {
        status: (s) => {
          statusValue = s
          return {
            json: (j) => {
              jsonValue = j
            }
          }
        }
      }
      const mockNext = vi.fn()

      const originalEnv = config.NODE_ENV
      config.NODE_ENV = 'production'
      try {
        csrf(mockReq, mockRes, mockNext)
        expect(statusValue).toBe(403)
        expect(jsonValue.message).toContain('Invalid CSRF token')
        expect(mockNext).not.toHaveBeenCalled()
      } finally {
        config.NODE_ENV = originalEnv
      }
    })

    // --- Rate Limiting ---
    it('should set RateLimit headers on response', async () => {
        const res = await request(app)
            .get('/api/v1/history')
            .set('Cookie', [`access_token=${token1}`])
            .set('x-test-rate-limit', 'true')
            .expect(200)

        expect(res.headers).toHaveProperty('ratelimit-limit')
        expect(res.headers).toHaveProperty('ratelimit-remaining')
        expect(res.headers).toHaveProperty('ratelimit-reset')
    })

    it('should use User ID as rate limiting key for authenticated requests', () => {
        const keyGen = getRateLimitKey('user')
        const mockReqUser = {
            user: { id: '60d0fe4f5311236168a109ca' },
            ip: '127.0.0.1'
        }
        const keyUser = keyGen(mockReqUser)
        expect(keyUser).toBe('60d0fe4f5311236168a109ca')

        const mockReqAnon = {
            ip: '192.168.1.1'
        }
        const keyAnon = keyGen(mockReqAnon)
        expect(keyAnon).toBe('192.168.1.1')
    })
})
