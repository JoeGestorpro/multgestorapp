'use strict'
const { z } = require('zod')
const { emailSchema, passwordSchema, tokenSchema } = require('./auth.schema')

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha obrigatoria').max(128)
})

// Bloqueia `<` e `>` para impedir injeção de HTML/scripts em campos de nome
// armazenados e potencialmente renderizados. Acentos, espaço, `&`, hífen e
// apóstrofo continuam válidos (ex.: "Barbearia João & Filhos").
const NO_HTML = /^[^<>]*$/
const noHtmlText = (min, max, label) => {
  let s = z.string().trim()
  if (min != null) s = s.min(min, `${label} deve ter ao menos ${min} caracteres`)
  if (max != null) s = s.max(max)
  return s.regex(NO_HTML, `${label} contém caracteres inválidos`)
}

const registerSchema = z.object({
  name: noHtmlText(2, 100, 'Nome'),
  email: emailSchema,
  password: passwordSchema,
  company_name: noHtmlText(2, 100, 'Nome da empresa').optional(),
  companyName: noHtmlText(2, 100, 'Nome da empresa').optional(),
  niche_type: noHtmlText(null, 50, 'Nicho').optional(),
  nicheType: noHtmlText(null, 50, 'Nicho').optional()
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
