const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    contenido: {
      type: String,
      required: [true, "El contenido del mensaje es obligatorio"],
      trim: true,
      minlength: [1, "El mensaje no puede estar vacío"],
      maxlength: [300, "El mensaje no puede superar los 300 caracteres"],
    },

    autor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El autor del mensaje es obligatorio"],
    },

    nombreAutor: {
      type: String,
      required: [true, "El nombre del autor es obligatorio"],
      trim: true,
      maxlength: [50, "El nombre del autor no puede superar los 50 caracteres"],
    },
  },
  {
    timestamps: true,
  }
);

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = ChatMessage;