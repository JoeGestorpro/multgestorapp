const { asyncHandler, success } = require('../../shared');
const clientBookingService = require('../../services/client-booking.service');

function sendError(req, res, error, fallbackMessage) {
  const statusCode = error.statusCode || 500;
  const traceId = req.traceId || null;

  if (error.responseBody && typeof error.responseBody === 'object') {
    return res.status(statusCode).json({ ...error.responseBody, ...(traceId && { traceId }) });
  }

  const message = statusCode >= 500
    ? (fallbackMessage || 'Erro interno no servidor')
    : (error.message || fallbackMessage || 'Erro interno no servidor');

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(traceId && { traceId })
  });
}

async function getPublicBooking(req, res) {
  try {
    const booking = await clientBookingService.getPublicBookingInfo(req.params.slug);

    return res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    req.log.error({ err: error }, 'Erro ao carregar link publico barber');
    return sendError(req, res, error, 'Erro ao carregar link publico');
  }
}

async function getPublicAvailableSlots(req, res) {
  try {
    const availability = await clientBookingService.getSchedulingAvailability(req.params.slug, req.query);

    return res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    req.log.error({ err: error }, 'Erro ao consultar agenda publica barber');
    return sendError(req, res, error, 'Erro ao consultar disponibilidade');
  }
}

const createPublicBookingAppointment = asyncHandler(async (req, res) => {
  const appointment = await clientBookingService.createPublicAppointment(req.params.slug, req.body);

  return success(res, appointment, { statusCode: 201, message: 'Agendamento criado com sucesso.' });
}, 'Erro ao criar agendamento');

module.exports = {
  getPublicBooking,
  getPublicAvailableSlots,
  createPublicBookingAppointment
};
