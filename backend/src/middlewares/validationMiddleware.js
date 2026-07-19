import { ValidationError } from '../errors/customErrors.js'

const parseSection = (schema, value) => {
  if (!schema) return { value }
  const result = schema.safeParse(value || {})
  if (result.success) return { value: result.data }
  const error = new ValidationError('Validation failed')
  error.errors = result.error.format()
  return { error }
}

export const validateRequest = ({ body, query, params } = {}) => {
  return (req, res, next) => {
    const validated = {}

    const paramsResult = parseSection(params, req.params)
    if (paramsResult.error) return next(paramsResult.error)
    if (params) validated.params = paramsResult.value

    const queryResult = parseSection(query, req.query)
    if (queryResult.error) return next(queryResult.error)
    if (query) validated.query = queryResult.value

    const bodyResult = parseSection(body, req.body)
    if (bodyResult.error) return next(bodyResult.error)
    if (body) validated.body = bodyResult.value

    req.validated = {
      ...(req.validated || {}),
      ...validated,
    }

    next()
  }
}

export default validateRequest
