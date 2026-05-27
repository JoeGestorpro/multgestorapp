const IntegrationMessage = {
  event_name: 'integration.message',
  description: 'Mensagem padronizada para integrações',
  required_fields: ['channel', 'company_id', 'direction'],
  optional_fields: ['recipient', 'sender', 'template', 'variables', 'metadata']
}

const IntegrationEvent = {
  event_name: 'integration.event',
  description: 'Evento de integração (entrada ou saida)',
  required_fields: ['event_type', 'channel', 'company_id'],
  optional_fields: ['provider_event_id', 'payload', 'status', 'error']
}

const IntegrationPayload = {
  event_name: 'integration.payload',
  description: 'Payload padronizado para envio via provider',
  required_fields: ['company_id', 'channel'],
  optional_fields: ['to', 'from', 'template', 'templateVariables', 'text', 'mediaUrl', 'mediaType']
}

const IntegrationResult = {
  event_name: 'integration.result',
  description: 'Resultado de uma operacao de integracao',
  required_fields: ['success', 'channel', 'company_id'],
  optional_fields: ['message_id', 'provider_message_id', 'status', 'error', 'metadata']
}

const INTEGRATION_EVENTS = {
  MESSAGE: IntegrationMessage,
  EVENT: IntegrationEvent,
  PAYLOAD: IntegrationPayload,
  RESULT: IntegrationResult
}

const INTEGRATION_CHANNELS = {
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  INSTAGRAM: 'instagram'
}

const INTEGRATION_DIRECTIONS = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound'
}

const INTEGRATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  UNDELIVERED: 'undelivered'
}

function validateIntegrationPayload(contract, payload) {
  const missing = contract.required_fields.filter(
    field => payload[field] === undefined || payload[field] === null
  )
  if (missing.length > 0) {
    throw new Error(
      `Missing required fields for ${contract.event_name}: ${missing.join(', ')}`
    )
  }
}

module.exports = {
  IntegrationMessage,
  IntegrationEvent,
  IntegrationPayload,
  IntegrationResult,
  INTEGRATION_EVENTS,
  INTEGRATION_CHANNELS,
  INTEGRATION_DIRECTIONS,
  INTEGRATION_STATUS,
  validateIntegrationPayload
}
