'use strict'
const { z } = require('zod')
const { emailSchema, passwordSchema, tokenSchema } = require('./auth.schema')

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha obrigatoria').max(128)
})

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100).trim(),
  email: emailSchema,
  password: passwordSchema,
  company_name: z.string().min(2).max(100).trim().optional(),
  companyName: z.string().min(2).max(100).trim().optional(),
  niche_type: z.string().max(50).optional(),
  nicheType: z.string().max(50).optional()
})

const forgotPasswordSchema = z.object({
  email: emailSchema
})

const resetPasswordSchema = z.object({
  token: tokenSchema,
  password: passwordSchema
})

const setFirstAccessPasswordSchema = z.object({
  token: tokenSchema,
  password: passwordSchema
})

const bookingLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  companySlug: z.string().min(1).max(100).optional(),
  company_slug: z.string().min(1).max(100).optional()
})

module.exports = {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setFirstAccessPasswordSchema,
  bookingLoginSchema
}
