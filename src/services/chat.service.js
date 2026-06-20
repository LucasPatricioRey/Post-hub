const ChatMessage = require("../models/ChatMessage");
const createError = require("../utils/createError");

const getRecentMessages = async (limit = 50) => {
  const messages = await ChatMessage.find()
    .populate("autor", "nombre email rol")
    .sort({ createdAt: -1 })
    .limit(limit);

  return messages.reverse();
};

const createMessage = async ({ contenido, autorId, nombreAutor }) => {
  const contenidoLimpio = contenido?.trim();

  if (!contenidoLimpio) {
    throw createError("El mensaje no puede estar vacío", 400);
  }

  if (contenidoLimpio.length > 300) {
    throw createError("El mensaje no puede superar los 300 caracteres", 400);
  }

  const savedMessage = await ChatMessage.create({
    contenido: contenidoLimpio,
    autor: autorId,
    nombreAutor,
  });

  return savedMessage.populate("autor", "nombre email rol");
};

module.exports = {
  getRecentMessages,
  createMessage,
};
