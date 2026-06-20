const mongoose = require("mongoose");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const createError = require("../utils/createError");
const uploadImageToCloudinary = require("../utils/uploadImageToCloudinary");
const deleteImageFromCloudinary = require("../utils/deleteImageFromCloudinary");

const createPost = async ({ titulo, contenido, file, autorId }) => {
  if (!titulo || !contenido) {
    throw createError("Título y contenido son obligatorios", 400);
  }

  let imagen = "";
  let imagenPublicId = "";

  if (file) {
    const resultadoCloudinary = await uploadImageToCloudinary(file.buffer);

    imagen = resultadoCloudinary.secure_url;
    imagenPublicId = resultadoCloudinary.public_id;
  }

  const post = await Post.create({
    titulo,
    contenido,
    imagen,
    imagenPublicId,
    autor: autorId,
  });

  return Post.findById(post._id).populate("autor", "nombre email rol");
};

const getAllPosts = async () => {
  return Post.find().populate("autor", "nombre email rol").sort({ createdAt: -1 });
};

const getPostById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("ID de posteo inválido", 400);
  }

  const post = await Post.findById(id).populate("autor", "nombre email rol");

  if (!post) {
    throw createError("Posteo no encontrado", 404);
  }

  return post;
};

const updatePost = async (id, { titulo, contenido, imagen }, userId) => {
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

  if (post.autor.toString() !== userId.toString()) {
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

  return Post.findById(post._id).populate("autor", "nombre email rol");
};

const deletePost = async (id, user) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("ID de posteo inválido", 400);
  }

  const post = await Post.findById(id);

  if (!post) {
    throw createError("Posteo no encontrado", 404);
  }

  const esAutor = post.autor.toString() === user._id.toString();
  const esAdmin = user.rol === "admin";

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
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};
