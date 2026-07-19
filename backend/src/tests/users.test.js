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

vi.mock('../models/User.js', () => {
  const mockUser = {
    findOne: (q) => testUsers.find((u) => u._id === q._id) || null,
    findOneAndUpdate: async (q, updateData) => {
      const user = testUsers.find((u) => u._id === q._id)
      if (!user) return null
      for (const [key, val] of Object.entries(updateData)) {
        user[key] = val
      }
      return user
    },
  }
  return { User: mockUser, default: mockUser }
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

describe('Users API Integration Tests', () => {
  let mockUser, authToken

  beforeEach(() => {
    testUsers = []

    mockUser = {
      _id: 'usr_test123', id: 'usr_test123',
      fullName: 'John Doe', email: 'john@example.com',
      role: 'user', theme: 'system', preferredUnit: 'metric',
      tokenVersion: 0,
      implementedRecommendations: [],
    }
    testUsers.push(mockUser)
    authToken = jwt.sign({ id: mockUser._id, role: 'user', tokenVersion: 0 }, config.JWT_SECRET, { expiresIn: '1h' })
  })

  it('GET /api/v1/users/me should return current authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Cookie', [`access_token=${authToken}`])
      .expect(200)

    expect(res.body.status).toBe('success')
    expect(res.body.data.user).toBeDefined()
  })

  it('PUT /api/v1/users/profile should update user fullName', async () => {
    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Cookie', [`access_token=${authToken}`])
      .send({ fullName: 'Jane Doe' })
      .expect(200)

    expect(res.body.status).toBe('success')
    expect(res.body.data.user.fullName).toBe('Jane Doe')
  })

  it('PUT /api/v1/users/settings should update theme and preferredUnit', async () => {
    const res = await request(app)
      .put('/api/v1/users/settings')
      .set('Cookie', [`access_token=${authToken}`])
      .send({ theme: 'dark', preferredUnit: 'imperial' })
      .expect(200)

    expect(res.body.status).toBe('success')
    expect(res.body.data.user.theme).toBe('dark')
    expect(res.body.data.user.preferredUnit).toBe('imperial')
  })
})
