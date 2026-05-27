const clientBookingService = require('../services/client-booking.service');
const { asyncHandler, success } = require('../shared');

function getRequestMeta(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  };
}

const preRegister = asyncHandler(async (req, res) => {
  const result = await clientBookingService.preRegisterClient(req.params.companySlug, req.body, getRequestMeta(req));

  return success(res, result, { statusCode: 201, message: result.message });
});

const resendConfirmation = asyncHandler(async (req, res) => {
  const result = await clientBookingService.resendClientConfirmation(req.body, getRequestMeta(req));

  return success(res, result, { message: result.message });
});

const confirmEmail = asyncHandler(async (req, res) => {
  const result = await clientBookingService.confirmClientEmail(req.query.token, getRequestMeta(req));

  return success(res, result, { message: result.message });
});

const getAvailability = asyncHandler(async (req, res) => {
  const result = await clientBookingService.getSchedulingAvailability(req.params.companySlug, req.query);

  return success(res, result);
});

const listMyAppointments = asyncHandler(async (req, res) => {
  const result = await clientBookingService.listClientAppointments(req.user);

  return success(res, result);
});

const createMyAppointment = asyncHandler(async (req, res) => {
  const result = await clientBookingService.createClientAppointment(req.user, req.body);

  return success(res, result, { statusCode: 201 });
});

const cancelMyAppointment = asyncHandler(async (req, res) => {
  const result = await clientBookingService.cancelClientAppointment(req.user, req.params.id);

  return success(res, result);
});

module.exports = {
  preRegister,
  resendConfirmation,
  confirmEmail,
  getAvailability,
  listMyAppointments,
  createMyAppointment,
  cancelMyAppointment
};
