import { ValidationError } from '../errors/customErrors.js'

const ALLOWED_QUERY_PARAMS = new Set([
  'page',
  'limit',
  'sort',
  'from',
  'to',
  'category',
  'sortBy',
  'sortOrder',
  'startDate',
  'endDate',
  'subCategory',
  'state',
  'version',
  'q',
  'v1',
  'v2',
])

/**
 * Global Query Parameter Whitelist Middleware.
 * Rejects requests with undocumented query parameters to prevent query injection/abuse.
 */
export const queryWhitelist = (req, res, next) => {
  const queryKeys = Object.keys(req.query || {})
  for (const key of queryKeys) {
    if (!ALLOWED_QUERY_PARAMS.has(key)) {
      return next(new ValidationError(`Unknown query parameter: '${key}'`))
    }
  }
  next()
}

export default queryWhitelist
