const jwt = require('jsonwebtoken');
const { createReqLogger } = require('../shared');
const {
  BARBER_ADMIN_ROLES,
  BOOKING_CUSTOMER_ROLES,
  MASTER_ROLES,
  inferAuthScope: inferAuthScopeFromRole
} = require('../shared/core/auth/roles');

function inferAuthScope(user = {}) {
  if (user.auth_scope) {
    return user.auth_scope;
  }

  return inferAuthScopeFromRole(user.role);
}

function reject(res, statusCode, error) {
  return res.status(statusCode).json({
    success: false,
    error
  });
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reject(res, 401, 'Token nao informado');
  }

  if (!process.env.JWT_SECRET) {
    return reject(res, 500, 'JWT_SECRET nao configurado');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      ...payload,
      id: payload.id || payload.user_id || payload.customer_id,
      user_id: payload.user_id || payload.id || null,
      customer_id: payload.customer_id || payload.id || null,
      company_id: payload.company_id || null,
      auth_scope: inferAuthScope(payload)
    };

    req.log = createReqLogger(req);

    return next();
  } catch (error) {
    return reject(res, 401, 'Token invalido ou expirado');
  }
}

function requireScopes(allowedScopes, errorMessage) {
  return function scopedMiddleware(req, res, next) {
    const resolvedScope = req.user?.auth_scope || inferAuthScope(req.user)

    if (!resolvedScope || !allowedScopes.includes(resolvedScope)) {
      return reject(res, 403, errorMessage);
    }

    req.user.auth_scope = resolvedScope;
    return next();
  };
}

function requireRoles(allowedRoles, errorMessage) {
  return function roleMiddleware(req, res, next) {
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      return reject(res, 403, errorMessage);
    }

    return next();
  };
}

const requireBackofficeAuth = requireScopes(
  ['barber_admin', 'master'],
  'Sessao invalida para o painel administrativo'
);

const requireBarberAdminScope = requireScopes(
  ['barber_admin'],
  'Sessao invalida para a area administrativa da barbearia'
);

const requireBookingCustomerScope = requireScopes(
  ['booking_customer'],
  'Sessao invalida para a area do cliente'
);

const requireMasterScope = requireScopes(
  ['master'],
  'Sessao invalida para o painel master'
);

const requireBarberAdminRole = requireRoles(
  BARBER_ADMIN_ROLES,
  'Acesso restrito a dono, admin ou colaborador da barbearia'
);

const requireBookingCustomerRole = requireRoles(
  BOOKING_CUSTOMER_ROLES,
  'Acesso restrito a clientes finais'
);

const requireMasterRole = requireRoles(
  MASTER_ROLES,
  'Acesso restrito ao master admin'
);

function requireBarberAdminAuth(req, res, next) {
  return requireBarberAdminScope(req, res, function handleScope() {
    return requireBarberAdminRole(req, res, next);
  });
}

// Alias genérico: hoje 'barber_admin' é o único auth_scope emitido para
// donos/admins/colaboradores de QUALQUER empresa tenant, independente do
// módulo/nicho ativo (auth.controller.js sempre usa authScope: 'barber_admin'
// no login — não existe um escopo por nicho). Módulos que não são o
// BarberGestor (ex: clima.routes.js) devem depender deste nome genérico, não
// de requireBarberAdminAuth, mesmo apontando para a mesma implementação hoje.
// Quando o sistema emitir auth_scope por módulo, só este alias muda.
const requireTenantAdminAuth = requireBarberAdminAuth;

function requireBookingCustomerAuth(req, res, next) {
  return requireBookingCustomerScope(req, res, function handleScope() {
    return requireBookingCustomerRole(req, res, next);
  });
}

function requireMasterAdminAuth(req, res, next) {
  return requireMasterScope(req, res, function handleScope() {
    return requireMasterRole(req, res, next);
  });
}

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireBackofficeAuth = requireBackofficeAuth;
module.exports.requireBarberAdminAuth = requireBarberAdminAuth;
module.exports.requireTenantAdminAuth = requireTenantAdminAuth;
module.exports.requireBookingCustomerAuth = requireBookingCustomerAuth;
module.exports.requireMasterAdminAuth = requireMasterAdminAuth;
module.exports.inferAuthScope = inferAuthScope;
