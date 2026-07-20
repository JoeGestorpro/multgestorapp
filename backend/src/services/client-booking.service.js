'use strict'
// client-booking.service.js
// FACADE — mantido para compatibilidade com imports existentes.
// Novos verticais devem importar diretamente:
//   - booking-customer-auth.service.js (generico, fica em services/)
//   - barber/booking-scheduling.service.js (ADR-007: rebaixado para barber/)
//   - barber/booking-appointments.service.js (ADR-007: rebaixado para barber/)

const {
  preRegisterClient,
  resendClientConfirmation,
  confirmClientEmail
} = require('./booking-customer-auth.service');

const {
  getPublicBookingInfo,
  getSchedulingAvailability,
  validateBookableSlot,
  getBookingSettings
} = require('./barber/booking-scheduling.service');

const {
  createPublicAppointment,
  createClientAppointment,
  listClientAppointments,
  cancelClientAppointment
} = require('./barber/booking-appointments.service');

module.exports = {
  preRegisterClient,
  resendClientConfirmation,
  confirmClientEmail,
  getBookingSettings,
  validateBookableSlot,
  getPublicBookingInfo,
  getSchedulingAvailability,
  createPublicAppointment,
  listClientAppointments,
  createClientAppointment,
  cancelClientAppointment
};
