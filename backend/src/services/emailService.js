import nodemailer from 'nodemailer'
import { config } from '../config/config.js'
import { logger } from '../config/logger.js'
import { retryWithBackoff } from '../utils/retry.js'

let transporter = null

try {
  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465, // True for 465, false for other ports
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
    connectionTimeout: config.SMTP_TIMEOUT_MS || 5000,
    greetingTimeout: config.SMTP_TIMEOUT_MS || 5000,
    socketTimeout: config.SMTP_TIMEOUT_MS || 5000,
  })
} catch (err) {
  logger.error('❌ Failed to initialize Nodemailer SMTP transport:', err.message)
}

export const emailService = {
  /**
   * Sends an email with retry logic for transient errors.
   * 
   * @param {Object} options - Email sending options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text body
   * @param {string} options.html - HTML body
   * @returns {Promise<Object>} Success status and message ID
   */
  sendEmail: async ({ to, subject, text, html }) => {
    if (!transporter) {
      throw new Error('SMTP transporter is not initialized')
    }

    const mailOptions = {
      from: config.SMTP_FROM,
      to,
      subject,
      text,
      html,
    }

    const sendFn = async () => {
      const info = await transporter.sendMail(mailOptions)
      logger.info(`📧 Email sent successfully to ${to}: ${info.messageId}`)
      return info
    }

    try {
      // Retry sending email with exponential backoff on transient errors
      const info = await retryWithBackoff(sendFn, {
        retries: 3,
        baseDelayMs: 2000,
        maxDelayMs: 15000,
        jitterRangeMs: 500,
        contextName: `SMTP Send (${to})`,
      })
      return { success: true, messageId: info.messageId }
    } catch (err) {
      logger.error(`❌ Permanent failure sending email to ${to}: ${err.message}`)
      throw err
    }
  },

  /**
   * Verifies connection to the SMTP server.
   * Useful for health check diagnostics and startup validation.
   * 
   * @returns {Promise<boolean>}
   */
  verifyConnection: async () => {
    if (!transporter) return false
    try {
      // Simple verify check with a 5 second limit
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP Verification Timeout')), 5000))
      ])
      return true
    } catch (err) {
      logger.error('❌ SMTP Connection verification failed:', err.message)
      return false
    }
  },
}

export default emailService
