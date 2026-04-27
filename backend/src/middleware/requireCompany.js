module.exports = function requireCompany(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  if (!req.user.company_id) {
    return res.status(403).json({ error: 'Empresa não identificada' });
  }

  next();
};
