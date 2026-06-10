const authorizeRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "No autorizado, usuario no autenticado",
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        message: "No autorizado, permisos insuficientes",
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};