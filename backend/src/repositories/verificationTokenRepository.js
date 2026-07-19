import crypto from 'crypto'
import { VerificationToken } from '../models/VerificationToken.js'

const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex')

export const verificationTokenRepository = {
  /**
   * Create a new verification token document. Raw token is hashed before storage.
   */
  create: async (userId, rawToken, expiresAt) => {
    return VerificationToken.create({
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt,
    })
  },

  /**
   * Find an unused, non-expired verification token by its raw value.
   */
  findByToken: async (rawToken) => {
    return VerificationToken.findOne({
      tokenHash: hashToken(rawToken),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    })
  },

  /**
   * Mark a verification token as consumed (single-use enforcement).
   */
  markUsed: async (id) => {
    return VerificationToken.findByIdAndUpdate(id, { usedAt: new Date() }, { new: true })
  },
}
export default verificationTokenRepository
