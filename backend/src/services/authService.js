import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'
import { userRepository } from '../repositories/userRepository.js'
import { tokenRepository } from '../repositories/tokenRepository.js'
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from '../errors/customErrors.js'

const generateAccessToken = (userId, tokenVersion = 0) => {
  return jwt.sign({ id: userId, tokenVersion }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN || '15m',
  })
}

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, config.JWT_SECRET, {
    expiresIn: '7d',
  })
}

export const authService = {
  register: async (data) => {
    const existing = await userRepository.findByEmail(data.email)
    if (existing) {
      throw new ValidationError('Email is already registered')
    }

    const user = await userRepository.create({
      fullName: data.fullName || data.name,
      email: data.email,
      passwordHash: data.password,
    })

    return {
      id: user._id,
      name: user.fullName,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    }
  },

  login: async (email, password, meta = {}) => {
    const user = await userRepository.findByEmail(email)
    if (!user) {
      throw new AuthenticationError('Invalid email or password')
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password')
    }

    const accessToken = generateAccessToken(user._id, user.tokenVersion)
    const refreshToken = generateRefreshToken(user._id)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await tokenRepository.save({
      token: refreshToken,
      userId: user._id,
      expiresAt,
      device: meta.device || null,
      ipAddress: meta.ipAddress || null,
      userAgent: meta.userAgent || null,
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.fullName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    }
  },

  refresh: async (token) => {
    const storedToken = await tokenRepository.findByToken(token)
    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await tokenRepository.deleteByToken(token)
      }
      throw new AuthenticationError('Invalid or expired refresh token')
    }

    let payload
    try {
      payload = jwt.verify(token, config.JWT_SECRET)
    } catch {
      throw new AuthenticationError('Invalid refresh token')
    }

    // Fetch current tokenVersion so the new access token can be validated against it
    const currentUser = await userRepository.findById(payload.id)
    const tokenVersion = currentUser?.tokenVersion ?? 0

    const newAccessToken = generateAccessToken(payload.id, tokenVersion)
    const newRefreshToken = generateRefreshToken(payload.id)

    await tokenRepository.deleteByToken(token)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await tokenRepository.save({
      token: newRefreshToken,
      userId: payload.id,
      expiresAt,
    })

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  },

  logout: async (token) => {
    if (token) {
      await tokenRepository.deleteByToken(token)
    }
  },

  requestPasswordReset: async (email) => {
    const user = await userRepository.findByEmail(email)
    if (!user) {
      throw new NotFoundError('User with this email does not exist')
    }

    const resetToken = jwt.sign({ id: user._id, type: 'reset' }, config.JWT_SECRET, {
      expiresIn: '15m',
    })

    return { resetToken }
  },

  resetPassword: async (token, newPassword) => {
    let payload
    try {
      payload = jwt.verify(token, config.JWT_SECRET)
      if (payload.type !== 'reset') throw new Error()
    } catch {
      throw new ValidationError('Invalid or expired password reset token')
    }

    const user = await userRepository.findById(payload.id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    user.passwordHash = newPassword
    await user.save()

    await tokenRepository.deleteByUserId(user._id)
  },
}
export default authService
