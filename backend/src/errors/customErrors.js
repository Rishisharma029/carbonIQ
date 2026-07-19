export class CustomError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends CustomError {
  constructor(message = 'Validation failed') {
    super(message, 400)
  }
}

export class AuthenticationError extends CustomError {
  constructor(message = 'Authentication failed') {
    super(message, 401)
  }
}

export class AuthorizationError extends CustomError {
  constructor(message = 'Not authorized to access this resource') {
    super(message, 403)
  }
}

export class ForbiddenError extends CustomError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403)
  }
}

export class NotFoundError extends CustomError {
  constructor(message = 'Resource not found') {
    super(message, 404)
  }
}

export class CalculationError extends CustomError {
  constructor(message = 'Calculation computation failed') {
    super(message, 422)
  }
}
