const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");

const registerUser = asyncHandler(async (req, res) => {
  const { nombre, email, password } = req.body;

  const { user, token } = await authService.registerUser({
    nombre,
    email,
    password,
  });

  res.status(201).json({
    message: "Usuario registrado correctamente",
    user: {
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      createdAt: user.createdAt,
    },
    token,
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, token } = await authService.loginUser({ email, password });

  res.status(200).json({
    message: "Login correcto",
    user: {
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    },
    token,
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "Usuario autenticado correctamente",
    user: {
      id: req.user._id,
      nombre: req.user.nombre,
      email: req.user.email,
      rol: req.user.rol,
    },
  });
});

const adminTest = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "Acceso de administrador permitido",
    user: {
      id: req.user._id,
      nombre: req.user.nombre,
      email: req.user.email,
      rol: req.user.rol,
    },
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  adminTest,
};
