const { z } = require('zod')

const uuidParam = z.string().uuid()

const idParam = z.coerce.number().int().positive()

const uuidSchema = z.object({
  id: z.string().uuid(),
})

module.exports = { uuidParam, idParam, uuidSchema }
