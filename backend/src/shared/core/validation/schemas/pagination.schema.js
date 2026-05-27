const { z } = require('zod')

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  orderBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
})

module.exports = { paginationSchema }
