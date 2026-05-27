'use strict'
// client-booking.service.js
// FACADE — mantido para compatibilidade com imports existentes.
// Novos verticais devem importar diretamente:
//   - booking-customer-auth.service.js
//   - booking-scheduling.service.js
//   - booking-appointments.service.js

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
} = require('./booking-scheduling.service');

const {
  createPublicAppointment,
  createClientAppointment,
  listClientAppointments,
  cancelClientAppointment
} = require('./booking-appointments.service');

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
