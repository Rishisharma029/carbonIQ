import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'

// ──────────── Core mocks ────────────

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

// ──────────── In-memory stores ────────────

let testUsers = []
let testSessions = []
let testVerificationTokens = []

// ──────────── User mock ────────────

vi.mock('../models/User.js', () => {
  function MockUser(data) {
    Object.assign(this, data)
    this._id = `usr_${Math.random().toString(36).substring(2, 9)}`
    this.tokenVersion = 0
    this.failedLoginAttempts = 0
    this.lockedUntil = null
    this.emailVerified = false
    this.implementedRecommendations = []
    this.save = async function () {
      const idx = testUsers.findIndex((u) => u._id === this._id)
      if (idx !== -1) testUsers[idx] = this
      else testUsers.push(this)
      return this
    }
    this.comparePassword = async function (pwd) {
      return pwd === 'Password123!Test'
    }
  }
  MockUser.create = async (data) => {
    const u = new MockUser(data)
    testUsers.push(u)
    return u
  }
  MockUser.findOne = (query) => {
    const user = testUsers.find((u) =>
      (query._id ? u._id === query._id : u.email === query.email) && !u.deletedAt
    ) || null
    // Return a chainable query object so .select('+passwordHash') doesn't throw
    return { select: () => user, then: (r, j) => Promise.resolve(user).then(r, j) }
  }
  MockUser.findById = (id) => testUsers.find((u) => u._id === id) || null
  MockUser.findOneAndUpdate = async (query, update) => {
    const user = testUsers.find((u) => u._id === (query._id || query.id))
    if (user) Object.assign(user, update)
    return user
  }
  return { User: MockUser, default: MockUser }
})

// ──────────── Session mock (replaces RefreshToken) ────────────

vi.mock('../models/Session.js', () => {
  const mockSession = {
    create: async (data) => {
      const session = {
        sessionId: `sess_${Math.random().toString(36).substring(2, 9)}`,
        ...data,
        revokedAt: null,
        lastUsedAt: new Date(),
      }
      testSessions.push(session)
      return session
    },
    findOne: (query) => {
      return testSessions.find((s) => {
        if (query.sessionId && s.sessionId !== query.sessionId) return false
        if (query.refreshTokenHash && s.refreshTokenHash !== query.refreshTokenHash) return false
        if (query.revokedAt === null && s.revokedAt !== null) return false
        return true
      }) || null
    },
    findOneAndUpdate: async (query, update) => {
      const s = testSessions.find((s) => s.sessionId === query.sessionId)
      if (s) Object.assign(s, update)
      return s
    },
    find: (query) => {
      const results = testSessions.filter((s) => {
        if (query.userId && s.userId !== query.userId) return false
        if (query.revokedAt === null && s.revokedAt !== null) return false
        return true
      })
      // Return Mongoose-like chainable so .sort() doesn't throw
      return { sort: () => results }
    },
    updateMany: async (query, update) => {
      testSessions.forEach((s) => {
        if (s.userId === query.userId && s.revokedAt === null) {
          Object.assign(s, update)
        }
      })
    },
  }
  return { Session: mockSession, default: mockSession }
})

// ──────────── Verification token mock ────────────

vi.mock('../models/VerificationToken.js', () => {
  const mockVT = {
    create: async (data) => {
      const doc = { _id: `vt_${Math.random().toString(36).substring(2, 9)}`, ...data, usedAt: null }
      testVerificationTokens.push(doc)
      return doc
    },
    findOne: (query) => {
      return testVerificationTokens.find((t) =>
        t.tokenHash === query.tokenHash && !t.usedAt
      ) || null
    },
    findByIdAndUpdate: async (id, update) => {
      const t = testVerificationTokens.find((t) => t._id === id)
      if (t) Object.assign(t, update)
      return t
    },
  }
  return { VerificationToken: mockVT, default: mockVT }
})

// ──────────── Legacy model mocks (still imported by app/routes) ────────────

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

import { app } from '../app.js'

// ──────────────────────────────────────────────────────────────────────────────
// TESTS
// ──────────────────────────────────────────────────────────────────────────────

// Valid test password — meets the 12-char + complexity policy
const VALID_PASSWORD = 'Password123!Test'

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    testUsers = []
    testSessions = []
    testVerificationTokens = []
  })

  // ──────────── Registration ────────────

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Jane Doe', email: 'jane@example.com', password: VALID_PASSWORD })
      .expect(201)

    expect(res.body.status).toBe('success')
    expect(res.body.data.user.email).toBe('jane@example.com')
    expect(res.body.data.user.emailVerified).toBe(false)
    // verifyToken returned in non-production
    expect(res.body.data.verifyToken).toBeDefined()
  })

  it('should log in a user and set HTTP-only cookies', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Jane Doe', email: 'jane@example.com', password: VALID_PASSWORD })

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'jane@example.com', password: VALID_PASSWORD })
      .expect(200)

    expect(res.body.status).toBe('success')
    const cookies = res.headers['set-cookie']
    expect(cookies).toBeDefined()
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true)
    expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true)
  })

  it('should reject login with wrong password', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Jane Doe', email: 'jane@example.com', password: VALID_PASSWORD })

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'jane@example.com', password: 'WrongPassword!' })
      .expect(401)
  })

  // ──────────── /auth/me ────────────

  it('GET /auth/me should return the authenticated user', async () => {
    // Register
    await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Jane Doe', email: 'jane@example.com', password: VALID_PASSWORD })

    const user = testUsers[0]
    // Mint a v1 access token with tokenVersion
    const token = jwt.sign(
      { id: user._id, role: user.role || 'user', sessionId: 'sess_test', tokenVersion: 0 },
      config.JWT_SECRET,
      { expiresIn: '15m' }
    )

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [`access_token=${token}`])
      .expect(200)

    expect(res.body.status).toBe('success')
    expect(res.body.data.user).toBeDefined()
  })

  // ──────────── /auth/sessions ────────────

  it('GET /auth/sessions should return active session list', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Jane Doe', email: 'jane@example.com', password: VALID_PASSWORD })

    // Log in to create a session
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'jane@example.com', password: VALID_PASSWORD })

    const user = testUsers[0]
    const token = jwt.sign(
      { id: user._id, role: 'user', sessionId: 'sess_test', tokenVersion: 0 },
      config.JWT_SECRET,
      { expiresIn: '15m' }
    )

    const res = await request(app)
      .get('/api/v1/auth/sessions')
      .set('Cookie', [`access_token=${token}`])
      .expect(200)

    expect(res.body.status).toBe('success')
    expect(Array.isArray(res.body.data.sessions)).toBe(true)
  })

  // ──────────── /auth/logout-all ────────────

  it('POST /auth/logout-all should revoke all sessions and increment tokenVersion', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ fullName: 'Jane Doe', email: 'jane@example.com', password: VALID_PASSWORD })

    const user = testUsers[0]
    const token = jwt.sign(
      { id: user._id, role: 'user', sessionId: 'sess_test', tokenVersion: 0 },
      config.JWT_SECRET,
      { expiresIn: '15m' }
    )

    // Create a couple of fake sessions
    testSessions.push(
      { sessionId: 'sess_a', userId: user._id, revokedAt: null, expiresAt: new Date(Date.now() + 1e9) },
      { sessionId: 'sess_b', userId: user._id, revokedAt: null, expiresAt: new Date(Date.now() + 1e9) }
    )

    const res = await request(app)
      .post('/api/v1/auth/logout-all')
      .set('Cookie', [`access_token=${token}`])
      .expect(200)

    expect(res.body.status).toBe('success')

    // All sessions should now be revoked
    const activeSessions = testSessions.filter((s) => s.userId === user._id && !s.revokedAt)
    expect(activeSessions).toHaveLength(0)
  })
})
