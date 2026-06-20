const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const createError = require("../utils/createError");

const registerUser = async ({ nombre, email, password }) => {
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

  return { user, token };
};

const loginUser = async ({ email, password }) => {
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

  return { user, token };
};

module.exports = {
  registerUser,
  loginUser,
};
