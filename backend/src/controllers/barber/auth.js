const { asyncHandler, success } = require('../../shared');
const authService = require('../../services/auth.service');

const collaboratorLogin = asyncHandler(async (req, res) => {
  const session = await authService.login(req.body);

  if (session.user.role !== 'collaborator') {
    return res.status(403).json({
      success: false,
      error: 'Este acesso e exclusivo para colaboradores'
    });
  }

  return success(res, session);
}, 'Erro ao autenticar colaborador');

module.exports = {
  collaboratorLogin
};
