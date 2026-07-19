export default {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
  },
  forgotPassword: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
  },
  verifyEmail: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
  },
}
