const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "No autorizado, falta token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "No autorizado, usuario no encontrado",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "No autorizado, token inválido",
    });
  }
};

module.exports = {
  protect,
};