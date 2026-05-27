const AppointmentCreated = {
  event_name: 'appointment.created',
  description: 'Novo agendamento criado',
  aggregate_type: 'appointment',
  required_fields: ['appointment_id', 'company_id', 'collaborator_id', 'service_id', 'starts_at', 'status'],
  optional_fields: ['customer_id', 'customer_name', 'customer_phone', 'notes', 'source']
}

const AppointmentConfirmed = {
  event_name: 'appointment.confirmed',
  description: 'Agendamento confirmado',
  aggregate_type: 'appointment',
  required_fields: ['appointment_id', 'company_id', 'status'],
  optional_fields: ['collaborator_id', 'service_id', 'notes']
}

const AppointmentCanceled = {
  event_name: 'appointment.canceled',
  description: 'Agendamento cancelado',
  aggregate_type: 'appointment',
  required_fields: ['appointment_id', 'company_id', 'status'],
  optional_fields: ['collaborator_id', 'canceled_reason', 'notes']
}

const AppointmentCompleted = {
  event_name: 'appointment.completed',
  description: 'Agendamento concluido',
  aggregate_type: 'appointment',
  required_fields: ['appointment_id', 'company_id', 'status'],
  optional_fields: ['collaborator_id', 'service_id', 'notes']
}

const AppointmentRescheduled = {
  event_name: 'appointment.rescheduled',
  description: 'Agendamento reagendado',
  aggregate_type: 'appointment',
  required_fields: ['appointment_id', 'company_id', 'starts_at', 'ends_at'],
  optional_fields: ['collaborator_id', 'old_starts_at']
}

const APPOINTMENT_EVENTS = {
  CREATED: AppointmentCreated,
  CONFIRMED: AppointmentConfirmed,
  CANCELED: AppointmentCanceled,
  COMPLETED: AppointmentCompleted,
  RESCHEDULED: AppointmentRescheduled
}

function validateEventPayload(contract, payload) {
  const missing = contract.required_fields.filter(field => payload[field] === undefined || payload[field] === null)
  if (missing.length > 0) {
    throw new Error(`Missing required fields for ${contract.event_name}: ${missing.join(', ')}`)
  }
}

module.exports = {
  APPOINTMENT_EVENTS,
  AppointmentCreated,
  AppointmentConfirmed,
  AppointmentCanceled,
  AppointmentCompleted,
  AppointmentRescheduled,
  validateEventPayload
}
