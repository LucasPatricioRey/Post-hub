const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, "El título es obligatorio"],
      trim: true,
      minlength: [3, "El título debe tener al menos 3 caracteres"],
      maxlength: [120, "El título no puede superar los 120 caracteres"],
    },

    contenido: {
      type: String,
      required: [true, "El contenido es obligatorio"],
      trim: true,
      minlength: [10, "El contenido debe tener al menos 10 caracteres"],
      maxlength: [5000, "El contenido no puede superar los 5000 caracteres"],
    },

    imagen: {
      type: String,
      default: "",
      trim: true,
    },

    imagenPublicId: {
      type: String,
      default: "",
      trim: true,
    },

    autor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El autor del posteo es obligatorio"],
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;