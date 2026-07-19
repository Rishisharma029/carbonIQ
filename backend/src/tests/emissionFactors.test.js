import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'

// --- CORE MOCKS ---

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

// --- DATA ARRAYS ---
let testUsers = []
let testFactors = []
let testAuditLogs = []

// Mock User Model
vi.mock('../models/User.js', () => {
  const mockUser = {
    findOne: (q) => {
      const criteria = q?._conditions || q || {}
      const user = testUsers.find((u) => {
        if (criteria._id && u._id === criteria._id) return true
        if (criteria.email && u.email === criteria.email) return true
        return false
      }) || null
      return { select: () => user, then: (r, j) => Promise.resolve(user).then(r, j) }
    },
    findById: async (id) => testUsers.find((u) => u._id === id) || null,
  }
  return { User: mockUser, default: mockUser }
})

// Mock AuditLog Model
vi.mock('../models/AuditLog.js', () => {
  const mockAudit = {
    create: async (data) => {
      testAuditLogs.push(data)
      return data
    },
  }
  return { AuditLog: mockAudit, default: mockAudit }
})

// Mock EmissionFactor Model
vi.mock('../models/EmissionFactor.js', () => {
  const mockFactor = {
    find: (query) => {
      let filtered = [...testFactors]

      if (query.isActive !== undefined) {
        filtered = filtered.filter((f) => f.isActive === query.isActive)
      }
      if (query.category) {
        filtered = filtered.filter((f) => f.category === query.category)
      }
      if (query.subCategory) {
        filtered = filtered.filter((f) => f.subCategory === query.subCategory)
      }
      if (query.state !== undefined) {
        filtered = filtered.filter((f) => f.state === query.state)
      }
      if (query.version) {
        filtered = filtered.filter((f) => f.version === query.version)
      }
      if (query.$or) {
        const regexes = query.$or.map((o) => {
          const field = Object.keys(o)[0]
          return { field, regex: o[field] }
        })
        filtered = filtered.filter((f) =>
          regexes.some((r) => r.regex.test(f[r.field] || ''))
        )
      }

      return {
        sort: () => filtered,
        then: (resolve) => resolve(filtered),
      }
    },

    findOne: (query) => {
      let filtered = [...testFactors]
      if (query.category) filtered = filtered.filter((f) => f.category === query.category)
      if (query.key) filtered = filtered.filter((f) => f.key === query.key)
      if (query.state !== undefined) filtered = filtered.filter((f) => f.state === query.state)
      if (query.version) filtered = filtered.filter((f) => f.version === query.version)
      if (query.isActive !== undefined) filtered = filtered.filter((f) => f.isActive === query.isActive)

      let result = filtered[0] || null

      return {
        sort: (sortQuery) => {
          if (sortQuery.publicationYear === -1) {
            filtered.sort((a, b) => b.publicationYear - a.publicationYear)
          }
          result = filtered[0] || null
          return {
            then: (resolve) => resolve(result),
          }
        },
        then: (resolve) => resolve(result),
      }
    },

    distinct: async (field) => {
      const vals = testFactors.map((f) => f[field])
      return [...new Set(vals)]
    },

    insertMany: async (factors) => {
      const inserts = factors.map((f, i) => ({
        _id: `f_new_${i}`,
        ...f,
      }))
      testFactors.push(...inserts)
      return inserts
    },

    updateMany: async (query, update) => {
      let matchedCount = 0
      testFactors.forEach((f) => {
        let matches = true
        if (query.version?.$ne && f.version === query.version.$ne) matches = false
        if (query.key?.$in && !query.key.$in.includes(f.key)) matches = false
        if (matches) {
          Object.assign(f, update.$set)
          matchedCount++
        }
      })
      return { matchedCount }
    },
  }

  return { EmissionFactor: mockFactor, default: mockFactor }
})

// Mock Queue service to avoid background worker runs in tests
vi.mock('../services/queueService.js', () => ({
  queueService: {
    enqueueJob: async () => ({ success: true, jobId: 'mock-job' }),
  },
}))

// Import dependencies to run app instance
import { app } from '../app.js'
import { factorRepository } from '../repositories/factorRepository.js'

describe('Emission Factor Integration & Fallback Cascade Tests', () => {
  const adminUser = { _id: 'admin_id', role: 'admin', tokenVersion: 0 }
  const regularUser = { _id: 'user_id', role: 'user', tokenVersion: 0 }

  const adminToken = jwt.sign({ id: adminUser._id, role: 'admin', tokenVersion: 0 }, config.JWT_SECRET)
  const userToken = jwt.sign({ id: regularUser._id, role: 'user', tokenVersion: 0 }, config.JWT_SECRET)

  beforeEach(() => {
    testUsers = [adminUser, regularUser]
    testAuditLogs = []
    testFactors = [
      {
        _id: 'f1',
        category: 'electricity',
        subCategory: 'national_grid',
        activity: 'grid_consumption',
        key: 'electricity_grid',
        state: null,
        country: 'IN',
        factor: 0.00071,
        value: 0.00071,
        unit: 'tons/kWh',
        source: 'CEA Guidelines',
        publicationYear: 2023,
        version: 'IN-2023-V1.0',
        confidence: 'High',
        methodology: 'Weighted baseline mix',
        isActive: true,
      },
      {
        _id: 'f2',
        category: 'electricity',
        subCategory: 'state_grid',
        activity: 'grid_consumption',
        key: 'electricity_grid',
        state: 'Maharashtra',
        country: 'IN',
        factor: 0.00079,
        value: 0.00079,
        unit: 'tons/kWh',
        source: 'CEA Guidelines',
        publicationYear: 2023,
        version: 'IN-2023-V1.0',
        confidence: 'High',
        methodology: 'State parameters coal-mix mix',
        isActive: true,
      },
      {
        _id: 'f3',
        category: 'transport',
        subCategory: 'road_transport',
        activity: 'passenger_car',
        key: 'transport_car_gasoline',
        state: null,
        country: 'IN',
        factor: 0.000143,
        value: 0.000143,
        unit: 'tons/km',
        source: 'ARAI Guidelines',
        publicationYear: 2022,
        version: 'IN-2023-V1.0',
        confidence: 'High',
        methodology: 'ARAI drive testing',
        isActive: true,
      },
    ]
  })

  // --- GET & SEARCH ---
  it('GET /api/v1/emission-factors should return list of factors', async () => {
    const res = await request(app)
      .get('/api/v1/emission-factors')
      .set('Cookie', [`access_token=${userToken}`])
      .query({ category: 'electricity' })
      .expect(200)

    expect(res.body.status).toBe('success')
    expect(res.body.data.factors.length).toBe(2)
  })

  it('GET /api/v1/emission-factors/search should search via query string', async () => {
    const res = await request(app)
      .get('/api/v1/emission-factors/search')
      .set('Cookie', [`access_token=${userToken}`])
      .query({ q: 'Maharashtra' })
      .expect(200)

    expect(res.body.status).toBe('success')
    expect(res.body.data.factors[0].state).toBe('Maharashtra')
  })

  // --- VERSIONING & COMPARISON ---
  it('GET /api/v1/emission-factors/versions should list distinct version tags', async () => {
    const res = await request(app)
      .get('/api/v1/emission-factors/versions')
      .set('Cookie', [`access_token=${userToken}`])
      .expect(200)

    expect(res.body.data.versions).toContain('IN-2023-V1.0')
  })

  it('GET /api/v1/emission-factors/sources should return data sources mapping', async () => {
    const res = await request(app)
      .get('/api/v1/emission-factors/sources')
      .set('Cookie', [`access_token=${userToken}`])
      .expect(200)

    expect(res.body.status).toBe('success')
    expect(res.body.data.mappings.length).toBe(8)
    expect(res.body.data.mappings[0].source).toContain('Central Electricity Authority')
  })

  it('GET /api/v1/emission-factors/compare should calculate difference between version factors', async () => {
    testFactors.push({
      _id: 'f4',
      category: 'electricity',
      subCategory: 'national_grid',
      activity: 'grid_consumption',
      key: 'electricity_grid',
      state: null,
      country: 'IN',
      factor: 0.00065, // lowered emissions in newer version
      value: 0.00065,
      unit: 'tons/kWh',
      source: 'CEA Guidelines',
      publicationYear: 2026,
      version: 'IN-2026-V1.0',
      confidence: 'High',
      methodology: 'Renewable increase mix',
      isActive: true,
    })

    const res = await request(app)
      .get('/api/v1/emission-factors/compare')
      .set('Cookie', [`access_token=${userToken}`])
      .query({ v1: 'IN-2023-V1.0', v2: 'IN-2026-V1.0' })
      .expect(200)

    expect(res.body.data.differences.length).toBeGreaterThan(0)
    const diff = res.body.data.differences.find((d) => d.key === 'electricity_grid')
    expect(diff.absoluteDifference).toBe(-0.00006)
  })

  // --- REPOSITORY FALLBACK CASCADE ---
  it('should resolve state-specific factor directly with High confidence', async () => {
    const resolved = await factorRepository.findWithFallback('electricity', 'electricity_grid', 'Maharashtra', 'IN-2023-V1.0')
    expect(resolved.factor.factor).toBe(0.00079)
    expect(resolved.confidence).toBe('High')
  })

  it('should fall back to state-null national average factor with Medium confidence', async () => {
    const resolved = await factorRepository.findWithFallback('electricity', 'electricity_grid', 'Delhi', 'IN-2023-V1.0')
    expect(resolved.factor.factor).toBe(0.00071)
    expect(resolved.confidence).toBe('Medium')
  })

  it('should fall back to latest active version with Low confidence if version mismatch occurs', async () => {
    const resolved = await factorRepository.findWithFallback('electricity', 'electricity_grid', 'Delhi', 'IN-2029-V9.9')
    expect(resolved.factor.factor).toBe(0.00071)
    expect(resolved.confidence).toBe('Low')
  })

  // --- ADMIN SECURITY & IMPORTS ---
  it('POST /api/v1/emission-factors/import should deny regular users', async () => {
    await request(app)
      .post('/api/v1/emission-factors/import')
      .set('Cookie', [`access_token=${userToken}`])
      .send({ version: 'IN-2026-V1.0' })
      .expect(403)
  })

  it('POST /api/v1/emission-factors/import should import valid datasets for admin and warn on outliers', async () => {
    const payload = {
      version: 'IN-2026-V1.0',
      source: 'ARAI / CEA Release 2026',
      publicationYear: 2026,
      factors: [
        {
          category: 'electricity',
          subCategory: 'national_grid',
          activity: 'grid_consumption',
          key: 'electricity_grid',
          state: null,
          country: 'IN',
          factor: 0.00025, // deviates by >50% from 0.00071 (64.7% drop)
          unit: 'tons/kWh',
          confidence: 'High',
          methodology: 'Rapid solarization grid',
        },
      ],
    }

    const res = await request(app)
      .post('/api/v1/emission-factors/import')
      .set('Cookie', [`access_token=${adminToken}`])
      .send(payload)
      .expect(201)

    expect(res.body.status).toBe('success')
    expect(res.body.data.importedCount).toBe(1)
    expect(res.body.data.outliers.length).toBe(1)
    expect(res.body.data.outliers[0].key).toBe('electricity_grid')
    expect(res.body.data.outliers[0].deviationPercent).toBeGreaterThan(50)
  })
})
