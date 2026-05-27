const { z } = require('zod')

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

const searchSchema = z.object({
  q: z.string().max(200).optional(),
})

const statusSchema = z.object({
  status: z.string().optional(),
})

module.exports = { dateRangeSchema, searchSchema, statusSchema }
