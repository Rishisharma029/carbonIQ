import { EmissionFactor } from '../models/EmissionFactor.js'

export const factorRepository = {
  findAll: async (query = { isActive: true }) => {
    return EmissionFactor.find(query)
  },
  findByCategoryAndKey: async (category, key) => {
    return EmissionFactor.findOne({ category, key, isActive: true })
  },
  findWithFallback: async (category, key, state = null, version = 'IN-2023-V1.0') => {
    // 1. Try Exact match: state + version
    if (state) {
      const exact = await EmissionFactor.findOne({
        category,
        key,
        state,
        version,
        isActive: true,
      })
      if (exact) return { factor: exact, confidence: 'High' }
    }

    // 2. Try Fallback: national average (state = null) + version
    const national = await EmissionFactor.findOne({
      category,
      key,
      state: null,
      version,
      isActive: true,
    })
    if (national) {
      return {
        factor: national,
        confidence: state ? 'Medium' : 'High',
      }
    }

    // 3. Try Fallback: national average + any active version (latest first)
    const anyVersion = await EmissionFactor.findOne({
      category,
      key,
      state: null,
      isActive: true,
    }).sort({ publicationYear: -1 })

    if (anyVersion) {
      return {
        factor: anyVersion,
        confidence: 'Low',
      }
    }

    return null
  },
}
export default factorRepository
