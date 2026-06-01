'use strict'
const { z } = require('zod')

const PROVIDER_TYPES = ['meta_cloud_api', 'evolution_api', 'z_api', 'mock']

const upsertIntegrationSchema = z.object({
  providerType: z.enum(PROVIDER_TYPES, {
    errorMap: () => ({ message: `Tipo de provedor invalido. Use: ${PROVIDER_TYPES.join(', ')}` })
  }),
  apiUrl: z.string().url('URL invalida').optional().or(z.literal('')),
  phoneNumberId: z.string().optional(),
  businessAccountId: z.string().optional().or(z.literal('')),
  accessToken: z.string().optional(),
  integrationEnabled: z.boolean().optional()
}).passthrough().superRefine((data, ctx) => {
  if (data.providerType !== 'mock') {
    if (!data.phoneNumberId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'phoneNumberId e obrigatorio para provedor nao-mock',
        path: ['phoneNumberId']
      })
    }
    if (!data.accessToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'accessToken e obrigatorio para provedor nao-mock',
        path: ['accessToken']
      })
    }
  }
})

const testIntegrationSchema = z.object({
  to: z.string().min(1, 'Destinatario e obrigatorio'),
  template: z.string().optional(),
  variables: z.record(z.string()).optional()
}).passthrough()

module.exports = {
  upsertIntegrationSchema,
  testIntegrationSchema
}
