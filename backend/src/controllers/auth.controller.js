const authService = require('../services/auth.service');
const { asyncHandler, success } = require('../shared');
const {
  issueRefreshToken,
  revokeRefreshToken,
  isRefreshTokenActive,
  REFRESH_COOKIE_OPTIONS
} = require('../services/auth.service');
const jwt = require('jsonwebtoken');

const REFRESH_COOKIE_NAMES = ['mg_refresh_barber', 'mg_refresh_master', 'mg_refresh_booking'];

function refreshCookieNameForScope(authScope) {
  if (authScope === 'master') return 'mg_refresh_master';
  if (authScope === 'booking_customer') return 'mg_refresh_booking';
  return 'mg_refresh_barber';
}

function getRequestMeta(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  };
}

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  return success(res, result, { statusCode: 201, message: 'Cadastro realizado com sucesso' });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, {
    authScope: 'barber_admin'
  });

  const refreshToken = await issueRefreshToken(
    result.user.id,
    result.user.role,
    result.user.company_id,
    'barber_admin'
  );

  res.cookie('mg_refresh_barber', refreshToken, REFRESH_COOKIE_OPTIONS);

  return success(res, result, { message: 'Login realizado com sucesso' });
});

const masterLogin = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, {
    authScope: 'master'
  });

  const refreshToken = await issueRefreshToken(
    result.user.id,
    result.user.role,
    result.user.company_id,
    'master'
  );

  res.cookie('mg_refresh_master', refreshToken, REFRESH_COOKIE_OPTIONS);

  return success(res, result, { message: 'Login master realizado com sucesso' });
});

const bookingLogin = asyncHandler(async (req, res) => {
  const result = await authService.loginBookingCustomer(req.body);

  const refreshToken = await issueRefreshToken(
    result.user.id,
    result.user.role,
    result.user.company_id,
    'booking_customer'
  );

  res.cookie('mg_refresh_booking', refreshToken, REFRESH_COOKIE_OPTIONS);

  return success(res, result, { message: 'Login do cliente realizado com sucesso' });
});

const me = asyncHandler(async (req, res) => {
  const session = await authService.getAuthenticatedUser(req.user.id, {
    authScope: req.user.auth_scope
  });

  return success(res, session);
});

const bookingMe = asyncHandler(async (req, res) => {
  const session = await authService.getAuthenticatedUser(req.user.customer_id || req.user.id, {
    authScope: 'booking_customer',
    customerId: req.user.customer_id || req.user.id
  });

  return success(res, session);
});

const validateFirstAccess = asyncHandler(async (req, res) => {
  const result = await authService.validateFirstAccessToken(req.body.token || req.query.token);

  return success(res, result);
});

const requestFirstAccess = asyncHandler(async (req, res) => {
  await authService.requestFirstAccess(req.body, getRequestMeta(req));

  return success(res, null, { message: 'Se o email estiver cadastrado, enviaremos as instrucoes de primeiro acesso.' });
});

const setFirstAccessPassword = asyncHandler(async (req, res) => {
  await authService.setFirstAccessPassword(req.body);

  return success(res, null, { message: 'Senha definida com sucesso' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body, getRequestMeta(req));

  return success(res, null, { message: 'Se o email estiver cadastrado, enviaremos as instrucoes de redefinicao.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);

  return success(res, null, { message: 'Senha redefinida com sucesso' });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.mg_refresh_barber
    || req.cookies?.mg_refresh_master
    || req.cookies?.mg_refresh_booking;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: 'Sessao expirada. Faca login novamente.'
    });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (payload.token_type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Token invalido.'
      });
    }

    // Revogação server-side: token com jti precisa de sessão ativa.
    // Tokens legados (sem jti, emitidos antes da migração 030) são aceitos
    // até expirarem e migram para sessão server-side na rotação abaixo.
    if (payload.jti) {
      const active = await isRefreshTokenActive(payload.jti);
      if (!active) {
        return res.status(401).json({
          success: false,
          error: 'Sessao expirada. Faca login novamente.'
        });
      }
    }

    const pool = require('../config/database');

    // Booking customer refresh
    if (payload.auth_scope === 'booking_customer') {
      const result = await pool.query(
        `SELECT
           booking_customers.id,
           booking_customers.company_id,
           booking_customers.name,
           booking_customers.phone,
           booking_customers.email,
           booking_customers.email_verified,
           booking_customers.status,
           booking_customers.source,
           booking_customers.last_login_at,
           booking_customers.created_at,
           companies.name AS company_name,
           companies.niche_type,
           companies.public_booking_slug AS company_public_booking_slug
         FROM booking_customers
         INNER JOIN companies ON companies.id = booking_customers.company_id
         WHERE booking_customers.id = $1
         LIMIT 1`,
        [payload.id]
      );

      if (result.rowCount === 0) {
        return res.status(401).json({
          success: false,
          error: 'Cliente nao encontrado.'
        });
      }

      const customer = result.rows[0];
      const { sanitizeBookingCustomer } = require('../services/auth.service');
      const sanitized = sanitizeBookingCustomer(customer);

      const newAccessToken = jwt.sign(
        {
          id: customer.id,
          user_id: null,
          customer_id: customer.id,
          email: customer.email,
          role: 'booking_customer',
          auth_scope: 'booking_customer',
          company_id: customer.company_id,
          can_launch_sales: false,
          can_view_own_dashboard: false,
          can_view_own_reports: false
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Rotação: novo refresh com sessão server-side; o anterior é revogado.
      const rotatedToken = await issueRefreshToken(
        customer.id,
        'booking_customer',
        customer.company_id,
        'booking_customer',
        { replacesJti: payload.jti || null }
      );
      res.cookie('mg_refresh_booking', rotatedToken, REFRESH_COOKIE_OPTIONS);

      return res.json({
        success: true,
        data: {
          token: newAccessToken,
          user: sanitized
        }
      });
    }

    // Barber / Master refresh
    const result = await pool.query(
      `SELECT u.*, c.name as company_name
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1
       LIMIT 1`,
      [payload.id]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuario nao encontrado.'
      });
    }

    const user = result.rows[0];
    const { sanitizeUser } = require('../services/auth.service');
    const sanitized = sanitizeUser(user);

    const newAccessToken = jwt.sign(
      {
        id: user.id,
        user_id: user.id,
        customer_id: null,
        email: user.email,
        role: user.role,
        auth_scope: payload.auth_scope,
        company_id: user.company_id,
        can_launch_sales: Boolean(user.can_launch_sales),
        can_view_own_dashboard: user.can_view_own_dashboard !== false,
        can_view_own_reports: user.can_view_own_reports !== false
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Rotação: novo refresh com sessão server-side; o anterior é revogado.
    const rotatedToken = await issueRefreshToken(
      user.id,
      user.role,
      user.company_id,
      payload.auth_scope,
      { replacesJti: payload.jti || null }
    );
    res.cookie(refreshCookieNameForScope(payload.auth_scope), rotatedToken, REFRESH_COOKIE_OPTIONS);

    return res.json({
      success: true,
      data: {
        token: newAccessToken,
        user: sanitized
      }
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Sessao expirada. Faca login novamente.'
    });
  }
});

const logout = asyncHandler(async (req, res) => {
  // Revoga as sessões server-side dos cookies apresentados (best effort)
  // e limpa os três cookies de refresh, incluindo o de booking.
  for (const cookieName of REFRESH_COOKIE_NAMES) {
    const token = req.cookies?.[cookieName];
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.token_type === 'refresh' && payload.jti) {
          await revokeRefreshToken(payload.jti);
        }
      } catch (_) {
        // Token inválido/expirado: nada a revogar, cookie é limpo mesmo assim.
      }
    }
    res.clearCookie(cookieName, { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
  }

  return res.json({ success: true });
});

module.exports = {
  register,
  login,
  masterLogin,
  bookingLogin,
  me,
  bookingMe,
  validateFirstAccess,
  requestFirstAccess,
  setFirstAccessPassword,
  forgotPassword,
  resetPassword,
  refresh,
  logout
};
