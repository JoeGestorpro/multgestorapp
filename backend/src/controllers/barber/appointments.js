const { asyncHandler, success } = require('../../shared');
const AppointmentRepository = require('../../repositories/appointment.repository');
const AppointmentService = require('../../services/appointment.service');

const appointmentService = new AppointmentService(new AppointmentRepository());

const listAppointments = asyncHandler(async (req, res) => {
  const appointments = await appointmentService.list(req.user.company_id, req.user, req.query);

  return success(res, appointments);
}, 'Erro ao listar agendamentos');

const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.create(req.user.company_id, req.user, req.body);

  return success(res, appointment, { statusCode: 201 });
}, 'Erro ao criar agendamento');

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.update(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, appointment);
}, 'Erro ao atualizar status do agendamento');

const rescheduleAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.reschedule(req.user.company_id, req.user, req.params.id, req.body);

  return success(res, appointment);
}, 'Erro ao remarcar agendamento');

const deleteAppointment = asyncHandler(async (req, res) => {
  await appointmentService.delete(req.user.company_id, req.user, req.params.id);

  return success(res, null, { message: 'Agendamento excluido com sucesso' });
}, 'Erro ao excluir agendamento');

module.exports = {
  listAppointments,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  deleteAppointment
};
