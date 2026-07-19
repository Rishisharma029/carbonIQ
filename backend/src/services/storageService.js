import fs from 'fs/promises'
import path from 'path'
import { config } from '../config/config.js'
import { logger } from '../config/logger.js'
import { retryWithBackoff } from '../utils/retry.js'

let s3Client = null

// Dynamically initialize AWS S3 if provider is 's3'
if (config.STORAGE_PROVIDER === 's3') {
  try {
    const { S3Client, PutObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3')
    
    if (config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY && config.AWS_S3_BUCKET) {
      s3Client = new S3Client({
        region: config.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        },
      })
      logger.info('☁️ AWS S3 client initialized successfully.')
    } else {
      logger.warn('⚠️ S3 credentials or bucket not configured. Degrading storage to local filesystem.')
    }
  } catch (err) {
    logger.warn('⚠️ AWS S3 SDK not installed or failed to initialize. Degrading storage to local filesystem.')
  }
}

export const storageService = {
  /**
   * Uploads a file buffer or string to storage.
   * 
   * @param {string} key - Unique path/filename for the object
   * @param {Buffer|string} data - Content to store
   * @param {string} mimeType - Content type header
   * @returns {Promise<string>} Storage path/key
   */
  upload: async (key, data, mimeType = 'application/octet-stream') => {
    // If S3 is initialized, upload to S3 with retry
    if (config.STORAGE_PROVIDER === 's3' && s3Client) {
      try {
        const { PutObjectCommand } = await import('@aws-sdk/client-s3')
        const uploadFn = async () => {
          const command = new PutObjectCommand({
            Bucket: config.AWS_S3_BUCKET,
            Key: key,
            Body: data,
            ContentType: mimeType,
          })
          return await s3Client.send(command)
        }

        await retryWithBackoff(uploadFn, {
          retries: 3,
          baseDelayMs: 1000,
          contextName: `S3 Upload (${key})`,
        })

        logger.info(`☁️ File uploaded to S3: s3://${config.AWS_S3_BUCKET}/${key}`)
        return `s3://${config.AWS_S3_BUCKET}/${key}`
      } catch (err) {
        logger.error(`❌ S3 Upload failed: ${err.message}. Falling back to local storage...`)
      }
    }

    // Local Storage Fallback
    const localUploadFn = async () => {
      const filePath = path.resolve(config.STORAGE_LOCAL_PATH, key)
      const dirPath = path.dirname(filePath)

      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true })
      await fs.writeFile(filePath, data)
      return filePath
    }

    try {
      const filePath = await retryWithBackoff(localUploadFn, {
        retries: 2,
        baseDelayMs: 500,
        contextName: `Local File Write (${key})`,
      })
      logger.info(`💾 File stored locally: ${filePath}`)
      return filePath
    } catch (err) {
      logger.error(`❌ Local storage write failed: ${err.message}`)
      throw err
    }
  },

  /**
   * Downloads a file from storage.
   * 
   * @param {string} key - Unique path/filename
   * @returns {Promise<Buffer|string>} File data
   */
  download: async (key) => {
    if (config.STORAGE_PROVIDER === 's3' && s3Client) {
      try {
        const { GetObjectCommand } = await import('@aws-sdk/client-s3')
        const downloadFn = async () => {
          const command = new GetObjectCommand({
            Bucket: config.AWS_S3_BUCKET,
            Key: key,
          })
          const response = await s3Client.send(command)
          // Helper to convert stream to buffer
          const streamToBuffer = (stream) =>
            new Promise((resolve, reject) => {
              const chunks = []
              stream.on('data', (chunk) => chunks.push(chunk))
              stream.on('error', reject)
              stream.on('end', () => resolve(Buffer.concat(chunks)))
            })
          return await streamToBuffer(response.Body)
        }

        return await retryWithBackoff(downloadFn, {
          retries: 3,
          baseDelayMs: 1000,
          contextName: `S3 Download (${key})`,
        })
      } catch (err) {
        logger.error(`❌ S3 Download failed: ${err.message}. Falling back to local download...`)
      }
    }

    // Local Storage Fallback
    const localDownloadFn = async () => {
      const filePath = path.resolve(config.STORAGE_LOCAL_PATH, key)
      return await fs.readFile(filePath)
    }

    return await retryWithBackoff(localDownloadFn, {
      retries: 2,
      baseDelayMs: 500,
      contextName: `Local File Read (${key})`,
    })
  },

  /**
   * Checks if local storage path is writeable.
   * 
   * @returns {Promise<boolean>}
   */
  checkLocalWriteable: async () => {
    try {
      const testDir = path.resolve(config.STORAGE_LOCAL_PATH)
      await fs.mkdir(testDir, { recursive: true })
      
      const testFile = path.join(testDir, '.storage_write_test')
      await fs.writeFile(testFile, 'test')
      await fs.unlink(testFile)
      return true
    } catch (err) {
      logger.error('❌ Local storage directory is not writeable:', err.message)
      return false
    }
  }
}

export default storageService
