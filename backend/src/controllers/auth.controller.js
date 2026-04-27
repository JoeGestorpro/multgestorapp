const authService = require('../services/auth.service');

function sendError(res, error) {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Erro interno do servidor' : error.message
  });
}

function getRequestMeta(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  };
}

async function register(req, res) {
  try {
    const result = await authService.register(req.body);

    return res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso',
      data: result
    });
  } catch (error) {
    console.error('Erro no register:', error);
    return sendError(res, error);
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body, {
      authScope: 'barber_admin'
    });

    return res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: result
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return sendError(res, error);
  }
}

async function masterLogin(req, res) {
  try {
    const result = await authService.login(req.body, {
      authScope: 'master'
    });

    return res.json({
      success: true,
      message: 'Login master realizado com sucesso',
      data: result
    });
  } catch (error) {
    console.error('Erro no login master:', error);
    return sendError(res, error);
  }
}

async function bookingLogin(req, res) {
  try {
    const result = await authService.loginBookingCustomer(req.body);

    return res.json({
      success: true,
      message: 'Login do cliente realizado com sucesso',
      data: result
    });
  } catch (error) {
    console.error('Erro no login do cliente:', error);
    return sendError(res, error);
  }
}

async function me(req, res) {
  try {
    const session = await authService.getAuthenticatedUser(req.user.id, {
      authScope: req.user.auth_scope
    });

    return res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Erro no me:', error);
    return sendError(res, error);
  }
}

async function bookingMe(req, res) {
  try {
    const session = await authService.getAuthenticatedUser(req.user.customer_id || req.user.id, {
      authScope: 'booking_customer',
      customerId: req.user.customer_id || req.user.id
    });

    return res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Erro no me do cliente:', error);
    return sendError(res, error);
  }
}

async function validateFirstAccess(req, res) {
  try {
    const result = await authService.validateFirstAccessToken(req.body.token || req.query.token);

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro no validate first access:', error);
    return sendError(res, error);
  }
}

async function requestFirstAccess(req, res) {
  try {
    await authService.requestFirstAccess(req.body, getRequestMeta(req));

    return res.json({
      success: true,
      message: 'Se o email estiver cadastrado, enviaremos as instrucoes de primeiro acesso.'
    });
  } catch (error) {
    console.error('Erro no request first access:', error);
    return sendError(res, error);
  }
}

async function setFirstAccessPassword(req, res) {
  try {
    await authService.setFirstAccessPassword(req.body);

    return res.json({
      success: true,
      message: 'Senha definida com sucesso'
    });
  } catch (error) {
    console.error('Erro no set first access password:', error);
    return sendError(res, error);
  }
}

async function forgotPassword(req, res) {
  try {
    await authService.requestPasswordReset(req.body, getRequestMeta(req));

    return res.json({
      success: true,
      message: 'Se o email estiver cadastrado, enviaremos as instrucoes de redefinicao.'
    });
  } catch (error) {
    console.error('Erro no forgot password:', error);
    return sendError(res, error);
  }
}

async function resetPassword(req, res) {
  try {
    await authService.resetPassword(req.body);

    return res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    console.error('Erro no reset password:', error);
    return sendError(res, error);
  }
}

module.exports = {
  register,
  login,
  masterLogin,
  bookingLogin,
  me,
  bookingMe,
  requestFirstAccess,
  validateFirstAccess,
  setFirstAccessPassword,
  forgotPassword,
  resetPassword
};
