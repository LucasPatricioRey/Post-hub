const mongoose = require("mongoose");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const asyncHandler = require("../utils/asyncHandler");
const createError = require("../utils/createError");
const uploadImageToCloudinary = require("../utils/uploadImageToCloudinary");
const deleteImageFromCloudinary = require("../utils/deleteImageFromCloudinary");

const createPost = asyncHandler(async (req, res) => {
  const { titulo, contenido } = req.body;

  if (!titulo || !contenido) {
    throw createError("Título y contenido son obligatorios", 400);
  }

  let imagen = "";
  let imagenPublicId = "";

  if (req.file) {
    const resultadoCloudinary = await uploadImageToCloudinary(req.file.buffer);

    imagen = resultadoCloudinary.secure_url;
    imagenPublicId = resultadoCloudinary.public_id;
  }

  const post = await Post.create({
    titulo,
    contenido,
    imagen,
    imagenPublicId,
    autor: req.user._id,
  });

  const postCreado = await Post.findById(post._id).populate(
    "autor",
    "nombre email rol"
  );

  res.status(201).json({
    message: "Posteo creado correctamente",
    post: postCreado,
  });
});

const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate("autor", "nombre email rol")
    .sort({ createdAt: -1 });

  res.status(200).json({
    message: "Posteos obtenidos correctamente",
    total: posts.length,
    posts,
  });
});

const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw createError("ID de posteo inválido", 400);
  }

  const post = await Post.findById(id).populate("autor", "nombre email rol");

  if (!post) {
    throw createError("Posteo no encontrado", 404);
  }

  res.status(200).json({
    message: "Posteo obtenido correctamente",
    post,
  });
});

const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { titulo, contenido, imagen } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw createError("ID de posteo inválido", 400);
  }

  if (
    titulo === undefined &&
    contenido === undefined &&
    imagen === undefined
  ) {
    throw createError("No enviaste campos para actualizar", 400);
  }

  const post = await Post.findById(id);

  if (!post) {
    throw createError("Posteo no encontrado", 404);
  }

  if (post.autor.toString() !== req.user._id.toString()) {
    throw createError(
      "No autorizado, solo podés editar tus propios posteos",
      403
    );
  }

  if (titulo !== undefined) {
    post.titulo = titulo;
  }

  if (contenido !== undefined) {
    post.contenido = contenido;
  }

  if (imagen !== undefined) {
    post.imagen = imagen;
  }

  await post.save();

  const postActualizado = await Post.findById(post._id).populate(
    "autor",
    "nombre email rol"
  );

  res.status(200).json({
    message: "Posteo actualizado correctamente",
    post: postActualizado,
  });
});

const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw createError("ID de posteo inválido", 400);
  }

  const post = await Post.findById(id);

  if (!post) {
    throw createError("Posteo no encontrado", 404);
  }

  const esAutor = post.autor.toString() === req.user._id.toString();
  const esAdmin = req.user.rol === "admin";

  if (!esAutor && !esAdmin) {
    throw createError(
      "No autorizado, solo el autor o un administrador puede eliminar este posteo",
      403
    );
  }

  if (post.imagenPublicId) {
    await deleteImageFromCloudinary(post.imagenPublicId);
  }

  await Comment.deleteMany({ post: post._id });

  await post.deleteOne();

  res.status(200).json({
    message: "Posteo eliminado correctamente",
  });
});

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
};