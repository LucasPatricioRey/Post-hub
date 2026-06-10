const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../utils/asyncHandler");
const createError = require("../utils/createError");

const registerUser = asyncHandler(async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    throw createError("Nombre, email y contraseña son obligatorios", 400);
  }

  if (typeof password !== "string" || password.length < 6) {
    throw createError("La contraseña debe tener al menos 6 caracteres", 400);
  }

  const emailNormalizado = email.toLowerCase().trim();

  const userExists = await User.findOne({ email: emailNormalizado });

  if (userExists) {
    throw createError("Ya existe un usuario registrado con ese email", 400);
  }

  const user = await User.create({
    nombre,
    email: emailNormalizado,
    password,
  });

  const token = generateToken(user._id);

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

  if (!email || !password) {
    throw createError("Email y contraseña son obligatorios", 400);
  }

  const emailNormalizado = email.toLowerCase().trim();

  const user = await User.findOne({ email: emailNormalizado }).select(
    "+password"
  );

  if (!user) {
    throw createError("Credenciales inválidas", 401);
  }

  const passwordCorrecta = await user.matchPassword(password);

  if (!passwordCorrecta) {
    throw createError("Credenciales inválidas", 401);
  }

  const token = generateToken(user._id);

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