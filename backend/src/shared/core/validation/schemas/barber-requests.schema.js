'use strict'
const { z } = require('zod')
const { emailSchema } = require('./auth.schema')

const PAYMENT_METHODS = ['dinheiro', 'pix', 'credito', 'debito', 'permuta']
const COMMISSION_TYPES = ['percentage', 'fixed']
const COLLABORATOR_ROLES = ['admin', 'collaborator', 'secretary']

// ─── Venda ────────────────────────────────────────────────────────────────────
const saleItemSchema = z.object({
  item_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  itemId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  collaborator_id: z.string().uuid().optional(),
  collaboratorId: z.string().uuid().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  price: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).default(0),
  item_type: z.string().optional(),
  itemType: z.string().optional()
})

const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'Venda deve ter ao menos 1 item'),
  payment_method: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: `Forma de pagamento invalida. Use: ${PAYMENT_METHODS.join(', ')}` })
  }),
  collaborator_id: z.string().uuid().optional(),
  collaboratorId: z.string().uuid().optional(),
  total: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().max(500).optional(),
  cash_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
}).passthrough()

// ─── Colaborador ──────────────────────────────────────────────────────────────
const createCollaboratorSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100).trim(),
  email: emailSchema.optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().max(20).optional(),
  role: z.enum(COLLABORATOR_ROLES).optional().default('collaborator'),
  commission_type: z.enum(COMMISSION_TYPES).optional(),
  commissionType: z.enum(COMMISSION_TYPES).optional(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  password: z.string().min(6).max(128).optional(),
  specialties: z.array(z.string().uuid()).optional()
}).passthrough()

// ─── Servico ──────────────────────────────────────────────────────────────────
const createServiceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100).trim(),
  price: z.coerce.number().min(0, 'Preco deve ser maior ou igual a zero'),
  duration_minutes: z.coerce.number().int().min(5, 'Duracao minima: 5 minutos').max(480),
  durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  is_active: z.boolean().optional().default(true)
}).passthrough()

// ─── Agendamento ──────────────────────────────────────────────────────────────
const createAppointmentSchema = z.object({
  service_id: z.string().uuid('service_id invalido').optional(),
  serviceId: z.string().uuid().optional(),
  collaborator_id: z.string().uuid('collaborator_id invalido').optional(),
  collaboratorId: z.string().uuid().optional(),
  customer_name: z.string().min(1).max(100).optional(),
  customer_phone: z.string().max(20).optional(),
  start_at: z.string().min(1, 'Data/hora de inicio obrigatoria'),
  notes: z.string().max(500).optional()
}).passthrough()

// ─── Vale (Advance) ──────────────────────────────────────────────────────────
const createAdvanceSchema = z.object({
  collaborator_id: z.string().uuid('collaborator_id invalido'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  description: z.string().max(500).optional(),
  advance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
}).passthrough()

// ─── Update schemas ───────────────────────────────────────────────────────────

const updateServiceSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  price: z.coerce.number().min(0).optional(),
  duration_minutes: z.coerce.number().int().min(5).max(480).optional(),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  is_active: z.boolean().optional()
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Nenhum campo para atualizar' }
)

const updateServiceStatusSchema = z.object({
  is_active: z.boolean()
}).strict()

const updateAppointmentStatusSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'])
}).strict()

const rescheduleAppointmentSchema = z.object({
  start_at: z.string().min(1, 'Nova data/hora obrigatoria'),
  collaborator_id: z.string().uuid().optional()
}).strict()

const updateCustomerSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  notes: z.string().max(1000).optional()
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Nenhum campo para atualizar' }
)

const updateCustomerStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'blocked'])
}).strict()

const updateCollaboratorSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: emailSchema.optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().max(20).optional(),
  role: z.enum(COLLABORATOR_ROLES).optional(),
  commission_type: z.enum(COMMISSION_TYPES).optional(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
  is_active: z.boolean().optional()
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Nenhum campo para atualizar' }
)

const updateCollaboratorStatusSchema = z.object({
  is_active: z.boolean()
}).strict()

module.exports = {
  createSaleSchema,
  createCollaboratorSchema,
  createServiceSchema,
  createAppointmentSchema,
  createAdvanceSchema,
  updateServiceSchema,
  updateServiceStatusSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
  updateCustomerSchema,
  updateCustomerStatusSchema,
  updateCollaboratorSchema,
  updateCollaboratorStatusSchema
}
