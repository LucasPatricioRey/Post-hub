const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const createError = require("../utils/createError");

const createComment = async (postId, contenido, autorId) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw createError("ID de posteo inválido", 400);
  }

  if (!contenido) {
    throw createError("El contenido del comentario es obligatorio", 400);
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw createError("Posteo no encontrado", 404);
  }

  const comment = await Comment.create({
    contenido,
    autor: autorId,
    post: post._id,
  });

  return Comment.findById(comment._id)
    .populate("autor", "nombre email rol")
    .populate("post", "titulo");
};

const getCommentsByPost = async (postId) => {
  if (!mongoose.isValidObjectId(postId)) {
    throw createError("ID de posteo inválido", 400);
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw createError("Posteo no encontrado", 404);
  }

  return Comment.find({ post: post._id })
    .populate("autor", "nombre email rol")
    .sort({ createdAt: -1 });
};

const updateComment = async (id, contenido, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("ID de comentario inválido", 400);
  }

  if (contenido === undefined) {
    throw createError("No enviaste contenido para actualizar", 400);
  }

  const comment = await Comment.findById(id);

  if (!comment) {
    throw createError("Comentario no encontrado", 404);
  }

  const esAutor = comment.autor.toString() === userId.toString();

  if (!esAutor) {
    throw createError(
      "No autorizado, solo podés editar tus propios comentarios",
      403
    );
  }

  comment.contenido = contenido;

  await comment.save();

  return Comment.findById(comment._id)
    .populate("autor", "nombre email rol")
    .populate("post", "titulo");
};

const deleteComment = async (id, user) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("ID de comentario inválido", 400);
  }

  const comment = await Comment.findById(id);

  if (!comment) {
    throw createError("Comentario no encontrado", 404);
  }

  const esAutor = comment.autor.toString() === user._id.toString();
  const esAdmin = user.rol === "admin";

  if (!esAutor && !esAdmin) {
    throw createError(
      "No autorizado, solo podés eliminar tus propios comentarios",
      403
    );
  }

  await comment.deleteOne();
};

module.exports = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};
