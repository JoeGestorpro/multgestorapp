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

const AppointmentReminder = {
  event_name: 'appointment.reminder',
  description: 'Lembrete de agendamento enviado ao cliente',
  aggregate_type: 'appointment',
  required_fields: ['appointment_id', 'company_id', 'customer_phone', 'starts_at'],
  optional_fields: ['customer_name']
}

const APPOINTMENT_EVENTS = {
  CREATED: AppointmentCreated,
  CONFIRMED: AppointmentConfirmed,
  CANCELED: AppointmentCanceled,
  COMPLETED: AppointmentCompleted,
  RESCHEDULED: AppointmentRescheduled,
  REMINDER: AppointmentReminder
}

const PackagePurchased = {
  event_name: 'package.purchased',
  description: 'Cliente comprou um pacote de creditos',
  aggregate_type: 'package',
  required_fields: ['company_id', 'customer_id', 'package_id', 'customer_package_id', 'amount', 'credits']
}

const PackageCreditRedeemed = {
  event_name: 'package.credit.redeemed',
  description: 'Credito de pacote resgatado em servico',
  aggregate_type: 'package',
  required_fields: ['company_id', 'customer_id', 'customer_package_id', 'service_id', 'credits_remaining']
}

const LoyaltyPointsEarned = {
  event_name: 'loyalty.points.earned',
  description: 'Cliente ganhou pontos de fidelidade',
  aggregate_type: 'loyalty',
  required_fields: ['company_id', 'customer_id', 'points', 'balance']
}

const LoyaltyPointsRedeemed = {
  event_name: 'loyalty.points.redeemed',
  description: 'Cliente resgatou pontos de fidelidade',
  aggregate_type: 'loyalty',
  required_fields: ['company_id', 'customer_id', 'points', 'balance']
}

const AnamnesisResponseSaved = {
  event_name: 'anamnesis.response.saved',
  description: 'Resposta de anamnese salva',
  aggregate_type: 'anamnesis',
  required_fields: ['company_id', 'customer_id', 'consent_granted']
}

const AnamnesisDataExported = {
  event_name: 'anamnesis.data.exported',
  description: 'Dados de anamnese exportados (LGPD)',
  aggregate_type: 'anamnesis',
  required_fields: ['company_id', 'customer_id']
}

const AnamnesisDataDeleted = {
  event_name: 'anamnesis.data.deleted',
  description: 'Dados de anamnese anonimizados (LGPD)',
  aggregate_type: 'anamnesis',
  required_fields: ['company_id', 'customer_id']
}

const FASE2_EVENTS = {
  PACKAGE_PURCHASED: PackagePurchased,
  PACKAGE_CREDIT_REDEEMED: PackageCreditRedeemed,
  LOYALTY_POINTS_EARNED: LoyaltyPointsEarned,
  LOYALTY_POINTS_REDEEMED: LoyaltyPointsRedeemed,
  ANAMNESIS_RESPONSE_SAVED: AnamnesisResponseSaved,
  ANAMNESIS_DATA_EXPORTED: AnamnesisDataExported,
  ANAMNESIS_DATA_DELETED: AnamnesisDataDeleted
}

const AiSuggestionGenerated = {
  event_name: 'AI.SuggestionGenerated',
  description: 'Sugestao de IA operacional gerada (previsao de demanda, alerta de churn, etc.)',
  aggregate_type: 'ai_suggestion',
  required_fields: ['suggestion_id', 'company_id', 'type', 'source'],
  optional_fields: []
}

const AI_EVENTS = {
  SUGGESTION_GENERATED: AiSuggestionGenerated
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
  AppointmentReminder,
  FASE2_EVENTS,
  PackagePurchased,
  PackageCreditRedeemed,
  LoyaltyPointsEarned,
  LoyaltyPointsRedeemed,
  AnamnesisResponseSaved,
  AnamnesisDataExported,
  AnamnesisDataDeleted,
  AI_EVENTS,
  AiSuggestionGenerated,
  validateEventPayload
}
