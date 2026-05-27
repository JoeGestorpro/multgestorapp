const crypto = require('crypto')
const { appLogger } = require('../../shared/core/logger')

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

class TokenEncryption {
  constructor() {
    this.logger = appLogger.child({ module: 'TokenEncryption' })
  }

  _getKey() {
    const key = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY
    if (!key) {
      throw new Error('WHATSAPP_TOKEN_ENCRYPTION_KEY not configured')
    }

    const normalizedKey = key.length === 64
      ? Buffer.from(key, 'hex')
      : crypto.createHash('sha256').update(key).digest()

    return normalizedKey
  }

  encrypt(plaintext) {
    if (!plaintext) return null

    try {
      const key = this._getKey()
      const iv = crypto.randomBytes(IV_LENGTH)
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const tag = cipher.getAuthTag()

      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
    } catch (error) {
      this.logger.error({ error: error.message }, 'Token encryption failed')
      throw new Error('Failed to encrypt token')
    }
  }

  decrypt(encryptedData) {
    if (!encryptedData) return null

    try {
      const key = this._getKey()
      const parts = encryptedData.split(':')

      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format')
      }

      const iv = Buffer.from(parts[0], 'hex')
      const tag = Buffer.from(parts[1], 'hex')
      const encrypted = parts[2]

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      this.logger.error({ error: error.message }, 'Token decryption failed')
      throw new Error('Failed to decrypt token')
    }
  }

  isEncryptionConfigured() {
    return !!process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY
  }
}

module.exports = new TokenEncryption()
