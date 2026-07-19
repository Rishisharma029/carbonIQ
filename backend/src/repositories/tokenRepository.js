import crypto from 'crypto'
import { RefreshToken } from '../models/RefreshToken.js'

const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex')

export const tokenRepository = {
  save: async ({ token, userId, expiresAt, device, ipAddress, userAgent }) => {
    return RefreshToken.create({
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      device: device || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    })
  },

  findByToken: async (rawToken) => {
    return RefreshToken.findOne({ tokenHash: hashToken(rawToken) })
  },

  deleteByToken: async (rawToken) => {
    return RefreshToken.deleteOne({ tokenHash: hashToken(rawToken) })
  },

  deleteByUserId: async (userId) => {
    return RefreshToken.deleteMany({ userId })
  },
}
export default tokenRepository
