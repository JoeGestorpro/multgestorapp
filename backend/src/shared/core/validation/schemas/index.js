const { paginationSchema } = require('./pagination.schema')
const { uuidParam, idParam, uuidSchema } = require('./id.schema')
const { emailSchema, passwordSchema, tokenSchema } = require('./auth.schema')
const { dateRangeSchema, searchSchema, statusSchema } = require('./query.schema')
const {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setFirstAccessPasswordSchema,
  bookingLoginSchema
} = require('./auth-requests.schema')
const {
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
} = require('./barber-requests.schema')

module.exports = {
  // base
  paginationSchema,
  uuidParam,
  idParam,
  uuidSchema,
  emailSchema,
  passwordSchema,
  tokenSchema,
  dateRangeSchema,
  searchSchema,
  statusSchema,
  // auth requests
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setFirstAccessPasswordSchema,
  bookingLoginSchema,
  // barber requests
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
