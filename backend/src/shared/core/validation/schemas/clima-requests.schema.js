'use strict';

const { z } = require('zod');

const getClimaAvailabilitySchema = z.object({
  professional_id: z.string().uuid('professional_id deve ser UUID'),
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date deve estar no formato YYYY-MM-DD'),
  service_id:      z.string().uuid('service_id deve ser UUID').optional(),
});

const createClimaAppointmentSchema = z.object({
  professional_id: z.string().uuid('professional_id deve ser UUID'),
  service_id:      z.string().uuid('service_id deve ser UUID'),
  client_name:     z.string().min(2, 'Nome do cliente obrigatorio'),
  client_phone:    z.string().max(30).optional(),
  client_email:    z.string().email('E-mail invalido').optional(),
  start_at:        z.string().min(1, 'start_at obrigatorio'),
  notes:           z.string().max(500).optional(),
});

module.exports = { getClimaAvailabilitySchema, createClimaAppointmentSchema };
