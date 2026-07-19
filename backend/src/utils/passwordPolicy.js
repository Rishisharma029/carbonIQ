/**
 * Password Policy — enforces strength requirements per the auth v1 spec.
 * Rules: min 12 chars, uppercase, lowercase, digit, special character.
 * Also rejects a list of commonly used passwords.
 */

const COMMON_PASSWORDS = new Set([
  'password123456', 'password1234', 'qwerty123456', 'letmein123456',
  'welcome123456', 'monkey123456', 'dragon123456', 'master123456',
  'iloveyou1234', 'sunshine1234', 'princess1234', 'football1234',
  'shadow1234567', 'trustno11234', 'superman1234', 'batman123456',
  'admin123456!', 'passw0rd1234', 'hello123456!', 'abc123456789',
])

const UPPERCASE_RE = /[A-Z]/
const LOWERCASE_RE = /[a-z]/
const DIGIT_RE = /[0-9]/
const SPECIAL_RE = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/

/**
 * Validates a plaintext password against the policy.
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validatePassword = (password) => {
  const errors = []

  if (!password || password.length < 12) {
    errors.push('Password must be at least 12 characters long')
  }
  if (!UPPERCASE_RE.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!LOWERCASE_RE.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!DIGIT_RE.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!SPECIAL_RE.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more unique password.')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Throws a ValidationError if the password fails policy.
 * Convenience wrapper for use in services.
 */
export const assertPasswordPolicy = (password, ValidationError) => {
  const { valid, errors } = validatePassword(password)
  if (!valid) {
    const err = new ValidationError(errors[0])
    err.errors = errors
    throw err
  }
}

export default { validatePassword, assertPasswordPolicy }
