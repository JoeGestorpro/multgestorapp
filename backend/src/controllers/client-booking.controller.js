const clientBookingService = require('../services/client-booking.service');

function sendError(res, error, fallbackMessage) {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? (fallbackMessage || 'Erro interno do servidor') : error.message
  });
}

function getRequestMeta(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  };
}

async function preRegister(req, res) {
  try {
    const result = await clientBookingService.preRegisterClient(req.params.companySlug, req.body, getRequestMeta(req));

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Erro no pre-cadastro publico:', {
      message: error.message,
      statusCode: error.statusCode || 500,
      stack: error.stack
    });
    return sendError(res, error, 'Erro ao iniciar pre-cadastro');
  }
}

async function resendConfirmation(req, res) {
  try {
    const result = await clientBookingService.resendClientConfirmation(req.body, getRequestMeta(req));

    return res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Erro ao reenviar confirmacao:', {
      message: error.message,
      statusCode: error.statusCode || 500,
      stack: error.stack
    });
    return sendError(res, error, 'Erro ao reenviar confirmacao');
  }
}

async function confirmEmail(req, res) {
  try {
    const result = await clientBookingService.confirmClientEmail(req.query.token, getRequestMeta(req));

    return res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Erro ao confirmar email do cliente:', {
      message: error.message,
      statusCode: error.statusCode || 500,
      stack: error.stack
    });
    return sendError(res, error, 'Erro ao confirmar email');
  }
}

async function getAvailability(req, res) {
  try {
    const result = await clientBookingService.getSchedulingAvailability(req.params.companySlug, req.query);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao consultar disponibilidade publica:', error);
    return sendError(res, error, 'Erro ao consultar disponibilidade');
  }
}

async function listMyAppointments(req, res) {
  try {
    const result = await clientBookingService.listClientAppointments(req.user);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao listar agendamentos do cliente:', error);
    return sendError(res, error, 'Erro ao listar agendamentos');
  }
}

async function createMyAppointment(req, res) {
  try {
    const result = await clientBookingService.createClientAppointment(req.user, req.body);

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao criar agendamento do cliente:', error);
    return sendError(res, error, 'Erro ao criar agendamento');
  }
}

async function cancelMyAppointment(req, res) {
  try {
    const result = await clientBookingService.cancelClientAppointment(req.user, req.params.id);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao cancelar agendamento do cliente:', error);
    return sendError(res, error, 'Erro ao cancelar agendamento');
  }
}

module.exports = {
  preRegister,
  resendConfirmation,
  confirmEmail,
  getAvailability,
  listMyAppointments,
  createMyAppointment,
  cancelMyAppointment
};
