// Event Factory — Appointment
//
// Proteção permanente contra drift de eventos (regra EVENT CONTRACTS,
// .opencodex/rules/event-contracts.md). Toda emissão de evento de appointment
// DEVE passar por aqui — nunca montar event_name/aggregate_type à mão.
//
// Cada método:
//   1. monta o payload correto;
//   2. busca event_name e aggregate_type do CONTRATO REAL (contracts.js);
//   3. chama validateEventPayload (falha se faltar campo obrigatório);
//   4. retorna um evento pronto para EventBus (in-memory) e Outbox (durável).
//
// Forma do evento retornado (neutra entre os dois sinks):
//   { event_name, aggregate_type, aggregate_id, payload }
// O caller mapeia para uow.addEvent(name, payload, { aggregateType, aggregateId, ... })
// ou eventBus.publish(name, payload, { aggregate_type, aggregate_id, ... }).

const {
  AppointmentCreated,
  AppointmentConfirmed,
  AppointmentCanceled,
  AppointmentCompleted,
  AppointmentRescheduled,
  validateEventPayload,
} = require('../contracts')

function buildEvent(contract, payload) {
  validateEventPayload(contract, payload)
  return Object.freeze({
    event_name: contract.event_name,
    aggregate_type: contract.aggregate_type,
    aggregate_id: payload.appointment_id,
    payload,
  })
}

const AppointmentEvents = {
  created(data = {}) {
    return buildEvent(AppointmentCreated, {
      appointment_id: data.appointment_id,
      company_id: data.company_id,
      collaborator_id: data.collaborator_id,
      service_id: data.service_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      status: data.status,
      source: data.source || 'admin_manual',
    })
  },

  confirmed(data = {}) {
    return buildEvent(AppointmentConfirmed, {
      appointment_id: data.appointment_id,
      company_id: data.company_id,
      status: 'confirmed',
      collaborator_id: data.collaborator_id,
      service_id: data.service_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
    })
  },

  canceled(data = {}) {
    return buildEvent(AppointmentCanceled, {
      appointment_id: data.appointment_id,
      company_id: data.company_id,
      status: 'canceled',
      collaborator_id: data.collaborator_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      canceled_reason: data.canceled_reason ?? null,
    })
  },

  completed(data = {}) {
    return buildEvent(AppointmentCompleted, {
      appointment_id: data.appointment_id,
      company_id: data.company_id,
      status: 'completed',
      collaborator_id: data.collaborator_id,
      service_id: data.service_id,
    })
  },

  rescheduled(data = {}) {
    return buildEvent(AppointmentRescheduled, {
      appointment_id: data.appointment_id,
      company_id: data.company_id,
      collaborator_id: data.collaborator_id,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      old_starts_at: data.old_starts_at,
    })
  },
}

module.exports = AppointmentEvents
