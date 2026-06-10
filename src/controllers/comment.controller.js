const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const asyncHandler = require("../utils/asyncHandler");
const createError = require("../utils/createError");

const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { contenido } = req.body;

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
    autor: req.user._id,
    post: post._id,
  });

  const commentCreado = await Comment.findById(comment._id)
    .populate("autor", "nombre email rol")
    .populate("post", "titulo");

  res.status(201).json({
    message: "Comentario creado correctamente",
    comment: commentCreado,
  });
});

const getCommentsByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.isValidObjectId(postId)) {
    throw createError("ID de posteo inválido", 400);
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw createError("Posteo no encontrado", 404);
  }

  const comments = await Comment.find({ post: post._id })
    .populate("autor", "nombre email rol")
    .sort({ createdAt: -1 });

  res.status(200).json({
    message: "Comentarios obtenidos correctamente",
    total: comments.length,
    comments,
  });
});

const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { contenido } = req.body;

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

  const esAutor = comment.autor.toString() === req.user._id.toString();

  if (!esAutor) {
    throw createError(
      "No autorizado, solo podés editar tus propios comentarios",
      403
    );
  }

  comment.contenido = contenido;

  await comment.save();

  const commentActualizado = await Comment.findById(comment._id)
    .populate("autor", "nombre email rol")
    .populate("post", "titulo");

  res.status(200).json({
    message: "Comentario actualizado correctamente",
    comment: commentActualizado,
  });
});

const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw createError("ID de comentario inválido", 400);
  }

  const comment = await Comment.findById(id);

  if (!comment) {
    throw createError("Comentario no encontrado", 404);
  }

  const esAutor = comment.autor.toString() === req.user._id.toString();
  const esAdmin = req.user.rol === "admin";

  if (!esAutor && !esAdmin) {
    throw createError(
      "No autorizado, solo podés eliminar tus propios comentarios",
      403
    );
  }

  await comment.deleteOne();

  res.status(200).json({
    message: "Comentario eliminado correctamente",
  });
});

module.exports = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};