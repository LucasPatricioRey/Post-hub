const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    contenido: {
      type: String,
      required: [true, "El contenido del comentario es obligatorio"],
      trim: true,
      minlength: [2, "El comentario debe tener al menos 2 caracteres"],
      maxlength: [1000, "El comentario no puede superar los 1000 caracteres"],
    },

    autor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El autor del comentario es obligatorio"],
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "El posteo del comentario es obligatorio"],
    },
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;