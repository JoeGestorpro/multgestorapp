const { z } = require('zod')

const emailSchema = z.string().email().max(255).transform(v => v.toLowerCase().trim())

const passwordSchema = z.string().min(6).max(128)

const tokenSchema = z.string().min(1)

module.exports = { emailSchema, passwordSchema, tokenSchema }
